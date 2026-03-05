/**
 * Prometheus Metrics Collection for Ultra AI Platform
 * 
 * Provides comprehensive metrics for monitoring API performance, health, and usage
 */

import { Counter, Histogram, Gauge, register } from 'prom-client';

// HTTP Request Metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5], // 1ms to 5s
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestSize = new Histogram({
  name: 'http_request_size_bytes',
  help: 'HTTP request size in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000],
});

export const httpResponseSize = new Histogram({
  name: 'http_response_size_bytes',
  help: 'HTTP response size in bytes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000],
});

// Error Metrics
export const errorCounter = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'severity'],
});

export const rateLimitCounter = new Counter({
  name: 'rate_limit_exceeded_total',
  help: 'Total number of rate limit exceeded events',
  labelNames: ['endpoint'],
});

// Authentication Metrics
export const authAttempts = new Counter({
  name: 'auth_attempts_total',
  help: 'Total authentication attempts',
  labelNames: ['type', 'result'], // type: login, register, token_refresh; result: success, failure
});

export const activeUsers = new Gauge({
  name: 'active_users_total',
  help: 'Number of currently active users',
});

// Database Metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query latency in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

export const dbQueryTotal = new Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table', 'success'],
});

// Cache Metrics
export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_name'],
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_name'],
});

export const cacheSize = new Gauge({
  name: 'cache_size_bytes',
  help: 'Current cache size in bytes',
  labelNames: ['cache_name'],
});

// Business Metrics
export const aiRequestCounter = new Counter({
  name: 'ai_requests_total',
  help: 'Total AI processing requests',
  labelNames: ['status', 'model'],
});

export const tokensDuration = new Histogram({
  name: 'ai_request_tokens_total',
  help: 'Number of tokens processed per request',
  labelNames: ['model', 'type'], // type: input, output
  buckets: [10, 50, 100, 500, 1000, 5000, 10000],
});

export const processingDuration = new Histogram({
  name: 'ai_processing_duration_seconds',
  help: 'AI request processing duration in seconds',
  labelNames: ['model'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
});

// System Metrics
export const uptimeSeconds = new Gauge({
  name: 'process_uptime_seconds',
  help: 'Process uptime in seconds',
});

export const memoryUsageBytes = new Gauge({
  name: 'process_memory_usage_bytes',
  help: 'Process memory usage in bytes',
  labelNames: ['type'], // type: rss, heapTotal, heapUsed, external
});

export const cpuUsagePercent = new Gauge({
  name: 'process_cpu_usage_percent',
  help: 'Process CPU usage percentage',
});

// Health Check Status
export const healthStatus = new Gauge({
  name: 'health_status',
  help: 'Health check status (1 = healthy, 0 = unhealthy)',
  labelNames: ['component'], // component: database, cache, ai_service
});

/**
 * Metrics collector class for managing all metrics operations
 */
export class MetricsCollector {
  private startTime: number = Date.now();

  /**
   * Record an HTTP request
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
    requestSize: number = 0,
    responseSize: number = 0,
  ): void {
    httpRequestDuration.labels(method, route, String(statusCode)).observe(duration / 1000);
    httpRequestTotal.labels(method, route, String(statusCode)).inc();
    
    if (requestSize > 0) {
      httpRequestSize.labels(method, route).observe(requestSize);
    }
    
    if (responseSize > 0) {
      httpResponseSize.labels(method, route, String(statusCode)).observe(responseSize);
    }
  }

  /**
   * Record an error
   */
  recordError(type: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    errorCounter.labels(type, severity).inc();
  }

  /**
   * Record rate limit exceeded
   */
  recordRateLimitExceeded(endpoint: string): void {
    rateLimitCounter.labels(endpoint).inc();
  }

  /**
   * Record authentication attempt
   */
  recordAuthAttempt(type: 'login' | 'register' | 'token_refresh', success: boolean): void {
    authAttempts.labels(type, success ? 'success' : 'failure').inc();
  }

  /**
   * Update active users count
   */
  setActiveUsers(count: number): void {
    activeUsers.set(count);
  }

  /**
   * Record database query
   */
  recordDbQuery(
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    table: string,
    duration: number,
    success: boolean = true,
  ): void {
    dbQueryDuration.labels(operation, table).observe(duration / 1000);
    dbQueryTotal.labels(operation, table, success ? 'true' : 'false').inc();
  }

  /**
   * Record cache hit
   */
  recordCacheHit(cacheName: string): void {
    cacheHits.labels(cacheName).inc();
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(cacheName: string): void {
    cacheMisses.labels(cacheName).inc();
  }

  /**
   * Update cache size
   */
  setCacheSize(cacheName: string, sizeBytes: number): void {
    cacheSize.labels(cacheName).set(sizeBytes);
  }

  /**
   * Record AI request
   */
  recordAIRequest(status: 'success' | 'failure', model: string): void {
    aiRequestCounter.labels(status, model).inc();
  }

  /**
   * Record token usage
   */
  recordTokenUsage(model: string, inputTokens: number, outputTokens: number): void {
    tokensDuration.labels(model, 'input').observe(inputTokens);
    tokensDuration.labels(model, 'output').observe(outputTokens);
  }

  /**
   * Record AI processing duration
   */
  recordProcessingDuration(model: string, duration: number): void {
    processingDuration.labels(model).observe(duration / 1000);
  }

  /**
   * Update system metrics
   */
  updateSystemMetrics(): void {
    const uptime = (Date.now() - this.startTime) / 1000;
    uptimeSeconds.set(uptime);

    const memUsage = process.memoryUsage();
    memoryUsageBytes.labels('rss').set(memUsage.rss);
    memoryUsageBytes.labels('heapTotal').set(memUsage.heapTotal);
    memoryUsageBytes.labels('heapUsed').set(memUsage.heapUsed);
    memoryUsageBytes.labels('external').set(memUsage.external);
  }

  /**
   * Update health status for a component
   */
  setHealthStatus(component: string, healthy: boolean): void {
    healthStatus.labels(component).set(healthy ? 1 : 0);
  }

  /**
   * Get all metrics in Prometheus format
   */
  async metricsAsPrometheus(): Promise<string> {
    this.updateSystemMetrics();
    return register.metrics();
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    register.resetMetrics();
  }
}

// Export singleton instance
export const metricsCollector = new MetricsCollector();
