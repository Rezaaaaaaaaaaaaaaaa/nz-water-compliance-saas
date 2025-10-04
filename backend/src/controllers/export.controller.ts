/**
 * Export Controller
 *
 * Handles data export requests in various formats
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import * as exportService from '../services/export.service.js';
import { logger } from '../config/logger.js';
import type { AuthenticatedUser } from '../server.js';

// Helper to get authenticated user from request
function getUser(request: FastifyRequest): AuthenticatedUser {
  return request.user as AuthenticatedUser;
}

/**
 * Export assets
 */
export async function exportAssets(
  request: FastifyRequest<{
    Querystring: { format?: string };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const organizationId = getUser(request).organizationId;
    const format = exportService.getExportFormat(request.query.format);

    if (format !== 'csv') {
      reply.status(400).send({
        success: false,
        error: 'Only CSV format is currently supported for assets export',
      });
      return;
    }

    const csv = await exportService.exportAssetsToCSV(organizationId);
    const filename = `assets_export_${new Date().toISOString().split('T')[0]}.csv`;

    reply
      .header('Content-Type', exportService.getMimeType(format))
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(csv);
  } catch (error) {
    logger.error({ err: error }, 'Failed to export assets');
    reply.status(500).send({
      success: false,
      error: 'Failed to export assets',
    });
  }
}

/**
 * Export documents
 */
export async function exportDocuments(
  request: FastifyRequest<{
    Querystring: { format?: string };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const organizationId = getUser(request).organizationId;
    const format = exportService.getExportFormat(request.query.format);

    if (format !== 'csv') {
      reply.status(400).send({
        success: false,
        error: 'Only CSV format is currently supported for documents export',
      });
      return;
    }

    const csv = await exportService.exportDocumentsToCSV(organizationId);
    const filename = `documents_export_${new Date().toISOString().split('T')[0]}.csv`;

    reply
      .header('Content-Type', exportService.getMimeType(format))
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(csv);
  } catch (error) {
    logger.error({ err: error }, 'Failed to export documents');
    reply.status(500).send({
      success: false,
      error: 'Failed to export documents',
    });
  }
}

/**
 * Export compliance plans
 */
export async function exportCompliancePlans(
  request: FastifyRequest<{
    Querystring: { format?: string };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const organizationId = getUser(request).organizationId;
    const format = exportService.getExportFormat(request.query.format);

    if (format !== 'csv') {
      reply.status(400).send({
        success: false,
        error: 'Only CSV format is currently supported for compliance plans export',
      });
      return;
    }

    const csv = await exportService.exportCompliancePlansToCSV(organizationId);
    const filename = `compliance_plans_export_${new Date().toISOString().split('T')[0]}.csv`;

    reply
      .header('Content-Type', exportService.getMimeType(format))
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(csv);
  } catch (error) {
    logger.error({ err: error }, 'Failed to export compliance plans');
    reply.status(500).send({
      success: false,
      error: 'Failed to export compliance plans',
    });
  }
}

/**
 * Export audit logs
 */
export async function exportAuditLogs(
  request: FastifyRequest<{
    Querystring: {
      format?: string;
      startDate?: string;
      endDate?: string;
    };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const organizationId = getUser(request).organizationId;
    const format = exportService.getExportFormat(request.query.format);

    if (format !== 'csv') {
      reply.status(400).send({
        success: false,
        error: 'Only CSV format is currently supported for audit logs export',
      });
      return;
    }

    const startDate = request.query.startDate ? new Date(request.query.startDate) : undefined;
    const endDate = request.query.endDate ? new Date(request.query.endDate) : undefined;

    const csv = await exportService.exportAuditLogsToCSV(organizationId, startDate, endDate);
    const filename = `audit_logs_export_${new Date().toISOString().split('T')[0]}.csv`;

    reply
      .header('Content-Type', exportService.getMimeType(format))
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(csv);
  } catch (error) {
    logger.error({ err: error }, 'Failed to export audit logs');
    reply.status(500).send({
      success: false,
      error: 'Failed to export audit logs',
    });
  }
}

/**
 * Export compliance overview report
 */
export async function exportComplianceOverview(
  request: FastifyRequest<{
    Querystring: { format?: string };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const organizationId = getUser(request).organizationId;
    const format = exportService.getExportFormat(request.query.format);

    if (format !== 'text') {
      reply.status(400).send({
        success: false,
        error: 'Only TEXT format is currently supported for compliance overview export',
      });
      return;
    }

    const report = await exportService.exportComplianceOverviewReport(organizationId);
    const filename = `compliance_overview_${new Date().toISOString().split('T')[0]}.txt`;

    reply
      .header('Content-Type', exportService.getMimeType(format))
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(report);
  } catch (error) {
    logger.error({ err: error }, 'Failed to export compliance overview');
    reply.status(500).send({
      success: false,
      error: 'Failed to export compliance overview',
    });
  }
}
