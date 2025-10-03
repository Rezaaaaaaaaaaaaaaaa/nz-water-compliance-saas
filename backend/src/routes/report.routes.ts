/**
 * Report Routes
 *
 * Endpoints for regulatory reporting
 */

import { FastifyInstance } from 'fastify';
import * as reportController from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { ResourceType, Action } from '../types/auth.js';

export default async function reportRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);

  // List reports
  fastify.get('/', {
    preHandler: [requirePermission(ResourceType.REPORT, Action.READ)],
    handler: reportController.listReports,
  });

  // Create report
  fastify.post('/', {
    preHandler: [requirePermission(ResourceType.REPORT, Action.CREATE)],
    handler: reportController.createReport,
  });

  // Generate monthly report
  fastify.get('/generate/monthly', {
    preHandler: [requirePermission(ResourceType.REPORT, Action.CREATE)],
    handler: reportController.generateMonthlyReport,
  });

  // Generate quarterly report
  fastify.get('/generate/quarterly', {
    preHandler: [requirePermission(ResourceType.REPORT, Action.CREATE)],
    handler: reportController.generateQuarterlyReport,
  });

  // Generate annual report
  fastify.get('/generate/annual', {
    preHandler: [requirePermission(ResourceType.REPORT, Action.CREATE)],
    handler: reportController.generateAnnualReport,
  });

  // Get report by ID
  fastify.get('/:id', {
    preHandler: [requirePermission(ResourceType.REPORT, Action.READ)],
    handler: reportController.getReport,
  });

  // Submit report to Taumata Arowai
  fastify.post('/:id/submit', {
    preHandler: [requirePermission(ResourceType.REPORT, Action.SUBMIT)],
    handler: reportController.submitReport,
  });

  // Delete report
  fastify.delete('/:id', {
    preHandler: [requirePermission(ResourceType.REPORT, Action.DELETE)],
    handler: reportController.deleteReport,
  });
}
