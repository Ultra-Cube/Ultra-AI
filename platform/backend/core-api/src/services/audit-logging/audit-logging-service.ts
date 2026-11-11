/**
 * Audit Logging Service
 * Tracks all system actions for compliance, security, and debugging
 */

import {
  PrismaClient,
  AuditLog,
  AuditAction,
  AuditResource,
  AuditSeverity,
} from '@prisma/client';

export interface AuditLogData {
  action: AuditAction;
  resource: AuditResource;
  resourceId: string;
  userId?: string;
  tenantId?: string;
  severity?: AuditSeverity;
  description?: string;
  changes?: Record<string, { before: any; after: any }>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

export interface AuditQuery {
  tenantId?: string;
  userId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditLoggingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Log an audit event
   */
  async log(data: AuditLogData): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        userId: data.userId,
        tenantId: data.tenantId,
        severity: data.severity || AuditSeverity.INFO,
        description: data.description,
        changes: data.changes as any,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        success: data.success,
        errorMessage: data.errorMessage,
      },
    });
  }

  /**
   * Query audit logs with filters
   */
  async queryLogs(query: AuditQuery = {}): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        ...(query.tenantId && { tenantId: query.tenantId }),
        ...(query.userId && { userId: query.userId }),
        ...(query.action && { action: query.action }),
        ...(query.resource && { resource: query.resource }),
        ...(query.severity && { severity: query.severity }),
        ...(query.startDate || query.endDate
          ? {
              createdAt: {
                ...(query.startDate && { gte: query.startDate }),
                ...(query.endDate && { lte: query.endDate }),
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit || 50,
      skip: query.offset || 0,
    });
  }

  /**
   * Get audit summary for tenant
   */
  async getTenantSummary(
    tenantId: string,
    days: number = 7
  ): Promise<{
    totalActions: number;
    successCount: number;
    failureCount: number;
    byAction: Record<string, number>;
    riskEvents: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.queryLogs({
      tenantId,
      startDate,
    });

    return {
      totalActions: logs.length,
      successCount: logs.filter((l) => l.success).length,
      failureCount: logs.filter((l) => !l.success).length,
      byAction: logs.reduce(
        (acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      riskEvents: logs.filter(
        (l) => l.severity === AuditSeverity.HIGH || l.severity === AuditSeverity.CRITICAL
      ).length,
    };
  }

  /**
   * Get user's recent actions
   */
  async getUserActions(
    userId: string,
    limit: number = 20
  ): Promise<AuditLog[]> {
    return this.queryLogs({
      userId,
      limit,
    });
  }

  /**
   * Export audit logs (CSV format)
   */
  async exportLogs(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    const logs = await this.queryLogs({
      tenantId,
      startDate,
      endDate,
      limit: 10000,
    });

    const headers = [
      'Timestamp',
      'User ID',
      'Action',
      'Resource',
      'Resource ID',
      'Severity',
      'Success',
      'Description',
      'IP Address',
      'Error Message',
    ];

    const rows = logs.map((log) => [
      log.createdAt.toISOString(),
      log.userId || '',
      log.action,
      log.resource,
      log.resourceId,
      log.severity,
      log.success ? 'Yes' : 'No',
      log.description || '',
      log.ipAddress || '',
      log.errorMessage || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Clean up old audit logs
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }

  /**
   * Get high-risk events
   */
  async getHighRiskEvents(
    tenantId?: string,
    days: number = 30
  ): Promise<AuditLog[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.queryLogs({
      tenantId,
      severity: AuditSeverity.CRITICAL,
      startDate,
      limit: 100,
    });
  }
}
