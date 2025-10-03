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
import { startWorkers, stopWorkers } from './workers/index.js';

// Type augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      organizationId: string;
      role: string;
    };
  }
}

/**
 * Build Fastify application with all plugins and routes
 */
async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: logger,
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

  // Rate Limiting - Prevent abuse
  await app.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.window,
    redis: config.redis, // Use Redis for distributed rate limiting
  });

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
  app.get('/health/db', async () => {
    try {
      // TODO: Add Prisma database health check
      // await prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', service: 'database' };
    } catch (error) {
      return { status: 'error', service: 'database', error: String(error) };
    }
  });

  app.get('/health/redis', async () => {
    try {
      // TODO: Add Redis health check
      // await redis.ping();
      return { status: 'ok', service: 'redis' };
    } catch (error) {
      return { status: 'error', service: 'redis', error: String(error) };
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
        await stopWorkers();
        await app.close();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  void start();
}

export { buildApp, start };
