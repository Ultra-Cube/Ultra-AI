# Advanced Monitoring & Observability System

## Overview

The Ultra AI Platform includes a comprehensive monitoring and observability system built on industry-standard tools:

- **Prometheus**: Metrics collection and time-series database integration
- **Winston**: Structured logging with correlation IDs
- **Distributed Tracing**: Request tracking across service boundaries
- **Health Checks**: Component-level health monitoring

## Features

### 1. Prometheus Metrics Collection

Comprehensive metrics covering all aspects of the platform:

#### HTTP Request Metrics
- `http_request_duration_seconds` - Request latency histogram
- `http_requests_total` - Total requests counter
- `http_request_size_bytes` - Request size histogram
- `http_response_size_bytes` - Response size histogram

#### Error Metrics
- `errors_total` - Total errors by type and severity
- `rate_limit_exceeded_total` - Rate limit violations

#### Authentication Metrics
- `auth_attempts_total` - Login/register/token refresh attempts
- `active_users_total` - Current active user count

#### Database Metrics
- `db_query_duration_seconds` - Query performance
- `db_queries_total` - Query volume by operation

#### Cache Metrics
- `cache_hits_total` - Cache hit counter
- `cache_misses_total` - Cache miss counter
- `cache_size_bytes` - Current cache size

#### AI Processing Metrics
- `ai_requests_total` - AI processing requests
- `ai_request_tokens_total` - Token usage tracking
- `ai_processing_duration_seconds` - Processing latency

#### System Metrics
- `process_uptime_seconds` - Service uptime
- `process_memory_usage_bytes` - Memory consumption
- `process_cpu_usage_percent` - CPU usage
- `health_status` - Component health (1=healthy, 0=unhealthy)

### 2. Structured Logging

Winston-based structured logging with:

- **Correlation IDs**: Track requests across services
- **Context Management**: User, endpoint, and operation context
- **Structured Output**: JSON format for easy parsing
- **Log Levels**: debug, verbose, info, warn, error
- **Multiple Transports**: File and console logging

#### Logger Instances
- `appLogger` - General application events
- `authLogger` - Authentication events
- `dbLogger` - Database operations
- `securityLogger` - Security events
- `aiLogger` - AI processing events

### 3. Distributed Tracing

Span-based tracing for understanding request flow:

```typescript
const span = DistributedTracing.createSpan('trace-id', 'operation-name');
DistributedTracing.addTag(span, 'userId', 'user-123');
DistributedTracing.log(span, 'Processing step 1');
DistributedTracing.endSpan(span);
```

### 4. Health Checks

Detailed health check endpoint at `GET /health/detailed` with:

- Overall system status (healthy/degraded/unhealthy)
- Individual component status
- Uptime information
- Component-specific health checks

## API Endpoints

### Metrics Endpoint
```
GET /metrics
```
Returns Prometheus-format metrics for scraping.

**Response**: Text plain (Prometheus format)

```
# HELP http_request_duration_seconds HTTP request latency in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",route="/health",le="0.001"} 0
...
```

### Health Check Endpoint
```
GET /health/detailed
```
Returns detailed health status of all components.

**Response**: JSON
```json
{
  "status": "healthy",
  "timestamp": "2026-03-05T10:30:00.000Z",
  "uptime": 3600,
  "components": {
    "database": {
      "status": "healthy"
    },
    "cache": {
      "status": "healthy"
    }
  }
}
```

## Request Tracking

All requests automatically include correlation IDs:

1. **Incoming Requests**: Reads `X-Correlation-ID` header if present
2. **Request Processing**: Uses correlation ID in all logs and traces
3. **Response**: Returns correlation ID in `X-Correlation-ID` response header

Example:
```bash
curl -H "X-Correlation-ID: trace-123" http://localhost:3000/api/health

# Response includes:
# X-Correlation-ID: trace-123
```

## Usage Examples

### Recording HTTP Metrics
```typescript
import { metricsCollector } from './services/monitoring/metrics';

metricsCollector.recordHttpRequest(
  'GET',           // method
  '/api/health',   // route
  200,             // status code
  50,              // duration in ms
  100,             // request size in bytes
  500              // response size in bytes
);
```

