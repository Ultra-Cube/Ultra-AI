/**
 * Monitoring Middleware for Request Tracking and Metrics Collection
 * 
 * Tracks request duration, logs requests, and collects metrics
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { metricsCollector } from './metrics';
import { appLogger } from './logger';

/**
 * Extract size in bytes of a value
 */
function getSize(obj: any): number {
  if (!obj) return 0;
  try {
    return JSON.stringify(obj).length;
  } catch {
    return 0;
  }
}

/**
 * Register monitoring middleware on Fastify instance
 */
export async function registerMonitoringMiddleware(app: FastifyInstance): Promise<void> {
  // Add correlation ID to all requests
  app.addHook('preHandler', async (request, reply) => {
    const correlationId = request.headers['x-correlation-id'] as string || uuidv4();
    request.id = correlationId;
    reply.header('x-correlation-id', correlationId);
    
    appLogger.setCorrelationId(correlationId);
  });

  // Track request duration and metrics
  app.addHook('onRequest', async (request) => {
    (request as any).startTime = Date.now();
  });

  // Log response and record metrics
  app.addHook('onResponse', async (request, reply) => {
    const startTime = (request as any).startTime;
    if (!startTime) return;

    const duration = Date.now() - startTime;
    const method = request.method;
    const route = request.routeOptions.url || request.url;
    const statusCode = reply.statusCode;

    // Get sizes
    const requestSize = getSize(request.body);
    const responseSize = getSize((reply as any)._payload || '');

    // Record metrics
    metricsCollector.recordHttpRequest(
      method,
      route,
      statusCode,
      duration,
      requestSize,
      responseSize,
    );

    // Log the request
    const userId = (request as any).user?.id;
    appLogger.logHttpRequest(method, route, statusCode, duration, userId);
  });

  // Handle errors and record metrics
  app.setErrorHandler(async (error, request, reply) => {
    const correlationId = request.id;
    const errorType = error.name || 'UnknownError';
    const severity = reply.statusCode >= 500 ? 'high' : reply.statusCode >= 400 ? 'medium' : 'low';

    // Record error metric
    metricsCollector.recordError(errorType, severity as any);

    // Log error
    appLogger.error(`Request error: ${error.message}`, error, {
      correlationId,
      endpoint: request.url,
      method: request.method,
      statusCode: reply.statusCode,
    });

    // Send error response
    reply.status(reply.statusCode || 500).send({
      error: error.message,
      statusCode: reply.statusCode,
      correlationId,
    });
  });
}

/**
 * Metrics endpoint middleware
 */
export async function registerMetricsEndpoint(app: FastifyInstance): Promise<void> {
  app.get('/metrics', {
    schema: {
      tags: ['Monitoring'],
      summary: 'Get Prometheus metrics',
      description: 'Returns metrics in Prometheus format for scraping',
      response: {
        200: {
          type: 'string',
          description: 'Prometheus format metrics',
        },
      },
    },
  }, async (request, reply) => {
    try {
      const metrics = await metricsCollector.metricsAsPrometheus();
      reply.type('text/plain');
      return metrics;
    } catch (error) {
      appLogger.error('Failed to generate metrics', error as Error);
      reply.status(500);
      return { error: 'Failed to generate metrics' };
    }
  });
}

/**
 * Enhanced health check endpoint with component status
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  components: {
    [key: string]: {
      status: 'healthy' | 'unhealthy';
      message?: string;
    };
  };
}

export async function registerHealthCheckEndpoint(
  app: FastifyInstance,
  checks: { [key: string]: () => Promise<boolean> } = {},
): Promise<void> {
  app.get('/health/detailed', {
    schema: {
      tags: ['Health'],
      summary: 'Detailed health check',
      description: 'Returns detailed health status of all system components',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            components: { type: 'object' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const results: HealthCheckResult['components'] = {};
    let hasUnhealthy = false;
    let hasDegraded = false;

    // Run all health checks
    for (const [name, check] of Object.entries(checks)) {
      try {
        const healthy = await check();
        const status = healthy ? 'healthy' : 'unhealthy';
        
        results[name] = { status };
        metricsCollector.setHealthStatus(name, healthy);

        if (!healthy) {
          hasUnhealthy = true;
        }
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          message: (error as Error).message,
        };
        metricsCollector.setHealthStatus(name, false);
        hasUnhealthy = true;
      }
    }

    const overallStatus = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';
    const statusCode = overallStatus === 'healthy' ? 200 : 503;

    const healthResponse: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      components: results,
    };

    reply.status(statusCode);
    return healthResponse;
  });
}

/**
 * Span context for distributed tracing
 */
export interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  startTime: number;
  duration?: number;
  tags: Map<string, any>;
  logs: Array<{ timestamp: number; message: string; data?: any }>;
}

/**
 * Distributed tracing helper
 */
export class DistributedTracing {
  static createSpan(
    traceId: string,
    name: string,
    parentSpanId?: string,
  ): SpanContext {
    return {
      traceId,
      spanId: uuidv4(),
      parentSpanId,
      startTime: Date.now(),
      tags: new Map(),
      logs: [],
    };
  }

  static addTag(span: SpanContext, key: string, value: any): void {
    span.tags.set(key, value);
  }

  static log(span: SpanContext, message: string, data?: any): void {
    span.logs.push({
      timestamp: Date.now(),
      message,
      data,
    });
  }

  static endSpan(span: SpanContext): SpanContext {
    span.duration = Date.now() - span.startTime;
    return span;
  }

  static spanToObject(span: SpanContext) {
    return {
      traceId: span.traceId,
      spanId: span.spanId,
      parentSpanId: span.parentSpanId,
      duration: span.duration,
      tags: Object.fromEntries(span.tags),
      logs: span.logs,
    };
  }
}

// Extend FastifyRequest with correlation ID
declare global {
  interface FastifyRequest {
    startTime?: number;
    user?: { id: string; email: string };
  }
}
