/**
 * Asset Routes
 *
 * Endpoints for managing water infrastructure assets
 */

import { FastifyInstance } from 'fastify';
import * as assetController from '../controllers/asset.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { ResourceType, Action } from '../types/auth.js';

export default async function assetRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);

  // Get asset statistics
  fastify.get('/statistics', {
    preHandler: [requirePermission(ResourceType.ASSET, Action.READ)],
    handler: assetController.getAssetStatistics,
  });

  // List assets
  fastify.get('/', {
    preHandler: [requirePermission(ResourceType.ASSET, Action.READ)],
    handler: assetController.listAssets,
  });

  // Create asset
  fastify.post('/', {
    preHandler: [requirePermission(ResourceType.ASSET, Action.CREATE)],
    handler: assetController.createAsset,
  });

  // Bulk import assets
  fastify.post('/bulk-import', {
    preHandler: [requirePermission(ResourceType.ASSET, Action.CREATE)],
    handler: assetController.bulkImportAssets,
  });

  // Get asset by ID
  fastify.get('/:id', {
    preHandler: [requirePermission(ResourceType.ASSET, Action.READ)],
    handler: assetController.getAsset,
  });

  // Update asset
  fastify.patch('/:id', {
    preHandler: [requirePermission(ResourceType.ASSET, Action.UPDATE)],
    handler: assetController.updateAsset,
  });

  // Delete asset
  fastify.delete('/:id', {
    preHandler: [requirePermission(ResourceType.ASSET, Action.DELETE)],
    handler: assetController.deleteAsset,
  });
}
