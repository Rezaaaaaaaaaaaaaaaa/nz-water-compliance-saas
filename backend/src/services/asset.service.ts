/**
 * Asset Service
 *
 * Business logic for managing water infrastructure assets
 * Required for Asset Management Plans and DWSP compliance
 */

import { AssetType, AssetCondition, RiskLevel } from '@prisma/client';
import { AuthenticatedUser } from '../types/auth.js';
import * as auditService from './audit.service.js';
import { prisma } from '../config/database.js';

export interface CreateAssetRequest {
  name: string;
  type: AssetType;
  description?: string;
  assetCode?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  installationDate?: string;
  expectedLife?: number;
  replacementValue?: number;
  condition?: AssetCondition;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  isCritical?: boolean;
  riskLevel?: RiskLevel;
  metadata?: any;
}

export interface UpdateAssetRequest extends Partial<CreateAssetRequest> {}

export interface AssetFilters {
  type?: AssetType;
  condition?: AssetCondition;
  isCritical?: boolean;
  riskLevel?: RiskLevel;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Calculate risk level based on asset criticality and condition
 * Simple algorithm - you should customize based on regulatory requirements
 */
export function calculateRiskLevel(isCritical: boolean, condition: AssetCondition): RiskLevel {
  if (isCritical) {
    // Critical assets
    switch (condition) {
      case AssetCondition.VERY_POOR:
      case AssetCondition.POOR:
        return RiskLevel.CRITICAL;
      case AssetCondition.FAIR:
        return RiskLevel.HIGH;
      case AssetCondition.GOOD:
        return RiskLevel.MEDIUM;
      default:
        return RiskLevel.LOW;
    }
  } else {
    // Non-critical assets
    switch (condition) {
      case AssetCondition.VERY_POOR:
        return RiskLevel.HIGH;
      case AssetCondition.POOR:
        return RiskLevel.MEDIUM;
      default:
        return RiskLevel.LOW;
    }
  }
}

/**
 * Create new asset
 */
export async function createAsset(user: AuthenticatedUser, data: CreateAssetRequest, request: any) {
  // Calculate risk level if not provided
  const riskLevel =
    data.riskLevel ||
    calculateRiskLevel(data.isCritical || false, data.condition || AssetCondition.UNKNOWN);

  const asset = await prisma.asset.create({
    data: {
      organizationId: user.organizationId,
      name: data.name,
      type: data.type,
      description: data.description,
      assetCode: data.assetCode,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      installationDate: data.installationDate ? new Date(data.installationDate) : null,
      expectedLife: data.expectedLife,
      replacementValue: data.replacementValue,
      condition: data.condition || AssetCondition.UNKNOWN,
      lastInspectionDate: data.lastInspectionDate ? new Date(data.lastInspectionDate) : null,
      nextInspectionDate: data.nextInspectionDate ? new Date(data.nextInspectionDate) : null,
      isCritical: data.isCritical || false,
      riskLevel,
      metadata: data.metadata,
    },
  });

  // Audit log
  await auditService.auditCreate(user, 'Asset', asset.id, asset, request);

  return asset;
}

/**
 * Get asset by ID
 */
export async function getAsset(id: string, user: AuthenticatedUser) {
  const asset = await prisma.asset.findFirst({
    where: {
      id,
      deletedAt: null,
      // User can only access their org's assets (unless Auditor/Admin)
      ...(user.role !== 'AUDITOR' && user.role !== 'SYSTEM_ADMIN'
        ? { organizationId: user.organizationId }
        : {}),
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      documents: {
        where: { document: { deletedAt: null } },
        include: {
          document: {
            select: {
              id: true,
              title: true,
              documentType: true,
              version: true,
              createdAt: true,
            },
          },
        },
      },
      compliancePlans: {
        where: { compliancePlan: { deletedAt: null } },
        include: {
          compliancePlan: {
            select: {
              id: true,
              title: true,
              planType: true,
              status: true,
            },
          },
        },
      },
    },
  });

  return asset;
}

/**
 * List assets for organization
 */
export async function listAssets(user: AuthenticatedUser, filters: AssetFilters) {
  const where: any = {
    deletedAt: null,
  };

  // Filter by organization (unless Auditor/Admin)
  if (user.role !== 'AUDITOR' && user.role !== 'SYSTEM_ADMIN') {
    where.organizationId = user.organizationId;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.condition) {
    where.condition = filters.condition;
  }

  if (filters.isCritical !== undefined) {
    where.isCritical = filters.isCritical;
  }

  if (filters.riskLevel) {
    where.riskLevel = filters.riskLevel;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { assetCode: { contains: filters.search, mode: 'insensitive' } },
      { address: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      take: filters.limit || 50,
      skip: filters.offset || 0,
      orderBy: [
        { isCritical: 'desc' }, // Critical assets first
        { riskLevel: 'desc' }, // High risk first
        { createdAt: 'desc' },
      ],
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.asset.count({ where }),
  ]);

  return {
    assets,
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  };
}

/**
 * Update asset
 */
export async function updateAsset(
  id: string,
  user: AuthenticatedUser,
  data: UpdateAssetRequest,
  request: any
) {
  // Get existing asset
  const existing = await getAsset(id, user);
  if (!existing) {
    throw new Error('Asset not found');
  }

  // Recalculate risk level if criticality or condition changed
  let riskLevel = data.riskLevel;
  if (!riskLevel && (data.isCritical !== undefined || data.condition !== undefined)) {
    riskLevel = calculateRiskLevel(
      data.isCritical ?? existing.isCritical,
      data.condition ?? existing.condition
    );
  }

  const updated = await prisma.asset.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      description: data.description,
      assetCode: data.assetCode,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      installationDate: data.installationDate ? new Date(data.installationDate) : undefined,
      expectedLife: data.expectedLife,
      replacementValue: data.replacementValue,
      condition: data.condition,
      lastInspectionDate: data.lastInspectionDate ? new Date(data.lastInspectionDate) : undefined,
      nextInspectionDate: data.nextInspectionDate ? new Date(data.nextInspectionDate) : undefined,
      isCritical: data.isCritical,
      riskLevel,
      metadata: data.metadata,
      updatedAt: new Date(),
    },
  });

  // Audit log
  await auditService.auditUpdate(user, 'Asset', id, existing, updated, request);

  return updated;
}

