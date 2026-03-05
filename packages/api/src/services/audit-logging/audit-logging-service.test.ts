/**
 * Audit Logging Service Tests
 */

import {
  AuditLoggingService,
  AuditLogData,
} from './audit-logging-service';
import { AuditAction, AuditResource, AuditSeverity } from '@prisma/client';

const mockPrisma = {
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

describe('AuditLoggingService', () => {
  let service: AuditLoggingService;
  const tenantId = 'tenant-test';
  const userId = 'user-test';

  beforeEach(() => {
    service = new AuditLoggingService(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should create audit log entry', async () => {
      const logData: AuditLogData = {
        action: AuditAction.CREATE,
        resource: AuditResource.FILE,
        resourceId: 'file-123',
        userId,
        tenantId,
        severity: AuditSeverity.INFO,
        success: true,
      };

      mockPrisma.auditLog.create.mockResolvedValue({
        id: 'log-123',
        ...logData,
        createdAt: new Date(),
        updatedAt: new Date(),
        changes: null,
        ipAddress: null,
        userAgent: null,
        description: null,
        errorMessage: null,
      });

      const result = await service.log(logData);

      expect(result.id).toBe('log-123');
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('should include severity as INFO by default', async () => {
      const logData: AuditLogData = {
        action: AuditAction.UPDATE,
        resource: AuditResource.USER,
        resourceId: 'user-123',
        success: true,
      };

      mockPrisma.auditLog.create.mockResolvedValue({});

      await service.log(logData);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            severity: AuditSeverity.INFO,
          }),
        })
      );
    });
  });

  describe('queryLogs', () => {
    it('should return filtered audit logs', async () => {
      const mockLogs = [
        {
          id: '1',
          action: AuditAction.DELETE,
          resource: AuditResource.FILE,
          tenantId,
          createdAt: new Date(),
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.queryLogs({ tenantId });

      expect(result).toHaveLength(1);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalled();
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      mockPrisma.auditLog.findMany.mockResolvedValue([]);

      await service.queryLogs({ startDate, endDate });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
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
  });

  describe('getTenantSummary', () => {
    it('should return audit summary', async () => {
      const mockLogs = [
        { success: true, severity: AuditSeverity.INFO, action: AuditAction.CREATE },
        { success: true, severity: AuditSeverity.INFO, action: AuditAction.CREATE },
        { success: false, severity: AuditSeverity.HIGH, action: AuditAction.DELETE },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const summary = await service.getTenantSummary(tenantId);

      expect(summary.totalActions).toBe(3);
      expect(summary.successCount).toBe(2);
      expect(summary.failureCount).toBe(1);
      expect(summary.riskEvents).toBe(1);
    });
  });

  describe('exportLogs', () => {
    it('should export logs as CSV', async () => {
      const mockLogs = [
        {
          createdAt: new Date('2024-03-05'),
          userId: 'user-1',
          action: AuditAction.UPDATE,
          resource: AuditResource.FILE,
          resourceId: 'file-1',
          severity: AuditSeverity.INFO,
          success: true,
          description: 'Updated file',
          ipAddress: '192.168.1.1',
          errorMessage: null,
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const csv = await service.exportLogs(tenantId);

      expect(csv).toContain('Timestamp');
      expect(csv).toContain('user-1');
      expect(csv).toContain('file-1');
    });
  });

  describe('cleanupOldLogs', () => {
    it('should delete logs older than specified days', async () => {
      mockPrisma.auditLog.deleteMany.mockResolvedValue({ count: 100 });

      const deleted = await service.cleanupOldLogs(90);

      expect(deleted).toBe(100);
      expect(mockPrisma.auditLog.deleteMany).toHaveBeenCalled();
    });
  });

  describe('getHighRiskEvents', () => {
    it('should return critical events', async () => {
      const mockLogs = [
        { severity: AuditSeverity.CRITICAL, action: AuditAction.DELETE },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const events = await service.getHighRiskEvents(tenantId);

      expect(events).toHaveLength(1);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            severity: AuditSeverity.CRITICAL,
          }),
        })
      );
    });
  });
});
