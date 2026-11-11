/**
 * File Storage Service Tests
 */

import { FileStatus, FileStorageType } from '@prisma/client';

import { FileStorageService } from './file-storage-service';

// Mock Prisma
const mockPrisma = {
  file: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    groupBy: jest.fn(),
    count: jest.fn(),
  },
  fileBackup: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
  },
  fileAccessLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  storageQuota: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('FileStorageService', () => {
  let service: FileStorageService;
  const tenantId = 'tenant-123';
  const userId = 'user-123';

  beforeEach(() => {
    service = new FileStorageService(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      const mockQuota = {
        tenantId,
        maxBytes: 1000000000,
        maxFiles: 10000,
        maxFileSize: 5000000000,
        usedBytes: 0,
        usedFiles: 0,
        warningThreshold: 80,
        isWarning: false,
        createdAt: new Date(),
      };

      const mockFile = {
        id: 'file-123',
        tenantId,
        userId,
        name: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024000,
        hash: 'abc123',
        storageType: FileStorageType.LOCAL,
        storageKey: 'tenant-123/user-123/1234567890-abc-test.pdf',
        storageUrl: 'https://files.example.com/...',
        isPublic: false,
        description: 'Test file',
        metadata: {},
        status: FileStatus.ACTIVE,
        virusScanStatus: null,
        virusScanResultAt: null,
        version: 1,
        parentFileId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrisma.storageQuota.findUnique.mockResolvedValue(mockQuota);
      mockPrisma.file.findFirst.mockResolvedValue(null);
      mockPrisma.file.create.mockResolvedValue(mockFile);
      mockPrisma.fileAccessLog.create.mockResolvedValue({});
      mockPrisma.storageQuota.update.mockResolvedValue({});

      const content = Buffer.from('test file content');
      const result = await service.uploadFile(tenantId, userId, {
        name: 'test.pdf',
        mimeType: 'application/pdf',
        content,
        description: 'Test file',
        isPublic: false,
      });

      expect(result).toBeTruthy();
      expect(result?.id).toBe('file-123');
      expect(result.name).toBe('test.pdf');
      expect(result.size).toBe(1024000);
      expect(mockPrisma.file.create).toHaveBeenCalled();
    });

    it('should throw error if quota exceeded', async () => {
      const mockQuota = {
        tenantId,
        maxBytes: 1000,
        maxFiles: 10000,
        maxFileSize: 5000000000,
        usedBytes: 500,
        usedFiles: 0,
        warningThreshold: 80,
        isWarning: false,
        createdAt: new Date(),
      };

      mockPrisma.storageQuota.findUnique.mockResolvedValue(mockQuota);

      const content = Buffer.alloc(600);
      await expect(
        service.uploadFile(tenantId, userId, {
          name: 'test.pdf',
          mimeType: 'application/pdf',
          content,
        })
      ).rejects.toThrow('Storage quota exceeded');
    });

    it('should throw error if file size exceeds limit', async () => {
      const mockQuota = {
        tenantId,
        maxBytes: 10000000000,
        maxFiles: 10000,
        maxFileSize: 1000,
        usedBytes: 0,
        usedFiles: 0,
        warningThreshold: 80,
        isWarning: false,
        createdAt: new Date(),
      };

      mockPrisma.storageQuota.findUnique.mockResolvedValue(mockQuota);

      const content = Buffer.alloc(2000);
      await expect(
        service.uploadFile(tenantId, userId, {
          name: 'test.pdf',
          mimeType: 'application/pdf',
          content,
        })
      ).rejects.toThrow('File size exceeds maximum allowed');
    });

    it('should throw error if max files reached', async () => {
      const mockQuota = {
        tenantId,
        maxBytes: 10000000000,
        maxFiles: 10,
        maxFileSize: 5000000000,
        usedBytes: 0,
        usedFiles: 10,
        warningThreshold: 80,
        isWarning: false,
        createdAt: new Date(),
      };

      mockPrisma.storageQuota.findUnique.mockResolvedValue(mockQuota);

      const content = Buffer.from('test');
      await expect(
        service.uploadFile(tenantId, userId, {
          name: 'test.pdf',
          mimeType: 'application/pdf',
          content,
        })
      ).rejects.toThrow('Maximum number of files reached');
    });
  });

  describe('getFiles', () => {
    it('should return files for tenant', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          tenantId,
          userId,
          name: 'file1.pdf',
          mimeType: 'application/pdf',
          size: 1000,
          status: FileStatus.ACTIVE,
          createdAt: new Date(),
        },
        {
          id: 'file-2',
          tenantId,
          userId,
          name: 'file2.txt',
          mimeType: 'text/plain',
          size: 500,
          status: FileStatus.ACTIVE,
          createdAt: new Date(),
        },
      ];

      mockPrisma.file.findMany.mockResolvedValue(mockFiles);

      const result = await service.getFiles(tenantId);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('file1.pdf');
      expect(mockPrisma.file.findMany).toHaveBeenCalled();
    });

    it('should filter files by user', async () => {
      mockPrisma.file.findMany.mockResolvedValue([]);

      await service.getFiles(tenantId, { userId });

      expect(mockPrisma.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId }),
        })
      );
    });

    it('should filter files by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      mockPrisma.file.findMany.mockResolvedValue([]);

      await service.getFiles(tenantId, { startDate, endDate });

      expect(mockPrisma.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: startDate,
              lte: endDate,
            }),
          }),
        })
      );
    });

    it('should support pagination', async () => {
      mockPrisma.file.findMany.mockResolvedValue([]);

      await service.getFiles(tenantId, { limit: 20, offset: 40 });

      expect(mockPrisma.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 40,
        })
      );
    });
  });

  describe('getFile', () => {
    it('should retrieve file by ID', async () => {
      const mockFile = {
        id: 'file-123',
        tenantId,
        userId,
        name: 'test.pdf',
        status: FileStatus.ACTIVE,
      };

      mockPrisma.file.findFirst.mockResolvedValue(mockFile);
      mockPrisma.fileAccessLog.create.mockResolvedValue({});

      const result = await service.getFile(tenantId, 'file-123', userId);

      expect(result).toBeTruthy();
      expect(result?.id).toBe('file-123');
      expect(mockPrisma.file.findFirst).toHaveBeenCalled();
    });

    it('should return null file not found', async () => {
      mockPrisma.file.findFirst.mockResolvedValue(null);

      const result = await service.getFile(tenantId, 'nonexistent', userId);

      expect(result).toBeNull();
    });
  });

  describe('deleteFile', () => {
    it('should soft delete file', async () => {
      const mockFile = {
        id: 'file-123',
        tenantId,
        userId,
        name: 'test.pdf',
        size: 1000,
        status: FileStatus.ACTIVE,
      };

      mockPrisma.file.findFirst.mockResolvedValue(mockFile);
      mockPrisma.file.findUnique.mockResolvedValue(mockFile);
      mockPrisma.file.update.mockResolvedValue({
        ...mockFile,
        status: FileStatus.DELETED,
      });
      mockPrisma.fileBackup.findFirst.mockResolvedValue(null);
      mockPrisma.fileBackup.create.mockResolvedValue({});
      mockPrisma.fileAccessLog.create.mockResolvedValue({});
      mockPrisma.storageQuota.findUnique.mockResolvedValue({
        usedBytes: 1000,
        usedFiles: 1,
      });
      mockPrisma.storageQuota.update.mockResolvedValue({});

      await service.deleteFile(tenantId, 'file-123', userId);

      expect(mockPrisma.file.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: FileStatus.DELETED,
          }),
        })
      );
    });

    it('should throw error if file not found', async () => {
      mockPrisma.file.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteFile(tenantId, 'nonexistent', userId)
      ).rejects.toThrow('File not found');
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics', async () => {
      const mockQuota = {
        tenantId,
        maxBytes: 1000000000,
        usedBytes: 500000000,
        maxFiles: 10000,
        usedFiles: 100,
        warningThreshold: 80,
        isWarning: false,
        createdAt: new Date(),
      };

      mockPrisma.storageQuota.findUnique.mockResolvedValue(mockQuota);
      mockPrisma.file.groupBy.mockResolvedValue([
        { mimeType: 'application/pdf', _count: { mimeType: 50 } },
        { mimeType: 'text/plain', _count: { mimeType: 30 } },
      ]);
      mockPrisma.file.count.mockResolvedValue(15);

      const stats = await service.getStorageStats(tenantId);

      expect(stats.totalFiles).toBe(100);
      expect(stats.totalBytes).toBe(500000000);
      expect(stats.maxBytes).toBe(1000000000);
      expect(stats.usagePercent).toBe(50);
      expect(stats.recentFiles).toBe(15);
      expect(stats.warningStatus).toBe(false);
    });
  });

  describe('createBackup', () => {
    it('should create file backup', async () => {
      const mockFile = {
        id: 'file-123',
        storageKey: 'tenant-123/user-123/file',
      };

      mockPrisma.file.findUnique.mockResolvedValue(mockFile);
      mockPrisma.fileBackup.findFirst.mockResolvedValue(null);
      mockPrisma.fileBackup.create.mockResolvedValue({
        fileId: 'file-123',
        version: 1,
        storageKey: 'tenant-123/user-123/file/backup-v1',
      });

      const backup = await service.createBackup('file-123', 1000);

      expect(backup.version).toBe(1);
      expect(mockPrisma.fileBackup.create).toHaveBeenCalled();
    });

    it('should increment version number', async () => {
      mockPrisma.file.findUnique.mockResolvedValue({ storageKey: 'key' });
      mockPrisma.fileBackup.findFirst.mockResolvedValue({ version: 3 });
      mockPrisma.fileBackup.create.mockResolvedValue({
        version: 4,
      });

      await service.createBackup('file-123', 1000);

      expect(mockPrisma.fileBackup.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            version: 4,
          }),
        })
      );
    });
  });

  describe('getBackups', () => {
    it('should return file backups', async () => {
      mockPrisma.fileBackup.findMany.mockResolvedValue([
        { version: 2, size: 1000 },
        { version: 1, size: 900 },
      ]);

      const backups = await service.getBackups('file-123');

      expect(backups).toHaveLength(2);
      expect(backups[0].version).toBe(2);
    });
  });

  describe('cleanup', () => {
    it('should delete old files and backups', async () => {
      mockPrisma.file.deleteMany.mockResolvedValue({ count: 5 });
      mockPrisma.fileBackup.deleteMany.mockResolvedValue({ count: 10 });

      const result = await service.cleanup(30);

      expect(result.filesDeleted).toBe(5);
      expect(result.backupsDeleted).toBe(10);
    });
  });

  describe('cleanupAccessLogs', () => {
    it('should delete old access logs', async () => {
      mockPrisma.fileAccessLog.deleteMany.mockResolvedValue({ count: 100 });

      const deleted = await service.cleanupAccessLogs(90);

      expect(deleted).toBe(100);
    });
  });
});
