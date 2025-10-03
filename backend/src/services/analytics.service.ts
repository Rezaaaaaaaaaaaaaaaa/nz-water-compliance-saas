/**
 * Analytics Service
 *
 * Provides data aggregation and analytics for dashboards
 */

import { PrismaClient, AssetCondition, RiskLevel, UserRole } from '@prisma/client';
import { logger } from '../config/logger.js';

const prisma = new PrismaClient();

/**
 * Get compliance overview statistics
 */
export async function getComplianceOverview(organizationId: string) {
  const [
    totalAssets,
    criticalAssets,
    activeDWSPs,
    pendingReports,
    overdueItems,
    recentIncidents,
  ] = await Promise.all([
    // Total assets
    prisma.asset.count({
      where: { organizationId, deletedAt: null },
    }),

    // Critical assets
    prisma.asset.count({
      where: {
        organizationId,
        deletedAt: null,
        OR: [{ isCritical: true }, { riskLevel: RiskLevel.CRITICAL }],
      },
    }),

    // Active DWSPs
    prisma.compliancePlan.count({
      where: {
        organizationId,
        deletedAt: null,
        type: 'DWSP',
        status: {
          in: ['APPROVED', 'IN_REVIEW'],
        },
      },
    }),

    // Pending reports
    prisma.compliancePlan.count({
      where: {
        organizationId,
        deletedAt: null,
        type: 'REPORT',
        status: 'DRAFT',
      },
    }),

    // Overdue items (compliance plans past target date)
    prisma.compliancePlan.count({
      where: {
        organizationId,
        deletedAt: null,
        targetDate: {
          lt: new Date(),
        },
        status: {
          not: 'APPROVED',
        },
      },
    }),

    // Recent incidents (last 30 days)
    prisma.compliancePlan.count({
      where: {
        organizationId,
        deletedAt: null,
        type: 'INCIDENT',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return {
    totalAssets,
    criticalAssets,
    activeDWSPs,
    pendingReports,
    overdueItems,
    recentIncidents,
    complianceScore: calculateComplianceScore({
      totalAssets,
      criticalAssets,
      activeDWSPs,
      overdueItems,
    }),
  };
}

/**
 * Calculate overall compliance score (0-100)
 */
function calculateComplianceScore(data: {
  totalAssets: number;
  criticalAssets: number;
  activeDWSPs: number;
  overdueItems: number;
}): number {
  let score = 100;

  // Deduct points for missing DWSP
  if (data.activeDWSPs === 0) {
    score -= 40; // Major compliance issue
  }

  // Deduct points for overdue items
  score -= Math.min(data.overdueItems * 5, 30);

  // Deduct points for too many critical assets (indicates poor maintenance)
  if (data.totalAssets > 0) {
    const criticalRatio = data.criticalAssets / data.totalAssets;
    if (criticalRatio > 0.3) {
      score -= Math.min((criticalRatio - 0.3) * 100, 20);
    }
  }

  return Math.max(Math.round(score), 0);
}

/**
 * Get asset statistics and trends
 */
export async function getAssetAnalytics(organizationId: string) {
  // Assets by risk level
  const assetsByRisk = await prisma.asset.groupBy({
    by: ['riskLevel'],
    where: { organizationId, deletedAt: null },
    _count: true,
  });

  // Assets by condition
  const assetsByCondition = await prisma.asset.groupBy({
    by: ['condition'],
    where: { organizationId, deletedAt: null },
    _count: true,
  });

  // Assets by type
  const assetsByType = await prisma.asset.groupBy({
    by: ['type'],
    where: { organizationId, deletedAt: null },
    _count: true,
  });

  // Critical assets requiring attention
  const criticalAssets = await prisma.asset.findMany({
    where: {
      organizationId,
      deletedAt: null,
      OR: [
        { isCritical: true },
        { riskLevel: RiskLevel.CRITICAL },
        { condition: AssetCondition.VERY_POOR },
      ],
    },
    select: {
      id: true,
      name: true,
      type: true,
      condition: true,
      riskLevel: true,
      lastInspectionDate: true,
    },
    orderBy: {
      riskLevel: 'desc',
    },
    take: 10,
  });

  return {
    byRiskLevel: assetsByRisk.map((r) => ({
      riskLevel: r.riskLevel,
      count: r._count,
    })),
    byCondition: assetsByCondition.map((c) => ({
      condition: c.condition,
      count: c._count,
    })),
    byType: assetsByType.map((t) => ({
      type: t.type,
      count: t._count,
    })),
    criticalAssets,
  };
}

/**
 * Get document statistics
 */
export async function getDocumentAnalytics(organizationId: string) {
  const [totalDocuments, documentsByType, recentUploads, storageUsed] = await Promise.all([
    // Total documents
    prisma.document.count({
      where: { organizationId, deletedAt: null },
    }),

    // Documents by type
    prisma.document.groupBy({
      by: ['type'],
      where: { organizationId, deletedAt: null },
      _count: true,
    }),

    // Recent uploads (last 30 days)
    prisma.document.count({
      where: {
        organizationId,
        deletedAt: null,
        uploadedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    // Approximate storage used (sum of file sizes)
    prisma.document.aggregate({
      where: { organizationId, deletedAt: null },
      _sum: {
        fileSize: true,
      },
    }),
  ]);

  return {
    totalDocuments,
    byType: documentsByType.map((d) => ({
      type: d.type,
      count: d._count,
    })),
    recentUploads,
    storageUsedBytes: storageUsed._sum.fileSize || 0,
    storageUsedMB: Math.round((storageUsed._sum.fileSize || 0) / (1024 * 1024)),
  };
}

/**
 * Get compliance activity timeline (last 90 days)
 */
export async function getActivityTimeline(organizationId: string, days: number = 90) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const activities = await prisma.auditLog.findMany({
    where: {
      organizationId,
      timestamp: {
        gte: startDate,
      },
      action: {
        in: [
          'DWSP_CREATED',
          'DWSP_SUBMITTED',
          'REPORT_GENERATED',
          'ASSET_CREATED',
          'DOCUMENT_UPLOADED',
          'COMPLIANCE_VIOLATION',
        ],
      },
    },
    select: {
      timestamp: true,
      action: true,
      resourceType: true,
    },
    orderBy: {
      timestamp: 'desc',
    },
  });

  // Group by week
  const weeklyActivity = activities.reduce((acc, activity) => {
    const week = getWeekKey(activity.timestamp);
    if (!acc[week]) {
      acc[week] = { week, count: 0, actions: {} };
    }
    acc[week].count++;
    acc[week].actions[activity.action] = (acc[week].actions[activity.action] || 0) + 1;
    return acc;
  }, {} as Record<string, { week: string; count: number; actions: Record<string, number> }>);

  return {
    timeline: Object.values(weeklyActivity).sort((a, b) => a.week.localeCompare(b.week)),
    totalActivities: activities.length,
  };
}

/**
 * Get week key for grouping (YYYY-Www)
 */
function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get DWSP submission trends (last 12 months)
 */
export async function getDWSPTrends(organizationId: string) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);

  const submissions = await prisma.compliancePlan.findMany({
    where: {
      organizationId,
      type: 'DWSP',
      submittedAt: {
        gte: startDate,
      },
    },
    select: {
      submittedAt: true,
      status: true,
    },
  });

  // Group by month
  const monthlySubmissions = submissions.reduce((acc, sub) => {
    if (sub.submittedAt) {
      const month = getMonthKey(sub.submittedAt);
      if (!acc[month]) {
        acc[month] = { month, total: 0, approved: 0, rejected: 0 };
      }
      acc[month].total++;
      if (sub.status === 'APPROVED') acc[month].approved++;
      if (sub.status === 'REJECTED') acc[month].rejected++;
    }
    return acc;
  }, {} as Record<string, { month: string; total: number; approved: number; rejected: number }>);

  return {
    trends: Object.values(monthlySubmissions).sort((a, b) => a.month.localeCompare(b.month)),
  };
}

/**
 * Get month key (YYYY-MM)
 */
function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get user activity summary
 */
export async function getUserActivitySummary(organizationId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [activeUsers, topContributors] = await Promise.all([
    // Users with activity in last 30 days
    prisma.auditLog
      .groupBy({
        by: ['userId'],
        where: {
          organizationId,
          timestamp: {
            gte: thirtyDaysAgo,
          },
        },
        _count: true,
      })
      .then((results) => results.length),

    // Top contributors
    prisma.auditLog
      .groupBy({
        by: ['userId'],
        where: {
          organizationId,
          timestamp: {
            gte: thirtyDaysAgo,
          },
        },
        _count: true,
        orderBy: {
          _count: {
            userId: 'desc',
          },
        },
        take: 5,
      })
      .then(async (results) => {
        const userIds = results.map((r) => r.userId);
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        });

        return results.map((r) => {
          const user = users.find((u) => u.id === r.userId);
          return {
            userId: r.userId,
            userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
            activityCount: r._count,
          };
        });
      }),
  ]);

  return {
    activeUsersLast30Days: activeUsers,
    topContributors,
  };
}

/**
 * Get comprehensive dashboard data
 */
export async function getDashboardData(organizationId: string) {
  const [overview, assetAnalytics, documentAnalytics, timeline, dwspTrends, userActivity] =
    await Promise.all([
      getComplianceOverview(organizationId),
      getAssetAnalytics(organizationId),
      getDocumentAnalytics(organizationId),
      getActivityTimeline(organizationId, 90),
      getDWSPTrends(organizationId),
      getUserActivitySummary(organizationId),
    ]);

  return {
    overview,
    assets: assetAnalytics,
    documents: documentAnalytics,
    activity: timeline,
    dwspTrends,
    users: userActivity,
    generatedAt: new Date(),
  };
}

/**
 * Get system-wide analytics (for System Admin)
 */
export async function getSystemAnalytics() {
  const [
    totalOrganizations,
    totalUsers,
    totalAssets,
    totalDocuments,
    activeDWSPs,
    systemStorage,
  ] = await Promise.all([
    prisma.organization.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.asset.count({ where: { deletedAt: null } }),
    prisma.document.count({ where: { deletedAt: null } }),
    prisma.compliancePlan.count({
      where: {
        type: 'DWSP',
        status: { in: ['APPROVED', 'IN_REVIEW'] },
        deletedAt: null,
      },
    }),
    prisma.document.aggregate({
      _sum: { fileSize: true },
      where: { deletedAt: null },
    }),
  ]);

  // Organizations by DWSP status
  const orgs = await prisma.organization.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          compliancePlans: {
            where: {
              type: 'DWSP',
              status: 'APPROVED',
              deletedAt: null,
            },
          },
        },
      },
    },
  });

  const orgsWithDWSP = orgs.filter((org) => org._count.compliancePlans > 0).length;
  const orgsWithoutDWSP = orgs.filter((org) => org._count.compliancePlans === 0).length;

  return {
    totalOrganizations,
    totalUsers,
    totalAssets,
    totalDocuments,
    activeDWSPs,
    systemStorageGB: Math.round((systemStorage._sum.fileSize || 0) / (1024 * 1024 * 1024)),
    organizationsWithDWSP: orgsWithDWSP,
    organizationsWithoutDWSP: orgsWithoutDWSP,
    complianceRate: totalOrganizations > 0 ? (orgsWithDWSP / totalOrganizations) * 100 : 0,
  };
}
