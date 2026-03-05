/**
 * Real-time Notification System
 * Provides comprehensive notification management with multi-channel delivery
 */

import {
  PrismaClient,
  Notification,
  NotificationPreference,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationChannel,
} from '@prisma/client';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface CreateNotificationData {
  userId: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  channels?: NotificationChannel[];
  expiresAt?: Date;
}

export interface NotificationQuery {
  userId?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  isRead?: boolean;
  isArchived?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface UpdatePreferencesData {
  enableInApp?: boolean;
  enableEmail?: boolean;
  enablePush?: boolean;
  enableSMS?: boolean;
  mutedTypes?: NotificationType[];
  quietHoursStart?: number;
  quietHoursEnd?: number;
  quietHoursTimezone?: string;
  emailDigest?: boolean;
  digestTime?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  recentCount: number;
}

// ============================================================================
// Notification Service
// ============================================================================

export class NotificationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create and send a notification
   */
  async create(
    tenantId: string,
    data: CreateNotificationData
  ): Promise<Notification> {
    // Get user preferences
    const preferences = await this.getOrCreatePreferences(tenantId, data.userId);

    // Check if notification type is muted
    if (preferences.mutedTypes.includes(data.type || NotificationType.INFO)) {
      throw new Error('Notification type is muted for this user');
    }

    // Check quiet hours
    if (this.isQuietHours(preferences)) {
      // Queue notification for later delivery
      // For now, we'll create it but mark it as pending
    }

    // Determine channels based on preferences
    const channels = this.determineChannels(data.channels, preferences);

    // Create notification
    const notification = await this.prisma.notification.create({
      data: {
        tenantId,
        userId: data.userId,
        type: data.type || NotificationType.INFO,
        priority: data.priority || NotificationPriority.NORMAL,
        status: NotificationStatus.PENDING,
        title: data.title,
        message: data.message,
        icon: data.icon,
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        metadata: data.metadata as any,
        channels,
        expiresAt: data.expiresAt,
      },
    });

    // Trigger delivery (async, don't block)
    setImmediate(() => {
      this.deliverNotification(notification).catch(error => {
        console.error('Notification delivery error:', error);
      });
    });

    return notification;
  }

