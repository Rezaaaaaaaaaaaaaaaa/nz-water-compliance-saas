/**
 * Document Routes
 *
 * Endpoints for document management with S3 presigned URLs
 */

import { FastifyInstance } from 'fastify';
import * as documentController from '../controllers/document.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { ResourceType, Action } from '../types/auth.js';

export default async function documentRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);

  // Request upload URL
  fastify.post('/upload-url', {
    preHandler: [requirePermission(ResourceType.DOCUMENT, Action.CREATE)],
    handler: documentController.requestUploadUrl,
  });

  // List documents
  fastify.get('/', {
    preHandler: [requirePermission(ResourceType.DOCUMENT, Action.READ)],
    handler: documentController.listDocuments,
  });

  // Create document record
  fastify.post('/', {
    preHandler: [requirePermission(ResourceType.DOCUMENT, Action.CREATE)],
    handler: documentController.createDocument,
  });

  // Get document by ID
  fastify.get('/:id', {
    preHandler: [requirePermission(ResourceType.DOCUMENT, Action.READ)],
    handler: documentController.getDocument,
  });

  // Get download URL
  fastify.get('/:id/download', {
    preHandler: [requirePermission(ResourceType.DOCUMENT, Action.EXPORT)],
    handler: documentController.getDownloadUrl,
  });

  // Link document to asset
  fastify.post('/:id/link-asset', {
    preHandler: [requirePermission(ResourceType.DOCUMENT, Action.UPDATE)],
    handler: documentController.linkToAsset,
  });

  // Link document to compliance plan
  fastify.post('/:id/link-compliance-plan', {
    preHandler: [requirePermission(ResourceType.DOCUMENT, Action.UPDATE)],
    handler: documentController.linkToCompliancePlan,
  });

  // Delete document (soft delete)
  fastify.delete('/:id', {
    preHandler: [requirePermission(ResourceType.DOCUMENT, Action.DELETE)],
    handler: documentController.deleteDocument,
  });
}
