/**
 * Monitoring Routes
 *
 * Endpoints for monitoring system health, queues, and workers
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { ResourceType, Action } from '../types/auth.js';
import { getAllQueueStats } from '../services/queue.service.js';
import { getWorkerStatus } from '../workers/index.js';
import * as cacheService from '../services/cache.service.js';

const prisma = new PrismaClient();

export default async function monitoringRoutes(fastify: FastifyInstance) {
  // All routes require authentication and admin permission
  fastify.addHook('preHandler', authenticate);

  /**
   * GET /api/v1/monitoring/queues
   * Get queue statistics
   */
  fastify.get(
    '/queues',
    {
      preHandler: [requirePermission(ResourceType.ORGANIZATION, Action.AUDIT)],
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const stats = await getAllQueueStats();

          return reply.code(200).send({
            queues: stats,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          request.log.error({ err: error }, 'Get queue stats error');
          return reply.code(500).send({
            error: 'Failed to get queue statistics',
          });
        }
      },
    }
  );

  /**
   * GET /api/v1/monitoring/workers
   * Get worker health status
   */
  fastify.get(
    '/workers',
    {
      preHandler: [requirePermission(ResourceType.ORGANIZATION, Action.AUDIT)],
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const workers = getWorkerStatus();

          return reply.code(200).send({
            workers,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          request.log.error({ err: error }, 'Get worker status error');
          return reply.code(500).send({
            error: 'Failed to get worker status',
          });
        }
      },
    }
  );

  /**
   * GET /api/v1/monitoring/system
   * Get overall system health
   */
  fastify.get(
    '/system',
    {
      preHandler: [requirePermission(ResourceType.ORGANIZATION, Action.AUDIT)],
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const [queueStats, workerStatus] = await Promise.all([
            getAllQueueStats(),
            Promise.resolve(getWorkerStatus()),
          ]);

          const totalQueued = queueStats.reduce((sum, q) => sum + q.total, 0);
          const totalFailed = queueStats.reduce((sum, q) => sum + q.failed, 0);
          const allWorkersRunning = workerStatus.every((w) => w.isRunning);

          return reply.code(200).send({
            status: allWorkersRunning && totalFailed === 0 ? 'healthy' : 'degraded',
            queues: {
              total: queueStats.length,
              totalQueued,
              totalFailed,
              details: queueStats,
            },
            workers: {
              total: workerStatus.length,
              running: workerStatus.filter((w) => w.isRunning).length,
              paused: workerStatus.filter((w) => w.isPaused).length,
              details: workerStatus,
            },
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          request.log.error({ err: error }, 'Get system health error');
          return reply.code(500).send({
            error: 'Failed to get system health',
          });
        }
      },
    }
  );

  /**
   * GET /api/v1/monitoring/cache
   * Get cache statistics
   */
  fastify.get(
    '/cache',
    {
      preHandler: [requirePermission(ResourceType.ORGANIZATION, Action.AUDIT)],
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const stats = await cacheService.getCacheStats();

          return reply.code(200).send({
            cache: stats,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          request.log.error({ err: error }, 'Get cache stats error');
          return reply.code(500).send({
            error: 'Failed to get cache statistics',
          });
        }
      },
    }
  );

  /**
   * GET /api/v1/monitoring/phase2
   * Get Phase 2 feature usage statistics
   */
  fastify.get(
    '/phase2',
    {
      preHandler: [requirePermission(ResourceType.ORGANIZATION, Action.AUDIT)],
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

          // Get Phase 2 feature usage stats
          const [
            complianceScoreRecords,
            analyticsViews,
            exportOperations,
            emailsSent,
          ] = await Promise.all([
            // Compliance score calculations (last 30 days)
            prisma.auditLog.count({
              where: {
                action: 'CALCULATE_COMPLIANCE_SCORE',
                timestamp: { gte: thirtyDaysAgo },
              },
            }),
            // Analytics dashboard views (last 30 days)
            prisma.auditLog.count({
              where: {
                action: 'VIEW_ANALYTICS',
                timestamp: { gte: thirtyDaysAgo },
              },
            }),
            // Export operations (last 30 days)
            prisma.auditLog.count({
              where: {
                action: { contains: 'EXPORT' },
                timestamp: { gte: thirtyDaysAgo },
              },
            }),
            // Emails sent (last 30 days)
            prisma.auditLog.count({
              where: {
                action: 'SEND_EMAIL',
                timestamp: { gte: thirtyDaysAgo },
              },
            }),
          ]);

          // Calculate cache effectiveness
          const cacheStats = await cacheService.getCacheStats();
          const cacheHitRate = parseFloat(cacheStats.hitRate?.replace('%', '') || '0');

          return reply.code(200).send({
            phase2Features: {
              complianceScoring: {
                calculationsLast30Days: complianceScoreRecords,
                averagePerDay: Math.round(complianceScoreRecords / 30),
              },
              analytics: {
                viewsLast30Days: analyticsViews,
                averagePerDay: Math.round(analyticsViews / 30),
                cacheHitRate: `${cacheHitRate.toFixed(1)}%`,
                cacheEffectiveness: cacheHitRate > 70 ? 'excellent' : cacheHitRate > 50 ? 'good' : 'poor',
              },
              exports: {
                operationsLast30Days: exportOperations,
                averagePerDay: Math.round(exportOperations / 30),
              },
              emailNotifications: {
                sentLast30Days: emailsSent,
                averagePerDay: Math.round(emailsSent / 30),
              },
            },
            performance: {
              cacheEnabled: true,
              retryLogicEnabled: true,
              rateLimitingEnabled: true,
              validationEnabled: true,
            },
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          request.log.error({ err: error }, 'Get Phase 2 stats error');
          return reply.code(500).send({
            error: 'Failed to get Phase 2 statistics',
          });
        }
      },
    }
  );
}
