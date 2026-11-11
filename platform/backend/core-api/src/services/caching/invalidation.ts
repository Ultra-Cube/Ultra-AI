/**
 * HTTP Response Caching Middleware
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { metricsCollector } from '../monitoring/metrics';

import { MultiLayerCache } from './cache';

export interface CacheConfig {
  ttl?: number;
  tags?: string[];
  key?: (request: FastifyRequest) => string;
  shouldCache?: (reply: FastifyReply) => boolean;
}

/**
 * Register HTTP response caching middleware
 */
export async function registerHttpCachingMiddleware(
  app: FastifyInstance,
  cache: MultiLayerCache
): Promise<void> {
  const cacheConfigs = new Map<string, CacheConfig>();

  /**
   * Register cache configuration for a route
   */
  app.decorate(
    'cacheRoute',
    (method: string, path: string, config: CacheConfig) => {
      cacheConfigs.set(`${method}:${path}`, config);
    }
  );

  // Add hook to check cache before processing request
  app.addHook('onRequest', async (request, reply) => {
    const routeKey = `${request.method}:${request.url.split('?')[0]}`;
    const config = cacheConfigs.get(routeKey);

    if (!config || request.method !== 'GET') {
      return;
    }

    const cacheKey = config.key
      ? config.key(request)
      : `http:${request.method}:${request.url}`;

    const cachedResponse = await cache.get(cacheKey);
    if (cachedResponse) {
      metricsCollector.recordCacheHit('httpCache');
      reply.send(cachedResponse);
    } else {
      metricsCollector.recordCacheMiss('httpCache');
    }
  });

  // Add hook to cache successful responses
  app.addHook('onResponse', async (request, reply) => {
    const routeKey = `${request.method}:${request.url.split('?')[0]}`;
    const config = cacheConfigs.get(routeKey);

    if (!config || request.method !== 'GET' || reply.statusCode !== 200) {
      return;
    }

    if (config.shouldCache && !config.shouldCache(reply)) {
      return;
    }

    const cacheKey = config.key
      ? config.key(request)
      : `http:${request.method}:${request.url}`;

    try {
      const payload = (reply as any).getPayload?.() || JSON.stringify({});
      await cache.set(cacheKey, payload, config.ttl || 3600, config.tags);
    } catch (error) {
      console.error('Error caching HTTP response:', error);
    }
  });
}

/**
 * Cache invalidation service
 */
export class CacheInvalidationService {
  private cache: MultiLayerCache;
  private invalidationRules: Map<string, string[]> = new Map();

  constructor(cache: MultiLayerCache) {
    this.cache = cache;
  }

  /**
   * Register invalidation rule
   * When event is triggered, invalidate caches with given tags
   */
  registerRule(event: string, tags: string[]): void {
    this.invalidationRules.set(event, tags);
  }

  /**
   * Trigger invalidation event
   */
  async invalidate(event: string): Promise<void> {
    const tags = this.invalidationRules.get(event);
    if (!tags) return;

    for (const tag of tags) {
      await this.cache.deleteByTag(tag);
    }
  }

  /**
   * Invalidate multiple events
   */
  async invalidateMultiple(events: string[]): Promise<void> {
    for (const event of events) {
      await this.invalidate(event);
    }
  }

  /**
   * Clear all rules
   */
  clearRules(): void {
    this.invalidationRules.clear();
  }

  /**
   * Get all rules
   */
  getRules(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const [event, tags] of this.invalidationRules) {
      result[event] = tags;
    }
    return result;
  }
}

/**
 * Event-based cache invalidation
 */
export class CacheEventBus {
  private listeners: Map<string, Set<(data?: any) => Promise<void>>> =
    new Map();

  /**
   * Subscribe to cache invalidation event
   */
  subscribe(event: string, handler: (data?: any) => Promise<void>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  /**
   * Publish cache invalidation event
   */
  async publish(event: string, data?: any): Promise<void> {
    const handlers = this.listeners.get(event);
    if (!handlers) return;

    const promises = Array.from(handlers).map((handler) => handler(data));
    await Promise.all(promises).catch((error) => {
      console.error(`Error publishing event ${event}:`, error);
    });
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners.clear();
  }
}

// Extend Fastify to include cache route decorator
declare module 'fastify' {
  interface FastifyInstance {
    cacheRoute(method: string, path: string, config: CacheConfig): void;
  }
}
