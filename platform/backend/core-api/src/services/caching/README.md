# Performance Caching Layer - Redis Integration

## Overview

Multi-layer caching system combining in-memory (L1) and Redis (L2) caches for optimal performance and scalability.

## Architecture

```
Request
  ↓
L1 (Memory Cache)
  ↓ (miss)
L2 (Redis Cache)
  ↓ (miss)
Database
  ↑
Populate L2 (async)
  ↑
Populate L1
  ↑
Response
```

## Features

### 1. In-Memory Cache (L1)

- **Fast**: Microsecond-level latency
- **Limited**: Configurable size limit (default: 100MB)
- **LRU Eviction**: Automatically evicts least-recently-used entries
- **TTL Support**: Automatic expiration of entries
- **Tag-Based Invalidation**: Invalidate groups of entries by tag

### 2. Redis Cache (L2)

- **Scalable**: Shared cache across instances
- **Persistent**: Optional persistence to disk
- **Advanced Features**: Supports complex data structures
- **Cluster Support**: Can be integrated with Redis Cluster
- **Pub/Sub**: Supports cache invalidation across instances

### 3. Multi-Layer Cache

- **Transparent**: Unified interface for both layers
- **Automatic Promotion**: L2 hits automatically populate L1
- **Consistency**: Atomic operations across layers
- **Efficient**: Reduces Redis traffic with L1 hits

### 4. Cache Invalidation

- **Event-Based**: Invalidate on domain events
- **Tag-Based**: Group related entries by tags
- **TTL-Based**: Automatic expiration
- **Selective**: Fine-grained control over what to invalidate

## Usage

### Basic Caching

```typescript
import { MultiLayerCache } from './services/caching';

const cache = new MultiLayerCache();
await cache.connectRedis('redis://localhost:6379');

// Set value
await cache.set('user:123', { id: 123, name: 'John' }, 3600, ['user:123']);

// Get value
const user = await cache.get('user:123');

// Delete value
await cache.delete('user:123');

// Clear all
await cache.clear();
```

### Tag-Based Invalidation

```typescript
// Cache with tags
await cache.set('user:123:profile', profile, 3600, ['user:123', 'profile']);
await cache.set('user:123:settings', settings, 3600, ['user:123', 'settings']);

// Invalidate all user data
await cache.deleteByTag('user:123');
```

### Cache Invalidation Service

```typescript
import { CacheInvalidationService } from './services/caching';

const invalidationService = new CacheInvalidationService(cache);

// Register rules
invalidationService.registerRule('user_updated', ['user:*', 'profile:*']);
invalidationService.registerRule('settings_changed', ['settings:*']);

// Trigger invalidation
await invalidationService.invalidate('user_updated');
```

### Event-Based Invalidation

```typescript
import { CacheEventBus } from './services/caching';

const eventBus = new CacheEventBus();

// Subscribe to events
const unsubscribe = eventBus.subscribe('user:created', async (userData) => {
  // Cache the new user
  await cache.set(`user:${userData.id}`, userData, 3600, ['user:*']);
});

// Publish events
await eventBus.publish('user:created', { id: 123, name: 'Jane' });
```

### HTTP Response Caching

```typescript
import { registerHttpCachingMiddleware } from './services/caching';

await registerHttpCachingMiddleware(app, cache);

// Register cached routes
app.cacheRoute('GET', '/api/users/:id', {
  ttl: 3600,       // Cache for 1 hour
  tags: ['user', 'user:*'],  // Tags for invalidation
  key: (request) => `user:${request.params.id}`,
  shouldCache: (reply) => reply.statusCode === 200,
});
```

### Cache Decorator

```typescript
import { Cacheable, MultiLayerCache } from './services/caching';

class UserService {
  private cache: MultiLayerCache;

  @Cacheable(3600, ['user:*'])
  async getUserById(userId: string) {
    // This result will be cached for 1 hour
    return await database.users.findOne({ id: userId });
  }
}
```

## Statistics & Monitoring

### Get Cache Statistics

```typescript
const stats = await cache.getStats();
console.log('L1 Cache:', stats.l1);
console.log('L2 Cache:', stats.l2);

// Output:
// L1 Cache: { hits: 1024, misses: 256, evictions: 10, size: 52428800 }
// L2 Cache: { hits: 512, misses: 256, evictions: 0, size: 104857600 }
```

### Hit Rate Calculation

```typescript
function calculateHitRate(stats: {hits: number, misses: number}): number {
  const total = stats.hits + stats.misses;
  return total > 0 ? (stats.hits / total) * 100 : 0;
}

const l1Stats = await cache.getStats();
console.log(`L1 Hit Rate: ${calculateHitRate(l1Stats.l1)}%`);
```

## Performance Characteristics

### Latency

| Operation | L1 Cache | L2 Cache | Database |
|-----------|----------|----------|----------|
| Hit       | <1ms     | 5-10ms   | 50-500ms |
| Miss      | N/A      | 5-10ms   | 50-500ms |

### Memory

