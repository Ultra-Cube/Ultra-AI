/**
 * Analytics Service Tests
 */

import {
  PrismaClient,
  EventType,
  EventSeverity,
  MetricType,
} from '@prisma/client';
import {
  AnalyticsService,
  EventData,
  ActivityData,
  MetricData,
} from './analytics-service';

// Mock Prisma Client
const mockPrisma = {
  analyticsEvent: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    deleteMany: jest.fn(),
  },
  userActivity: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  analyticsMetric: {
    create: jest.fn(),
    upsert: jest.fn(),
    findMany: jest.fn(),
  },
  systemMetric: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    count: jest.fn(),
  },
} as unknown as PrismaClient;

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  const tenantId = 'tenant_test123';
  const userId = 'user_test123';

  beforeEach(() => {
    service = new AnalyticsService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('Event Tracking', () => {
    it('should track an event successfully', async () => {
      const eventData: EventData = {
        eventType: EventType.API_CALL,
        eventName: 'GET /api/users',
        path: '/api/users',
        method: 'GET',
        statusCode: 200,
        duration: 45,
        success: true,
      };

      const mockEvent = {
        id: 'event_123',
        tenantId,
        userId,
        ...eventData,
        timestamp: new Date(),
      };

      (mockPrisma.analyticsEvent.create as jest.Mock).mockResolvedValue(mockEvent);

      const result = await service.trackEvent(tenantId, userId, eventData);

      expect(result).toEqual(mockEvent);
      expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          userId,
          ...eventData,
        },
      });
    });

    it('should track event without userId', async () => {
      const eventData: EventData = {
        eventType: EventType.PAGE_VIEW,
        eventName: 'Home Page',
        path: '/',
      };

      (mockPrisma.analyticsEvent.create as jest.Mock).mockResolvedValue({
        id: 'event_456',
        tenantId,
        userId: null,
        ...eventData,
      });

      await service.trackEvent(tenantId, null, eventData);

      expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          userId: null,
          ...eventData,
        },
      });
    });

    it('should track error events with severity', async () => {
      const eventData: EventData = {
        eventType: EventType.ERROR,
        eventName: 'Database Connection Error',
        severity: EventSeverity.CRITICAL,
        success: false,
        errorMessage: 'Connection timeout',
        errorStack: 'Error: timeout...',
      };

      (mockPrisma.analyticsEvent.create as jest.Mock).mockResolvedValue({
        id: 'event_error',
        tenantId,
        userId,
        ...eventData,
      });

      await service.trackEvent(tenantId, userId, eventData);

      expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          success: false,
          errorMessage: 'Connection timeout',
          severity: EventSeverity.CRITICAL,
        }),
      });
    });
  });

  describe('Activity Tracking', () => {
    it('should track user activity with changes', async () => {
      const activityData: ActivityData = {
        action: 'update_profile',
        resource: 'user',
        resourceId: userId,
        before: { name: 'John' },
        after: { name: 'John Doe' },
        ipAddress: '192.168.1.1',
      };

      const mockActivity = {
        id: 'activity_123',
        tenantId,
        userId,
        ...activityData,
        timestamp: new Date(),
      };

      (mockPrisma.userActivity.create as jest.Mock).mockResolvedValue(mockActivity);

      const result = await service.trackActivity(tenantId, userId, activityData);

      expect(result).toEqual(mockActivity);
      expect(mockPrisma.userActivity.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          userId,
          ...activityData,
        },
      });
    });
  });

  describe('Metrics Recording', () => {
    it('should record a new metric', async () => {
      const metricData: MetricData = {
        metricType: MetricType.COUNTER,
        metricName: 'api_requests',
        value: 1,
        dimension1: 'GET',
        dimension2: '/api/users',
      };

      const mockMetric = {
        id: 'metric_123',
        tenantId,
        ...metricData,
        count: 1,
        windowStart: new Date(),
        windowEnd: new Date(),
      };

      (mockPrisma.analyticsMetric.upsert as jest.Mock).mockResolvedValue(mockMetric);

      const result = await service.recordMetric(tenantId, metricData);

      expect(result).toEqual(mockMetric);
      expect(mockPrisma.analyticsMetric.upsert).toHaveBeenCalled();
    });

    it('should increment existing metric', async () => {
      const metricData: MetricData = {
        metricType: MetricType.COUNTER,
        metricName: 'page_views',
        value: 1,
        count: 1,
      };

      (mockPrisma.analyticsMetric.upsert as jest.Mock).mockResolvedValue({
        id: 'metric_existing',
        tenantId,
        ...metricData,
        count: 5,
      });

      await service.recordMetric(tenantId, metricData);

      const call = (mockPrisma.analyticsMetric.upsert as jest.Mock).mock.calls[0][0];
      expect(call.update.count).toEqual({ increment: 1 });
    });

    it('should record system metric', async () => {
      const mockSystemMetric = {
        id: 'sys_metric_123',
        metricName: 'cpu_usage',
        value: 45.5,
        unit: 'percent',
        host: 'server-01',
        service: 'api',
      };

      (mockPrisma.systemMetric.create as jest.Mock).mockResolvedValue(mockSystemMetric);

      const result = await service.recordSystemMetric('cpu_usage', 45.5, {
        unit: 'percent',
        host: 'server-01',
        service: 'api',
      });

      expect(result).toEqual(mockSystemMetric);
    });
  });

  describe('Event Queries', () => {
    it('should get events with filters', async () => {
      const mockEvents = [
        {
          id: 'event_1',
          eventType: EventType.API_CALL,
          eventName: 'GET /api/users',
          timestamp: new Date(),
        },
        {
          id: 'event_2',
          eventType: EventType.API_CALL,
          eventName: 'POST /api/users',
          timestamp: new Date(),
        },
      ];

      (mockPrisma.analyticsEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const result = await service.getEvents(tenantId, {
        eventType: EventType.API_CALL,
        limit: 10,
      });

      expect(result).toEqual(mockEvents);
      expect(mockPrisma.analyticsEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            eventType: EventType.API_CALL,
          }),
          take: 10,
        })
      );
    });

    it('should get events with date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      (mockPrisma.analyticsEvent.findMany as jest.Mock).mockResolvedValue([]);

      await service.getEvents(tenantId, { startDate, endDate });

      expect(mockPrisma.analyticsEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });
  });

  describe('User Activities', () => {
    it('should get user activities', async () => {
      const mockActivities = [
        {
          id: 'activity_1',
          action: 'create_report',
          timestamp: new Date(),
          user: { email: 'test@example.com', role: 'USER' },
        },
      ];

      (mockPrisma.userActivity.findMany as jest.Mock).mockResolvedValue(mockActivities);

      const result = await service.getUserActivities(tenantId, userId);

      expect(result).toEqual(mockActivities);
      expect(mockPrisma.userActivity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, userId },
        })
      );
    });

    it('should get all activities for tenant', async () => {
      (mockPrisma.userActivity.findMany as jest.Mock).mockResolvedValue([]);

      await service.getUserActivities(tenantId);

      expect(mockPrisma.userActivity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId },
        })
      );
    });
  });

  describe('Dashboard Statistics', () => {
    it('should get comprehensive dashboard stats', async () => {
      // Mock all required queries
      (mockPrisma.analyticsEvent.count as jest.Mock).mockResolvedValue(1000);
      (mockPrisma.analyticsEvent.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { duration: 100, success: true },
          { duration: 150, success: true },
          { duration: 200, success: false },
        ])
        .mockResolvedValueOnce([{ userId: 'user1' }, { userId: 'user2' }]);

      (mockPrisma.user.count as jest.Mock)
        .mockResolvedValueOnce(50) // total users
        .mockResolvedValue(0); // user growth queries

      (mockPrisma.analyticsEvent.groupBy as jest.Mock)
        .mockResolvedValueOnce([
          { eventName: 'login', _count: { eventName: 100 } },
          { eventName: 'logout', _count: { eventName: 50 } },
        ])
        .mockResolvedValueOnce([
          { path: '/dashboard', _count: { path: 200 } },
          { path: '/settings', _count: { path: 100 } },
        ])
        .mockResolvedValueOnce([
          { eventType: EventType.ERROR, _count: { eventType: 10 } },
        ]);

      (mockPrisma.systemMetric.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getDashboardStats(tenantId);

      expect(result).toMatchObject({
        totalEvents: 1000,
        totalUsers: 50,
        activeUsers: 2,
        avgResponseTime: expect.any(Number),
        errorRate: expect.any(Number),
        topEvents: expect.arrayContaining([
          expect.objectContaining({ eventName: expect.any(String), count: expect.any(Number) }),
        ]),
        topPages: expect.arrayContaining([
          expect.objectContaining({ path: expect.any(String), views: expect.any(Number) }),
        ]),
        userGrowth: expect.any(Array),
        errorsByType: expect.any(Array),
        systemHealth: expect.any(Object),
      });
    });
  });

  describe('Report Generation', () => {
    it('should generate JSON report', async () => {
      const mockEvents = [
        {
          id: 'event_1',
          eventType: EventType.API_CALL,
          eventName: 'test',
          timestamp: new Date(),
        },
      ];

      (mockPrisma.analyticsEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const result = await service.generateReport(tenantId, {}, { format: 'json' });

      expect(result).toBe(JSON.stringify(mockEvents, null, 2));
    });

    it('should generate CSV report', async () => {
      const mockEvents = [
        {
          id: 'event_1',
          eventType: EventType.API_CALL,
          eventName: 'test',
          userId: 'user1',
          path: '/test',
          method: 'GET',
          statusCode: 200,
          duration: 100,
          success: true,
          timestamp: new Date('2024-01-01'),
        },
      ];

      (mockPrisma.analyticsEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const result = await service.generateReport(tenantId, {}, { format: 'csv' });

      expect(result).toContain('timestamp,eventType,eventName');
      expect(result).toContain('API_CALL');
      expect(result).toContain('test');
    });
  });

  describe('Data Cleanup', () => {
    it('should clean old analytics data', async () => {
      (mockPrisma.analyticsEvent.deleteMany as jest.Mock).mockResolvedValue({ count: 500 });

      const result = await service.cleanOldData(90);

      expect(result).toBe(500);
      expect(mockPrisma.analyticsEvent.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: expect.objectContaining({ lt: expect.any(Date) }),
          }),
        })
      );
    });
  });

  describe('Event Aggregation', () => {
    it('should get event count by type', async () => {
      (mockPrisma.analyticsEvent.groupBy as jest.Mock).mockResolvedValue([
        { eventType: EventType.API_CALL, _count: { eventType: 100 } },
        { eventType: EventType.PAGE_VIEW, _count: { eventType: 50 } },
        { eventType: EventType.ERROR, _count: { eventType: 5 } },
      ]);

      const result = await service.getEventCountByType(tenantId);

      expect(result).toEqual({
        API_CALL: 100,
        PAGE_VIEW: 50,
        ERROR: 5,
      });
    });
  });
});
