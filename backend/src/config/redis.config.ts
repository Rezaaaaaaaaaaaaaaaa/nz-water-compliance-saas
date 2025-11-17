/**
 * Redis Configuration
 *
 * Optimized connection pooling and configuration for production.
 */

import { RedisOptions } from 'ioredis';
import { config } from './index.js';

/**
 * Redis Connection Configuration
 *
 * Optimized for production with:
 * - Connection pooling
 * - Automatic reconnection
 * - Sentinel support (high availability)
 */
export const redisConfig: RedisOptions = {
  host: config.redis?.host || 'localhost',
  port: config.redis?.port || 6379,
  password: config.redis?.password,
  db: 0,

  // Connection pool
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,

  // Reconnection strategy
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },

  // Timeouts
  connectTimeout: 10000, // 10 seconds
  commandTimeout: 5000, // 5 seconds

  // Keep alive
  keepAlive: 30000, // 30 seconds
};

/**
 * Redis Sentinel Configuration (High Availability)
 *
 * For production deployments with Redis Sentinel
 */
export const redisSentinelConfig: RedisOptions = {
  sentinels: [
    { host: 'sentinel1', port: 26379 },
    { host: 'sentinel2', port: 26379 },
    { host: 'sentinel3', port: 26379 },
  ],
  name: 'mymaster',
  password: config.redis?.password,

  sentinelRetryStrategy: (times: number) => {
    return Math.min(times * 50, 2000);
  },
};

/**
 * Redis Cluster Configuration
 *
 * For high-throughput production deployments
 */
export const redisClusterConfig = {
  nodes: [
    { host: 'redis-node1', port: 6379 },
    { host: 'redis-node2', port: 6379 },
    { host: 'redis-node3', port: 6379 },
  ],
  options: {
    redisOptions: {
      password: config.redis?.password,
    },
    clusterRetryStrategy: (times: number) => {
      return Math.min(times * 50, 2000);
    },
  },
};
