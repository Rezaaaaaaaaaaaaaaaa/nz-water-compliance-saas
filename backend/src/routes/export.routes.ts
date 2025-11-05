/**
 * Export Routes
 *
 * API routes for data export functionality
 */

import { FastifyInstance } from 'fastify';
import * as exportController from '../controllers/export.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateQuery, CommonSchemas } from '../middleware/validation.middleware.js';
import { z } from 'zod';

export async function exportRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', authenticate);

  // Apply stricter rate limiting for exports (resource-intensive)
  const exportRateLimit = {
    max: 10, // 10 requests
    timeWindow: '15 minutes',
    keyGenerator: (request: any) => request.user?.id || request.ip,
  };

  // Validation schemas
  const exportQuerySchema = z.object({
    format: CommonSchemas.exportFormat,
  });

  const auditLogsQuerySchema = z.object({
    format: CommonSchemas.exportFormat,
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().min(1).max(50000))
      .optional(),
  });

  // Export assets
  app.get('/assets', {
    preHandler: [validateQuery(exportQuerySchema)],
    config: { rateLimit: exportRateLimit },
    handler: exportController.exportAssets,
  });

  // Export documents
  app.get('/documents', {
    preHandler: [validateQuery(exportQuerySchema)],
    config: { rateLimit: exportRateLimit },
    handler: exportController.exportDocuments,
  });

  // Export compliance plans
  app.get('/compliance-plans', {
    preHandler: [validateQuery(exportQuerySchema)],
    config: { rateLimit: exportRateLimit },
    handler: exportController.exportCompliancePlans,
  });

  // Export audit logs
  app.get('/audit-logs', {
    preHandler: [validateQuery(auditLogsQuerySchema)],
    config: { rateLimit: exportRateLimit },
    handler: exportController.exportAuditLogs,
  });

  // Export compliance overview report
  app.get('/compliance-overview', {
    preHandler: [validateQuery(exportQuerySchema)],
    config: { rateLimit: exportRateLimit },
    handler: exportController.exportComplianceOverview,
  });
}
