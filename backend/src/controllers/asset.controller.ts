/**
 * Asset Controller
 *
 * API endpoints for water infrastructure asset management
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { AssetType, AssetCondition, RiskLevel } from '@prisma/client';
import * as assetService from '../services/asset.service.js';
import { requireUser } from '../middleware/auth.js';

/**
 * POST /api/v1/assets
 * Create new asset
 */
export async function createAsset(
  request: FastifyRequest<{ Body: assetService.CreateAssetRequest }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    const asset = await assetService.createAsset(user, request.body, request);

    return reply.code(201).send({
      success: true,
      data: asset,
    });
  } catch (error) {
    request.log.error({ err: error }, 'Create asset error');
    return reply.code(500).send({
      success: false,
      error: 'Failed to create asset',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/v1/assets
 * List assets
 */
export async function listAssets(
  request: FastifyRequest<{
    Querystring: {
      type?: AssetType;
      condition?: AssetCondition;
      isCritical?: string;
      riskLevel?: RiskLevel;
      search?: string;
      limit?: string;
      offset?: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);

    const result = await assetService.listAssets(user, {
      type: request.query.type,
      condition: request.query.condition,
      isCritical:
        request.query.isCritical !== undefined ? request.query.isCritical === 'true' : undefined,
      riskLevel: request.query.riskLevel,
      search: request.query.search,
      limit: request.query.limit ? parseInt(request.query.limit) : undefined,
      offset: request.query.offset ? parseInt(request.query.offset) : undefined,
    });

    return reply.code(200).send({
      success: true,
      data: result,
    });
  } catch (error) {
    request.log.error({ err: error }, 'List assets error');
    return reply.code(500).send({
      success: false,
      error: 'Failed to list assets',
    });
  }
}

/**
 * GET /api/v1/assets/statistics
 * Get asset statistics
 */
export async function getAssetStatistics(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = requireUser(request);
    const stats = await assetService.getAssetStatistics(user);

    return reply.code(200).send({
      success: true,
      data: stats,
    });
  } catch (error) {
    request.log.error({ err: error }, 'Get asset statistics error');
    return reply.code(500).send({
      success: false,
      error: 'Failed to get asset statistics',
    });
  }
}

/**
 * GET /api/v1/assets/:id
 * Get asset by ID
 */
export async function getAsset(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    const asset = await assetService.getAsset(request.params.id, user);

    if (!asset) {
      return reply.code(404).send({
        success: false,
        error: 'Asset not found',
      });
    }

    return reply.code(200).send({
      success: true,
      data: asset,
    });
  } catch (error) {
    request.log.error({ err: error }, 'Get asset error');
    return reply.code(500).send({
      success: false,
      error: 'Failed to get asset',
    });
  }
}

/**
 * PATCH /api/v1/assets/:id
 * Update asset
 */
export async function updateAsset(
  request: FastifyRequest<{
    Params: { id: string };
    Body: assetService.UpdateAssetRequest;
  }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    const asset = await assetService.updateAsset(request.params.id, user, request.body, request);

    return reply.code(200).send({
      success: true,
      data: asset,
    });
  } catch (error) {
    request.log.error({ err: error }, 'Update asset error');
    return reply.code(500).send({
      success: false,
      error: 'Failed to update asset',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * DELETE /api/v1/assets/:id
 * Delete asset (soft delete)
 */
export async function deleteAsset(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    await assetService.deleteAsset(request.params.id, user, request);

    return reply.code(200).send({
      success: true,
      data: {
        message: 'Asset deleted successfully',
      },
    });
  } catch (error) {
    request.log.error({ err: error }, 'Delete asset error');
    return reply.code(500).send({
      success: false,
      error: 'Failed to delete asset',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/v1/assets/bulk-import
 * Bulk import assets from CSV
 */
export async function bulkImportAssets(
  request: FastifyRequest<{ Body: { assets: assetService.CreateAssetRequest[] } }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);

    if (!request.body.assets || !Array.isArray(request.body.assets)) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid request',
        message: 'Assets array is required',
      });
    }

    const result = await assetService.bulkImportAssets(user, request.body.assets, request);

    return reply.code(200).send({
      success: true,
      data: {
        message: `Imported ${result.created} assets`,
        created: result.created,
        errors: result.errors,
      },
    });
  } catch (error) {
    request.log.error({ err: error }, 'Bulk import assets error');
    return reply.code(500).send({
      success: false,
      error: 'Failed to import assets',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
