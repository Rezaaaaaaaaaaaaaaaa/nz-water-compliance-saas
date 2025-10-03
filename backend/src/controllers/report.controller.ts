/**
 * Report Controller
 *
 * API endpoints for regulatory reporting
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { ReportType, ReportStatus } from '@prisma/client';
import * as reportService from '../services/report.service.js';
import { requireUser } from '../middleware/auth.js';

/**
 * POST /api/v1/reports
 * Create new report
 */
export async function createReport(
  request: FastifyRequest<{ Body: reportService.CreateReportRequest }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    const report = await reportService.createReport(user, request.body, request);

    return reply.code(201).send({
      report,
      message: 'Report created successfully',
    });
  } catch (error) {
    request.log.error({ err: error }, 'Create report error');
    return reply.code(500).send({
      error: 'Failed to create report',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/v1/reports
 * List reports
 */
export async function listReports(
  request: FastifyRequest<{
    Querystring: {
      reportType?: ReportType;
      status?: ReportStatus;
      startDate?: string;
      endDate?: string;
      limit?: string;
      offset?: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);

    const result = await reportService.listReports(user, {
      reportType: request.query.reportType,
      status: request.query.status,
      startDate: request.query.startDate,
      endDate: request.query.endDate,
      limit: request.query.limit ? parseInt(request.query.limit) : undefined,
      offset: request.query.offset ? parseInt(request.query.offset) : undefined,
    });

    return reply.code(200).send(result);
  } catch (error) {
    request.log.error({ err: error }, 'List reports error');
    return reply.code(500).send({
      error: 'Failed to list reports',
    });
  }
}

/**
 * GET /api/v1/reports/:id
 * Get report by ID
 */
export async function getReport(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    const report = await reportService.getReport(request.params.id, user);

    if (!report) {
      return reply.code(404).send({
        error: 'Report not found',
      });
    }

    return reply.code(200).send({ report });
  } catch (error) {
    request.log.error({ err: error }, 'Get report error');
    return reply.code(500).send({
      error: 'Failed to get report',
    });
  }
}

/**
 * POST /api/v1/reports/:id/submit
 * Submit report to Taumata Arowai
 */
export async function submitReport(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    const report = await reportService.submitReport(request.params.id, user, request);

    return reply.code(200).send({
      report,
      message: 'Report submitted successfully',
    });
  } catch (error) {
    request.log.error({ err: error }, 'Submit report error');
    return reply.code(500).send({
      error: 'Failed to submit report',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * DELETE /api/v1/reports/:id
 * Delete report (soft delete)
 */
export async function deleteReport(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    await reportService.deleteReport(request.params.id, user, request);

    return reply.code(200).send({
      message: 'Report deleted successfully',
    });
  } catch (error) {
    request.log.error({ err: error }, 'Delete report error');
    return reply.code(500).send({
      error: 'Failed to delete report',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/v1/reports/generate/monthly
 * Generate monthly compliance report
 */
export async function generateMonthlyReport(
  request: FastifyRequest<{
    Querystring: {
      year: string;
      month: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    const year = parseInt(request.query.year);
    const month = parseInt(request.query.month);

    if (!year || !month || month < 1 || month > 12) {
      return reply.code(400).send({
        error: 'Invalid year or month',
      });
    }

    const reportData = await reportService.generateMonthlyReport(
      user.organizationId,
      year,
      month
    );

    return reply.code(200).send({
      reportData,
      message: 'Monthly report generated successfully',
    });
  } catch (error) {
    request.log.error({ err: error }, 'Generate monthly report error');
    return reply.code(500).send({
      error: 'Failed to generate monthly report',
    });
  }
}

/**
 * GET /api/v1/reports/generate/quarterly
 * Generate quarterly compliance report
 */
export async function generateQuarterlyReport(
  request: FastifyRequest<{
    Querystring: {
      year: string;
      quarter: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    const year = parseInt(request.query.year);
    const quarter = parseInt(request.query.quarter);

    if (!year || !quarter || quarter < 1 || quarter > 4) {
      return reply.code(400).send({
        error: 'Invalid year or quarter',
      });
    }

    const reportData = await reportService.generateQuarterlyReport(
      user.organizationId,
      year,
      quarter
    );

    return reply.code(200).send({
      reportData,
      message: 'Quarterly report generated successfully',
    });
  } catch (error) {
    request.log.error({ err: error }, 'Generate quarterly report error');
    return reply.code(500).send({
      error: 'Failed to generate quarterly report',
    });
  }
}

/**
 * GET /api/v1/reports/generate/annual
 * Generate annual compliance report
 */
export async function generateAnnualReport(
  request: FastifyRequest<{
    Querystring: {
      year: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    const year = parseInt(request.query.year);

    if (!year) {
      return reply.code(400).send({
        error: 'Invalid year',
      });
    }

    const reportData = await reportService.generateAnnualReport(user.organizationId, year);

    return reply.code(200).send({
      reportData,
      message: 'Annual report generated successfully',
    });
  } catch (error) {
    request.log.error({ err: error }, 'Generate annual report error');
    return reply.code(500).send({
      error: 'Failed to generate annual report',
    });
  }
}
