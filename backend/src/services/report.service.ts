/**
 * Report Service
 *
 * Generates regulatory compliance reports for submission to Taumata Arowai
 * Includes monthly, quarterly, and annual compliance reports
 */

import { PrismaClient, ReportType, ReportStatus } from '@prisma/client';
import { AuthenticatedUser } from '../types/auth.js';
import * as auditService from './audit.service.js';

const prisma = new PrismaClient();

export interface CreateReportRequest {
  title: string;
  description?: string;
  reportType: ReportType;
  startDate: string;
  endDate: string;
  includeAssets?: boolean;
  includeDocuments?: boolean;
  includeIncidents?: boolean;
  includeTestResults?: boolean;
}

export interface ReportFilters {
  reportType?: ReportType;
  status?: ReportStatus;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Generate compliance report data
 * Aggregates data from various sources for the reporting period
 */
async function generateReportData(
  organizationId: string,
  startDate: Date,
  endDate: Date,
  options: {
    includeAssets?: boolean;
    includeDocuments?: boolean;
    includeIncidents?: boolean;
    includeTestResults?: boolean;
  }
) {
  const reportData: any = {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    summary: {},
  };

  // Get active compliance plans for the period
  const compliancePlans = await prisma.compliancePlan.findMany({
    where: {
      organizationId,
      deletedAt: null,
      createdAt: {
        lte: endDate,
      },
    },
    include: {
      assignedTo: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  reportData.summary.totalCompliancePlans = compliancePlans.length;
  reportData.summary.approvedPlans = compliancePlans.filter(
    (p) => p.status === 'APPROVED'
  ).length;
  reportData.summary.submittedPlans = compliancePlans.filter(
    (p) => p.status === 'SUBMITTED'
  ).length;

  reportData.compliancePlans = compliancePlans.map((plan) => ({
    id: plan.id,
    title: plan.title,
    type: plan.planType,
    status: plan.status,
    submittedAt: plan.submittedAt,
    approvedAt: plan.approvedAt,
    assignedTo: plan.assignedTo
      ? `${plan.assignedTo.firstName} ${plan.assignedTo.lastName}`
      : null,
  }));

  // Include asset data if requested
  if (options.includeAssets) {
    const assets = await prisma.asset.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        type: true,
        condition: true,
        isCritical: true,
        riskLevel: true,
        lastInspectionDate: true,
      },
    });

    reportData.summary.totalAssets = assets.length;
    reportData.summary.criticalAssets = assets.filter((a) => a.isCritical).length;
    reportData.summary.assetsNeedingInspection = assets.filter(
      (a) =>
        !a.lastInspectionDate ||
        (endDate.getTime() - a.lastInspectionDate.getTime()) / (1000 * 60 * 60 * 24) >
          365
    ).length;

    reportData.assets = assets;
  }

  // Include document data if requested
  if (options.includeDocuments) {
    const documents = await prisma.document.findMany({
      where: {
        organizationId,
        deletedAt: null,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        title: true,
        documentType: true,
        fileName: true,
        createdAt: true,
      },
    });

    reportData.summary.documentsCreated = documents.length;
    reportData.documents = documents;
  }

  // Include incident data if requested
  if (options.includeIncidents) {
    const incidents = await prisma.incident.findMany({
      where: {
        organizationId,
        incidentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        title: true,
        severity: true,
        status: true,
        incidentDate: true,
        resolvedAt: true,
      },
    });

    reportData.summary.totalIncidents = incidents.length;
    reportData.summary.criticalIncidents = incidents.filter(
      (i) => i.severity === 'CRITICAL'
    ).length;
    reportData.summary.unresolvedIncidents = incidents.filter(
      (i) => i.status !== 'RESOLVED'
    ).length;

    reportData.incidents = incidents;
  }

  // Include test results if requested
  if (options.includeTestResults) {
    const testResults = await prisma.waterQualityTest.findMany({
      where: {
        asset: {
          organizationId,
        },
        testDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        testDate: true,
        testType: true,
        result: true,
        compliant: true,
        asset: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    });

    reportData.summary.totalTests = testResults.length;
    reportData.summary.compliantTests = testResults.filter((t) => t.compliant).length;
    reportData.summary.nonCompliantTests = testResults.filter((t) => !t.compliant).length;

    reportData.testResults = testResults;
  }

  // Calculate compliance rate
  const totalItems =
    (reportData.summary.totalCompliancePlans || 0) +
    (reportData.summary.totalTests || 0);
  const compliantItems =
    (reportData.summary.approvedPlans || 0) + (reportData.summary.compliantTests || 0);

  reportData.summary.overallComplianceRate =
    totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 0;

  return reportData;
}

/**
 * Create new report
 */
export async function createReport(
  user: AuthenticatedUser,
  data: CreateReportRequest,
  request: any
) {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  // Generate report data
  const reportData = await generateReportData(user.organizationId, startDate, endDate, {
    includeAssets: data.includeAssets,
    includeDocuments: data.includeDocuments,
    includeIncidents: data.includeIncidents,
    includeTestResults: data.includeTestResults,
  });

  // Create report record
  const report = await prisma.report.create({
    data: {
      organizationId: user.organizationId,
      createdById: user.id,
      title: data.title,
      description: data.description,
      reportType: data.reportType,
      startDate,
      endDate,
      data: reportData,
      status: ReportStatus.DRAFT,
    },
  });

  // Audit log
  await auditService.auditCreate(user, 'Report', report.id, report, request);

  return report;
}

/**
 * Get report by ID
 */
export async function getReport(id: string, user: AuthenticatedUser) {
  const report = await prisma.report.findFirst({
    where: {
      id,
      deletedAt: null,
      // User can only access their org's reports (unless Auditor/Admin)
      OR: [
        user.role === 'AUDITOR' || user.role === 'SYSTEM_ADMIN'
          ? {}
          : { organizationId: user.organizationId },
      ],
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return report;
}

/**
 * List reports
 */
export async function listReports(user: AuthenticatedUser, filters: ReportFilters) {
  const where: any = {
    deletedAt: null,
  };

  // Filter by organization (unless Auditor/Admin)
  if (user.role !== 'AUDITOR' && user.role !== 'SYSTEM_ADMIN') {
    where.organizationId = user.organizationId;
  }

  if (filters.reportType) {
    where.reportType = filters.reportType;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.startDate) {
    where.startDate = {
      gte: new Date(filters.startDate),
    };
  }

  if (filters.endDate) {
    where.endDate = {
      lte: new Date(filters.endDate),
    };
  }

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      take: filters.limit || 50,
      skip: filters.offset || 0,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.report.count({ where }),
  ]);

  return {
    reports,
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  };
}

/**
 * Submit report to Taumata Arowai
 */
export async function submitReport(id: string, user: AuthenticatedUser, request: any) {
  const report = await getReport(id, user);

  if (!report) {
    throw new Error('Report not found');
  }

  if (report.status !== ReportStatus.DRAFT) {
    throw new Error('Only draft reports can be submitted');
  }

  // Update report status
  const submitted = await prisma.report.update({
    where: { id },
    data: {
      status: ReportStatus.SUBMITTED,
      submittedAt: new Date(),
      submittedById: user.id,
    },
  });

  // Audit log
  await auditService.auditUpdate(
    user,
    'Report',
    id,
    report,
    submitted,
    request,
    'Report submitted to Taumata Arowai'
  );

  // TODO: Integrate with Hinekōrako platform (Taumata Arowai submission system)
  // This would involve API calls to the regulatory system

  return submitted;
}

/**
 * Delete report (soft delete)
 */
export async function deleteReport(id: string, user: AuthenticatedUser, request: any) {
  const report = await getReport(id, user);
  if (!report) {
    throw new Error('Report not found');
  }

  if (report.status === ReportStatus.SUBMITTED) {
    throw new Error('Cannot delete submitted reports');
  }

  const deleted = await prisma.report.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  // Audit log
  await auditService.auditDelete(user, 'Report', id, report, request, 'Report deleted');

  return deleted;
}

/**
 * Generate monthly compliance report
 */
export async function generateMonthlyReport(
  organizationId: string,
  year: number,
  month: number
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const reportData = await generateReportData(organizationId, startDate, endDate, {
    includeAssets: true,
    includeDocuments: true,
    includeIncidents: true,
    includeTestResults: true,
  });

  return reportData;
}

/**
 * Generate quarterly compliance report
 */
export async function generateQuarterlyReport(
  organizationId: string,
  year: number,
  quarter: number
) {
  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0, 23, 59, 59);

  const reportData = await generateReportData(organizationId, startDate, endDate, {
    includeAssets: true,
    includeDocuments: true,
    includeIncidents: true,
    includeTestResults: true,
  });

  return reportData;
}

/**
 * Generate annual compliance report
 */
export async function generateAnnualReport(organizationId: string, year: number) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const reportData = await generateReportData(organizationId, startDate, endDate, {
    includeAssets: true,
    includeDocuments: true,
    includeIncidents: true,
    includeTestResults: true,
  });

  return reportData;
}
