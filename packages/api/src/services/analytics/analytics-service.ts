/**
 * Advanced Analytics Service
 * Provides comprehensive analytics, event tracking, and metrics aggregation
 */

import {
  PrismaClient,
  EventType,
  EventSeverity,
  MetricType,
  AnalyticsEvent,
  AnalyticsMetric,
  UserActivity,
  SystemMetric,
} from '@prisma/client';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface EventData {
  eventType: EventType;
  eventName: string;
  severity?: EventSeverity;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  metadata?: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  success?: boolean;
  errorMessage?: string;
  errorStack?: string;
}

export interface ActivityData {
  action: string;
  resource?: string;
  resourceId?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface MetricData {
  metricType: MetricType;
  metricName: string;
  value: number;
  count?: number;
  dimension1?: string;
  dimension2?: string;
  dimension3?: string;
  windowStart?: Date;
  windowEnd?: Date;
}

export interface AnalyticsQuery {
  eventType?: EventType;
  eventName?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface MetricsQuery {
  metricName?: string;
  startDate?: Date;
  endDate?: Date;
  groupBy?: string[];
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
}

export interface DashboardStats {
  totalEvents: number;
  totalUsers: number;
  activeUsers: number; // Last 24h
  errorRate: number;
  avgResponseTime: number;
  topEvents: Array<{ eventName: string; count: number }>;
  topPages: Array<{ path: string; views: number }>;
  userGrowth: Array<{ date: string; count: number }>;
  errorsByType: Array<{ eventType: EventType; count: number }>;
  systemHealth: {
    cpuUsage?: number;
    memoryUsage?: number;
    responseTime?: number;
  };
}

export interface ReportOptions {
  format: 'json' | 'csv';
  includeMetadata?: boolean;
  groupBy?: string[];
}

// ============================================================================
// Analytics Service
// ============================================================================

export class AnalyticsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Track an event
   */
  async trackEvent(
    tenantId: string,
    userId: string | null,
    eventData: EventData
  ): Promise<AnalyticsEvent> {
    return this.prisma.analyticsEvent.create({
      data: {
        tenantId,
        userId,
        ...eventData,
      },
    });
  }

  /**
   * Track user activity with change tracking
   */
  async trackActivity(
    tenantId: string,
    userId: string,
    activityData: ActivityData
  ): Promise<UserActivity> {
    return this.prisma.userActivity.create({
      data: {
        tenantId,
        userId,
        ...activityData,
      },
    });
  }

  /**
   * Record a metric
   */
  async recordMetric(tenantId: string, metricData: MetricData): Promise<AnalyticsMetric> {
    const now = new Date();
    const windowStart = metricData.windowStart || now;
    const windowEnd = metricData.windowEnd || now;

    return this.prisma.analyticsMetric.upsert({
      where: {
        tenantId_metricName_dimension1_dimension2_dimension3_windowStart: {
          tenantId,
          metricName: metricData.metricName,
          dimension1: metricData.dimension1 || null,
          dimension2: metricData.dimension2 || null,
          dimension3: metricData.dimension3 || null,
          windowStart,
        },
      },
      update: {
        value: metricData.value,
        count: { increment: metricData.count || 1 },
      },
      create: {
        tenantId,
        ...metricData,
        windowStart,
        windowEnd,
      },
    });
  }

  /**
   * Record system metric (global, not tenant-specific)
   */
  async recordSystemMetric(
    metricName: string,
    value: number,
    options?: {
      unit?: string;
      host?: string;
      service?: string;
      tags?: Record<string, any>;
    }
  ): Promise<SystemMetric> {
    return this.prisma.systemMetric.create({
      data: {
        metricName,
        value,
        ...options,
      },
    });
  }

