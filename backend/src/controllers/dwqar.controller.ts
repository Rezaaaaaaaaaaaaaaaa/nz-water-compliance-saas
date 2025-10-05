/**
 * DWQAR Controller
 *
 * Handles DWQAR reporting workflow requests
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { dwqarAggregationService } from '../services/dwqar-aggregation.service.js';
import { dwqarValidationService } from '../services/dwqar-validation.service.js';
import { dwqarExcelExportService } from '../services/dwqar-excel-export.service.js';
import { logger } from '../config/logger.js';
import type { AuthenticatedUser } from '../server.js';

const prisma = new PrismaClient();

// Helper to get authenticated user from request
function getUser(request: FastifyRequest): AuthenticatedUser {
  return request.user as AuthenticatedUser;
}

/**
 * GET /api/dwqar/current
 * Get current DWQAR report status
 */
export async function getCurrentStatus(
  request: FastifyRequest<{
    Querystring: { period?: string };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const organizationId = getUser(request).organizationId;
    const period = request.query.period || `${new Date().getFullYear()}-Annual`;

    const status = await dwqarAggregationService.getCurrentStatus(
      organizationId
    );

    reply.send({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get DWQAR status');
    reply.status(500).send({
      success: false,
      error: 'Failed to get DWQAR status',
    });
  }
}

/**
 * POST /api/dwqar/validate
 * Validate DWQAR report before export
 */
export async function validateReport(
  request: FastifyRequest<{
    Body: { organizationId: string; period: string };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { organizationId, period } = request.body;

    // Check user has access to organization
    const userOrgId = getUser(request).organizationId;
    if (organizationId !== userOrgId) {
      reply.status(403).send({
        success: false,
        error: 'Access denied to this organization',
      });
      return;
    }

    // Aggregate report data
    const report = await dwqarAggregationService.aggregateReportingPeriod(
      organizationId,
      period
    );

    // Validate report
    const validation = await dwqarValidationService.validate(report);

    reply.send({
      success: true,
      data: validation,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to validate DWQAR report');
    reply.status(500).send({
      success: false,
      error: 'Failed to validate DWQAR report',
    });
  }
}

/**
 * GET /api/dwqar/export
 * Generate Excel export matching official DWQAR template
 */
export async function exportExcel(
  request: FastifyRequest<{
    Querystring: { period: string };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const organizationId = getUser(request).organizationId;
    const period = request.query.period;

    logger.info(
      { organizationId, period },
      'Generating DWQAR Excel export'
    );

    // Aggregate report data
    const report = await dwqarAggregationService.aggregateReportingPeriod(
      organizationId,
      period
    );

    // Validate before export (warn if issues, but allow export)
    const validation = await dwqarValidationService.validate(report);

    if (!validation.canExport) {
      reply.status(400).send({
        success: false,
        error: 'Report validation failed - cannot export',
        validation: {
          errors: validation.errors,
          warnings: validation.warnings,
        },
      });
      return;
    }

    // Generate Excel
    const buffer = await dwqarExcelExportService.generateExcel(report);

    // Validate exported Excel
    const exportValidation = await dwqarExcelExportService.validateExport(
      buffer
    );

    if (!exportValidation.valid) {
      logger.error(
        { errors: exportValidation.errors },
        'Excel export validation failed'
      );
      reply.status(500).send({
        success: false,
        error: 'Excel export validation failed',
        details: exportValidation.errors,
      });
      return;
    }

    // Send file
    const filename = `DWQAR_${period}_${organizationId}_${new Date().toISOString().split('T')[0]}.xlsx`;

    reply
      .header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(buffer);
  } catch (error) {
    logger.error({ err: error }, 'Failed to export DWQAR Excel');
    reply.status(500).send({
      success: false,
      error: 'Failed to export DWQAR Excel',
    });
  }
}

/**
 * POST /api/dwqar/submit
 * Record DWQAR submission to Hinekōrako
 */
export async function recordSubmission(
  request: FastifyRequest<{
    Body: {
      period: string;
      hinekōrakoId: string;
      confirmationPdf?: string;
    };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const organizationId = getUser(request).organizationId;
    const { period, hinekōrakoId, confirmationPdf } = request.body;

    logger.info(
      { organizationId, period, hinekōrakoId },
      'Recording DWQAR submission'
    );

    // Create or update report record
    const report = await prisma.report.upsert({
      where: {
        organizationId_reportType_reportingPeriod: {
          organizationId,
          reportType: 'DWQAR',
          reportingPeriod: period,
        },
      },
      update: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        hinekōrakoSubmissionId: hinekōrakoId,
        submissionConfirmation: confirmationPdf || null,
        regulatorAcknowledged: false,
      },
      create: {
        organizationId,
        reportType: 'DWQAR',
        reportingPeriod: period,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        hinekōrakoSubmissionId: hinekōrakoId,
        submissionConfirmation: confirmationPdf || null,
        regulatorAcknowledged: false,
        title: `DWQAR Annual Report - ${period}`,
        description: `Drinking Water Quality Assurance Rules submission for ${period}`,
      },
    });

    reply.send({
      success: true,
      data: {
        reportId: report.id,
        submittedAt: report.submittedAt,
        hinekōrakoId: report.hinekōrakoSubmissionId,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to record DWQAR submission');
    reply.status(500).send({
      success: false,
      error: 'Failed to record DWQAR submission',
    });
  }
}

/**
 * GET /api/dwqar/history
 * Get submission history for all past reporting periods
 */
export async function getSubmissionHistory(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const organizationId = getUser(request).organizationId;

    const reports = await prisma.report.findMany({
      where: {
        organizationId,
        reportType: 'DWQAR',
      },
      orderBy: {
        reportingPeriod: 'desc',
      },
      select: {
        id: true,
        reportingPeriod: true,
        status: true,
        submittedAt: true,
        hinekōrakoSubmissionId: true,
        regulatorAcknowledged: true,
        acknowledgedAt: true,
        createdAt: true,
      },
    });

    reply.send({
      success: true,
      data: reports,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get DWQAR submission history');
    reply.status(500).send({
      success: false,
      error: 'Failed to get submission history',
    });
  }
}

/**
 * GET /api/dwqar/aggregation/:period
 * Get aggregated data for a specific reporting period
 */
export async function getAggregation(
  request: FastifyRequest<{
    Params: { period: string };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const organizationId = getUser(request).organizationId;
    const period = request.params.period;

    const report = await dwqarAggregationService.aggregateReportingPeriod(
      organizationId,
      period
    );

    reply.send({
      success: true,
      data: report,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get DWQAR aggregation');
    reply.status(500).send({
      success: false,
      error: 'Failed to get aggregation data',
    });
  }
}

/**
 * GET /api/dwqar/completeness
 * Get completeness report for current period
 */
export async function getCompleteness(
  request: FastifyRequest<{
    Querystring: { period?: string };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const organizationId = getUser(request).organizationId;
    const period = request.query.period || `${new Date().getFullYear()}-Annual`;

    const report = await dwqarAggregationService.aggregateReportingPeriod(
      organizationId,
      period
    );

    reply.send({
      success: true,
      data: {
        reportingPeriod: period,
        completeness: report.completeness,
        totalSamples: report.totalSamples,
        totalRules: report.totalRules,
        status: report.status,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get DWQAR completeness');
    reply.status(500).send({
      success: false,
      error: 'Failed to get completeness data',
    });
  }
}
