/**
 * Compliance Scoring Service
 *
 * Advanced compliance scoring system that evaluates organizations
 * against Taumata Arowai regulatory requirements
 */

import { PrismaClient, AssetCondition, RiskLevel } from '@prisma/client';
import { logger } from '../config/logger.js';

const prisma = new PrismaClient();

export interface ComplianceScore {
  overall: number;
  breakdown: {
    dwspCompliance: ScoreComponent;
    assetManagement: ScoreComponent;
    documentationCompliance: ScoreComponent;
    reportingCompliance: ScoreComponent;
    riskManagement: ScoreComponent;
    timeliness: ScoreComponent;
  };
  recommendations: Array<{
    category: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    issue: string;
    recommendation: string;
    potentialImpact: number; // Score points that can be gained
  }>;
  lastCalculated: Date;
  trend: 'improving' | 'stable' | 'declining' | 'unknown';
}

interface ScoreComponent {
  score: number;
  maxScore: number;
  weight: number;
  weightedScore: number;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  details: string;
}

/**
 * Calculate comprehensive compliance score for organization
 */
export async function calculateComplianceScore(
  organizationId: string
): Promise<ComplianceScore> {
  // Gather all compliance data
  const [
    dwspData,
    assetData,
    documentData,
    reportData,
    riskData,
    timelinessData,
    historicalScores,
  ] = await Promise.all([
    getDWSPData(organizationId),
    getAssetData(organizationId),
    getDocumentData(organizationId),
    getReportData(organizationId),
    getRiskData(organizationId),
    getTimelinessData(organizationId),
    getHistoricalScores(organizationId, 2), // Last 2 scores for trend
  ]);

  // Calculate individual components
  const breakdown = {
    dwspCompliance: scoreDWSPCompliance(dwspData),
    assetManagement: scoreAssetManagement(assetData),
    documentationCompliance: scoreDocumentation(documentData),
    reportingCompliance: scoreReporting(reportData),
    riskManagement: scoreRiskManagement(riskData),
    timeliness: scoreTimeliness(timelinessData),
  };

  // Calculate overall weighted score
  const overall = Math.round(
    Object.values(breakdown).reduce((sum, component) => sum + component.weightedScore, 0)
  );

  // Generate recommendations
  const recommendations = generateRecommendations(breakdown, {
    dwspData,
    assetData,
    documentData,
    reportData,
    riskData,
    timelinessData,
  });

  // Determine trend
  const trend = calculateTrend(overall, historicalScores);

  // Save score to database
  await saveComplianceScore(organizationId, overall, breakdown);

  return {
    overall,
    breakdown,
    recommendations,
    lastCalculated: new Date(),
    trend,
  };
}

/**
 * Score DWSP (Drinking Water Safety Plan) Compliance
 * Weight: 35% (most critical)
 */
function scoreDWSPCompliance(data: any): ScoreComponent {
  const weight = 0.35;
  let score = 0;
  const maxScore = 100;
  const issues: string[] = [];

  // Must have at least one approved DWSP
  if (data.approvedDWSPs === 0) {
    issues.push('No approved DWSP');
    score = 0; // Critical failure
  } else {
    score = 60; // Base score for having approved DWSP

    // Check if DWSP is up to date (reviewed within last year)
    if (data.daysSinceLastReview <= 365) {
      score += 20;
    } else {
      issues.push(`DWSP not reviewed in ${Math.round(data.daysSinceLastReview / 365)} years`);
    }

    // Check if all 12 mandatory elements are complete
    if (data.completionPercentage >= 100) {
      score += 20;
    } else {
      score += (data.completionPercentage / 100) * 20;
      issues.push(
        `DWSP only ${data.completionPercentage}% complete (missing ${100 - data.completionPercentage}% of elements)`
      );
    }
  }

  return {
    score,
    maxScore,
    weight,
    weightedScore: (score / maxScore) * weight * 100,
    status: getStatus(score, maxScore),
    details:
      issues.length > 0
        ? issues.join('; ')
        : 'Approved DWSP with all mandatory elements complete',
  };
}

/**
 * Score Asset Management
 * Weight: 20%
 */
