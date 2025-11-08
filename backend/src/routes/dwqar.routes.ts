/**
 * DWQAR Routes
 *
 * API routes for DWQAR (Drinking Water Quality Assurance Rules) reporting workflow
 */

import { FastifyInstance } from 'fastify';
import * as dwqarController from '../controllers/dwqar.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateQuery, validateBody } from '../middleware/validation.middleware.js';
import { z } from 'zod';

export async function dwqarRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', authenticate);

  // Apply rate limiting for DWQAR operations
  const dwqarRateLimit = {
    max: 20, // 20 requests
    timeWindow: '15 minutes',
    keyGenerator: (request: import('fastify').FastifyRequest) =>
      (request as import('fastify').FastifyRequest & { user?: { id: string } }).user?.id || request.ip,
  };

  // Validation schemas
  const periodQuerySchema = z.object({
    period: z
      .string()
      .regex(/^\d{4}-(Annual|Q[1-4])$/)
      .optional(),
  });

  const validateQuerySchema = z.object({
    organizationId: z.string().cuid(),
    period: z.string().regex(/^\d{4}-(Annual|Q[1-4])$/),
  });

  const exportQuerySchema = z.object({
    period: z.string().regex(/^\d{4}-(Annual|Q[1-4])$/),
  });

  const submitBodySchema = z.object({
    period: z.string().regex(/^\d{4}-(Annual|Q[1-4])$/),
    hinekōrakoId: z.string().min(1),
    confirmationPdf: z.string().optional(), // Base64 encoded PDF
  });

  /**
   * GET /api/dwqar/current
   * Get current DWQAR report status for the organization
   */
  app.get('/current', {
    preHandler: [validateQuery(periodQuerySchema)],
    config: { rateLimit: dwqarRateLimit },
    handler: dwqarController.getCurrentStatus,
  });

  /**
   * POST /api/dwqar/validate
   * Validate DWQAR report before export
   */
  app.post('/validate', {
    preHandler: [validateBody(validateQuerySchema)],
    config: { rateLimit: dwqarRateLimit },
    handler: dwqarController.validateReport,
  });

  /**
   * GET /api/dwqar/export
   * Generate Excel export matching official DWQAR template
   */
  app.get('/export', {
    preHandler: [validateQuery(exportQuerySchema)],
    config: { rateLimit: dwqarRateLimit },
    handler: dwqarController.exportExcel,
  });

  /**
   * POST /api/dwqar/submit
   * Record DWQAR submission to Hinekōrako
   */
  app.post('/submit', {
    preHandler: [validateBody(submitBodySchema)],
    config: { rateLimit: dwqarRateLimit },
    handler: dwqarController.recordSubmission,
  });

  /**
   * GET /api/dwqar/history
   * Get submission history for all past reporting periods
   */
  app.get('/history', {
    config: { rateLimit: dwqarRateLimit },
    handler: dwqarController.getSubmissionHistory,
  });

  /**
   * GET /api/dwqar/aggregation/:period
   * Get aggregated data for a specific reporting period
   */
  app.get('/aggregation/:period', {
    config: { rateLimit: dwqarRateLimit },
    handler: dwqarController.getAggregation,
  });

  /**
   * GET /api/dwqar/completeness
   * Get completeness report for current period
   */
  app.get('/completeness', {
    preHandler: [validateQuery(periodQuerySchema)],
    config: { rateLimit: dwqarRateLimit },
    handler: dwqarController.getCompleteness,
  });
}
