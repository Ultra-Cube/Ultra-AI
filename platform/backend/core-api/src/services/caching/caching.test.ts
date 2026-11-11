/**
 * Tests for Caching System
 */

import {
  MemoryCache,
  RedisCache,
  MultiLayerCache,
  CacheEntry,
  CacheStats,
} from './cache';
import {
  CacheInvalidationService,
  CacheEventBus,
  CacheConfig,
} from './invalidation';

describe('Caching System', () => {
  describe('MemoryCache', () => {
    let cache: MemoryCache;

    beforeEach(() => {
      cache = new MemoryCache(10 * 1024 * 1024); // 10MB
    });

    afterEach(() => {
      cache.stop();
    });

    it('should store and retrieve values', () => {
      cache.set('key1', { data: 'value1' });
      const value = cache.get<{ data: string }>('key1');
      
      expect(value).toEqual({ data: 'value1' });
    });

    it('should return null for non-existent keys', () => {
      const value = cache.get('nonexistent');
      expect(value).toBeNull();
    });

    it('should support TTL expiration', async () => {
      cache.set('key1', 'value1', 1); // 1 second TTL
      expect(cache.get('key1')).toBe('value1');
      
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(cache.get('key1')).toBeNull();
    });

    it('should track cache statistics', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // hit
      cache.get('key2'); // miss
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it('should support tag-based deletion', () => {
      cache.set('key1', 'value1', undefined, ['user:123']);
      cache.set('key2', 'value2', undefined, ['user:123']);
      cache.set('key3', 'value3', undefined, ['user:456']);
      
      const deleted = cache.deleteByTag('user:123');
      expect(deleted).toBe(2);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBe('value3');
    });

    it('should clear all cache entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });

    it('should get memory usage', () => {
      cache.set('key1', { data: 'x'.repeat(1000) });
      const usage = cache.getMemoryUsage();
      expect(usage).toBeGreaterThan(0);
    });

    it('should delete individual keys', () => {
      cache.set('key1', 'value1');
      const deleted = cache.delete('key1');
      
      expect(deleted).toBe(true);
      expect(cache.get('key1')).toBeNull();
    });

    it('should evict oldest entries when size exceeded', () => {
      const smallCache = new MemoryCache(1000); // 1KB
      
      smallCache.set('key1', { data: 'a'.repeat(200) });
      smallCache.set('key2', { data: 'b'.repeat(200) });
      smallCache.set('key3', { data: 'c'.repeat(200) });
      smallCache.set('key4', { data: 'd'.repeat(200) });
      smallCache.set('key5', { data: 'e'.repeat(200) });
      
      const stats = smallCache.getStats();
      expect(stats.evictions).toBeGreaterThan(0);
      
      smallCache.stop();
    });

    it('should handle complex data types', () => {
      const complexData = {
        id: 'user-123',
        nested: { 
          array: [1, 2, 3],
          date: new Date().toISOString(),
        },
      };
      
      cache.set('complex', complexData);
      const retrieved = cache.get('complex');
      expect(retrieved).toEqual(complexData);
    });
  });

  describe('RedisCache', () => {
    let cache: RedisCache;

    beforeEach(() => {
      cache = new RedisCache();
    });

    it('should create Redis cache instance', () => {
      expect(cache).toBeDefined();
    });

    it('should indicate disconnected state', () => {
      expect(cache.isReady()).toBe(false);
    });

    it('should return null when not connected', async () => {
      const value = await cache.get('key1');
      expect(value).toBeNull();
    });
  });

  describe('MultiLayerCache', () => {
    let cache: MultiLayerCache;

    beforeEach(() => {
      cache = new MultiLayerCache();
    });

    afterEach(async () => {
      await cache.disconnect();
    });

    it('should store and retrieve from L1', async () => {
      await cache.set('key1', { data: 'value1' });
      const value = await cache.get<{ data: string }>('key1');
      
      expect(value).toEqual({ data: 'value1' });
    });

    it('should return null for non-existent keys', async () => {
      const value = await cache.get('nonexistent');
      expect(value).toBeNull();
    });

    it('should support multi-layer caching', async () => {
      await cache.set('key1', 'value1', 3600, ['test']);
      const value = await cache.get('key1');
      expect(value).toBe('value1');
    });

    it('should delete from both layers', async () => {
      await cache.set('key1', 'value1');
      const deleted = await cache.delete('key1');
      
      expect(deleted).toBe(true);
      const value = await cache.get('key1');
      expect(value).toBeNull();
    });

    it('should support tag-based invalidation', async () => {
      await cache.set('key1', 'value1', undefined, ['user:123']);
      await cache.set('key2', 'value2', undefined, ['user:456']);
      
      const deleted = await cache.deleteByTag('user:123');
      expect(deleted).toBeGreaterThanOrEqual(1);
      expect(await cache.get('key1')).toBeNull();
    });

    it('should clear all caches', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.clear();
      
      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
    });

    it('should get combined statistics', async () => {
      await cache.set('key1', 'value1');
      const stats = await cache.getStats();
      
      expect(stats.l1).toBeDefined();
      expect(stats.l2).toBeDefined();
    });

    it('should handle different data types', async () => {
      const testData = [
        { number: 42 },
        { string: 'test' },
        { array: [1, 2, 3] },
        { nested: { deep: { value: 'test' } } },
      ];

      for (const data of testData) {
        const key = `test:${JSON.stringify(data)}`;
        await cache.set(key, data);
        const retrieved = await cache.get(key);
        expect(retrieved).toEqual(data);
      }
    });
  });

  describe('CacheInvalidationService', () => {
    let cache: MultiLayerCache;
    let service: CacheInvalidationService;

    beforeEach(() => {
      cache = new MultiLayerCache();
      service = new CacheInvalidationService(cache);
    });

    afterEach(async () => {
      await cache.disconnect();
    });

    it('should register invalidation rules', () => {
      service.registerRule('user_updated', ['user:*', 'profile:*']);
      const rules = service.getRules();
      
      expect(rules['user_updated']).toEqual(['user:*', 'profile:*']);
    });

    it('should invalidate cache by event', async () => {
      service.registerRule('user_updated', ['user:123']);
      await cache.set('user:123:data', { id: 123 }, undefined, ['user:123']);
      
      await service.invalidate('user_updated');
      const value = await cache.get('user:123:data');
      expect(value).toBeNull();
    });

    it('should handle multiple invalidation events', async () => {
      service.registerRule('user_updated', ['user:*']);
      service.registerRule('profile_updated', ['profile:*']);
      
      await cache.set('user:data', {}, undefined, ['user:*']);
      await cache.set('profile:data', {}, undefined, ['profile:*']);
      
      await service.invalidateMultiple(['user_updated', 'profile_updated']);
      expect(await cache.get('user:data')).toBeNull();
      expect(await cache.get('profile:data')).toBeNull();
    });

    it('should clear all rules', () => {
      service.registerRule('event1', ['tag1']);
      service.registerRule('event2', ['tag2']);
      
      service.clearRules();
      const rules = service.getRules();
      expect(Object.keys(rules)).toHaveLength(0);
    });
  });

  describe('CacheEventBus', () => {
    let bus: CacheEventBus;

    beforeEach(() => {
      bus = new CacheEventBus();
    });

    afterEach(() => {
      bus.clear();
    });

    it('should subscribe and publish events', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      bus.subscribe('test_event', handler);
      
      await bus.publish('test_event', { data: 'test' });
      
      expect(handler).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should support multiple subscribers', async () => {
      const handler1 = jest.fn().mockResolvedValue(undefined);
      const handler2 = jest.fn().mockResolvedValue(undefined);
      
      bus.subscribe('event', handler1);
      bus.subscribe('event', handler2);
      
      await bus.publish('event');
      
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should support unsubscription', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      const unsubscribe = bus.subscribe('event', handler);
      
      unsubscribe();
      await bus.publish('event');
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle errors in handlers gracefully', async () => {
      const errorHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
      const normalHandler = jest.fn().mockResolvedValue(undefined);
      
      bus.subscribe('event', errorHandler);
      bus.subscribe('event', normalHandler);
      
      // Should not throw
      await bus.publish('event');
      
      expect(normalHandler).toHaveBeenCalled();
    });

    it('should clear all listeners', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      bus.subscribe('event', handler);
      
      bus.clear();
      await bus.publish('event');
      
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Cache Integration Scenarios', () => {
    let cache: MultiLayerCache;

    beforeEach(() => {
      cache = new MultiLayerCache();
    });

    afterEach(async () => {
      await cache.disconnect();
    });

    it('should handle concurrent cache operations', async () => {
      const operations = Array.from({ length: 100 }, (_, i) =>
        cache.set(`key:${i}`, { value: i })
      );

      await Promise.all(operations);

      const value = await cache.get('key:50');
      expect(value).toEqual({ value: 50 });
    });

    it('should handle cache invalidation during reads', async () => {
      await cache.set('key:1', { version: 1 }, undefined, ['data']);
      
      const readPromise = cache.get('key:1');
      const invalidatePromise = cache.deleteByTag('data');
      
      const [value] = await Promise.all([readPromise, invalidatePromise]);
      expect(value).toEqual({ version: 1 });
    });

    it('should manage different TTLs correctly', async () => {
      await cache.set('short', 'value1', 1); // 1 second
      await cache.set('long', 'value2', 10); // 10 seconds
      
      expect(await cache.get('short')).toBe('value1');
      expect(await cache.get('long')).toBe('value2');
      
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(await cache.get('short')).toBeNull();
      expect(await cache.get('long')).toBe('value2');
    });
  });
});