/**
 * Delete asset (soft delete)
 */
export async function deleteAsset(id: string, user: AuthenticatedUser, request: any) {
  const asset = await getAsset(id, user);
  if (!asset) {
    throw new Error('Asset not found');
  }

  const deleted = await prisma.asset.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  // Audit log
  await auditService.auditDelete(user, 'Asset', id, asset, request, 'Asset soft deleted');

  return deleted;
}

/**
 * Get asset condition statistics for organization
 */
export async function getAssetStatistics(user: AuthenticatedUser) {
  const where: any = {
    deletedAt: null,
  };

  // Filter by organization (unless Auditor/Admin)
  if (user.role !== 'AUDITOR' && user.role !== 'SYSTEM_ADMIN') {
    where.organizationId = user.organizationId;
  }

  const [total, critical, byCondition, byType, byRiskLevel, needingInspection] = await Promise.all([
    // Total assets
    prisma.asset.count({ where }),

    // Critical assets
    prisma.asset.count({ where: { ...where, isCritical: true } }),

    // By condition
    prisma.asset.groupBy({
      by: ['condition'],
      where,
      _count: true,
    }),

    // By type
    prisma.asset.groupBy({
      by: ['type'],
      where,
      _count: true,
    }),

    // By risk level
    prisma.asset.groupBy({
      by: ['riskLevel'],
      where,
      _count: true,
    }),

    // Needing inspection (next inspection date in past)
    prisma.asset.count({
      where: {
        ...where,
        nextInspectionDate: {
          lte: new Date(),
        },
      },
    }),
  ]);

  return {
    total,
    critical,
    byCondition,
    byType,
    byRiskLevel,
    needingInspection,
  };
}

/**
 * Bulk import assets from CSV
 * Returns { created: number, errors: array }
 */
export async function bulkImportAssets(
  user: AuthenticatedUser,
  assets: CreateAssetRequest[],
  request: any
) {
  const results = {
    created: 0,
    errors: [] as Array<{ row: number; error: string }>,
  };

  for (let i = 0; i < assets.length; i++) {
    try {
      await createAsset(user, assets[i], request);
      results.created++;
    } catch (error) {
      results.errors.push({
        row: i + 1,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}