| Layer | Size | Type |
|-------|------|------|
| L1    | 100MB (configurable) | In-Process |
| L2    | Unlimited | Redis |
| Total | L1 + L2 | ~2-5GB typical |

### Throughput

- **L1 Hit**: 100k+ requests/second
- **L2 Hit**: 10k-50k requests/second
- **Database**: 1k-5k requests/second

## Configuration

### Redis Connection

```typescript
const cache = new MultiLayerCache(50 * 1024 * 1024); // 50MB L1

// Connect to Redis
await cache.connectRedis('redis://localhost:6379');

// Or with custom options
await cache.connectRedis('redis://user:password@localhost:6379/0');
```

### Memory Cache Size

```typescript
// 50MB in-memory cache
const cache = new MultiLayerCache(50 * 1024 * 1024);

// 200MB in-memory cache
const cache = new MultiLayerCache(200 * 1024 * 1024);
```

### TTL Management

```typescript
// Short TTL for frequently changing data
await cache.set('session:123', sessionData, 300, ['session']);

// Long TTL for static data
await cache.set('config:app', appConfig, 86400, ['config']);

// No TTL (manual invalidation only)
await cache.set('permanent:data', data, undefined, ['permanent']);
```

## Best Practices

### 1. Use Appropriate TTLs

```typescript
// Fast-changing data: short TTL
await cache.set('user:trends', data, 60);  // 1 minute

// Semi-static data: medium TTL
await cache.set('user:profile', data, 3600);  // 1 hour

// Static data: long TTL
await cache.set('system:config', data, 86400);  // 1 day
```

### 2. Tag Everything for Invalidation

```typescript
// Good: Multiple tags for flexible invalidation
await cache.set('user:123:profile', data, 3600, [
  'user:123',
  'user:profile',
  'user:*',
]);

// Bad: No tags
await cache.set('user:123:profile', data, 3600);
```

### 3. Handle Cache Failures Gracefully

```typescript
async function getOrFetch(key: string, fetcher: () => Promise<T>) {
  try {
    const cached = await cache.get(key);
    if (cached) return cached;
  } catch (error) {
    console.error('Cache error:', error);
    // Fall through to fetch from database
  }

  const data = await fetcher();
  
  try {
    await cache.set(key, data, 3600);
  } catch (error) {
    console.error('Failed to cache:', error);
  }

  return data;
}
```

### 4. Size-Aware Caching

```typescript
// Cache large results with shorter TTL
await cache.set('large:data', bigDataSet, 600, ['large']);

// Cache small results with longer TTL
await cache.set('small:config', config, 86400, ['config']);
```

## Troubleshooting

### Cache is Empty

```typescript
// Check connection
if (!cache.l2.isReady()) {
  console.log('Redis not connected');
  await cache.connectRedis();
}

// Check if items were evicted
const stats = await cache.getStats();
console.log('Evictions:', stats.l1.evictions, stats.l2.evictions);
```

### High Eviction Rate

```typescript
// L1 cache too small
const cache = new MultiLayerCache(200 * 1024 * 1024); // Increase L1
```

### Redis Connection Issues

```typescript
try {
  await cache.connectRedis('redis://localhost:6379');
} catch (error) {
  console.error('Failed to connect to Redis:', error);
  // Fall back to L1-only caching
}
```

## Performance Optimization

### 1. Reduce Cache Misses

```typescript
// Prefetch related data
async function getUserWithRelated(userId: string) {
  const user = await cache.get(`user:${userId}`)
    || await fetchUser(userId);
  
  // Prefetch related data
  const [posts, comments] = await Promise.all([
    cache.get(`user:${userId}:posts`) 
      || fetchUserPosts(userId),
    cache.get(`user:${userId}:comments`)
      || fetchUserComments(userId),
  ]);

  return { user, posts, comments };
}
```

### 2. Batch Operations

```typescript
// Cache multiple items at once
const users = await database.users.find({ ids: [1, 2, 3] });

await Promise.all(
  users.map(user => 
    cache.set(`user:${user.id}`, user, 3600, ['user:*'])
  )
);
```

### 3. Monitor and Adjust

```typescript
// Monitor hit rates and adjust TTLs
setInterval(async () => {
  const stats = await cache.getStats();
  const l1HitRate = (stats.l1.hits / (stats.l1.hits + stats.l1.misses)) * 100;
  
  if (l1HitRate < 70) {
    console.warn(`Low hit rate: ${l1HitRate}%`);
    // Consider adjusting TTLs or cache size
  }
}, 60000);
```

## Integration with Monitoring

Cache metrics are automatically tracked:

```typescript
// Prometheus metrics
metricsCollector.recordCacheHit('userCache');
metricsCollector.recordCacheMiss('userCache');
metricsCollector.setCacheSize('userCache', 52428800);
```

## Next Steps

1. **Connect to Redis**: Use production Redis instance
2. **Monitor Performance**: Track hit rates and evictions
3. **Fine-tune TTLs**: Adjust based on data characteristics
4. **Event Coherence**: Implement cache invalidation on data changes
5. **Scale L2**: Use Redis Cluster for multi-region support
