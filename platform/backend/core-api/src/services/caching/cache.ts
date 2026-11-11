/**
 * Multi-Layer Caching System for Ultra AI Platform
 *
 * Implements in-memory (L1) and Redis (L2) caching with automatic invalidation
 */

import { createClient, RedisClientType } from 'redis';

export interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
  tags?: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
}

/**
 * In-memory cache layer (L1)
 */
export class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, evictions: 0, size: 0 };
  private maxSize: number;
  private cleanupInterval: NodeJS.Timer | null = null;

  constructor(maxSizeBytes: number = 100 * 1024 * 1024) {
    // 100MB default
    this.maxSize = maxSizeBytes;
    this.startCleanupInterval();
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiration
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttlSeconds?: number, tags?: string[]): void {
    const entry: CacheEntry<T> = {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
      tags,
    };

    this.cache.set(key, entry);
    this.stats.size = this.getMemoryUsage();
    this.evictIfNeeded();
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.size = this.getMemoryUsage();
    }
    return deleted;
  }

  /**
   * Delete by tag pattern
   */
  deleteByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache) {
      if (entry.tags?.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    this.stats.size = this.getMemoryUsage();
    return count;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0, size: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache size in bytes
   */
  getMemoryUsage(): number {
    let size = 0;
    for (const [key, entry] of this.cache) {
      size += key.length;
      try {
        size += JSON.stringify(entry.value).length;
      } catch {
        size += 1024; // Fallback estimate
      }
    }
    return size;
  }

  /**
   * Evict least recently used entries if size exceeds limit
   */
  private evictIfNeeded(): void {
    if (this.stats.size > this.maxSize) {
      const entriesToEvict = Math.ceil(this.cache.size * 0.1);
      let evicted = 0;

      for (const key of this.cache.keys()) {
        if (evicted >= entriesToEvict) break;
        this.cache.delete(key);
        evicted++;
      }

      this.stats.evictions += evicted;
      this.stats.size = this.getMemoryUsage();
    }
  }

  /**
   * Clean up expired entries periodically
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.cache) {
        if (entry.expiresAt && entry.expiresAt < now) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        this.stats.size = this.getMemoryUsage();
      }
    }, 60000); // Run every 60 seconds
  }

  /**
   * Stop cleanup interval
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval as any);
    }
  }
}

/**
 * Redis cache layer (L2)
 */
export class RedisCache {
  private client: RedisClientType | null = null;
  private stats: CacheStats = { hits: 0, misses: 0, evictions: 0, size: 0 };
  private isConnected = false;

  constructor() {}

  /**
   * Connect to Redis server
   */
  async connect(url: string = 'redis://localhost:6379'): Promise<void> {
    this.client = createClient({ url });

    this.client.on('error', (err) => {
      console.error('Redis client error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      this.isConnected = true;
    });

    await this.client.connect();
    this.isConnected = true;
  }

  /**
   * Check if connected
   */
  isReady(): boolean {
    return this.isConnected && !!this.client;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isReady()) return null;

    try {
      const value = await this.client!.get(key);

      if (!value) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Redis get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
    tags?: string[]
  ): Promise<void> {
    if (!this.isReady()) return;

    try {
      const jsonValue = JSON.stringify(value);

      if (ttlSeconds) {
        await this.client!.setEx(key, ttlSeconds, jsonValue);
      } else {
        await this.client!.set(key, jsonValue);
      }

      // Store tags for invalidation
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          const tagKey = `tag:${tag}`;
          await this.client!.sAdd(tagKey, key);
          await this.client!.expire(tagKey, ttlSeconds || 3600);
        }
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      const result = await this.client!.del(key);
      return result > 0;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  /**
   * Delete by tag pattern
   */
  async deleteByTag(tag: string): Promise<number> {
    if (!this.isReady()) return 0;

    try {
      const tagKey = `tag:${tag}`;
      const keys = await this.client!.sMembers(tagKey);

      if (keys.length > 0) {
        await this.client!.del(keys);
      }

      await this.client!.del(tagKey);
      return keys.length;
    } catch (error) {
      console.error('Redis deleteByTag error:', error);
      return 0;
    }
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    if (!this.isReady()) return;

    try {
      await this.client!.flushDb();
      this.stats = { hits: 0, misses: 0, evictions: 0, size: 0 };
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    if (!this.isReady()) return { ...this.stats };

    try {
      const info = await this.client!.info('memory');
      const lines = info.split('\r\n');
      let usedMemory = 0;

      for (const line of lines) {
        if (line.startsWith('used_memory:')) {
          usedMemory = parseInt(line.split(':')[1], 10);
          break;
        }
      }

      return { ...this.stats, size: usedMemory };
    } catch (error) {
      console.error('Redis getStats error:', error);
      return { ...this.stats };
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

/**
 * Multi-layer cache combining L1 (memory) and L2 (Redis)
 */
export class MultiLayerCache {
  private l1: MemoryCache;
  private l2: RedisCache;
  private stats: CacheStats = { hits: 0, misses: 0, evictions: 0, size: 0 };

  constructor(l1MaxSize: number = 100 * 1024 * 1024) {
    this.l1 = new MemoryCache(l1MaxSize);
    this.l2 = new RedisCache();
  }

  /**
   * Connect to Redis
   */
  async connectRedis(url?: string): Promise<void> {
    await this.l2.connect(url);
  }

  /**
   * Get value from cache (checks L1 first, then L2)
   */
  async get<T>(key: string): Promise<T | null> {
    // Check L1 (memory)
    const l1Value = this.l1.get<T>(key);
    if (l1Value !== null) {
      return l1Value;
    }

    // Check L2 (Redis)
    const l2Value = await this.l2.get<T>(key);
    if (l2Value !== null) {
      // Populate L1 with L2 value
      this.l1.set(key, l2Value);
      return l2Value;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set value in both L1 and L2
   */
  async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
    tags?: string[]
  ): Promise<void> {
    this.l1.set(key, value, ttlSeconds, tags);
    await this.l2.set(key, value, ttlSeconds, tags);
  }

  /**
   * Delete from both caches
   */
  async delete(key: string): Promise<boolean> {
    const l1Deleted = this.l1.delete(key);
    const l2Deleted = await this.l2.delete(key);
    return l1Deleted || l2Deleted;
  }

  /**
   * Delete by tag from both caches
   */
  async deleteByTag(tag: string): Promise<number> {
    const l1Count = this.l1.deleteByTag(tag);
    const l2Count = await this.l2.deleteByTag(tag);
    return l1Count + l2Count;
  }

  /**
   * Clear both caches
   */
  async clear(): Promise<void> {
    this.l1.clear();
    await this.l2.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0, size: 0 };
  }

  /**
   * Get combined statistics
   */
  async getStats(): Promise<{ l1: CacheStats; l2: CacheStats }> {
    const l2Stats = await this.l2.getStats();
    return {
      l1: this.l1.getStats(),
      l2: l2Stats,
    };
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    this.l1.stop();
    await this.l2.disconnect();
  }
}

/**
 * Cache decorator for functions
 */
export function Cacheable(ttlSeconds?: number, tags?: string[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cacheKey = `${target.constructor.name}:${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const cache = (this as any).cache as MultiLayerCache;
      if (!cache) {
        return originalMethod.apply(this, args);
      }

      const argKey = JSON.stringify(args);
      const fullKey = `${cacheKey}:${argKey}`;

      const cachedValue = await cache.get(fullKey);
      if (cachedValue !== null) {
        return cachedValue;
      }

      const result = await originalMethod.apply(this, args);
      await cache.set(fullKey, result, ttlSeconds, tags);
      return result;
    };

    return descriptor;
  };
}
