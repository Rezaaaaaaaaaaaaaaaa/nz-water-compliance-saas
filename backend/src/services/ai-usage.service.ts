/**
 * AI Usage Tracking & Quota Management Service
 *
 * Tracks AI API usage, enforces rate limits, and manages monthly quotas
 * to control costs and ensure fair usage across organizations.
 */

import { PrismaClient, AIFeature } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Pricing configuration for Claude API
 * Claude 3.5 Sonnet pricing (as of 2024)
 */
const PRICING = {
  INPUT_PER_MILLION: 3.0, // $3 per million input tokens
  OUTPUT_PER_MILLION: 15.0, // $15 per million output tokens
};

/**
 * Default quota tiers
 */
const QUOTA_TIERS = {
  FREE: {
    maxRequests: 100,
    maxTokens: 100000,
    maxCostCents: 1000, // $10
    maxChatRequests: 50,
    maxDocumentAnalyses: 20,
    maxWaterQualityAnalyses: 20,
    maxReportGenerations: 10,
  },
  BASIC: {
    maxRequests: 500,
    maxTokens: 500000,
    maxCostCents: 5000, // $50
    maxChatRequests: 250,
    maxDocumentAnalyses: 100,
    maxWaterQualityAnalyses: 100,
    maxReportGenerations: 50,
  },
  PREMIUM: {
    maxRequests: 2000,
    maxTokens: 2000000,
    maxCostCents: 20000, // $200
    maxChatRequests: 1000,
    maxDocumentAnalyses: 500,
    maxWaterQualityAnalyses: 500,
    maxReportGenerations: 200,
  },
};

interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: {
    requests: number;
    tokens: number;
    costCents: number;
  };
  limits?: {
    maxRequests: number;
    maxTokens: number;
    maxCostCents: number;
  };
}

/**
 * Check if organization has quota available for AI feature
 */
export async function checkAIQuota(
  organizationId: string,
  feature: AIFeature,
  estimatedTokens: number = 1000
): Promise<UsageCheckResult> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Get or create quota for current month
  let quota = await prisma.aIUsageQuota.findUnique({
    where: {
      organizationId_year_month: {
        organizationId,
        year,
        month,
      },
    },
  });

  if (!quota) {
    // Create quota with FREE tier defaults
    quota = await prisma.aIUsageQuota.create({
      data: {
        organizationId,
        year,
        month,
        tier: 'FREE',
        ...QUOTA_TIERS.FREE,
      },
    });
  }

  // Check overall limits
  const estimatedCost = calculateCost(estimatedTokens, estimatedTokens / 2);

  if (quota.requestCount >= quota.maxRequests) {
    return {
      allowed: false,
      reason: `Monthly request limit reached (${quota.maxRequests} requests)`,
      currentUsage: {
        requests: quota.requestCount,
        tokens: quota.tokenCount,
        costCents: quota.costCents,
      },
      limits: {
        maxRequests: quota.maxRequests,
        maxTokens: quota.maxTokens,
        maxCostCents: quota.maxCostCents,
      },
    };
  }

  if (quota.tokenCount + estimatedTokens > quota.maxTokens) {
    return {
      allowed: false,
      reason: `Monthly token limit reached (${quota.maxTokens} tokens)`,
      currentUsage: {
        requests: quota.requestCount,
        tokens: quota.tokenCount,
        costCents: quota.costCents,
      },
      limits: {
        maxRequests: quota.maxRequests,
        maxTokens: quota.maxTokens,
        maxCostCents: quota.maxCostCents,
      },
    };
  }

  if (quota.costCents + estimatedCost > quota.maxCostCents) {
    return {
      allowed: false,
      reason: `Monthly cost limit reached ($${quota.maxCostCents / 100})`,
      currentUsage: {
        requests: quota.requestCount,
        tokens: quota.tokenCount,
        costCents: quota.costCents,
      },
      limits: {
        maxRequests: quota.maxRequests,
        maxTokens: quota.maxTokens,
        maxCostCents: quota.maxCostCents,
      },
    };
  }

  // Check per-feature limits
  const featureLimits = getFeatureLimits(feature, quota);
  if (featureLimits.current >= featureLimits.max) {
    return {
      allowed: false,
      reason: `Monthly ${feature} limit reached (${featureLimits.max} requests)`,
      currentUsage: {
        requests: quota.requestCount,
        tokens: quota.tokenCount,
        costCents: quota.costCents,
      },
      limits: {
        maxRequests: quota.maxRequests,
        maxTokens: quota.maxTokens,
        maxCostCents: quota.maxCostCents,
      },
    };
  }

  return {
    allowed: true,
    currentUsage: {
      requests: quota.requestCount,
      tokens: quota.tokenCount,
      costCents: quota.costCents,
    },
    limits: {
      maxRequests: quota.maxRequests,
      maxTokens: quota.maxTokens,
      maxCostCents: quota.maxCostCents,
    },
  };
}

/**
 * Log AI usage after API call
 */
