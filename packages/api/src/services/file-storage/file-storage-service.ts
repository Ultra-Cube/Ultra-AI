/**
 * File Storage Service
 * Comprehensive file management with versioning, backup, and audit logging
 */

import {
  PrismaClient,
  File,
  FileBackup,
  FileAccessLog,
  StorageQuota,
  FileStatus,
  FileStorageType,
} from '@prisma/client';
import crypto from 'crypto';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface UploadFileOptions {
  name: string;
  mimeType: string;
  content: Buffer;
  description?: string;
  isPublic?: boolean;
  metadata?: Record<string, any>;
  storageType?: FileStorageType;
}

export interface FileQuery {
  userId?: string;
  status?: FileStatus;
  isPublic?: boolean;
  mimeType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface StorageStats {
  totalFiles: number;
  totalBytes: number;
  maxBytes: number;
  usagePercent: number;
  filesByType: Record<string, number>;
  recentFiles: number;
  warningStatus: boolean;
}

// ============================================================================
// File Storage Service
// ============================================================================

export class FileStorageService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Upload a file
   */
  async uploadFile(
    tenantId: string,
    userId: string,
    options: UploadFileOptions
  ): Promise<File> {
    // Check storage quota
    const quota = await this.getOrCreateQuota(tenantId);
    const fileSize = options.content.length;

    if (quota.usedBytes + fileSize > quota.maxBytes) {
      throw new Error('Storage quota exceeded');
    }

    if (quota.usedFiles >= quota.maxFiles) {
      throw new Error('Maximum number of files reached');
    }

    if (fileSize > quota.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${quota.maxFileSize} bytes`);
    }

    // Calculate file hash for deduplication
    const hash = this.calculateHash(options.content);

    // Check if file already exists (deduplicate)
    const existingFile = await this.prisma.file.findFirst({
      where: {
        tenantId,
        hash,
        status: FileStatus.ACTIVE,
      },
    });

    // Determine storage key
    const storageKey = this.generateStorageKey(tenantId, userId, options.name);

    // Create database entry
    const file = await this.prisma.file.create({
      data: {
        tenantId,
        userId,
        name: options.name,
        mimeType: options.mimeType,
        size: fileSize,
        hash: existingFile ? existingFile.hash : hash,
        storageType: options.storageType || FileStorageType.LOCAL,
        storageKey,
        storageUrl: this.buildStorageUrl(storageKey),
        isPublic: options.isPublic || false,
        description: options.description,
        metadata: options.metadata as any,
      },
    });

    // Log access
    await this.logAccess(tenantId, file.id, userId, 'upload', true);

    // Update quota
    await this.updateQuotaUsage(tenantId, fileSize, 1);

    // Trigger virus scan asynchronously
    setImmediate(() => {
      this.scanFileForVirus(file.id).catch(error => {
        console.error('Virus scan error:', error);
      });
    });

    return file;
  }

  /**
   * Get files for a user/tenant
   */
  async getFiles(tenantId: string, query: FileQuery = {}): Promise<File[]> {
    const {
      userId,
      status = FileStatus.ACTIVE,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = query;

    return this.prisma.file.findMany({
      where: {
        tenantId,
        ...(userId && { userId }),
        status,
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get file by ID
   */
  async getFile(tenantId: string, fileId: string, userId?: string): Promise<File | null> {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        tenantId,
        ...(userId && { userId }),
      },
    });

    if (file && userId) {
      // Log access
      await this.logAccess(tenantId, fileId, userId, 'view', true).catch(_ => {});
    }

    return file;
  }

  /**
   * Download file
   */
  async downloadFile(
    tenantId: string,
    fileId: string,
    userId: string
  ): Promise<Buffer> {
    const file = await this.getFile(tenantId, fileId, userId);

    if (!file) {
      throw new Error('File not found');
    }

    if (file.status === FileStatus.QUARANTINED) {
      throw new Error('File is quarantined due to security concerns');
    }

    if (file.status === FileStatus.DELETED) {
      throw new Error('File has been deleted');
    }

    // Log download
    await this.logAccess(tenantId, fileId, userId, 'download', true);

    // TODO: Actually download file from storage backend
    // This is a placeholder - implement based on storageType
    console.log(`Downloading file ${fileId} from storage type ${file.storageType}`);

    return Buffer.alloc(0); // Placeholder
  }

  /**
   * Update file metadata
   */
  async updateFile(
    tenantId: string,
    fileId: string,
    userId: string,
    updates: {
      name?: string;
      description?: string;
      isPublic?: boolean;
      metadata?: Record<string, any>;
    }
  ): Promise<File> {
    const file = await this.getFile(tenantId, fileId, userId);

    if (!file) {
      throw new Error('File not found');
    }

    const updated = await this.prisma.file.update({
      where: { id: fileId },
      data: {
        ...updates,
        metadata: updates.metadata as any,
      },
    });

    // Log access
    await this.logAccess(tenantId, fileId, userId, 'update', true);

    return updated;
  }

  /**
   * Delete file (soft delete)
   */
  async deleteFile(tenantId: string, fileId: string, userId: string): Promise<void> {
    const file = await this.getFile(tenantId, fileId, userId);

    if (!file) {
      throw new Error('File not found');
    }

    // Soft delete
    await this.prisma.file.update({
      where: { id: fileId },
      data: {
        status: FileStatus.DELETED,
        deletedAt: new Date(),
      },
    });

    // Create backup before deletion
    await this.createBackup(fileId, file.size, 'manual');

    // Log access
    await this.logAccess(tenantId, fileId, userId, 'delete', true);

    // Update quota
    await this.updateQuotaUsage(tenantId, -file.size, -1);
  }

  /**
   * Permanently delete file
   */
  async permanentlyDeleteFile(tenantId: string, fileId: string): Promise<void> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file || file.tenantId !== tenantId) {
      throw new Error('File not found');
    }

    // Delete from database
    await this.prisma.file.delete({
      where: { id: fileId },
    });

    // TODO: Delete from storage backend
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(tenantId: string): Promise<StorageStats> {
    const quota = await this.getOrCreateQuota(tenantId);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [filesByType, recentCount] = await Promise.all([
      // Files by type
      this.prisma.file.groupBy({
        by: ['mimeType'],
        where: {
          tenantId,
          status: FileStatus.ACTIVE,
        },
        _count: { mimeType: true },
      }),

      // Recent files (24h)
      this.prisma.file.count({
        where: {
          tenantId,
          status: FileStatus.ACTIVE,
          createdAt: { gte: oneDayAgo },
        },
      }),
    ]);

    const usagePercent = (quota.usedBytes / quota.maxBytes) * 100;

    return {
      totalFiles: quota.usedFiles,
      totalBytes: quota.usedBytes,
      maxBytes: quota.maxBytes,
      usagePercent: Math.round(usagePercent * 100) / 100,
      filesByType: filesByType.reduce((acc, item) => {
        acc[item.mimeType] = item._count.mimeType;
        return acc;
      }, {} as Record<string, number>),
      recentFiles: recentCount,
      warningStatus: quota.isWarning,
    };
  }

  /**
   * Get file access log
   */
  async getAccessLog(
    tenantId: string,
    fileId: string,
    limit = 50
  ): Promise<FileAccessLog[]> {
    return this.prisma.fileAccessLog.findMany({
      where: {
        fileId,
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            email: true,
            id: true,
          },
        },
      } as any,
    });
  }

  /**
   * Create file backup
   */
  async createBackup(
    fileId: string,
    size: number,
    backupType: string = 'auto'
  ): Promise<FileBackup> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Get latest version number
    const latest = await this.prisma.fileBackup.findFirst({
      where: { fileId },
      orderBy: { version: 'desc' },
    });

    const newVersion = (latest?.version || 0) + 1;

    return this.prisma.fileBackup.create({
      data: {
        fileId,
        version: newVersion,
        storageKey: `${file.storageKey}/backup-v${newVersion}`,
        size,
        backupType,
        retentionUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
  }

  /**
   * List file backups
   */
  async getBackups(fileId: string): Promise<FileBackup[]> {
    return this.prisma.fileBackup.findMany({
      where: { fileId },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(fileId: string, version: number, userId: string): Promise<File> {
    const backup = await this.prisma.fileBackup.findUnique({
      where: {
        fileId_version: { fileId, version },
      },
    });

    if (!backup) {
      throw new Error('Backup not found');
    }

    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Restore file
    const restored = await this.prisma.file.update({
      where: { id: fileId },
      data: {
        version,
        storageKey: backup.storageKey,
        size: backup.size,
      },
    });

    // Log access
    await this.logAccess(file.tenantId, fileId, userId, 'restore', true);

    return restored;
  }

  /**
   * Clean up old files and backups
   */
  async cleanup(daysToKeep = 30): Promise<{ filesDeleted: number; backupsDeleted: number }> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const [filesResult, backupsResult] = await Promise.all([
      // Delete old deleted files
      this.prisma.file.deleteMany({
        where: {
          status: FileStatus.DELETED,
          deletedAt: { lt: cutoffDate },
        },
      }),

      // Delete expired backups
      this.prisma.fileBackup.deleteMany({
        where: {
          retentionUntil: { lt: new Date() },
        },
      }),
    ]);

    return {
      filesDeleted: filesResult.count,
      backupsDeleted: backupsResult.count,
    };
  }

  /**
   * Clean up access logs
   */
  async cleanupAccessLogs(daysToKeep = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await this.prisma.fileAccessLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Calculate file hash for deduplication
   */
  private calculateHash(content: Buffer): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Generate unique storage key
   */
  private generateStorageKey(tenantId: string, userId: string, fileName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${tenantId}/${userId}/${timestamp}-${random}-${fileName}`;
  }

  /**
   * Build storage URL
   */
  private buildStorageUrl(storageKey: string): string {
    // Placeholder - adjust based on your storage backend
    return `https://files.example.com/${storageKey}`;
  }

  /**
   * Log file access
   */
  private async logAccess(
    tenantId: string,
    fileId: string,
    userId: string,
    action: string,
    success: boolean,
    errorMessage?: string
  ): Promise<FileAccessLog> {
    return this.prisma.fileAccessLog.create({
      data: {
        fileId,
        tenantId,
        userId,
        action,
        success,
        errorMessage,
      },
    });
  }

  /**
   * Scan file for viruses
   */
  private async scanFileForVirus(fileId: string): Promise<void> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return;
    }

