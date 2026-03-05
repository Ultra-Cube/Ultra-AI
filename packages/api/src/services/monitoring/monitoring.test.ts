/**
 * Tests for Monitoring and Observability Systems
 */

import { MetricsCollector, metricsCollector } from './metrics';
import { StructuredLogger } from './logger';
import { DistributedTracing } from './middleware';

describe('Monitoring and Observability', () => {
  describe('MetricsCollector', () => {
    let collector: MetricsCollector;

    beforeEach(() => {
      collector = new MetricsCollector();
    });

    it('should record HTTP request metrics', () => {
      expect(() => {
        collector.recordHttpRequest('GET', '/api/health', 200, 50);
      }).not.toThrow();
    });

    it('should record HTTP request with sizes', () => {
      expect(() => {
        collector.recordHttpRequest('POST', '/api/data', 201, 100, 1000, 500);
      }).not.toThrow();
    });

    it('should record errors with severity levels', () => {
      expect(() => {
        collector.recordError('ValidationError', 'low');
        collector.recordError('DatabaseError', 'high');
        collector.recordError('SystemError', 'critical');
      }).not.toThrow();
    });

    it('should track rate limit exceeded events', () => {
      expect(() => {
        collector.recordRateLimitExceeded('/api/auth/login');
      }).not.toThrow();
    });

    it('should record authentication attempts', () => {
      expect(() => {
        collector.recordAuthAttempt('login', true);
        collector.recordAuthAttempt('register', false);
        collector.recordAuthAttempt('token_refresh', true);
      }).not.toThrow();
    });

    it('should manage active users count', () => {
      expect(() => {
        collector.setActiveUsers(10);
        collector.setActiveUsers(15);
      }).not.toThrow();
    });

    it('should record database query metrics', () => {
      expect(() => {
        collector.recordDbQuery('SELECT', 'users', 50, true);
        collector.recordDbQuery('INSERT', 'logs', 75, true);
        collector.recordDbQuery('UPDATE', 'users', 100, false);
      }).not.toThrow();
    });

    it('should track cache hits and misses', () => {
      expect(() => {
        collector.recordCacheHit('authCache');
        collector.recordCacheMiss('userCache');
        collector.recordCacheMiss('authCache');
      }).not.toThrow();
    });

    it('should manage cache sizes', () => {
      expect(() => {
        collector.setCacheSize('authCache', 50000);
        collector.setCacheSize('userCache', 100000);
      }).not.toThrow();
    });

    it('should record AI request metrics', () => {
      expect(() => {
        collector.recordAIRequest('success', 'gpt-4');
        collector.recordAIRequest('failure', 'claude-3');
      }).not.toThrow();
    });

    it('should track token usage', () => {
      expect(() => {
        collector.recordTokenUsage('gpt-4', 100, 200);
        collector.recordTokenUsage('claude-3', 150, 250);
      }).not.toThrow();
    });

    it('should record AI processing duration', () => {
      expect(() => {
        collector.recordProcessingDuration('gpt-4', 2000);
        collector.recordProcessingDuration('claude-3', 3000);
      }).not.toThrow();
    });

    it('should update system metrics', () => {
      expect(() => {
        collector.updateSystemMetrics();
      }).not.toThrow();
    });

    it('should set component health status', () => {
      expect(() => {
        collector.setHealthStatus('database', true);
        collector.setHealthStatus('cache', false);
        collector.setHealthStatus('ai_service', true);
      }).not.toThrow();
    });

    it('should generate Prometheus format metrics', async () => {
      collector.recordHttpRequest('GET', '/health', 200, 50);
      const metrics = await collector.metricsAsPrometheus();
      
      expect(typeof metrics).toBe('string');
      expect(metrics).toContain('http_request_duration_seconds');
      expect(metrics).toContain('http_requests_total');
    });
  });

  describe('StructuredLogger', () => {
    let logger: StructuredLogger;

    beforeEach(() => {
      logger = new StructuredLogger('test-module');
    });

    it('should create logger with label', () => {
      expect(logger).toBeDefined();
    });

    it('should set correlation ID', () => {
      const correlationId = '12345-67890';
      expect(() => {
        logger.setCorrelationId(correlationId);
      }).not.toThrow();
    });

    it('should set user context', () => {
      expect(() => {
        logger.setUser('user-123');
      }).not.toThrow();
    });

    it('should set request context', () => {
      expect(() => {
        logger.setRequestContext('GET', '/api/health');
      }).not.toThrow();
    });

    it('should log info messages', () => {
      expect(() => {
        logger.info('Test info message', { detail: 'test' });
      }).not.toThrow();
    });

    it('should log warning messages', () => {
      expect(() => {
        logger.warn('Test warning message', { warning: 'test' });
      }).not.toThrow();
    });

    it('should log error messages with Error objects', () => {
      const error = new Error('Test error');
      expect(() => {
        logger.error('Test error message', error, { context: 'test' });
      }).not.toThrow();
    });

    it('should log error messages with string', () => {
      expect(() => {
        logger.error('Test error message', 'Error string', { context: 'test' });
      }).not.toThrow();
    });

    it('should log debug messages', () => {
      expect(() => {
        logger.debug('Test debug message', { debug: 'test' });
      }).not.toThrow();
    });

    it('should log HTTP requests', () => {
      expect(() => {
        logger.logHttpRequest('GET', '/api/health', 200, 50, 'user-123');
      }).not.toThrow();
    });

    it('should log database operations', () => {
      expect(() => {
        logger.logDbOperation('SELECT', 'users', 50, true);
        logger.logDbOperation('INSERT', 'logs', 75, false, new Error('DB Error'));
      }).not.toThrow();
    });

    it('should log authentication events', () => {
      expect(() => {
        logger.logAuthEvent('login', 'user-123', true);
        logger.logAuthEvent('register', 'user-456', false, new Error('Validation failed'));
      }).not.toThrow();
    });

    it('should log security events with severity', () => {
      expect(() => {
        logger.logSecurityEvent('suspicious_login', 'medium', { ip: '192.168.1.1' });
        logger.logSecurityEvent('unauthorized_access', 'high', { resource: 'admin' });
      }).not.toThrow();
    });

    it('should log performance metrics', () => {
      expect(() => {
        logger.logPerformance('query_time', 150, 'ms');
        logger.logPerformance('memory_usage', 512, 'MB');
      }).not.toThrow();
    });

    it('should create child loggers with additional context', () => {
      const childLogger = logger.child({ userId: 'user-123' });
      expect(childLogger).toBeDefined();
      expect(() => {
        childLogger.info('Child logger message');
      }).not.toThrow();
    });
  });

  describe('DistributedTracing', () => {
    it('should create a span', () => {
      const span = DistributedTracing.createSpan('trace-123', 'test-span');
      
      expect(span).toBeDefined();
      expect(span.traceId).toBe('trace-123');
      expect(span.spanId).toBeDefined();
      expect(span.startTime).toBeDefined();
      expect(span.duration).toBeUndefined();
    });

    it('should create span with parent span ID', () => {
      const span = DistributedTracing.createSpan('trace-123', 'test-span', 'parent-span-456');
      
      expect(span.parentSpanId).toBe('parent-span-456');
    });

    it('should add tags to span', () => {
      const span = DistributedTracing.createSpan('trace-123', 'test-span');
      
      DistributedTracing.addTag(span, 'userId', 'user-123');
      DistributedTracing.addTag(span, 'status', 'success');
      
      expect(span.tags.get('userId')).toBe('user-123');
      expect(span.tags.get('status')).toBe('success');
    });

    it('should add logs to span', () => {
      const span = DistributedTracing.createSpan('trace-123', 'test-span');
      
      DistributedTracing.log(span, 'Step 1 completed', { result: 'success' });
      DistributedTracing.log(span, 'Step 2 started');
      
      expect(span.logs).toHaveLength(2);
      expect(span.logs[0].message).toBe('Step 1 completed');
      expect(span.logs[0].data).toEqual({ result: 'success' });
    });

    it('should end span and capture duration', async () => {
      const span = DistributedTracing.createSpan('trace-123', 'test-span');
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const endedSpan = DistributedTracing.endSpan(span);
      
      expect(endedSpan.duration).toBeDefined();
      expect(endedSpan.duration).toBeGreaterThanOrEqual(10);
    });

    it('should convert span to object format', () => {
      const span = DistributedTracing.createSpan('trace-123', 'test-span', 'parent-span-456');
      
      DistributedTracing.addTag(span, 'userId', 'user-123');
      DistributedTracing.log(span, 'Test log');
      DistributedTracing.endSpan(span);
      
      const spanObject = DistributedTracing.spanToObject(span);
      
      expect(spanObject.traceId).toBe('trace-123');
      expect(spanObject.spanId).toBe(span.spanId);
      expect(spanObject.parentSpanId).toBe('parent-span-456');
      expect(spanObject.duration).toBeDefined();
      expect(spanObject.tags.userId).toBe('user-123');
      expect(spanObject.logs).toHaveLength(1);
    });

    it('should create span tree with parent-child relationships', () => {
      const traceId = 'trace-123';
      
      const parentSpan = DistributedTracing.createSpan(traceId, 'parent');
      const childSpan1 = DistributedTracing.createSpan(traceId, 'child1', parentSpan.spanId);
      const childSpan2 = DistributedTracing.createSpan(traceId, 'child2', parentSpan.spanId);
      
      expect(childSpan1.parentSpanId).toBe(parentSpan.spanId);
      expect(childSpan2.parentSpanId).toBe(parentSpan.spanId);
      expect(childSpan1.traceId).toBe(childSpan2.traceId);
    });
  });

  describe('Metrics Integration', () => {
    it('should track complete request lifecycle', () => {
      const collector = new MetricsCollector();
      
      // Simulate request
      const startTime = Date.now();
      collector.recordHttpRequest('POST', '/api/data', 201, 150, 2000, 1000);
      
      expect(() => {
        // Simulate processing
        collector.recordDbQuery('INSERT', 'requests', 50, true);
        collector.recordDbQuery('SELECT', 'users', 30, true);
      }).not.toThrow();
      
      expect(() => {
        collector.recordCacheHit('userCache');
        collector.recordAIRequest('success', 'gpt-4');
      }).not.toThrow();
    });

    it('should track error scenarios', () => {
      const collector = new MetricsCollector();
      
      expect(() => {
        collector.recordHttpRequest('GET', '/api/data', 500, 1000);
        collector.recordError('DatabaseError', 'critical');
        collector.recordDbQuery('SELECT', 'data', 1000, false);
      }).not.toThrow();
    });

    it('should track rate limiting scenarios', () => {
      const collector = new MetricsCollector();
      
      expect(() => {
        collector.recordRateLimitExceeded('/api/auth/login');
        collector.recordRateLimitExceeded('/api/auth/login');
        collector.recordRateLimitExceeded('/api/data');
      }).not.toThrow();
    });
  });
});