function scoreAssetManagement(data: any): ScoreComponent {
  const weight = 0.2;
  let score = 0;
  const maxScore = 100;
  const issues: string[] = [];

  if (data.totalAssets === 0) {
    issues.push('No assets registered');
    score = 0;
  } else {
    score = 40; // Base score for having assets

    // Penalize for high percentage of critical risk assets
    const criticalRatio = data.criticalAssets / data.totalAssets;
    if (criticalRatio === 0) {
      score += 30;
    } else if (criticalRatio <= 0.1) {
      score += 25;
    } else if (criticalRatio <= 0.2) {
      score += 15;
    } else {
      score += 5;
      issues.push(`${Math.round(criticalRatio * 100)}% of assets are critical risk`);
    }

    // Reward for recent inspections
    const inspectedRatio = data.assetsInspectedLast90Days / data.totalAssets;
    if (inspectedRatio >= 0.8) {
      score += 20;
    } else if (inspectedRatio >= 0.5) {
      score += 15;
    } else if (inspectedRatio >= 0.3) {
      score += 10;
    } else {
      score += 5;
      issues.push(
        `Only ${Math.round(inspectedRatio * 100)}% of assets inspected in last 90 days`
      );
    }

    // Penalize for very poor condition assets
    const poorConditionRatio = data.veryPoorConditionAssets / data.totalAssets;
    if (poorConditionRatio > 0.2) {
      score -= 10;
      issues.push(`${Math.round(poorConditionRatio * 100)}% of assets in very poor condition`);
    }
  }

  return {
    score: Math.max(0, score),
    maxScore,
    weight,
    weightedScore: (Math.max(0, score) / maxScore) * weight * 100,
    status: getStatus(score, maxScore),
    details:
      issues.length > 0 ? issues.join('; ') : 'Assets properly managed and inspected regularly',
  };
}

/**
 * Score Documentation Compliance
 * Weight: 15%
 */
function scoreDocumentation(data: any): ScoreComponent {
  const weight = 0.15;
  let score = 0;
  const maxScore = 100;
  const issues: string[] = [];

  if (data.totalDocuments === 0) {
    issues.push('No documents uploaded');
    score = 20; // Minimal score
  } else {
    score = 50; // Base score for having documents

    // Check for diversity of document types (should have DWSP, reports, procedures, etc.)
    const requiredTypes = ['DWSP', 'REPORT', 'PROCEDURE', 'CERTIFICATE'];
    const presentTypes = data.documentTypes.filter((t: string) =>
      requiredTypes.includes(t)
    ).length;
    score += (presentTypes / requiredTypes.length) * 30;

    if (presentTypes < requiredTypes.length) {
      issues.push(
        `Missing ${requiredTypes.length - presentTypes} required document types`
      );
    }

    // Check for recent document activity (last 90 days)
    if (data.documentsLast90Days > 0) {
      score += 20;
    } else {
      issues.push('No documents uploaded in last 90 days');
    }
  }

  return {
    score,
    maxScore,
    weight,
    weightedScore: (score / maxScore) * weight * 100,
    status: getStatus(score, maxScore),
    details:
      issues.length > 0
        ? issues.join('; ')
        : 'Complete documentation with all required types',
  };
}

/**
 * Score Reporting Compliance
 * Weight: 15%
 */
function scoreReporting(data: any): ScoreComponent {
  const weight = 0.15;
  let score = 0;
  const maxScore = 100;
  const issues: string[] = [];

  // Check for regular reporting (monthly, quarterly, annual)
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

  // Annual report
  if (data.annualReportsThisYear >= 1) {
    score += 40;
  } else if (data.annualReportsLastYear >= 1) {
    score += 20;
    issues.push('Annual report for current year not yet submitted');
  } else {
    issues.push('No annual reports submitted');
  }

  // Quarterly reports
  const expectedQuarterlyReports = currentQuarter;
  if (data.quarterlyReportsThisYear >= expectedQuarterlyReports) {
    score += 30;
  } else if (data.quarterlyReportsThisYear >= expectedQuarterlyReports - 1) {
    score += 20;
    issues.push('Missing latest quarterly report');
  } else {
    score += 10;
    issues.push(
      `Only ${data.quarterlyReportsThisYear}/${expectedQuarterlyReports} quarterly reports submitted`
    );
  }

  // Monthly reports
  if (data.monthlyReportsLast90Days >= 3) {
    score += 30;
  } else if (data.monthlyReportsLast90Days >= 2) {
    score += 20;
  } else {
    score += 10;
    issues.push('Irregular monthly reporting');
  }

  return {
    score,
    maxScore,
    weight,
    weightedScore: (score / maxScore) * weight * 100,
    status: getStatus(score, maxScore),
    details: issues.length > 0 ? issues.join('; ') : 'All reports submitted on time',
  };
}