  /**
   * Create bulk notifications
   */
  async createBulk(
    tenantId: string,
    userIds: string[],
    data: Omit<CreateNotificationData, 'userId'>
  ): Promise<number> {
    const notifications = userIds.map(userId => ({
      tenantId,
      userId,
      type: data.type || NotificationType.INFO,
      priority: data.priority || NotificationPriority.NORMAL,
      status: NotificationStatus.PENDING,
      title: data.title,
      message: data.message,
      icon: data.icon,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel,
      metadata: data.metadata as any,
      channels: data.channels || [NotificationChannel.IN_APP],
      expiresAt: data.expiresAt,
    }));

    const result = await this.prisma.notification.createMany({
      data: notifications,
    });

    return result.count;
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(
    tenantId: string,
    query: NotificationQuery = {}
  ): Promise<Notification[]> {
    const {
      userId,
      type,
      priority,
      isRead,
      isArchived = false,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = query;

    return this.prisma.notification.findMany({
      where: {
        tenantId,
        ...(userId && { userId }),
        ...(type && { type }),
        ...(priority && { priority }),
        ...(isRead !== undefined && { isRead }),
        isArchived,
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
              },
            }
          : {}),
        // Filter out expired notifications
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(tenantId: string, userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        tenantId,
        userId,
        isRead: false,
        isArchived: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });
  }

  /**
   * Get notification statistics
   */
  async getStats(tenantId: string, userId: string): Promise<NotificationStats> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [total, unread, byType, byPriority, recent] = await Promise.all([
      // Total notifications
      this.prisma.notification.count({
        where: { tenantId, userId, isArchived: false },
      }),

      // Unread count
      this.prisma.notification.count({
        where: { tenantId, userId, isRead: false, isArchived: false },
      }),

      // By type
      this.prisma.notification.groupBy({
        by: ['type'],
        where: { tenantId, userId, isArchived: false },
        _count: { type: true },
      }),

      // By priority
      this.prisma.notification.groupBy({
        by: ['priority'],
        where: { tenantId, userId, isArchived: false },
        _count: { priority: true },
      }),

      // Recent (last 24h)
      this.prisma.notification.count({
        where: {
          tenantId,
          userId,
          isArchived: false,
          createdAt: { gte: oneDayAgo },
        },
      }),
    ]);

    return {
      total,
      unread,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = item._count.priority;
        return acc;
      }, {} as Record<string, number>),
      recentCount: recent,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(
    tenantId: string,
    notificationId: string,
    userId: string
  ): Promise<Notification> {
    return this.prisma.notification.update({
      where: {
        id: notificationId,
        tenantId,
        userId, // Ensure user owns this notification
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(tenantId: string, userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        tenantId,
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Archive notification
   */
  async archive(
    tenantId: string,
    notificationId: string,
    userId: string
  ): Promise<Notification> {
    return this.prisma.notification.update({
      where: {
        id: notificationId,
        tenantId,
        userId,
      },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });
  }

  /**
   * Delete notification
   */
  async delete(
    tenantId: string,
    notificationId: string,
    userId: string
  ): Promise<void> {
    await this.prisma.notification.delete({
      where: {
        id: notificationId,
        tenantId,
        userId,
      },
    });
  }

  /**
   * Delete all read notifications
   */
  async deleteAllRead(tenantId: string, userId: string): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: {
        tenantId,
        userId,
        isRead: true,
      },
    });

    return result.count;
  }

  /**
   * Get or create user notification preferences
   */
  async getOrCreatePreferences(
    tenantId: string,
    userId: string
  ): Promise<NotificationPreference> {
    let preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await this.prisma.notificationPreference.create({
        data: {
          tenantId,
          userId,
        },
      });
    }

    return preferences;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    tenantId: string,
    userId: string,
    data: UpdatePreferencesData
  ): Promise<NotificationPreference> {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: {
        ...data,
        mutedTypes: data.mutedTypes as any,
      },
      create: {
        tenantId,
        userId,
        ...data,
        mutedTypes: data.mutedTypes as any,
      },
    });
  }

  /**
   * Send notification to a user (system-level)
   */
  async sendSystemNotification(
    tenantId: string,
    userId: string,
    title: string,
    message: string,
    options?: {
      type?: NotificationType;
      priority?: NotificationPriority;
      actionUrl?: string;
      actionLabel?: string;
    }
  ): Promise<Notification> {
    return this.create(tenantId, {
      userId,
      type: options?.type || NotificationType.SYSTEM,
      priority: options?.priority || NotificationPriority.NORMAL,
      title,
      message,
      actionUrl: options?.actionUrl,
      actionLabel: options?.actionLabel,
      channels: [NotificationChannel.IN_APP],
    });
  }

  /**
   * Send notification to all tenant users (broadcast)
   */
  async broadcastToTenant(
    tenantId: string,
    title: string,
    message: string,
    options?: {
      type?: NotificationType;
      priority?: NotificationPriority;
      excludeUserIds?: string[];
    }
  ): Promise<number> {
    // Get all users in tenant
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        ...(options?.excludeUserIds && {
          id: { notIn: options.excludeUserIds },
        }),
      },
      select: { id: true },
    });

    const userIds = users.map(u => u.id);

    return this.createBulk(tenantId, userIds, {
      type: options?.type || NotificationType.ANNOUNCEMENT,
      priority: options?.priority || NotificationPriority.NORMAL,
      title,
      message,
    });
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpired(): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  /**
   * Clean up old archived notifications
   */
  async cleanupOldArchived(daysToKeep = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await this.prisma.notification.deleteMany({
      where: {
        isArchived: true,
        archivedAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Check if current time is within user's quiet hours
   */
  private isQuietHours(preferences: NotificationPreference): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();

    const start = preferences.quietHoursStart;
    const end = preferences.quietHoursEnd;

    if (start < end) {
      return currentHour >= start && currentHour < end;
    } else {
      // Quiet hours span midnight
      return currentHour >= start || currentHour < end;
    }
  }

  /**
   * Determine which channels to use based on user preferences
   */
  private determineChannels(
    requestedChannels: NotificationChannel[] | undefined,
    preferences: NotificationPreference
  ): NotificationChannel[] {
    const channels: NotificationChannel[] = [];

    // Default to in-app if no channels specified
    const requested = requestedChannels || [NotificationChannel.IN_APP];

    if (requested.includes(NotificationChannel.IN_APP) && preferences.enableInApp) {
      channels.push(NotificationChannel.IN_APP);
    }

    if (requested.includes(NotificationChannel.EMAIL) && preferences.enableEmail) {
      // Skip if email digest is enabled (will be sent in digest)
      if (!preferences.emailDigest) {
        channels.push(NotificationChannel.EMAIL);
      }
    }

    if (requested.includes(NotificationChannel.PUSH) && preferences.enablePush) {
      channels.push(NotificationChannel.PUSH);
    }

    if (requested.includes(NotificationChannel.SMS) && preferences.enableSMS) {
      channels.push(NotificationChannel.SMS);
    }

    return channels;
  }

  /**
   * Actually deliver notification through channels
   */
  private async deliverNotification(notification: Notification): Promise<void> {
    try {
      const deliveryPromises: Promise<void>[] = [];

      for (const channel of notification.channels) {
        switch (channel) {
          case NotificationChannel.IN_APP:
            // In-app delivery is handled by the database entry itself
            // WebSocket/SSE will be notified separately
            break;

          case NotificationChannel.EMAIL:
            deliveryPromises.push(this.deliverViaEmail(notification));
            break;

          case NotificationChannel.PUSH:
            deliveryPromises.push(this.deliverViaPush(notification));
            break;

          case NotificationChannel.SMS:
            deliveryPromises.push(this.deliverViaSMS(notification));
            break;

          case NotificationChannel.WEBHOOK:
            deliveryPromises.push(this.deliverViaWebhook(notification));
            break;
        }
      }

      await Promise.all(deliveryPromises);

      // Update status to sent
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      // Update status to failed
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.FAILED,
          failedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Deliver notification via email
   */
  private async deliverViaEmail(notification: Notification): Promise<void> {
    // TODO: Implement email delivery (using nodemailer, SendGrid, etc.)
    console.log(`Would send email notification ${notification.id}`);
  }

  /**
   * Deliver notification via push
   */
  private async deliverViaPush(notification: Notification): Promise<void> {
    // TODO: Implement push notification (using FCM, APNs, etc.)
    console.log(`Would send push notification ${notification.id}`);
  }

  /**
   * Deliver notification via SMS
   */
  private async deliverViaSMS(notification: Notification): Promise<void> {
    // TODO: Implement SMS delivery (using Twilio, etc.)
    console.log(`Would send SMS notification ${notification.id}`);
  }

  /**
   * Deliver notification via webhook
   */
  private async deliverViaWebhook(notification: Notification): Promise<void> {
    // TODO: Implement webhook delivery
    console.log(`Would send webhook notification ${notification.id}`);
  }
}

// ============================================================================
// Notification Event Emitter (for real-time updates)
// ============================================================================

export class NotificationEventEmitter {
  private listeners: Map<string, Set<(notification: Notification) => void>> = new Map();

  /**
   * Subscribe to notifications for a user
   */
  subscribe(userId: string, callback: (notification: Notification) => void): () => void {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, new Set());
    }

    this.listeners.get(userId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(userId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(userId);
        }
      }
    };
  }

  /**
   * Emit notification to subscribed listeners
   */
  emit(userId: string, notification: Notification): void {
    const callbacks = this.listeners.get(userId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(notification);
        } catch (error) {
          console.error('Notification listener error:', error);
        }
      });
    }
  }

  /**
   * Get subscriber count for a user
   */
  getSubscriberCount(userId: string): number {
    return this.listeners.get(userId)?.size || 0;
  }
}

// Singleton instance
export const notificationEmitter = new NotificationEventEmitter();
