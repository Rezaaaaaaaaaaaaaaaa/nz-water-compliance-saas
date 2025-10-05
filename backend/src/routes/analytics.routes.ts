/**
 * Analytics Routes
 *
 * API routes for analytics and dashboard data
 */

import { FastifyInstance } from 'fastify';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateQuery } from '../middleware/validation.middleware.js';
import { z } from 'zod';

export async function analyticsRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', authenticate);

  // Validation schemas for analytics endpoints
  const dateRangeQuerySchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1)).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional(),
  });

  // Get comprehensive dashboard data
  app.get('/dashboard', analyticsController.getDashboard);

  // Get compliance overview
  app.get('/compliance/overview', analyticsController.getComplianceOverview);

  // Get asset analytics
  app.get('/assets', analyticsController.getAssetAnalytics);

  // Get document analytics
  app.get('/documents', analyticsController.getDocumentAnalytics);

  // Get activity timeline (with date range validation)
  app.get('/activity', {
    preHandler: [validateQuery(dateRangeQuerySchema)],
    handler: analyticsController.getActivityTimeline,
  });

  // Get DWSP trends (with date range validation)
  app.get('/dwsp-trends', {
    preHandler: [validateQuery(dateRangeQuerySchema)],
    handler: analyticsController.getDWSPTrends,
  });

  // Get user activity summary
  app.get('/users', analyticsController.getUserActivitySummary);

  // Get system-wide analytics (System Admin only)
  app.get('/system', analyticsController.getSystemAnalytics);
}
