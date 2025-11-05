/**
 * Export Service
 *
 * Handles data export in multiple formats: CSV, Excel, PDF
 */

import { logger } from '../config/logger.js';
import { prisma } from '../config/database.js';

/**
 * Export assets to CSV format
 */
export async function exportAssetsToCSV(organizationId: string): Promise<string> {
  const assets = await prisma.asset.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: { name: 'asc' },
  });

  // CSV header
  const headers = [
    'ID',
    'Name',
    'Type',
    'Description',
    'Location',
    'Latitude',
    'Longitude',
    'Installation Date',
    'Condition',
    'Risk Level',
    'Is Critical',
    'Last Inspection Date',
    'Next Inspection Date',
    'Maintenance Schedule',
    'Capacity',
    'Material',
    'Manufacturer',
    'Model Number',
    'Serial Number',
    'Created At',
    'Updated At',
  ];

  // Build CSV content
  let csv = headers.join(',') + '\n';

  for (const asset of assets) {
    const row = [
      asset.id,
      escapeCSV(asset.name),
      asset.type,
      escapeCSV(asset.description || ''),
      escapeCSV(asset.location || ''),
      asset.latitude || '',
      asset.longitude || '',
      asset.installationDate ? formatDate(asset.installationDate) : '',
      asset.condition,
      asset.riskLevel,
      asset.isCritical,
      asset.lastInspectionDate ? formatDate(asset.lastInspectionDate) : '',
      asset.nextInspectionDate ? formatDate(asset.nextInspectionDate) : '',
      asset.maintenanceSchedule || '',
      asset.capacity || '',
      asset.material || '',
      asset.manufacturer || '',
      asset.modelNumber || '',
      asset.serialNumber || '',
      formatDate(asset.createdAt),
      formatDate(asset.updatedAt),
    ];

    csv += row.join(',') + '\n';
  }

  logger.info({ organizationId, count: assets.length }, 'Assets exported to CSV');
  return csv.trimEnd();
}

/**
 * Export documents to CSV format
 */
