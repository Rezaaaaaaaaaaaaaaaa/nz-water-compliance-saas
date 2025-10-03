/**
 * DWSP (Drinking Water Safety Plan) Routes
 *
 * Endpoints for managing DWSPs according to Taumata Arowai requirements
 */

import { FastifyInstance } from 'fastify';
import * as dwspController from '../controllers/dwsp.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission, requireComplianceManager } from '../middleware/rbac.js';
import { ResourceType, Action } from '../types/auth.js';

export default async function dwspRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);

  // List DWSPs
  fastify.get('/', {
    preHandler: [requirePermission(ResourceType.COMPLIANCE_PLAN, Action.READ)],
    handler: dwspController.listDWSPs,
  });

  // Create DWSP
  fastify.post('/', {
    preHandler: [requirePermission(ResourceType.COMPLIANCE_PLAN, Action.CREATE)],
    handler: dwspController.createDWSP,
  });

  // Get DWSP by ID
  fastify.get('/:id', {
    preHandler: [requirePermission(ResourceType.COMPLIANCE_PLAN, Action.READ)],
    handler: dwspController.getDWSP,
  });

  // Update DWSP
  fastify.patch('/:id', {
    preHandler: [requirePermission(ResourceType.COMPLIANCE_PLAN, Action.UPDATE)],
    handler: dwspController.updateDWSP,
  });

  // Validate DWSP
  fastify.get('/:id/validate', {
    preHandler: [requirePermission(ResourceType.COMPLIANCE_PLAN, Action.READ)],
    handler: dwspController.validateDWSP,
  });

  // Approve DWSP (Compliance Manager or above)
  fastify.post('/:id/approve', {
    preHandler: [
      requireComplianceManager(),
      requirePermission(ResourceType.COMPLIANCE_PLAN, Action.APPROVE),
    ],
    handler: dwspController.approveDWSP,
  });

  // Submit DWSP to Taumata Arowai (Compliance Manager only - regulatory requirement)
  fastify.post('/:id/submit', {
    preHandler: [
      requireComplianceManager(),
      requirePermission(ResourceType.COMPLIANCE_PLAN, Action.SUBMIT),
    ],
    handler: dwspController.submitDWSP,
  });

  // Delete DWSP
  fastify.delete('/:id', {
    preHandler: [requirePermission(ResourceType.COMPLIANCE_PLAN, Action.DELETE)],
    handler: dwspController.deleteDWSP,
  });
}