export async function logAIUsage(data: {
  organizationId: string;
  userId: string;
  feature: AIFeature;
  operation: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  success: boolean;
  errorMessage?: string;
  latencyMs?: number;
  ipAddress?: string;
  userAgent?: string;
}) {
  const totalTokens = data.inputTokens + data.outputTokens;
  const estimatedCost = calculateCost(data.inputTokens, data.outputTokens);

  // Create usage log
  const log = await prisma.aIUsageLog.create({
    data: {
      organizationId: data.organizationId,
      userId: data.userId,
      feature: data.feature,
      operation: data.operation,
      model: data.model,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      totalTokens,
      estimatedCost,
      success: data.success,
      errorMessage: data.errorMessage,
      latencyMs: data.latencyMs,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
  });

  // Update quota if successful
  if (data.success) {
    await incrementQuota(
      data.organizationId,
      data.feature,
      totalTokens,
      estimatedCost
    );
  }

  return log;
}

/**
 * Increment usage quota
 */
async function incrementQuota(
  organizationId: string,
  feature: AIFeature,
  tokens: number,
  costCents: number
) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const featureCountField = getFeatureCountField(feature);

  await prisma.aIUsageQuota.upsert({
    where: {
      organizationId_year_month: {
        organizationId,
        year,
        month,
      },
    },
    create: {
      organizationId,
      year,
      month,
      tier: 'FREE',
      ...QUOTA_TIERS.FREE,
      requestCount: 1,
      tokenCount: tokens,
      costCents,
      [featureCountField]: 1,
    },
    update: {
      requestCount: { increment: 1 },
      tokenCount: { increment: tokens },
      costCents: { increment: costCents },
      [featureCountField]: { increment: 1 },
    },
  });
}

/**
 * Calculate cost in cents based on token usage
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1000000) * PRICING.INPUT_PER_MILLION;
  const outputCost = (outputTokens / 1000000) * PRICING.OUTPUT_PER_MILLION;
  return Math.ceil((inputCost + outputCost) * 100); // Convert to cents
}

/**
 * Get feature-specific limits
 */
function getFeatureLimits(
  feature: AIFeature,
  quota: any
): { current: number; max: number } {
  const map = {
    COMPLIANCE_ASSISTANT: {
      current: quota.chatRequestCount,
      max: quota.maxChatRequests,
    },
    DWSP_ANALYSIS: {
      current: quota.documentAnalysisCount,
      max: quota.maxDocumentAnalyses,
    },
    WATER_QUALITY_ANALYSIS: {
      current: quota.waterQualityAnalysisCount,
      max: quota.maxWaterQualityAnalyses,
    },
    REPORT_GENERATION: {
      current: quota.reportGenerationCount,
      max: quota.maxReportGenerations,
    },
    REGULATORY_ANALYSIS: {
      current: quota.documentAnalysisCount,
      max: quota.maxDocumentAnalyses,
    },
    RISK_ASSESSMENT: {
      current: quota.documentAnalysisCount,
      max: quota.maxDocumentAnalyses,
    },
  };

  return map[feature] || { current: 0, max: 0 };
}

/**
 * Get Prisma field name for feature count
 */
function getFeatureCountField(feature: AIFeature): string {
  const map = {
    COMPLIANCE_ASSISTANT: 'chatRequestCount',
    DWSP_ANALYSIS: 'documentAnalysisCount',
    WATER_QUALITY_ANALYSIS: 'waterQualityAnalysisCount',
    REPORT_GENERATION: 'reportGenerationCount',
    REGULATORY_ANALYSIS: 'documentAnalysisCount',
    RISK_ASSESSMENT: 'documentAnalysisCount',
  };

  return map[feature] || 'chatRequestCount';
}

/**
 * Get usage statistics for organization
 */
export async function getAIUsageStats(organizationId: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const quota = await prisma.aIUsageQuota.findUnique({
    where: {
      organizationId_year_month: {
        organizationId,
        year,
        month,
      },
    },
  });

  const logs = await prisma.aIUsageLog.findMany({
    where: {
      organizationId,
      createdAt: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return {
    quota: quota || QUOTA_TIERS.FREE,
    recentLogs: logs,
    summary: {
      requestsUsed: quota?.requestCount || 0,
      requestsRemaining: (quota?.maxRequests || 0) - (quota?.requestCount || 0),
      tokensUsed: quota?.tokenCount || 0,
      tokensRemaining: (quota?.maxTokens || 0) - (quota?.tokenCount || 0),
      costUsed: quota?.costCents || 0,
      costRemaining: (quota?.maxCostCents || 0) - (quota?.costCents || 0),
      percentUsed: quota
        ? Math.round((quota.requestCount / quota.maxRequests) * 100)
        : 0,
    },
  };
}

/**
 * Update organization tier
 */
export async function updateOrganizationTier(
  organizationId: string,
  tier: 'FREE' | 'BASIC' | 'PREMIUM'
) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const tierLimits = QUOTA_TIERS[tier];

  await prisma.aIUsageQuota.upsert({
    where: {
      organizationId_year_month: {
        organizationId,
        year,
        month,
      },
    },
    create: {
      organizationId,
      year,
      month,
      tier,
      ...tierLimits,
    },
    update: {
      tier,
      ...tierLimits,
    },
  });

  return { success: true, tier, limits: tierLimits };
}
