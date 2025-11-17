/**
 * Database Configuration with Read Replica Support
 *
 * Implements read/write splitting for improved performance and scalability.
 * - Write operations → Primary database
 * - Read operations → Read replicas (round-robin load balancing)
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

/**
 * Database connection configuration
 */
export interface DatabaseConfig {
  primaryUrl: string;
  replicaUrls?: string[];
  poolSize?: number;
  connectionTimeout?: number;
}

/**
 * Database client with read replica support
 */
export class DatabaseClientWithReplicas {
  private primaryClient: PrismaClient;
  private replicaClients: PrismaClient[] = [];
  private currentReplicaIndex = 0;

  constructor(config: DatabaseConfig) {
    // Primary database (for writes and critical reads)
    this.primaryClient = new PrismaClient({
      datasources: {
        db: {
          url: config.primaryUrl,
        },
      },
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
    });

    // Set up logging
    this.primaryClient.$on('query' as any, (e: any) => {
      logger.debug({ query: e.query, duration: e.duration }, 'Database query (primary)');
    });

    this.primaryClient.$on('error' as any, (e: any) => {
      logger.error({ err: e }, 'Database error (primary)');
    });

    // Read replicas (for read operations)
    if (config.replicaUrls && config.replicaUrls.length > 0) {
      config.replicaUrls.forEach((url, index) => {
        const replicaClient = new PrismaClient({
          datasources: {
            db: {
              url,
            },
          },
          log: [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'event' },
          ],
        });

        replicaClient.$on('query' as any, (e: any) => {
          logger.debug({ query: e.query, duration: e.duration, replica: index }, 'Database query (replica)');
        });

        replicaClient.$on('error' as any, (e: any) => {
          logger.error({ err: e, replica: index }, 'Database error (replica)');
        });

        this.replicaClients.push(replicaClient);
      });

      logger.info({ count: this.replicaClients.length }, 'Database read replicas initialized');
    } else {
      logger.info('No read replicas configured - using primary for all operations');
    }
  }

  /**
   * Get primary database client (for writes)
   */
  get primary(): PrismaClient {
    return this.primaryClient;
  }

  /**
   * Get read database client (round-robin load balancing)
   */
  get read(): PrismaClient {
    // If no replicas, use primary
    if (this.replicaClients.length === 0) {
      return this.primaryClient;
    }

    // Round-robin selection
    const client = this.replicaClients[this.currentReplicaIndex];
    this.currentReplicaIndex = (this.currentReplicaIndex + 1) % this.replicaClients.length;

    return client;
  }

  /**
   * Execute transaction on primary database
   */
  async $transaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    return this.primaryClient.$transaction(fn as any) as Promise<T>;
  }

  /**
   * Connect all database clients
   */
  async connect(): Promise<void> {
    await this.primaryClient.$connect();
    logger.info('Primary database connected');

    await Promise.all(
      this.replicaClients.map(async (client, index) => {
        await client.$connect();
        logger.info({ replica: index }, 'Read replica connected');
      })
    );
  }

  /**
   * Disconnect all database clients
   */
  async disconnect(): Promise<void> {
    await this.primaryClient.$disconnect();
    logger.info('Primary database disconnected');

    await Promise.all(
      this.replicaClients.map(async (client, index) => {
        await client.$disconnect();
        logger.info({ replica: index }, 'Read replica disconnected');
      })
    );
  }

  /**
   * Health check for all database connections
   */
  async healthCheck(): Promise<{
    primary: boolean;
    replicas: boolean[];
  }> {
    const results = {
      primary: false,
      replicas: [] as boolean[],
    };

    // Check primary
    try {
      await this.primaryClient.$queryRaw`SELECT 1`;
      results.primary = true;
    } catch (error) {
      logger.error({ err: error }, 'Primary database health check failed');
    }

    // Check replicas
    for (const client of this.replicaClients) {
      try {
        await client.$queryRaw`SELECT 1`;
        results.replicas.push(true);
      } catch (error) {
        logger.error({ err: error }, 'Replica database health check failed');
        results.replicas.push(false);
      }
    }

    return results;
  }
}

/**
 * Database client instance
 */
let dbClient: DatabaseClientWithReplicas | null = null;

/**
 * Initialize database client with read replica support
 */
export function initDatabaseClient(config: DatabaseConfig): DatabaseClientWithReplicas {
  if (dbClient) {
    logger.warn('Database client already initialized');
    return dbClient;
  }

  dbClient = new DatabaseClientWithReplicas(config);

  logger.info('Database client initialized with read replica support');

  return dbClient;
}

/**
 * Get database client instance
 */
export function getDatabaseClient(): DatabaseClientWithReplicas {
  if (!dbClient) {
    throw new Error('Database client not initialized. Call initDatabaseClient() first.');
  }

  return dbClient;
}

/**
 * Graceful shutdown
 */
export async function shutdownDatabase(): Promise<void> {
  if (dbClient) {
    await dbClient.disconnect();
    dbClient = null;
    logger.info('Database client shut down');
  }
}
