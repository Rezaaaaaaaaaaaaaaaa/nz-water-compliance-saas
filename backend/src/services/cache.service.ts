/**
 * Cache Service
 *
 * Redis caching for performance optimization
 */

import Redis from 'ioredis';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

// Create Redis client
const redis = new Redis({
  host: config.redis?.host || 'localhost',
  port: config.redis?.port || 6379,
  password: config.redis?.password,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('error', (error) => {
  logger.error({ err: error }, 'Redis connection error');
});

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

/**
 * Cache key prefixes
 */
export const CachePrefix = {
  DASHBOARD: 'dashboard',
  ANALYTICS: 'analytics',
  COMPLIANCE_SCORE: 'compliance_score',
  ASSETS: 'assets',
  DOCUMENTS: 'documents',
  EXPORT: 'export',
} as const;

/**
 * Default TTL values (in seconds)
 */
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  HOUR: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;

/**
 * Retrieve a value from the cache
 *
 * @template T - The type of the cached value
 * @param {string} key - The cache key
 * @returns {Promise<T | null>} The cached value if found, null otherwise
 * @example
 * const user = await get<User>('user:123');
 */
export async function get<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    if (!value) return null;

    const parsed = JSON.parse(value);
    logger.debug({ key }, 'Cache hit');
    return parsed as T;
  } catch (error) {
    logger.error({ err: error, key }, 'Cache get error');
    return null;
  }
}

/**
 * Store a value in the cache with a time-to-live (TTL)
 *
 * @param {string} key - The cache key
 * @param {any} value - The value to cache (will be JSON serialized)
 * @param {number} [ttl=CacheTTL.MEDIUM] - Time-to-live in seconds (default: 300s / 5min)
 * @returns {Promise<void>}
 * @example
 * await set('user:123', userData, CacheTTL.HOUR);
 */
export async function set(key: string, value: any, ttl: number = CacheTTL.MEDIUM): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    await redis.setex(key, ttl, serialized);
    logger.debug({ key, ttl }, 'Cache set');
  } catch (error) {
    logger.error({ err: error, key }, 'Cache set error');
  }
}

/**
 * Delete value from cache
 */
export async function del(key: string): Promise<void> {
  try {
    await redis.del(key);
    logger.debug({ key }, 'Cache deleted');
  } catch (error) {
    logger.error({ err: error, key }, 'Cache delete error');
  }
}

/**
 * Delete all keys matching pattern
 */
export async function delPattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug({ pattern, count: keys.length }, 'Cache pattern deleted');
    }
  } catch (error) {
    logger.error({ err: error, pattern }, 'Cache pattern delete error');
  }
}

/**
 * Check if key exists in cache
 */
export async function exists(key: string): Promise<boolean> {
  try {
    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    logger.error({ err: error, key }, 'Cache exists check error');
    return false;
  }
}

/**
 * Get value from cache or fetch and store it (cache-aside pattern)
 *
 * This function implements the cache-aside pattern:
 * 1. Try to get value from cache
 * 2. If not found, execute fetchFn to get fresh data
 * 3. Store the fresh data in cache
 * 4. Return the data
 *
 * @template T - The type of the value to fetch and cache
 * @param {string} key - The cache key
 * @param {() => Promise<T>} fetchFn - Function to fetch fresh data if cache miss
 * @param {number} [ttl=CacheTTL.MEDIUM] - Time-to-live in seconds (default: 300s / 5min)
 * @returns {Promise<T>} The cached or freshly fetched value
 * @example
 * const dashboard = await getOrSet(
 *   getDashboardKey(orgId),
 *   () => analyticsService.getDashboardData(orgId),
 *   CacheTTL.MEDIUM
 * );
 */
export async function getOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CacheTTL.MEDIUM
): Promise<T> {
  // Try to get from cache first
  const cached = await get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Store in cache
  await set(key, data, ttl);

  return data;
}

/**
 * Invalidate all cached data for a specific organization
 *
 * This function deletes all cache keys related to an organization across all prefixes:
 * - Dashboard data
 * - Analytics data
 * - Compliance scores
 * - Asset data
 * - Document data
 *
 * Call this when organization data is modified to ensure cache consistency.
 *
 * @param {string} organizationId - The organization ID
 * @returns {Promise<void>}
 * @example
 * // After updating organization data
 * await prisma.asset.update({...});
 * await invalidateOrganization(organizationId);
 */
export async function invalidateOrganization(organizationId: string): Promise<void> {
  const patterns = [
    `${CachePrefix.DASHBOARD}:${organizationId}:*`,
    `${CachePrefix.ANALYTICS}:${organizationId}:*`,
    `${CachePrefix.COMPLIANCE_SCORE}:${organizationId}:*`,
    `${CachePrefix.ASSETS}:${organizationId}:*`,
    `${CachePrefix.DOCUMENTS}:${organizationId}:*`,
  ];

  await Promise.all(patterns.map((pattern) => delPattern(pattern)));

  logger.info({ organizationId }, 'Organization cache invalidated');
}

/**
 * Generate cache key for dashboard
 */
export function getDashboardKey(organizationId: string): string {
  return `${CachePrefix.DASHBOARD}:${organizationId}:full`;
}

/**
 * Generate cache key for compliance score
 */
export function getComplianceScoreKey(organizationId: string): string {
  return `${CachePrefix.COMPLIANCE_SCORE}:${organizationId}:latest`;
}

/**
 * Generate cache key for asset analytics
 */
export function getAssetAnalyticsKey(organizationId: string): string {
  return `${CachePrefix.ANALYTICS}:${organizationId}:assets`;
}

/**
 * Generate cache key for document analytics
 */
export function getDocumentAnalyticsKey(organizationId: string): string {
  return `${CachePrefix.ANALYTICS}:${organizationId}:documents`;
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalKeys: number;
  memoryUsed: string;
  hitRate: string;
}> {
  try {
    const info = await redis.info('stats');
    const dbSize = await redis.dbsize();

    // Parse info string for hit rate
    const lines = info.split('\r\n');
    const hitsLine = lines.find((l) => l.startsWith('keyspace_hits:'));
    const missesLine = lines.find((l) => l.startsWith('keyspace_misses:'));

    const hits = hitsLine ? parseInt(hitsLine.split(':')[1]) : 0;
    const misses = missesLine ? parseInt(missesLine.split(':')[1]) : 0;
    const total = hits + misses;
    const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) : '0.00';

    // Get memory info
    const memoryInfo = await redis.info('memory');
    const memoryLine = memoryInfo.split('\r\n').find((l) => l.startsWith('used_memory_human:'));
    const memoryUsed = memoryLine ? memoryLine.split(':')[1] : 'Unknown';

    return {
      totalKeys: dbSize,
      memoryUsed,
      hitRate: `${hitRate}%`,
    };
  } catch (error) {
    logger.error({ err: error }, 'Failed to get cache stats');
    return {
      totalKeys: 0,
      memoryUsed: 'Unknown',
      hitRate: '0%',
    };
  }
}

/**
 * Flush all cache (use with caution)
 */
export async function flushAll(): Promise<void> {
  try {
    await redis.flushdb();
    logger.warn('All cache flushed');
  } catch (error) {
    logger.error({ err: error }, 'Cache flush error');
    throw error;
  }
}

/**
 * Close Redis connection
 */
export async function close(): Promise<void> {
  await redis.quit();
  logger.info('Redis connection closed');
}

export default redis;
