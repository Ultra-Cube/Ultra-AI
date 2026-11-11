# Phase 11: Advanced Analytics Dashboard - Implementation Guide

## 🎯 Overview

Phase 11 introduces a comprehensive analytics and monitoring system that provides real-time insights into user behavior, system performance, and business metrics. The system includes event tracking, activity logging, metrics aggregation, and customizable reporting capabilities.

## ✨ Key Features

### 1. **Event Tracking System**
- Real-time event capture for all API calls
- Custom event tracking with metadata
- Event categorization (PAGE_VIEW, API_CALL, USER_ACTION, ERROR, etc.)
- Severity levels (INFO, WARNING, ERROR, CRITICAL)
- Success/failure tracking with error details
- Response time monitoring

### 2. **User Activity Logging**
- Detailed action tracking per user
- Change tracking (before/after snapshots)
- Resource-level audit trail
- IP address and user agent logging
- Tenant-scoped activity isolation

### 3. **Metrics Aggregation**
- Time-window based aggregation
- Multi-dimensional grouping (up to 3 dimensions)
- Support for multiple metric types:
  - **COUNTER**: Incremental counts
  - **GAUGE**: Point-in-time values
  - **HISTOGRAM**: Distribution tracking
  - **SUMMARY**: Statistical summaries

### 4. **System Performance Monitoring**
- CPU usage tracking
- Memory usage monitoring
- Response time analysis
- Service-level metrics
- Host-based metric grouping

### 5. **Dashboard Statistics**
- Total events and users
- Active users (24-hour window)
- Error rate calculation
- Average response time
- Top events and pages
- User growth trends
- Error breakdown by type
- System health indicators

### 6. **Custom Reporting**
- Export to JSON or CSV
- Flexible date range filtering
- Event type filtering
- Optional metadata inclusion
- Automated report generation

## 🗄️ Database Schema

### Analytics Event Model
```prisma
model AnalyticsEvent {
  id          String         @id @default(cuid())
  tenantId    String
  userId      String?
  
  eventType   EventType      // PAGE_VIEW, API_CALL, USER_ACTION, etc.
  eventName   String
  severity    EventSeverity  @default(INFO)
  
  path        String?
  method      String?
  statusCode  Int?
  duration    Int?           // milliseconds
  
  metadata    Json?
  userAgent   String?
  ipAddress   String?
  
  success     Boolean        @default(true)
  errorMessage String?
  errorStack   String?
  
  timestamp   DateTime       @default(now())
}
```

### User Activity Model
```prisma
model UserActivity {
  id          String    @id @default(cuid())
  tenantId    String
  userId      String
  
  action      String    // "created_report", "updated_settings"
  resource    String?   // "report", "user"
  resourceId  String?
  
  before      Json?     // Before state
  after       Json?     // After state
  
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime  @default(now())
}
```

### Analytics Metric Model
```prisma
model AnalyticsMetric {
  id          String     @id @default(cuid())
  tenantId    String
  
  metricType  MetricType // COUNTER, GAUGE, HISTOGRAM, SUMMARY
  metricName  String
  
  value       Float
  count       Int        @default(1)
  
  dimension1  String?    // For grouping (e.g., "endpoint")
  dimension2  String?
  dimension3  String?
  
  timestamp   DateTime   @default(now())
  windowStart DateTime
  windowEnd   DateTime
}
```

### System Metric Model
```prisma
model SystemMetric {
  id          String    @id @default(cuid())
  
  metricName  String    // "cpu_usage", "memory_usage"
  value       Float
  unit        String?   // "percent", "ms", "bytes"
  
  host        String?
  service     String?
  tags        Json?
  
  timestamp   DateTime  @default(now())
}
```

## 🔧 Core Components

### AnalyticsService

The main service class providing all analytics functionality:

```typescript
class AnalyticsService {
  // Event tracking
  trackEvent(tenantId, userId, eventData): Promise<AnalyticsEvent>
  
  // Activity logging
  trackActivity(tenantId, userId, activityData): Promise<UserActivity>
  
  // Metrics recording
  recordMetric(tenantId, metricData): Promise<AnalyticsMetric>
  recordSystemMetric(name, value, options): Promise<SystemMetric>
  
  // Data retrieval
  getEvents(tenantId, query): Promise<AnalyticsEvent[]>
  getUserActivities(tenantId, userId?, limit?): Promise<UserActivity[]>
  getMetrics(tenantId, query): Promise<AnalyticsMetric[]>
  
  // Dashboard
  getDashboardStats(tenantId): Promise<DashboardStats>
  
  // Reporting
  generateReport(tenantId, query, options): Promise<string>
  
  // Maintenance
  cleanOldData(daysToKeep): Promise<number>
  getEventCountByType(tenantId, startDate?, endDate?): Promise<Record<string, number>>
}
```

### Analytics Middleware

Automatic tracking middleware for all API requests:

```typescript
const analyticsMiddleware = createAnalyticsMiddleware(analyticsService);
app.addHook('preHandler', analyticsMiddleware);
```