  /**
   * Get events with filtering
   */
  async getEvents(tenantId: string, query: AnalyticsQuery = {}): Promise<AnalyticsEvent[]> {
    const {
      eventType,
      eventName,
      userId,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = query;

    return this.prisma.analyticsEvent.findMany({
      where: {
        tenantId,
        ...(eventType && { eventType }),
        ...(eventName && { eventName }),
        ...(userId && { userId }),
        ...(startDate || endDate
          ? {
              timestamp: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
              },
            }
          : {}),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Get user activities
   */
  async getUserActivities(
    tenantId: string,
    userId?: string,
    limit = 50
  ): Promise<UserActivity[]> {
    return this.prisma.userActivity.findMany({
      where: {
        tenantId,
        ...(userId && { userId }),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Get aggregated metrics
   */
  async getMetrics(tenantId: string, query: MetricsQuery = {}): Promise<AnalyticsMetric[]> {
    const { metricName, startDate, endDate } = query;

    return this.prisma.analyticsMetric.findMany({
      where: {
        tenantId,
        ...(metricName && { metricName }),
        ...(startDate || endDate
          ? {
              windowStart: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
              },
            }
          : {}),
      },
      orderBy: { windowStart: 'desc' },
    });
  }

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(tenantId: string): Promise<DashboardStats> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Run queries in parallel
    const [
      totalEvents,
      recentEvents,
      totalUsers,
      activeUsers,
      errorEvents,
      topEvents,
      topPages,
      errorsByType,
    ] = await Promise.all([
      // Total events
      this.prisma.analyticsEvent.count({ where: { tenantId } }),

      // Recent events for response time calc
      this.prisma.analyticsEvent.findMany({
        where: {
          tenantId,
          timestamp: { gte: yesterday },
          duration: { not: null },
        },
        select: { duration: true, success: true },
      }),

      // Total users
      this.prisma.user.count({ where: { tenantId } }),

      // Active users (24h)
      this.prisma.analyticsEvent.findMany({
        where: {
          tenantId,
          timestamp: { gte: yesterday },
          userId: { not: null },
        },
        distinct: ['userId'],
        select: { userId: true },
      }),

      // Error events
      this.prisma.analyticsEvent.count({
        where: {
          tenantId,
          timestamp: { gte: yesterday },
          success: false,
        },
      }),

      // Top events
      this.prisma.analyticsEvent.groupBy({
        by: ['eventName'],
        where: {
          tenantId,
          timestamp: { gte: lastWeek },
        },
        _count: { eventName: true },
        orderBy: { _count: { eventName: 'desc' } },
        take: 5,
      }),

      // Top pages
      this.prisma.analyticsEvent.groupBy({
        by: ['path'],
        where: {
          tenantId,
          eventType: 'PAGE_VIEW',
          timestamp: { gte: lastWeek },
          path: { not: null },
        },
        _count: { path: true },
        orderBy: { _count: { path: 'desc' } },
        take: 5,
      }),

      // Errors by type
      this.prisma.analyticsEvent.groupBy({
        by: ['eventType'],
        where: {
          tenantId,
          success: false,
          timestamp: { gte: lastWeek },
        },
        _count: { eventType: true },
      }),
    ]);

    // Calculate average response time
    const avgResponseTime =
      recentEvents.length > 0
        ? recentEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / recentEvents.length
        : 0;

    // Calculate error rate
    const totalRecentEvents = recentEvents.length;
    const errorRate =
      totalRecentEvents > 0 ? (errorEvents / totalRecentEvents) * 100 : 0;

    // Get user growth (last 7 days)
    const userGrowth = await this.getUserGrowth(tenantId, 7);

    // Get latest system metrics
    const systemHealth = await this.getSystemHealth();

    return {
      totalEvents,
      totalUsers,
      activeUsers: activeUsers.length,
      errorRate: Math.round(errorRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      topEvents: topEvents.map(e => ({
        eventName: e.eventName,
        count: e._count.eventName,
      })),
      topPages: topPages.map(p => ({
        path: p.path || 'unknown',
        views: p._count.path,
      })),
      userGrowth,
      errorsByType: errorsByType.map(e => ({
        eventType: e.eventType,
        count: e._count.eventType,
      })),
      systemHealth,
    };
  }

  /**
   * Get user growth over time
   */
  private async getUserGrowth(
    tenantId: string,
    days: number
  ): Promise<Array<{ date: string; count: number }>> {
    const result: Array<{ date: string; count: number }> = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const count = await this.prisma.user.count({
        where: {
          tenantId,
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      result.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    return result;
  }

  /**
   * Get system health metrics
   */
  private async getSystemHealth(): Promise<{
    cpuUsage?: number;
    memoryUsage?: number;
    responseTime?: number;
  }> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [cpuMetrics, memoryMetrics, responseMetrics] = await Promise.all([
      this.prisma.systemMetric.findMany({
        where: {
          metricName: 'cpu_usage',
          timestamp: { gte: fiveMinutesAgo },
        },
        orderBy: { timestamp: 'desc' },
        take: 1,
      }),
      this.prisma.systemMetric.findMany({
        where: {
          metricName: 'memory_usage',
          timestamp: { gte: fiveMinutesAgo },
        },
        orderBy: { timestamp: 'desc' },
        take: 1,
      }),
      this.prisma.systemMetric.findMany({
        where: {
          metricName: 'response_time',
          timestamp: { gte: fiveMinutesAgo },
        },
        orderBy: { timestamp: 'desc' },
        take: 1,
      }),
    ]);

    return {
      cpuUsage: cpuMetrics[0]?.value,
      memoryUsage: memoryMetrics[0]?.value,
      responseTime: responseMetrics[0]?.value,
    };
  }

  /**
   * Generate custom report
   */
  async generateReport(
    tenantId: string,
    query: AnalyticsQuery,
    options: ReportOptions = { format: 'json' }
  ): Promise<string> {
    const events = await this.getEvents(tenantId, query);

    if (options.format === 'csv') {
      return this.eventsToCSV(events, options.includeMetadata);
    }

    return JSON.stringify(events, null, 2);
  }

  /**
   * Convert events to CSV format
   */
  private eventsToCSV(events: any[], includeMetadata = false): string {
    if (events.length === 0) return '';

    const headers = [
      'timestamp',
      'eventType',
      'eventName',
      'userId',
      'path',
      'method',
      'statusCode',
      'duration',
      'success',
    ];

    if (includeMetadata) {
      headers.push('metadata');
    }

    const rows = events.map(event => {
      const row = [
        event.timestamp.toISOString(),
        event.eventType,
        event.eventName,
        event.userId || '',
        event.path || '',
        event.method || '',
        event.statusCode || '',
        event.duration || '',
        event.success,
      ];

      if (includeMetadata) {
        row.push(JSON.stringify(event.metadata || {}));
      }

      return row.join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Clean old analytics data
   */
  async cleanOldData(daysToKeep = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await this.prisma.analyticsEvent.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    return result.count;
  }

  /**
   * Get event count by type
   */
  async getEventCountByType(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<string, number>> {
    const result = await this.prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: {
        tenantId,
        ...(startDate || endDate
          ? {
              timestamp: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
              },
            }
          : {}),
      },
      _count: { eventType: true },
    });

    return result.reduce(
      (acc, item) => {
        acc[item.eventType] = item._count.eventType;
        return acc;
      },
      {} as Record<string, number>
    );
  }
}

// ============================================================================
// Analytics Middleware
// ============================================================================

export interface RequestContext {
  tenantId?: string;
  userId?: string;
  path: string;
  method: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Create analytics tracking middleware for Fastify
 */
export function createAnalyticsMiddleware(analyticsService: AnalyticsService) {
  return async (request: any, reply: any) => {
    const startTime = Date.now();

    // Store original send function
    const originalSend = reply.send.bind(reply);

    // Override send to track after response
    reply.send = function (payload: any) {
      const duration = Date.now() - startTime;
      const statusCode = reply.statusCode;

      // Track event asynchronously (don't block response)
      setImmediate(async () => {
        try {
          const tenantId = request.tenantContext?.tenantId;
          const userId = request.user?.id;

          if (tenantId) {
            await analyticsService.trackEvent(tenantId, userId || null, {
              eventType: 'API_CALL' as EventType,
              eventName: `${request.method} ${request.url}`,
              path: request.url,
              method: request.method,
              statusCode,
              duration,
              success: statusCode < 400,
              userAgent: request.headers['user-agent'],
              ipAddress: request.ip,
              metadata: {
                query: request.query,
                params: request.params,
              },
            });
          }
        } catch (error) {
          console.error('Analytics tracking error:', error);
        }
      });

      return originalSend(payload);
    };
  };
}