### Structured Logging
```typescript
import { appLogger } from './services/monitoring/logger';

appLogger.setCorrelationId('trace-123');
appLogger.setUser('user-456');
appLogger.logHttpRequest('GET', '/api/data', 200, 150, 'user-456');
appLogger.info('Processing request', { processId: 'proc-789' });
appLogger.error('Database error', error, { table: 'users' });
```

### Database Query Logging
```typescript
import { dbLogger } from './services/monitoring/logger';

const startTime = Date.now();
try {
  const result = await prisma.user.findUnique({ where: { id: 'user-123' } });
  const duration = Date.now() - startTime;
  dbLogger.logDbOperation('SELECT', 'users', duration, true);
} catch (error) {
  const duration = Date.now() - startTime;
  dbLogger.logDbOperation('SELECT', 'users', duration, false, error);
}
```

### AI Processing Metrics
```typescript
import { metricsCollector } from './services/monitoring/metrics';

const startTime = Date.now();

// Process AI request
const result = await aiCore.process(request);
const duration = Date.now() - startTime;

metricsCollector.recordAIRequest('success', 'gpt-4');
metricsCollector.recordTokenUsage('gpt-4', 150, 250);
metricsCollector.recordProcessingDuration('gpt-4', duration);
```

### Distributed Tracing
```typescript
import { DistributedTracing } from './services/monitoring/middleware';

const traceId = 'trace-' + Date.now();
const span = DistributedTracing.createSpan(traceId, 'user-registration');

try {
  DistributedTracing.addTag(span, 'email', 'user@example.com');
  
  DistributedTracing.log(span, 'Validating input');
  // ... validation logic
  
  DistributedTracing.log(span, 'Creating user in database');
  // ... database logic
  
  DistributedTracing.endSpan(span);
  
  // Return or log span
  const spanData = DistributedTracing.spanToObject(span);
  appLogger.info('User registration completed', spanData);
} catch (error) {
  DistributedTracing.log(span, 'Registration failed', { error: error.message });
  throw error;
}
```

## Log File Locations

Logs are written to the following locations:

- **Error Logs**: `logs/error.log`
- **Combined Logs**: `logs/combined.log`
- **Console**: Development mode only

## Prometheus Configuration

To scrape metrics from the Ultra AI Platform, add to your Prometheus config:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ultra-ai-api'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s
```

## Grafana Dashboard

Example Grafana dashboard queries:

### Request Rate
```
rate(http_requests_total[1m])
```

### Latency (P95)
```
histogram_quantile(0.95, http_request_duration_seconds)
```

### Error Rate
```
rate(errors_total[5m])
```

### AI Processing Throughput
```
rate(ai_requests_total[1m])
```

## Health Check Configuration

Custom health checks can be registered when building the app:

```typescript
const app = await buildApp(context);

await registerHealthCheckEndpoint(app, {
  database: async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  },
  cache: async () => {
    // Check cache availability
    return cacheIsHealthy();
  },
  ai_service: async () => {
    // Check AI service connectivity
    return aiServiceIsHealthy();
  },
});
```

## Performance Considerations

- **Metrics Overhead**: ~1-2% increase in request processing time
- **Memory**: ~10-20MB for metrics and logging buffers
- **Disk Space**: ~100MB per 1M requests in logs
- **Cardinality**: Prometheus metric cardinality kept low with explicit labels

## Security

- **Correlation IDs**: Securely track requests without exposing data
- **Log Redaction**: Sensitive data should be excluded from logs
- **Metrics Endpoint**: Can be restricted to internal networks
- **Health Checks**: Public endpoint provides minimal information

## Troubleshooting

### High Memory Usage
- Check log rotation in Winston configuration
- Reduce metric cardinality
- Enable sampling for high-volume endpoints

### Missing Metrics
- Verify metrics endpoint is accessible: `GET /metrics`
- Check Prometheus scrape configuration
- Ensure collectors are initialized in buildApp()

### Correlation ID Not Propagating
- Verify `X-Correlation-ID` header is passed in downstream requests
- Check that correlation ID is set before making calls
- Review logs for correlation ID patterns

## Next Steps

1. **Monitor**: Set up Prometheus to scrape `/metrics`
2. **Visualize**: Create Grafana dashboards
3. **Alert**: Configure alerting rules for errors and performance
4. **Trace**: Implement distributed tracing backend (Jaeger/Zipkin)
5. **Analyze**: Review logs and metrics for optimization opportunities