    // TODO: Implement actual virus scanning (ClamAV, VirusTotal, etc.)
    // For now, mark as clean
    await this.prisma.file.update({
      where: { id: fileId },
      data: {
        virusScanStatus: 'clean',
        virusScanResultAt: new Date(),
      },
    });
  }

  /**
   * Get or create storage quota for tenant
   */
  private async getOrCreateQuota(tenantId: string): Promise<StorageQuota> {
    let quota = await this.prisma.storageQuota.findUnique({
      where: { tenantId },
    });

    if (!quota) {
      // Create default quota based on tenant plan
      // This should be integrated with tenant service
      quota = await this.prisma.storageQuota.create({
        data: {
          tenantId,
          maxBytes: 100 * 1024 * 1024 * 1024, // 100GB default
          maxFiles: 10000,
          maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB per file
        },
      });
    }

    return quota;
  }

  /**
   * Update quota usage
   */
  private async updateQuotaUsage(
    tenantId: string,
    bytesDelta: number,
    filesDelta: number
  ): Promise<void> {
    const quota = await this.getOrCreateQuota(tenantId);

    const newUsedBytes = Math.max(0, quota.usedBytes + bytesDelta);
    const newUsedFiles = Math.max(0, quota.usedFiles + filesDelta);

    // Check if quota threshold exceeded
    const usagePercent = (newUsedBytes / quota.maxBytes) * 100;
    const isWarning = usagePercent >= quota.warningThreshold;

    await this.prisma.storageQuota.update({
      where: { tenantId },
      data: {
        usedBytes: newUsedBytes,
        usedFiles: newUsedFiles,
        isWarning,
      },
    });
  }
}