Features:
- Automatically tracks all API calls
- Measures response time
- Captures HTTP method, path, status code
- Records query params and route params
- Non-blocking (doesn't delay responses)
- Tenant-aware (only tracks if tenant context exists)

## 📊 API Endpoints

### 1. Track Custom Event
```http
POST /analytics/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "eventType": "USER_ACTION",
  "eventName": "report_generated",
  "path": "/reports/monthly",
  "duration": 1250,
  "success": true,
  "metadata": {
    "reportType": "monthly",
    "format": "pdf"
  }
}
```

**Response:**
```json
{
  "id": "event_clxxx",
  "timestamp": "2024-03-05T10:30:00.000Z"
}
```

### 2. Get Analytics Events
```http
GET /analytics/events?eventType=API_CALL&limit=50&startDate=2024-03-01
Authorization: Bearer <token>
```

**Query Parameters:**
- `eventType` - Filter by event type
- `eventName` - Filter by event name
- `userId` - Filter by user
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)
- `limit` - Max results (default: 100)
- `offset` - Pagination offset (default: 0)

### 3. Get Dashboard Statistics
```http
GET /analytics/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalEvents": 15432,
  "totalUsers": 247,
  "activeUsers": 89,
  "errorRate": 2.34,
  "avgResponseTime": 145,
  "topEvents": [
    { "eventName": "login", "count": 1205 },
    { "eventName": "api_request", "count": 987 }
  ],
  "topPages": [
    { "path": "/dashboard", "views": 3421 },
    { "path": "/reports", "views": 1893 }
  ],
  "userGrowth": [
    { "date": "2024-03-01", "count": 12 },
    { "date": "2024-03-02", "count": 15 }
  ],
  "errorsByType": [
    { "eventType": "ERROR", "count": 45 }
  ],
  "systemHealth": {
    "cpuUsage": 45.2,
    "memoryUsage": 62.8,
    "responseTime": 142
  }
}
```

### 4. Get User Activities
```http
GET /analytics/activities?userId=user_123&limit=20
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "activity_xxx",
    "action": "update_profile",
    "resource": "user",
    "resourceId": "user_123",
    "before": { "name": "John" },
    "after": { "name": "John Doe" },
    "timestamp": "2024-03-05T10:15:00.000Z",
    "user": {
      "email": "john@example.com",
      "role": "USER"
    }
  }
]
```

### 5. Generate Analytics Report
```http
GET /analytics/report?format=csv&startDate=2024-03-01&endDate=2024-03-31
Authorization: Bearer <token>
```

**Query Parameters:**
- `format` - Output format: `json` or `csv` (default: json)
- `eventType` - Filter by event type
- `startDate` - Start date
- `endDate` - End date
- `includeMetadata` - Include metadata column (CSV only)

**CSV Response:**
```csv
timestamp,eventType,eventName,userId,path,method,statusCode,duration,success
2024-03-05T10:00:00.000Z,API_CALL,GET /api/users,user_123,/api/users,GET,200,45,true
2024-03-05T10:01:00.000Z,PAGE_VIEW,Dashboard,user_456,/dashboard,GET,200,120,true
```

### 6. Get Event Count by Type
```http
GET /analytics/events/count-by-type?startDate=2024-03-01
Authorization: Bearer <token>
```

**Response:**
```json
{
  "API_CALL": 8924,
  "PAGE_VIEW": 3421,
  "USER_ACTION": 1256,
  "ERROR": 145,
  "AUTH": 892
}
```

### 7. Clean Old Analytics Data
```http
DELETE /analytics/cleanup?daysToKeep=90
Authorization: Bearer <token>
```

**Requirements:** ADMIN role

**Response:**
```json
{
  "message": "Analytics data cleanup completed",
  "deletedCount": 15234
}
```

## 🚀 Usage Examples

### Track Custom User Action
```typescript
// In your application code
await analyticsService.trackActivity(
  tenantId,
  userId,
  {
    action: 'report_created',
    resource: 'report',
    resourceId: report.id,
    after: {
      name: report.name,
      type: report.type,
    },
    ipAddress: request.ip,
  }
);
```

### Record Custom Metric
```typescript
// Record API endpoint latency
await analyticsService.recordMetric(tenantId, {
  metricType: 'HISTOGRAM',
  metricName: 'api_latency',
  value: 145,
  dimension1: 'GET',
  dimension2: '/api/users',
  windowStart: new Date(),
  windowEnd: new Date(),
});
```

### Query Events Programmatically
```typescript
// Get all errors from last 24 hours
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
const errorEvents = await analyticsService.getEvents(tenantId, {
  eventType: EventType.ERROR,
  startDate: yesterday,
  limit: 100,
});
```

## 📈 Dashboard Integration

### Real-time Dashboard Updates

The analytics system provides all data needed for a real-time dashboard:

```typescript
// Fetch dashboard data every 30 seconds
const fetchDashboardData = async () => {
  const response = await fetch('/analytics/dashboard', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const stats = await response.json();
  updateCharts(stats);
};

setInterval(fetchDashboardData, 30000);
```

### Visualization Recommendations

