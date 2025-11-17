/**
 * Database Service with Read/Write Splitting
 *
 * Provides convenient methods for database operations with automatic
 * read replica routing.
 */

import { PrismaClient } from '@prisma/client';
import { getDatabaseClient } from '../config/database.config.js';
import { logger } from '../config/logger.js';

/**
 * Get database client for read operations
 *
 * Routes to read replica if available, otherwise primary.
 */
export function getReadClient(): PrismaClient {
  return getDatabaseClient().read;
}

/**
 * Get database client for write operations
 *
 * Always routes to primary database.
 */
export function getWriteClient(): PrismaClient {
  return getDatabaseClient().primary;
}

/**
 * Execute a read query
 *
 * Automatically uses read replica for load balancing.
 *
 * @example
 * ```ts
 * const users = await readQuery((db) => db.user.findMany());
 * ```
 */
export async function readQuery<T>(
  fn: (db: PrismaClient) => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await fn(getReadClient());
    const duration = Date.now() - startTime;
    logger.debug({ duration, type: 'read' }, 'Database query completed');
    return result;
  } catch (error) {
    logger.error({ err: error, type: 'read' }, 'Read query failed');
    throw error;
  }
}

/**
 * Execute a write query
 *
 * Always uses primary database for consistency.
 *
 * @example
 * ```ts
 * const user = await writeQuery((db) => db.user.create({ data: { ... } }));
 * ```
 */
export async function writeQuery<T>(
  fn: (db: PrismaClient) => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await fn(getWriteClient());
    const duration = Date.now() - startTime;
    logger.debug({ duration, type: 'write' }, 'Database query completed');
    return result;
  } catch (error) {
    logger.error({ err: error, type: 'write' }, 'Write query failed');
    throw error;
  }
}

/**
 * Execute a transaction
 *
 * Always uses primary database.
 *
 * @example
 * ```ts
 * await transaction(async (db) => {
 *   await db.user.create({ data: { ... } });
 *   await db.auditLog.create({ data: { ... } });
 * });
 * ```
 */
export async function transaction<T>(
  fn: (db: PrismaClient) => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await getDatabaseClient().$transaction(fn);
    const duration = Date.now() - startTime;
    logger.debug({ duration, type: 'transaction' }, 'Database transaction completed');
    return result;
  } catch (error) {
    logger.error({ err: error, type: 'transaction' }, 'Transaction failed');
    throw error;
  }
}

/**
 * Execute a query with retry logic
 *
 * Retries failed queries with exponential backoff.
 *
 * @param fn - Query function
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @param useReadReplica - Whether to use read replica (default: false)
 */
export async function queryWithRetry<T>(
  fn: (db: PrismaClient) => Promise<T>,
  maxRetries: number = 3,
  useReadReplica: boolean = false
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const db = useReadReplica ? getReadClient() : getWriteClient();
      return await fn(db);
    } catch (error: any) {
      lastError = error;

      // Don't retry on certain errors
      if (
        error.code === 'P2002' || // Unique constraint violation
        error.code === 'P2025' || // Record not found
        error.code === 'P2003' // Foreign key constraint violation
      ) {
        throw error;
      }

      logger.warn(
        { err: error, attempt: attempt + 1, maxRetries },
        'Query failed, retrying...'
      );

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 100)
      );
    }
  }

  throw lastError;
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  primary: boolean;
  replicas: boolean[];
}> {
  try {
    const health = await getDatabaseClient().healthCheck();
    const allHealthy = health.primary && health.replicas.every((r) => r);

    return {
      healthy: allHealthy,
      primary: health.primary,
      replicas: health.replicas,
    };
  } catch (error) {
    logger.error({ err: error }, 'Database health check failed');
    return {
      healthy: false,
      primary: false,
      replicas: [],
    };
  }
}