/**
 * Score Risk Management
 * Weight: 10%
 */
function scoreRiskManagement(data: any): ScoreComponent {
  const weight = 0.1;
  let score = 0;
  const maxScore = 100;
  const issues: string[] = [];

  // Check if risk assessments are being performed
  if (data.riskAssessments > 0) {
    score = 50;

    // Recent risk assessment
    if (data.daysSinceLastRiskAssessment <= 180) {
      score += 30;
    } else {
      issues.push(
        `Last risk assessment was ${Math.round(data.daysSinceLastRiskAssessment / 30)} months ago`
      );
    }

    // Low incident rate
    if (data.incidentsLast90Days === 0) {
      score += 20;
    } else if (data.incidentsLast90Days <= 2) {
      score += 10;
    } else {
      issues.push(`${data.incidentsLast90Days} incidents in last 90 days`);
    }
  } else {
    issues.push('No risk assessments performed');
  }

  return {
    score,
    maxScore,
    weight,
    weightedScore: (score / maxScore) * weight * 100,
    status: getStatus(score, maxScore),
    details: issues.length > 0 ? issues.join('; ') : 'Effective risk management in place',
  };
}

/**
 * Score Timeliness (meeting deadlines)
 * Weight: 5%
 */
function scoreTimeliness(data: any): ScoreComponent {
  const weight = 0.05;
  let score = 100;
  const maxScore = 100;
  const issues: string[] = [];

  // Penalize for overdue items
  if (data.overdueItems > 0) {
    const penalty = Math.min(data.overdueItems * 20, 80);
    score -= penalty;
    issues.push(`${data.overdueItems} overdue items`);
  }

  // Penalize for items due soon that aren't addressed
  if (data.itemsDueWithin7Days > 5) {
    score -= 10;
    issues.push(`${data.itemsDueWithin7Days} items due within 7 days`);
  }

  return {
    score: Math.max(0, score),
    maxScore,
    weight,
    weightedScore: (Math.max(0, score) / maxScore) * weight * 100,
    status: getStatus(score, maxScore),
    details: issues.length > 0 ? issues.join('; ') : 'All deadlines met',
  };
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(breakdown: any, data: any): any[] {
  const recommendations: any[] = [];

  // DWSP recommendations
  if (breakdown.dwspCompliance.score < 60) {
    recommendations.push({
      category: 'DWSP Compliance',
      severity: 'critical' as const,
      issue: 'Missing or incomplete Drinking Water Safety Plan',
      recommendation:
        'Create and submit a complete DWSP with all 12 mandatory elements to Taumata Arowai immediately',
      potentialImpact: 35,
    });
  } else if (data.dwspData.daysSinceLastReview > 365) {
    recommendations.push({
      category: 'DWSP Compliance',
      severity: 'high' as const,
      issue: 'DWSP requires review',
      recommendation:
        'Review and update your DWSP annually as required by regulations',
      potentialImpact: 7,
    });
  }

  // Asset management recommendations
  if (breakdown.assetManagement.score < 60) {
    if (data.assetData.assetsInspectedLast90Days / data.assetData.totalAssets < 0.5) {
      recommendations.push({
        category: 'Asset Management',
        severity: 'high' as const,
        issue: 'Insufficient asset inspections',
        recommendation:
          'Implement a regular inspection schedule to inspect at least 80% of assets quarterly',
        potentialImpact: 10,
      });
    }

    if (data.assetData.criticalAssets / data.assetData.totalAssets > 0.2) {
      recommendations.push({
        category: 'Asset Management',
        severity: 'high' as const,
        issue: 'Too many critical risk assets',
        recommendation:
          'Prioritize maintenance and upgrades for critical assets to reduce risk levels',
        potentialImpact: 8,
      });
    }
  }

  // Documentation recommendations
  if (breakdown.documentationCompliance.score < 70) {
    recommendations.push({
      category: 'Documentation',
      severity: 'medium' as const,
      issue: 'Incomplete documentation',
      recommendation:
        'Ensure all required document types are uploaded: DWSP, Reports, Procedures, and Certificates',
      potentialImpact: 5,
    });
  }

  // Reporting recommendations
  if (breakdown.reportingCompliance.score < 70) {
    recommendations.push({
      category: 'Reporting',
      severity: 'high' as const,
      issue: 'Missing compliance reports',
      recommendation:
        'Submit all required monthly, quarterly, and annual compliance reports to meet regulatory requirements',
      potentialImpact: 12,
    });
  }

  // Timeliness recommendations
  if (data.timelinessData.overdueItems > 0) {
    recommendations.push({
      category: 'Timeliness',
      severity: data.timelinessData.overdueItems > 5 ? 'critical' : 'high',
      issue: `${data.timelinessData.overdueItems} overdue compliance items`,
      recommendation:
        'Address all overdue items immediately to maintain regulatory compliance',
      potentialImpact: 5,
    });
  }

  // Sort by severity and potential impact
  return recommendations.sort((a: any, b: any) => {
    const severityOrder: Record<'critical' | 'high' | 'medium' | 'low', number> = { critical: 0, high: 1, medium: 2, low: 3 };
    if (severityOrder[a.severity as 'critical' | 'high' | 'medium' | 'low'] !== severityOrder[b.severity as 'critical' | 'high' | 'medium' | 'low']) {
      return severityOrder[a.severity as 'critical' | 'high' | 'medium' | 'low'] - severityOrder[b.severity as 'critical' | 'high' | 'medium' | 'low'];
    }
    return b.potentialImpact - a.potentialImpact;
  });
}

/**
 * Get status based on score
 */
function getStatus(score: number, maxScore: number): ScoreComponent['status'] {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 90) return 'excellent';
  if (percentage >= 75) return 'good';
  if (percentage >= 60) return 'fair';
  if (percentage >= 40) return 'poor';
  return 'critical';
}