**Event Timeline Chart:**
- X-axis: Time (hourly/daily buckets)
- Y-axis: Event count
- Group by: Event type
- Data: `topEvents` from dashboard stats

**Error Rate Trend:**
- Line chart showing error rate over time
- Alert threshold at 5%
- Data: `errorRate` + historical queries

**User Growth Chart:**
- Area chart showing cumulative user count
- Data: `userGrowth` from dashboard stats

**Top Pages Bar Chart:**
- Horizontal bar chart
- Data: `topPages` from dashboard stats

## 🔒 Security & Privacy

### Tenant Isolation
- All analytics data is tenant-scoped
- Automatic tenant filtering on all queries
- No cross-tenant data access possible

### PII Handling
- Email addresses stored only if needed
- IP addresses stored for audit purposes
- User agent strings captured for analytics

### Data Retention
- Automatic cleanup of old data
- Configurable retention period (default: 90 days)
- ADMIN-only access to cleanup endpoint

### Access Control
- All endpoints require authentication
- Tenant context required (except admin cleanup)
- ADMIN role required for data cleanup

## 🧪 Testing

**Test Coverage:**
- 16 comprehensive tests
- All core functionality covered
- Mocked Prisma client (no database required)

**Test Categories:**
1. Event tracking (3 tests)
2. Activity tracking (1 test)
3. Metrics recording (3 tests)
4. Event queries (2 tests)
5. User activities (2 tests)
6. Dashboard statistics (1 test)
7. Report generation (2 tests)
8. Data cleanup (1 test)
9. Event aggregation (1 test)

**Run Tests:**
```bash
npm test --workspace=platform/backend/core-api
```

## 🎛️ Configuration

### Environment Variables
```env
# Optional: Configure Redis for distributed metrics aggregation
REDIS_HOST=localhost
REDIS_PORT=6379

# Optional: Analytics retention period
ANALYTICS_RETENTION_DAYS=90

# Optional: Enable detailed request logging
ANALYTICS_DETAILED_LOGGING=true
```

### Middleware Configuration

```typescript
// Custom analytics middleware with options
const middleware = createAnalyticsMiddleware(analyticsService, {
  excludePaths: ['/health', '/metrics'], // Paths to skip
  sampleRate: 1.0, // 1.0 = 100% sampling, 0.1 = 10% sampling
});
```

## 📊 Performance Considerations

### Indexing Strategy
The schema includes strategic indexes for optimal query performance:
- `tenantId` - Primary filtering
- `userId` - User-specific queries
- `eventType` - Type-based filtering
- `timestamp` - Time-range queries
- Composite indexes for common query patterns

### Write Optimization
- Analytics middleware uses `setImmediate()` to avoid blocking responses
- Events written asynchronously after response sent
- Batch metric upserts using Prisma's upsert operation

### Query Optimization
- Dashboard stats use parallel queries (Promise.all)
- Pagination support for large result sets
- Selective field loading (don't load unnecessary data)

### Storage Management
- Automatic cleanup of old data
- Configurable retention periods
- JSONB columns for flexible metadata storage

## 🔧 Maintenance

### Regular Cleanup
Set up a cron job to clean old analytics data:

```bash
# Daily cleanup at 2 AM
0 2 * * * curl -X DELETE "https://api.example.com/analytics/cleanup?daysToKeep=90" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Monitoring Analytics System
Monitor the analytics system itself:
- Event write latency
- Query response times
- Storage growth rate
- Error rates in analytics tracking

### Troubleshooting

**Issue: Events not appearing**
- Check if tenant context is properly set
- Verify authentication token is valid
- Check application logs for tracking errors

**Issue: Slow dashboard queries**
- Review index usage with EXPLAIN queries
- Consider increasing retention cleanup frequency
- Check database resources (CPU, memory)

**Issue: High storage usage**
- Review retention period setting
- Run manual cleanup if needed
- Consider archiving old data to cold storage

## 🚀 Next Steps

Consider these enhancements for future phases:

1. **Real-time Streaming**: WebSocket-based live dashboard updates
2. **Anomaly Detection**: ML-based alerting for unusual patterns
3. **Advanced Visualization**: Pre-built chart components
4. **Data Warehouse**: Export to BigQuery/RedShift for long-term analysis
5. **Custom Dashboards**: User-created dashboard configurations
6. **Alerts & Notifications**: Threshold-based alerting system
7. **A/B Testing**: Experiment tracking and analysis
8. **Funnel Analysis**: User journey and conversion tracking

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Fastify Hooks](https://www.fastify.io/docs/latest/Reference/Hooks/)
- [Analytics Best Practices](https://segment.com/academy/)
- [GDPR Compliance for Analytics](https://gdpr.eu/cookies/)

---

**Phase 11 Status:** ✅ Complete
- Schema: ✅ 4 new models, 3 enums
- Service: ✅ 14 methods, 700+ lines
- Middleware: ✅ Automatic tracking
- Endpoints: ✅ 7 REST endpoints
- Tests: ✅ 16 tests (230 total)
- Documentation: ✅ Complete

**All 230 tests passing** | **Build successful** | **Ready for production**
