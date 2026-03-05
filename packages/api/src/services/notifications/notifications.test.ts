/**
 * Notification Service Tests
 */

import {
  PrismaClient,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationChannel,
} from '@prisma/client';
import {
  NotificationService,
  CreateNotificationData,
  UpdatePreferencesData,
} from './notification-service';

// Mock Prisma Client
const mockPrisma = {
  notification: {
    create: jest.fn(),
    createMany: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  notificationPreference: {
    findUnique: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

describe('NotificationService', () => {
  let service: NotificationService;
  const tenantId = 'tenant_test123';
  const userId = 'user_test123';

  beforeEach(() => {
    service = new NotificationService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('Create Notification', () => {
    it('should create a notification successfully', async () => {
      const notificationData: CreateNotificationData = {
        userId,
        type: NotificationType.INFO,
        priority: NotificationPriority.NORMAL,
        title: 'Test Notification',
        message: 'This is a test',
        channels: [NotificationChannel.IN_APP],
      };

      const mockPreferences = {
        id: 'pref_123',
        tenantId,
        userId,
        enableInApp: true,
        enableEmail: true,
        enablePush: false,
        enableSMS: false,
        mutedTypes: [],
        quietHoursStart: null,
        quietHoursEnd: null,
        quietHoursTimezone: 'UTC',
        emailDigest: false,
        digestTime: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockNotification = {
        id: 'notif_123',
        tenantId,
        userId,
        ...notificationData,
        status: NotificationStatus.PENDING,
        isRead: false,
        isArchived: false,
        createdAt: new Date(),
        sentAt: null,
        deliveredAt: null,
        readAt: null,
        archivedAt: null,
        failedAt: null,
        errorMessage: null,
        icon: null,
        actionUrl: null,
        actionLabel: null,
        metadata: null,
        expiresAt: null,
      };

      (mockPrisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(mockPreferences);
      (mockPrisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);

      const result = await service.create(tenantId, notificationData);

      expect(result).toEqual(mockNotification);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId,
            userId,
            title: 'Test Notification',
            message: 'This is a test',
          }),
        })
      );
    });

    it('should reject notification if type is muted', async () => {
      const notificationData: CreateNotificationData = {
        userId,
        type: NotificationType.INFO,
        title: 'Test',
        message: 'Test',
      };

      const mockPreferences = {
        id: 'pref_123',
        tenantId,
        userId,
        enableInApp: true,
        enableEmail: true,
        enablePush: false,
        enableSMS: false,
        mutedTypes: [NotificationType.INFO],
        quietHoursStart: null,
        quietHoursEnd: null,
        quietHoursTimezone: 'UTC',
        emailDigest: false,
        digestTime: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(mockPreferences);

      await expect(service.create(tenantId, notificationData)).rejects.toThrow(
        'Notification type is muted for this user'
      );
    });
  });

  describe('Create Bulk Notifications', () => {
    it('should create multiple notifications at once', async () => {
      const userIds = ['user1', 'user2', 'user3'];
      const data = {
        type: NotificationType.ANNOUNCEMENT,
        title: 'System Announcement',
        message: 'Important update',
      };

      (mockPrisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await service.createBulk(tenantId, userIds, data);

      expect(result).toBe(3);
      expect(mockPrisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            tenantId,
            userId: 'user1',
            title: 'System Announcement',
          }),
          expect.objectContaining({
            tenantId,
            userId: 'user2',
            title: 'System Announcement',
          }),
          expect.objectContaining({
            tenantId,
            userId: 'user3',
            title: 'System Announcement',
          }),
        ]),
      });
    });
  });

  describe('Get Notifications', () => {
    it('should get notifications for a user', async () => {
      const mockNotifications = [
        {
          id: 'notif_1',
          title: 'Notification 1',
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'notif_2',
          title: 'Notification 2',
          isRead: true,
          createdAt: new Date(),
        },
      ];

      (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);

      const result = await service.getNotifications(tenantId, { userId });

      expect(result).toEqual(mockNotifications);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            userId,
          }),
        })
      );
    });

    it('should filter notifications by type', async () => {
      (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue([]);

      await service.getNotifications(tenantId, {
        userId,
        type: NotificationType.ERROR,
      });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: NotificationType.ERROR,
          }),
        })
      );
    });

    it('should filter unread notifications', async () => {
      (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue([]);

      await service.getNotifications(tenantId, {
        userId,
        isRead: false,
      });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isRead: false,
          }),
        })
      );
    });
  });

  describe('Unread Count', () => {
    it('should get unread notification count', async () => {
      (mockPrisma.notification.count as jest.Mock).mockResolvedValue(5);

      const result = await service.getUnreadCount(tenantId, userId);

      expect(result).toBe(5);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            userId,
            isRead: false,
            isArchived: false,
          }),
        })
      );
    });
  });

  describe('Notification Statistics', () => {
    it('should get comprehensive notification stats', async () => {
      (mockPrisma.notification.count as jest.Mock)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(15) // unread
        .mockResolvedValueOnce(10); // recent

      (mockPrisma.notification.groupBy as jest.Mock)
        .mockResolvedValueOnce([
          { type: NotificationType.INFO, _count: { type: 50 } },
          { type: NotificationType.ERROR, _count: { type: 10 } },
        ])
        .mockResolvedValueOnce([
          { priority: NotificationPriority.NORMAL, _count: { priority: 80 } },
          { priority: NotificationPriority.HIGH, _count: { priority: 20 } },
        ]);

      const result = await service.getStats(tenantId, userId);

      expect(result).toMatchObject({
        total: 100,
        unread: 15,
        byType: {
          INFO: 50,
          ERROR: 10,
        },
        byPriority: {
          NORMAL: 80,
          HIGH: 20,
        },
        recentCount: 10,
      });
    });
  });

  describe('Mark as Read', () => {
    it('should mark single notification as read', async () => {
      const mockNotification = {
        id: 'notif_123',
        isRead: true,
        readAt: new Date(),
      };

      (mockPrisma.notification.update as jest.Mock).mockResolvedValue(mockNotification);

      const result = await service.markAsRead(tenantId, 'notif_123', userId);

      expect(result.isRead).toBe(true);
      expect(mockPrisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'notif_123',
            tenantId,
            userId,
          },
          data: {
            isRead: true,
            readAt: expect.any(Date),
          },
        })
      );
    });

    it('should mark all notifications as read', async () => {
      (mockPrisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 10 });

      const result = await service.markAllAsRead(tenantId, userId);

      expect(result).toBe(10);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId,
            userId,
            isRead: false,
          },
          data: {
            isRead: true,
            readAt: expect.any(Date),
          },
        })
      );
    });
  });

  describe('Archive Notification', () => {
    it('should archive a notification', async () => {
      const mockNotification = {
        id: 'notif_123',
        isArchived: true,
        archivedAt: new Date(),
      };

      (mockPrisma.notification.update as jest.Mock).mockResolvedValue(mockNotification);

      const result = await service.archive(tenantId, 'notif_123', userId);

      expect(result.isArchived).toBe(true);
      expect(mockPrisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'notif_123',
            tenantId,
            userId,
          },
          data: {
            isArchived: true,
            archivedAt: expect.any(Date),
          },
        })
      );
    });
  });

  describe('Delete Notifications', () => {
    it('should delete a single notification', async () => {
      (mockPrisma.notification.delete as jest.Mock).mockResolvedValue({});

      await service.delete(tenantId, 'notif_123', userId);

      expect(mockPrisma.notification.delete).toHaveBeenCalledWith({
        where: {
          id: 'notif_123',
          tenantId,
          userId,
        },
      });
    });

    it('should delete all read notifications', async () => {
      (mockPrisma.notification.deleteMany as jest.Mock).mockResolvedValue({ count: 15 });

      const result = await service.deleteAllRead(tenantId, userId);

      expect(result).toBe(15);
      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          userId,
          isRead: true,
        },
      });
    });
  });

  describe('Notification Preferences', () => {
    it('should get or create preferences', async () => {
      const mockPreferences = {
        id: 'pref_123',
        tenantId,
        userId,
        enableInApp: true,
        enableEmail: true,
        enablePush: false,
        enableSMS: false,
        mutedTypes: [],
        quietHoursStart: null,
        quietHoursEnd: null,
        quietHoursTimezone: 'UTC',
        emailDigest: false,
        digestTime: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(mockPreferences);

      const result = await service.getOrCreatePreferences(tenantId, userId);

      expect(result).toEqual(mockPreferences);
    });

    it('should create preferences if not exist', async () => {
      const mockPreferences = {
        id: 'pref_new',
        tenantId,
        userId,
        enableInApp: true,
        enableEmail: true,
        enablePush: false,
        enableSMS: false,
        mutedTypes: [],
        quietHoursStart: null,
        quietHoursEnd: null,
        quietHoursTimezone: 'UTC',
        emailDigest: false,
        digestTime: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.notificationPreference.create as jest.Mock).mockResolvedValue(mockPreferences);

      const result = await service.getOrCreatePreferences(tenantId, userId);

      expect(result).toEqual(mockPreferences);
      expect(mockPrisma.notificationPreference.create).toHaveBeenCalled();
    });

    it('should update preferences', async () => {
      const updates: UpdatePreferencesData = {
        enablePush: true,
        mutedTypes: [NotificationType.INFO],
        quietHoursStart: 22,
        quietHoursEnd: 7,
      };

      const mockUpdatedPreferences = {
        id: 'pref_123',
        tenantId,
        userId,
        enableInApp: true,
        enableEmail: true,
        enablePush: true,
        enableSMS: false,
        mutedTypes: [NotificationType.INFO],
        quietHoursStart: 22,
        quietHoursEnd: 7,
        quietHoursTimezone: 'UTC',
        emailDigest: false,
        digestTime: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.notificationPreference.upsert as jest.Mock).mockResolvedValue(mockUpdatedPreferences);

      const result = await service.updatePreferences(tenantId, userId, updates);

      expect(result.enablePush).toBe(true);
      expect(result.quietHoursStart).toBe(22);
    });
  });

  describe('System Notifications', () => {
    it('should send system notification', async () => {
      const mockPreferences = {
        id: 'pref_123',
        tenantId,
        userId,
        enableInApp: true,
        enableEmail: true,
        enablePush: false,
        enableSMS: false,
        mutedTypes: [],
        quietHoursStart: null,
        quietHoursEnd: null,
        quietHoursTimezone: 'UTC',
        emailDigest: false,
        digestTime: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockNotification = {
        id: 'notif_sys',
        type: NotificationType.SYSTEM,
      };

      (mockPrisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(mockPreferences);
      (mockPrisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);

      await service.sendSystemNotification(
        tenantId,
        userId,
        'System Update',
        'System maintenance scheduled'
      );

      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: NotificationType.SYSTEM,
            title: 'System Update',
          }),
        })
      );
    });
  });

  describe('Broadcast to Tenant', () => {
    it('should broadcast notification to all tenant users', async () => {
      const mockUsers = [
        { id: 'user1' },
        { id: 'user2' },
        { id: 'user3' },
      ];

      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (mockPrisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await service.broadcastToTenant(
        tenantId,
        'Broadcast',
        'Message to all users'
      );

      expect(result).toBe(3);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId },
        })
      );
    });

    it('should exclude specific users from broadcast', async () => {
      const mockUsers = [
        { id: 'user1' },
        { id: 'user3' },
      ];

      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (mockPrisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      await service.broadcastToTenant(
        tenantId,
        'Broadcast',
        'Message',
        { excludeUserIds: ['user2'] }
      );

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { notIn: ['user2'] },
          }),
        })
      );
    });
  });

  describe('Cleanup', () => {
    it('should cleanup expired notifications', async () => {
      (mockPrisma.notification.deleteMany as jest.Mock).mockResolvedValue({ count: 25 });

      const result = await service.cleanupExpired();

      expect(result).toBe(25);
      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            expiresAt: {
              lt: expect.any(Date),
            },
          }),
        })
      );
    });

    it('should cleanup old archived notifications', async () => {
      (mockPrisma.notification.deleteMany as jest.Mock).mockResolvedValue({ count: 50 });

      const result = await service.cleanupOldArchived(30);

      expect(result).toBe(50);
      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isArchived: true,
            archivedAt: {
              lt: expect.any(Date),
            },
          }),
        })
      );
    });
  });
});