/**
 * Calculate trend from historical scores
 */
function calculateTrend(
  currentScore: number,
  historicalScores: number[]
): ComplianceScore['trend'] {
  if (historicalScores.length === 0) return 'unknown';

  const previousScore = historicalScores[0];
  const difference = currentScore - previousScore;

  if (Math.abs(difference) < 3) return 'stable';
  if (difference > 0) return 'improving';
  return 'declining';
}

/**
 * Helper functions to gather data
 */
async function getDWSPData(organizationId: string) {
  const approvedDWSPs = await prisma.compliancePlan.count({
    where: {
      organizationId,
      planType: 'DWSP',
      status: 'APPROVED',
      deletedAt: null,
    },
  });

  const latestDWSP = await prisma.compliancePlan.findFirst({
    where: {
      organizationId,
      planType: 'DWSP',
      status: 'APPROVED',
      deletedAt: null,
    },
    orderBy: {
      reviewDate: 'desc',
    },
  });

  const daysSinceLastReview = latestDWSP?.reviewDate
    ? Math.floor((Date.now() - latestDWSP.reviewDate.getTime()) / (1000 * 60 * 60 * 24))
    : 9999;

  // Estimate completion percentage (would need to check actual DWSP data structure)
  const completionPercentage = approvedDWSPs > 0 ? 100 : 0;

  return {
    approvedDWSPs,
    daysSinceLastReview,
    completionPercentage,
  };
}

