/**
 * NZ Water Compliance SaaS - Backend Server
 *
 * Main server entry point for the compliance management system.
 * This system helps NZ water utilities maintain regulatory compliance
 * with Taumata Arowai requirements.
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import authRoutes from './routes/auth.routes.js';
import dwspRoutes from './routes/dwsp.routes.js';
import assetRoutes from './routes/asset.routes.js';
import documentRoutes from './routes/document.routes.js';
import reportRoutes from './routes/report.routes.js';
import monitoringRoutes from './routes/monitoring.routes.js';
import { analyticsRoutes } from './routes/analytics.routes.js';
import { exportRoutes } from './routes/export.routes.js';
import { dwqarRoutes } from './routes/dwqar.routes.js';
import { aiRoutes } from './routes/ai.routes.js';
import { startWorkers, stopWorkers } from './workers/index.js';
import { prisma } from './config/database.js';
import Redis from 'ioredis';

// Initialize Redis with proper error handling
const redis = new Redis({
  host: config.redis?.host || 'localhost',
  port: config.redis?.port || 6379,
  password: config.redis?.password || undefined,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      logger.error('Redis connection failed after max retries');
      return null;
    }
    return Math.min(times * 50, 2000);
  },
  lazyConnect: true, // Don't connect immediately
});

// Handle Redis connection errors gracefully
redis.on('error', (error) => {
  logger.error({ err: error }, 'Redis connection error - caching disabled');
});

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

// Attempt to connect but don't crash if it fails
redis.connect().catch((error) => {
  logger.warn(
    { err: error },
    'Redis connection failed - running without cache. Set REDIS_PASSWORD in .env'
  );
});

// Type for authenticated user (used with type assertion)
export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
  role: string;
}

// Type augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * Build Fastify application with all plugins and routes
 */
async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: logger as any, // Type assertion for Pino logger compatibility
    trustProxy: true,
    requestIdLogLabel: 'requestId',
    disableRequestLogging: false,
    bodyLimit: config.maxFileSize,
  });

  // Security: Helmet - Sets security headers
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // CORS Configuration
  await app.register(cors, {
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  // Rate Limiting - Prevent abuse (skip in test mode)
  if (config.nodeEnv !== 'test') {
    await app.register(rateLimit, {
      max: config.rateLimit.max,
      timeWindow: config.rateLimit.window,
      redis: redis, // Use Redis client instance for distributed rate limiting
    });
  }

  // JWT Authentication
  await app.register(jwt, {
    secret: config.jwtSecret,
  });

  // Multipart/form-data support for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: config.maxFileSize,
      files: 10,
    },
  });

  // Health Check Endpoint
  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
    };
  });

  // Detailed Health Checks
  app.get('/health/db', async (_request, reply) => {
    try {
      // Test database connection with a simple query
      await prisma.$queryRaw`SELECT 1 as health`;

      // Get database connection info
      const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM "Organization"
      `;

      return {
        status: 'ok',
        service: 'database',
        timestamp: new Date().toISOString(),
        details: {
          connected: true,
          organizations: Number(result[0].count),
        },
      };
    } catch (error: any) {
      logger.error('Database health check failed', error);
      reply.code(503);
      return {
        status: 'error',
        service: 'database',
        timestamp: new Date().toISOString(),
        // @ts-ignore - error is caught as any for flexibility
        error: error.message || String(error),
      };
    }
  });

  app.get('/health/redis', async (_request, reply) => {
    try {
      // Test Redis connection with PING command
      const pong = await redis.ping();

      // Get Redis info
      const info = await redis.info('server');
      const versionMatch = info.match(/redis_version:([^\r\n]+)/);
      const version = versionMatch ? versionMatch[1] : 'unknown';

      // Get memory info
      const memInfo = await redis.info('memory');
      const memMatch = memInfo.match(/used_memory_human:([^\r\n]+)/);
      const memoryUsed = memMatch ? memMatch[1] : 'unknown';

      return {
        status: 'ok',
        service: 'redis',
        timestamp: new Date().toISOString(),
        details: {
          connected: pong === 'PONG',
          version,
          memoryUsed,
        },
      };
    } catch (error: any) {
      logger.error('Redis health check failed', error);
      reply.code(503);
      return {
        status: 'error',
        service: 'redis',
        timestamp: new Date().toISOString(),
        // @ts-ignore - error is caught as any for flexibility
        error: error.message || String(error),
      };
    }
  });

  // API Routes
  app.get('/api/v1', async () => {
    return {
      message: 'NZ Water Compliance SaaS API',
      version: '1.0.0',
      documentation: '/api/v1/docs',
    };
  });

  // Register route modules
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(dwspRoutes, { prefix: '/api/v1/compliance/dwsp' });
  await app.register(assetRoutes, { prefix: '/api/v1/assets' });
  await app.register(documentRoutes, { prefix: '/api/v1/documents' });
  await app.register(reportRoutes, { prefix: '/api/v1/reports' });
  await app.register(monitoringRoutes, { prefix: '/api/v1/monitoring' });
  await app.register(analyticsRoutes, { prefix: '/api/v1/analytics' });
  await app.register(exportRoutes, { prefix: '/api/v1/export' });
  await app.register(dwqarRoutes, { prefix: '/api/v1/dwqar' });
  await app.register(aiRoutes); // AI routes (includes /api/ai prefix in route definitions)

  // Global Error Handler
  app.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode || 500;

    // Log error with request context
    request.log.error({
      err: error,
      requestId: request.id,
      url: request.url,
      method: request.method,
      statusCode,
    });

    // Don't expose internal error details in production
    const message =
      config.nodeEnv === 'production' && statusCode === 500
        ? 'Internal Server Error'
        : error.message;

    void reply.status(statusCode).send({
      error: {
        message,
        statusCode,
        requestId: request.id,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // 404 Handler
  app.setNotFoundHandler((request, reply) => {
    void reply.status(404).send({
      error: {
        message: 'Route not found',
        statusCode: 404,
        path: request.url,
        requestId: request.id,
      },
    });
  });

  return app;
}

/**
 * Start the server
 */
async function start() {
  try {
    const app = await buildApp();

    await app.listen({
      port: config.port,
      host: config.host,
    });

    // Start background workers
    await startWorkers();

    // Log startup information
    app.log.info({
      message: 'Server started successfully',
      environment: config.nodeEnv,
      port: config.port,
      host: config.host,
    });

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        app.log.info(`Received ${signal}, shutting down gracefully...`);

        // Stop background workers
        await stopWorkers();

        // Close database connections
        await prisma.$disconnect();
        app.log.info('Database connection closed');

        // Close Redis connection
        await redis.quit();
        app.log.info('Redis connection closed');

        // Close Fastify server
        await app.close();
        app.log.info('Server closed successfully');

        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Cleanup function for tests and graceful shutdown
 * Removes all process event listeners to prevent memory leaks
 */
async function cleanup() {
  try {
    // Stop background workers
    await stopWorkers();

    // Close database connections
    await prisma.$disconnect();
    logger.info('Database connection closed');

    // Close Redis connection
    await redis.quit();
    logger.info('Redis connection closed');

    // Remove all process event listeners to prevent memory leaks
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('exit');
    process.removeAllListeners('uncaughtException');
    process.removeAllListeners('unhandledRejection');

    logger.info('Cleanup completed');
  } catch (error) {
    logger.error({ err: error }, 'Error during cleanup');
  }
}

// Start server if run directly (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  // Always start in development mode with tsx watch
  void start();
}

export { buildApp, start, cleanup };
