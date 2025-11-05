/**
 * Audit Logging Service
 *
 * Records all user actions for regulatory compliance
 * Audit logs are IMMUTABLE and retained for 7 years (Taumata Arowai requirement)
 */

import { AuditAction } from '@prisma/client';
import { AuthenticatedUser } from '../types/auth.js';
import { logAudit } from '../config/logger.js';
import { prisma } from '../config/database.js';

/**
 * Create audit log entry
 *
 * CRITICAL: Audit logs must be immutable (no UPDATE or DELETE)
 * Required for regulatory inspections by Taumata Arowai
 */
export async function createAuditLog(params: {
  organizationId: string;
  userId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  changes?: {
    before?: any;
    after?: any;
  };
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  reason?: string;
}) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        changes: params.changes ? JSON.parse(JSON.stringify(params.changes)) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        sessionId: params.sessionId,
        reason: params.reason,
        timestamp: new Date(),
      },
    });

    // Also log to application logger for immediate visibility
    logAudit({
      userId: params.userId || 'system',
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      organizationId: params.organizationId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      changes: params.changes,
      metadata: {
        reason: params.reason,
        sessionId: params.sessionId,
      },
    });

    return auditLog;
  } catch (error) {
    // Audit logging failure is serious - log error but don't fail the operation
    console.error('CRITICAL: Failed to create audit log', error);
    throw error;
  }
}

/**
 * Log CREATE action
 */
export async function auditCreate(
  user: AuthenticatedUser,
  resourceType: string,
  resourceId: string,
  data: any,
  request: any
) {
  return createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: AuditAction.CREATE,
    resourceType,
    resourceId,
    changes: {
      after: data,
    },
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  });
}

/**
 * Log UPDATE action
 */
export async function auditUpdate(
  user: AuthenticatedUser,
  resourceType: string,
  resourceId: string,
  before: any,
  after: any,
  request: any,
  reason?: string
) {
  return createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: AuditAction.UPDATE,
    resourceType,
    resourceId,
    changes: {
      before,
      after,
    },
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    reason,
  });
}

/**
 * Log DELETE action
 */
export async function auditDelete(
  user: AuthenticatedUser,
  resourceType: string,
  resourceId: string,
  data: any,
  request: any,
  reason?: string
) {
  return createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: AuditAction.DELETE,
    resourceType,
    resourceId,
    changes: {
      before: data,
    },
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    reason,
  });
}

/**
 * Log SUBMIT action (compliance plan to regulator)
 */
export async function auditSubmit(
  user: AuthenticatedUser,
  resourceType: string,
  resourceId: string,
  request: any,
  reason?: string
) {
  return createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: AuditAction.SUBMIT,
    resourceType,
    resourceId,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    reason,
  });
}

/**
 * Log APPROVE action
 */
export async function auditApprove(
  user: AuthenticatedUser,
  resourceType: string,
  resourceId: string,
  request: any,
  reason?: string
) {
  return createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: AuditAction.APPROVE,
    resourceType,
    resourceId,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    reason,
  });
}

/**
 * Log VIEW action (for sensitive resources)
 */
export async function auditView(
  user: AuthenticatedUser,
  resourceType: string,
  resourceId: string,
  request: any
) {
  return createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: AuditAction.VIEW,
    resourceType,
    resourceId,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  });
}

/**
 * Log EXPORT action (data download/export)
 */
export async function auditExport(
  user: AuthenticatedUser,
  resourceType: string,
  resourceId: string,
  request: any
) {
  return createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: AuditAction.EXPORT,
    resourceType,
    resourceId,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  });
}

/**
 * Log LOGIN action
 */
export async function auditLogin(userId: string, organizationId: string, request: any) {
  return createAuditLog({
    organizationId,
    userId,
    action: AuditAction.LOGIN,
    resourceType: 'User',
    resourceId: userId,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  });
}

/**
 * Log LOGOUT action
 */
export async function auditLogout(userId: string, organizationId: string, request: any) {
  return createAuditLog({
    organizationId,
    userId,
    action: AuditAction.LOGOUT,
    resourceType: 'User',
    resourceId: userId,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  });
}

/**
 * Log PERMISSION_DENIED action
 */
export async function auditPermissionDenied(
  userId: string,
  organizationId: string,
  resourceType: string,
  resourceId: string,
  request: any,
  reason: string
) {
  return createAuditLog({
    organizationId,
    userId,
    action: AuditAction.PERMISSION_DENIED,
    resourceType,
    resourceId,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    reason,
  });
}

/**
 * Query audit logs (for authorized users only)
 */
export async function getAuditLogs(params: {
  organizationId?: string;
  userId?: string;
  action?: AuditAction;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (params.organizationId) where.organizationId = params.organizationId;
  if (params.userId) where.userId = params.userId;
  if (params.action) where.action = params.action;
  if (params.resourceType) where.resourceType = params.resourceType;
  if (params.resourceId) where.resourceId = params.resourceId;

  if (params.startDate || params.endDate) {
    where.timestamp = {};
    if (params.startDate) where.timestamp.gte = params.startDate;
    if (params.endDate) where.timestamp.lte = params.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: params.limit || 100,
      skip: params.offset || 0,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    limit: params.limit || 100,
    offset: params.offset || 0,
  };
}