async function getAssetData(organizationId: string) {
  const [
    totalAssets,
    criticalAssets,
    veryPoorConditionAssets,
    assetsInspectedLast90Days,
  ] = await Promise.all([
    prisma.asset.count({ where: { organizationId, deletedAt: null } }),
    prisma.asset.count({
      where: {
        organizationId,
        deletedAt: null,
        OR: [{ isCritical: true }, { riskLevel: RiskLevel.CRITICAL }],
      },
    }),
    prisma.asset.count({
      where: {
        organizationId,
        deletedAt: null,
        condition: AssetCondition.VERY_POOR,
      },
    }),
    prisma.asset.count({
      where: {
        organizationId,
        deletedAt: null,
        lastInspectionDate: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return {
    totalAssets,
    criticalAssets,
    veryPoorConditionAssets,
    assetsInspectedLast90Days,
  };
}

async function getDocumentData(organizationId: string) {
  const totalDocuments = await prisma.document.count({
    where: { organizationId, deletedAt: null },
  });

  const documents = await prisma.document.findMany({
    where: { organizationId, deletedAt: null },
    select: { documentType: true, uploadedAt: true },
  });

  const documentTypes = [...new Set(documents.map((d) => d.documentType))];
  const documentsLast90Days = documents.filter(
    (d) => d.uploadedAt && Date.now() - d.uploadedAt.getTime() < 90 * 24 * 60 * 60 * 1000
  ).length;

  return {
    totalDocuments,
    documentTypes,
    documentsLast90Days,
  };
}

async function getReportData(organizationId: string) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const lastYear = currentYear - 1;
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [
    annualReportsThisYear,
    annualReportsLastYear,
    quarterlyReportsThisYear,
    monthlyReportsLast90Days,
  ] = await Promise.all([
    prisma.compliancePlan.count({
      where: {
        organizationId,
        planType: 'DWSP',
        reportingPeriod: 'ANNUAL',
        createdAt: {
          gte: new Date(currentYear, 0, 1),
        },
        deletedAt: null,
      },
    }),
    prisma.compliancePlan.count({
      where: {
        organizationId,
        planType: 'DWSP',
        reportingPeriod: 'ANNUAL',
        createdAt: {
          gte: new Date(lastYear, 0, 1),
          lt: new Date(currentYear, 0, 1),
        },
        deletedAt: null,
      },
    }),
    prisma.compliancePlan.count({
      where: {
        organizationId,
        planType: 'DWSP',
        reportingPeriod: 'QUARTERLY',
        createdAt: {
          gte: new Date(currentYear, 0, 1),
        },
        deletedAt: null,
      },
    }),
    prisma.compliancePlan.count({
      where: {
        organizationId,
        planType: 'DWSP',
        reportingPeriod: 'MONTHLY',
        createdAt: {
          gte: ninetyDaysAgo,
        },
        deletedAt: null,
      },
    }),
  ]);

  return {
    annualReportsThisYear,
    annualReportsLastYear,
    quarterlyReportsThisYear,
    monthlyReportsLast90Days,
  };
}

async function getRiskData(organizationId: string) {
  // Count risk assessments (could be in DWSP or separate documents)
  const riskAssessments = await prisma.document.count({
    where: {
      organizationId,
      documentType: 'AUDIT_REPORT',
      deletedAt: null,
    },
  });

  const latestRiskAssessment = await prisma.document.findFirst({
    where: {
      organizationId,
      documentType: 'AUDIT_REPORT',
      deletedAt: null,
    },
    orderBy: {
      uploadedAt: 'desc',
    },
  });

  const daysSinceLastRiskAssessment = latestRiskAssessment?.uploadedAt
    ? Math.floor((Date.now() - latestRiskAssessment.uploadedAt.getTime()) / (1000 * 60 * 60 * 24))
    : 9999;

  const incidentsLast90Days = await prisma.compliancePlan.count({
    where: {
      organizationId,
      planType: 'DWSP',
      createdAt: {
        gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
      deletedAt: null,
    },
  });

  return {
    riskAssessments,
    daysSinceLastRiskAssessment,
    incidentsLast90Days,
  };
}

async function getTimelinessData(organizationId: string) {
  const overdueItems = await prisma.compliancePlan.count({
    where: {
      organizationId,
      targetDate: {
        lt: new Date(),
      },
      status: {
        notIn: ['APPROVED', 'ACCEPTED'],
      },
      deletedAt: null,
    },
  });

  const itemsDueWithin7Days = await prisma.compliancePlan.count({
    where: {
      organizationId,
      targetDate: {
        gte: new Date(),
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      status: {
        notIn: ['APPROVED', 'ACCEPTED'],
      },
      deletedAt: null,
    },
  });

  return {
    overdueItems,
    itemsDueWithin7Days,
  };
}

async function getHistoricalScores(
  organizationId: string,
  limit: number
): Promise<number[]> {
  const scores = await prisma.complianceScore.findMany({
    where: { organizationId },
    orderBy: { calculatedAt: 'desc' },
    take: limit,
    select: { overallScore: true },
  });

  return scores.map((s) => s.overallScore);
}

async function saveComplianceScore(
  organizationId: string,
  overallScore: number,
  breakdown: any
): Promise<void> {
  await prisma.complianceScore.create({
    data: {
      organizationId,
      overallScore,
      dwspScore: breakdown.dwspCompliance.score,
      assetScore: breakdown.assetManagement.score,
      documentScore: breakdown.documentationCompliance.score,
      reportingScore: breakdown.reportingCompliance.score,
      riskScore: breakdown.riskManagement.score,
      timelinessScore: breakdown.timeliness.score,
      calculatedAt: new Date(),
    },
  });

  logger.info({ organizationId, overallScore }, 'Compliance score calculated and saved');
}