export async function exportDocumentsToCSV(organizationId: string): Promise<string> {
  const documents = await prisma.document.findMany({
    where: { organizationId, deletedAt: null },
    include: {
      uploadedBy: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { uploadedAt: 'desc' },
  });

  const headers = [
    'ID',
    'Title',
    'Type',
    'Description',
    'File Name',
    'File Size (MB)',
    'MIME Type',
    'Version',
    'Tags',
    'Uploaded By',
    'Uploaded At',
    'Retention Until',
  ];

  let csv = headers.join(',') + '\n';

  for (const doc of documents) {
    const row = [
      doc.id,
      escapeCSV(doc.title),
      (doc as any).type || (doc as any).documentType || '',
      escapeCSV(doc.description || ''),
      escapeCSV(doc.fileName),
      (doc.fileSize / (1024 * 1024)).toFixed(2),
      (doc as any).mimeType || doc.fileType || '', // MIME type
      doc.version,
      escapeCSV(Array.isArray(doc.tags) ? (doc.tags as string[]).join('; ') : ''),
      escapeCSV(doc.uploadedBy ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}` : ''),
      doc.uploadedAt ? formatDate(doc.uploadedAt) : formatDate(doc.createdAt),
      doc.retentionUntil ? formatDate(doc.retentionUntil) : '',
    ];

    csv += row.join(',') + '\n';
  }

  logger.info({ organizationId, count: documents.length }, 'Documents exported to CSV');
  return csv.trimEnd();
}

/**
 * Export compliance plans to CSV format
 */
export async function exportCompliancePlansToCSV(organizationId: string): Promise<string> {
  const plans = await prisma.compliancePlan.findMany({
    where: { organizationId, deletedAt: null },
    include: {
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      assignedTo: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const headers = [
    'ID',
    'Title',
    'Type',
    'Status',
    'Reporting Period',
    'Target Date',
    'Review Date',
    'Created By',
    'Assigned To',
    'Submitted At',
    'Approved At',
    'Created At',
  ];

  let csv = headers.join(',') + '\n';

  for (const plan of plans) {
    const row = [
      plan.id,
      escapeCSV(plan.title),
      plan.planType,
      plan.status,
      plan.reportingPeriod || '',
      plan.targetDate ? formatDate(plan.targetDate) : '',
      plan.reviewDate ? formatDate(plan.reviewDate) : '',
      escapeCSV(plan.createdBy ? `${plan.createdBy.firstName} ${plan.createdBy.lastName}` : ''),
      escapeCSV(plan.assignedTo ? `${plan.assignedTo.firstName} ${plan.assignedTo.lastName}` : ''),
      plan.submittedAt ? formatDate(plan.submittedAt) : '',
      plan.approvedAt ? formatDate(plan.approvedAt) : '',
      formatDate(plan.createdAt),
    ];

    csv += row.join(',') + '\n';
  }

  logger.info({ organizationId, count: plans.length }, 'Compliance plans exported to CSV');
  return csv.trimEnd();
}

/**
 * Export audit logs to CSV format
 */
export async function exportAuditLogsToCSV(
  organizationId: string,
  startDate?: Date,
  endDate?: Date,
  limit: number = 10000 // Max export limit
): Promise<string> {
  const where: any = { organizationId };

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

  // Validate limit
  const maxLimit = Math.min(limit, 50000); // Absolute max 50,000 records

  const logs = await prisma.auditLog.findMany({
    where,
    select: {
      id: true,
      userId: true,
      action: true,
      resourceType: true,
      resourceId: true,
      ipAddress: true,
      userAgent: true,
      timestamp: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { timestamp: 'desc' },
    take: maxLimit,
  });

  const headers = [
    'ID',
    'User',
    'User Email',
    'Action',
    'Resource Type',
    'Resource ID',
    'IP Address',
    'User Agent',
    'Timestamp',
  ];

  let csv = headers.join(',') + '\n';

  for (const log of logs) {
    const row = [
      log.id,
      log.user ? escapeCSV(`${log.user.firstName} ${log.user.lastName}`) : 'SYSTEM',
      log.user ? escapeCSV(log.user.email) : '',
      log.action,
      log.resourceType,
      log.resourceId || '',
      log.ipAddress || '',
      escapeCSV(log.userAgent || ''),
      formatDateTime(log.timestamp),
    ];

    csv += row.join(',') + '\n';
  }

  logger.info({ organizationId, count: logs.length }, 'Audit logs exported to CSV');
  return csv.trimEnd();
}

/**
 * Export compliance overview report to formatted text
 */
export async function exportComplianceOverviewReport(organizationId: string): Promise<string> {
  const [org, assets, documents, plans, recentLogs] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
    }),
    prisma.asset.findMany({
      where: { organizationId, deletedAt: null },
    }),
    prisma.document.count({
      where: { organizationId, deletedAt: null },
    }),
    prisma.compliancePlan.findMany({
      where: { organizationId, deletedAt: null },
    }),
    prisma.auditLog.findMany({
      where: {
        organizationId,
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      take: 100,
    }),
  ]);

  const dwsps = plans.filter((p) => p.planType === 'DWSP');
  const approvedDWSPs = dwsps.filter((p) => p.status === 'APPROVED');
  const reports = plans.filter((p) => p.planType === 'DWSP');
  const criticalAssets = assets.filter((a) => a.isCritical || a.riskLevel === 'CRITICAL');

  const report = `
===============================================================================
                    COMPLIANCE OVERVIEW REPORT
                    Taumata Arowai Requirements
===============================================================================

Organization: ${org?.name || 'Unknown'}
Report Date:  ${formatDate(new Date())}
Generated:    ${formatDateTime(new Date())}

===============================================================================
                        EXECUTIVE SUMMARY
===============================================================================

Total Assets:             ${assets.length}
Critical Assets:          ${criticalAssets.length} (${((criticalAssets.length / Math.max(assets.length, 1)) * 100).toFixed(1)}%)
Total Documents:          ${documents}
Active DWSPs:             ${approvedDWSPs.length}
Total Compliance Plans:   ${plans.length}
Reports Submitted:        ${reports.length}

===============================================================================
                      DWSP (DRINKING WATER SAFETY PLAN)
===============================================================================

Total DWSPs:              ${dwsps.length}
Approved:                 ${dwsps.filter((p) => p.status === 'APPROVED').length}
In Review:                ${dwsps.filter((p) => p.status === 'IN_REVIEW').length}
Draft:                    ${dwsps.filter((p) => p.status === 'DRAFT').length}
Rejected:                 ${dwsps.filter((p) => p.status === 'REJECTED').length}

${approvedDWSPs.length > 0 ? 'Latest Approved DWSP:' : 'No approved DWSPs found'}
${approvedDWSPs.length > 0 ? approvedDWSPs.map((d) => `  - ${d.title} (Approved: ${formatDate(d.approvedAt!)})`).join('\n') : ''}

===============================================================================
                        ASSET MANAGEMENT
===============================================================================

Asset Breakdown by Risk Level:
${getAssetBreakdown(assets, 'riskLevel')}

Asset Breakdown by Condition:
${getAssetBreakdown(assets, 'condition')}

Critical Assets Requiring Attention:
${
  criticalAssets.length > 0
    ? criticalAssets
        .slice(0, 10)
        .map((a) => `  - ${a.name} (${a.type}) - ${a.condition} condition, ${a.riskLevel} risk`)
        .join('\n')
    : '  None'
}

===============================================================================
                        RECENT ACTIVITY (Last 30 Days)
===============================================================================

Total Actions:            ${recentLogs.length}

Activity Breakdown:
${getActivityBreakdown(recentLogs)}

===============================================================================
                        COMPLIANCE STATUS
===============================================================================

✓ Organization registered with system
${approvedDWSPs.length > 0 ? '✓' : '✗'} Approved DWSP on file
${assets.length > 0 ? '✓' : '✗'} Assets registered and tracked
${documents > 0 ? '✓' : '✗'} Documentation uploaded
${reports.length > 0 ? '✓' : '✗'} Compliance reports submitted

===============================================================================
                        RECOMMENDATIONS
===============================================================================

${generateRecommendationsText(approvedDWSPs, assets, documents, reports)}

===============================================================================
                              END OF REPORT
===============================================================================

This report was generated automatically by the NZ Water Compliance SaaS
system to assist with Taumata Arowai regulatory compliance requirements.

For questions or support, contact your system administrator.
`;

  logger.info({ organizationId }, 'Compliance overview report generated');
  return report.trim();
}

/**
 * Helper: Escape CSV field
 */
function escapeCSV(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Helper: Format date to YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Helper: Format datetime
 */
function formatDateTime(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Helper: Get asset breakdown by field
 */
function getAssetBreakdown(assets: any[], field: string): string {
  const breakdown: Record<string, number> = {};
  assets.forEach((asset) => {
    const value = asset[field] || 'Unknown';
    breakdown[value] = (breakdown[value] || 0) + 1;
  });

  return Object.entries(breakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([key, count]) => `  ${key}: ${count} (${((count / assets.length) * 100).toFixed(1)}%)`)
    .join('\n');
}

/**
 * Helper: Get activity breakdown
 */
function getActivityBreakdown(logs: any[]): string {
  const breakdown: Record<string, number> = {};
  logs.forEach((log) => {
    breakdown[log.action] = (breakdown[log.action] || 0) + 1;
  });

  return Object.entries(breakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([action, count]) => `  ${action}: ${count}`)
    .join('\n');
}

/**
 * Helper: Generate recommendations text
 */
function generateRecommendationsText(
  dwsps: any[],
  assets: any[],
  documentCount: number,
  reports: any[]
): string {
  const recommendations: string[] = [];

  if (dwsps.length === 0) {
    recommendations.push(
      '! CRITICAL: Create and submit a Drinking Water Safety Plan (DWSP) immediately'
    );
  } else if (dwsps.filter((d) => d.status === 'APPROVED').length === 0) {
    recommendations.push('! HIGH: Get your DWSP approved by Taumata Arowai');
  }

  if (assets.length === 0) {
    recommendations.push('! HIGH: Register all water infrastructure assets in the system');
  }

  const criticalAssets = assets.filter((a) => a.isCritical || a.riskLevel === 'CRITICAL');
  if (criticalAssets.length / Math.max(assets.length, 1) > 0.2) {
    recommendations.push(
      '! MEDIUM: High percentage of critical risk assets - prioritize maintenance'
    );
  }

  if (documentCount === 0) {
    recommendations.push('! MEDIUM: Upload required compliance documentation');
  }

  if (reports.length === 0) {
    recommendations.push('! MEDIUM: Begin regular compliance reporting');
  }

  if (recommendations.length === 0) {
    recommendations.push('No critical recommendations - continue maintaining compliance');
  }

  return recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n');
}

/**
 * Get export format from request
 */
export function getExportFormat(formatParam: string | undefined): 'csv' | 'excel' | 'pdf' | 'text' {
  const format = (formatParam || 'csv').toLowerCase();
  if (['csv', 'excel', 'pdf', 'text'].includes(format)) {
    return format as 'csv' | 'excel' | 'pdf' | 'text';
  }
  return 'csv';
}

/**
 * Get MIME type for export format
 */
export function getMimeType(format: 'csv' | 'excel' | 'pdf' | 'text'): string {
  switch (format) {
    case 'csv':
      return 'text/csv';
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'pdf':
      return 'application/pdf';
    case 'text':
      return 'text/plain';
  }
}

/**
 * Get file extension for export format
 */
export function getFileExtension(format: 'csv' | 'excel' | 'pdf' | 'text'): string {
  switch (format) {
    case 'csv':
      return 'csv';
    case 'excel':
      return 'xlsx';
    case 'pdf':
      return 'pdf';
    case 'text':
      return 'txt';
  }
}
