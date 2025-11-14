/**
 * Cache Invalidation Utilities
 *
 * Smart cache invalidation strategies for Redis with tag-based
 * and pattern-based invalidation support.
 */

import Redis from 'ioredis';
import { logger } from '../config/logger.js';

/**
 * Cache Manager
 *
 * Provides utilities for cache operations with intelligent invalidation
 */
export class CacheManager {
  private static prefix = 'cache:';
  private static tagPrefix = 'tag:';

  constructor(private redis: Redis) {}

  /**
   * Generate cache key with prefix
   */
  private key(key: string): string {
    return `${CacheManager.prefix}${key}`;
  }

  /**
   * Generate tag key
   */
  private tagKey(tag: string): string {
    return `${CacheManager.prefix}${CacheManager.tagPrefix}${tag}`;
  }

  /**
   * Set cache value with optional tags and TTL
   */
  async set(
    key: string,
    value: string,
    options?: {
      ttl?: number; // seconds
      tags?: string[];
    }
  ): Promise<void> {
    const fullKey = this.key(key);

    try {
      // Set the value
      if (options?.ttl) {
        await this.redis.setex(fullKey, options.ttl, value);
      } else {
        await this.redis.set(fullKey, value);
      }

      // Add to tag sets
      if (options?.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          await this.redis.sadd(this.tagKey(tag), fullKey);

          // Set TTL on tag set (longer than individual keys)
          if (options.ttl) {
            await this.redis.expire(this.tagKey(tag), options.ttl * 2);
          }
        }
      }

      logger.debug({ key, tags: options?.tags, ttl: options?.ttl }, 'Cache set');
    } catch (error) {
      logger.error({ error, key }, 'Failed to set cache');
      throw error;
    }
  }

  /**
   * Get cache value
   */
  async get(key: string): Promise<string | null> {
    try {
      const value = await this.redis.get(this.key(key));
      logger.debug({ key, hit: !!value }, 'Cache get');
      return value;
    } catch (error) {
      logger.error({ error, key }, 'Failed to get cache');
      return null;
    }
  }

  /**
   * Delete specific key
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(this.key(key));
      logger.info({ key }, 'Cache key deleted');
    } catch (error) {
      logger.error({ error, key }, 'Failed to delete cache key');
      throw error;
    }
  }

  /**
   * Invalidate cache by pattern
   *
   * WARNING: KEYS command can be slow on large databases
   * Use with caution in production
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const fullPattern = this.key(pattern);
      const keys = await this.redis.keys(fullPattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info({ pattern, count: keys.length }, 'Cache invalidated by pattern');
        return keys.length;
      }

      return 0;
    } catch (error) {
      logger.error({ error, pattern }, 'Failed to invalidate cache by pattern');
      throw error;
    }
  }

  /**
   * Invalidate cache by tags
   *
   * More efficient than pattern matching
   */
  async invalidateTags(tags: string[]): Promise<number> {
    try {
      let totalDeleted = 0;

      for (const tag of tags) {
        const tagKey = this.tagKey(tag);

        // Get all keys for this tag
        const keys = await this.redis.smembers(tagKey);

        if (keys.length > 0) {
          // Delete all keys
          await this.redis.del(...keys);
          // Delete the tag set
          await this.redis.del(tagKey);

          totalDeleted += keys.length;
          logger.info({ tag, count: keys.length }, 'Cache invalidated by tag');
        }
      }

      return totalDeleted;
    } catch (error) {
      logger.error({ error, tags }, 'Failed to invalidate cache by tags');
      throw error;
    }
  }

  /**
   * Invalidate organization cache
   */
  async invalidateOrganization(organizationId: string): Promise<void> {
    await this.invalidateTags([
      `org:${organizationId}`,
      `org:${organizationId}:*`,
    ]);
  }

  /**
   * Invalidate user cache
   */
  async invalidateUser(userId: string): Promise<void> {
    await this.invalidateTags([
      `user:${userId}`,
      `user:${userId}:*`,
    ]);
  }

  /**
   * Invalidate asset cache
   */
  async invalidateAsset(assetId: string, organizationId: string): Promise<void> {
    await this.invalidateTags([
      `asset:${assetId}`,
      `org:${organizationId}:assets`,
    ]);
  }

  /**
   * Invalidate compliance plan cache
   */
  async invalidateCompliancePlan(planId: string, organizationId: string): Promise<void> {
    await this.invalidateTags([
      `plan:${planId}`,
      `org:${organizationId}:plans`,
      `compliance`,
    ]);
  }

  /**
   * Invalidate document cache
   */
  async invalidateDocument(documentId: string, organizationId: string): Promise<void> {
    await this.invalidateTags([
      `document:${documentId}`,
      `org:${organizationId}:documents`,
    ]);
  }

  /**
   * Invalidate analytics cache
   */
  async invalidateAnalytics(organizationId: string): Promise<void> {
    await this.invalidateTags([
      `analytics`,
      `org:${organizationId}:analytics`,
      `org:${organizationId}:dashboard`,
    ]);
  }

  /**
   * Invalidate all cache (use with extreme caution)
   */
  async invalidateAll(): Promise<void> {
    try {
      await this.redis.flushdb();
      logger.warn('All cache invalidated');
    } catch (error) {
      logger.error({ error }, 'Failed to invalidate all cache');
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    keys: number;
    memory: string;
    hits: number;
    misses: number;
  }> {
    try {
      const info = await this.redis.info('stats');
      const dbsize = await this.redis.dbsize();

      // Parse stats from info string
      const hitsMatch = info.match(/keyspace_hits:(\d+)/);
      const missesMatch = info.match(/keyspace_misses:(\d+)/);
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);

      return {
        keys: dbsize,
        memory: memoryMatch ? memoryMatch[1] : 'unknown',
        hits: hitsMatch ? parseInt(hitsMatch[1]) : 0,
        misses: missesMatch ? parseInt(missesMatch[1]) : 0,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get cache stats');
      return { keys: 0, memory: '0B', hits: 0, misses: 0 };
    }
  }
}

/**
 * Cache Invalidation Middleware
 *
 * Automatically invalidates cache after mutations
 */
export function createCacheInvalidationMiddleware(redis: Redis) {
  const cacheManager = new CacheManager(redis);

  return {
    /**
     * Invalidate after create/update/delete
     */
    async afterMutation(
      resourceType: string,
      resourceId: string,
      organizationId: string
    ): Promise<void> {
      switch (resourceType) {
        case 'asset':
          await cacheManager.invalidateAsset(resourceId, organizationId);
          break;
        case 'compliancePlan':
          await cacheManager.invalidateCompliancePlan(resourceId, organizationId);
          break;
        case 'document':
          await cacheManager.invalidateDocument(resourceId, organizationId);
          break;
        default:
          // Invalidate organization cache by default
          await cacheManager.invalidateOrganization(organizationId);
      }

      // Always invalidate analytics
      await cacheManager.invalidateAnalytics(organizationId);
    },
  };
}
