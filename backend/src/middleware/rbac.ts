/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * Permission checking based on Taumata Arowai regulatory requirements
 * Implements 5 roles: System Admin, Org Admin, Compliance Manager, Inspector, Auditor
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser, ResourceType, Action, Permission } from '../types/auth.js';
import { requireUser } from './auth.js';
import { logSecurity } from '../config/logger.js';

/**
 * Role Permissions Configuration
 * Based on Taumata Arowai regulatory framework
 */
const ROLE_PERMISSIONS = {
  // System Admin: Full system access
  [UserRole.SYSTEM_ADMIN]: {
    canAccessAllOrganizations: true,
    canPerformAllActions: true,
  },

  // Organization Admin: Full access within organization
  [UserRole.ORG_ADMIN]: {
    canAccessAllOrganizations: false,
    allowedActions: {
      [ResourceType.ORGANIZATION]: [Action.READ, Action.UPDATE],
      [ResourceType.USER]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
      [ResourceType.ASSET]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
      [ResourceType.DOCUMENT]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.EXPORT],
      [ResourceType.COMPLIANCE_PLAN]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.APPROVE],
      [ResourceType.REPORT]: [Action.CREATE, Action.READ, Action.EXPORT],
      [ResourceType.AUDIT_LOG]: [Action.READ, Action.AUDIT],
      [ResourceType.NOTIFICATION]: [Action.READ, Action.UPDATE],
    },
  },

  // Compliance Manager: Can submit to regulator
  // Key role for Taumata Arowai compliance
  [UserRole.COMPLIANCE_MANAGER]: {
    canAccessAllOrganizations: false,
    allowedActions: {
      [ResourceType.ORGANIZATION]: [Action.READ],
      [ResourceType.USER]: [Action.READ],
      [ResourceType.ASSET]: [Action.CREATE, Action.READ, Action.UPDATE],
      [ResourceType.DOCUMENT]: [Action.CREATE, Action.READ, Action.UPDATE, Action.EXPORT],
      [ResourceType.COMPLIANCE_PLAN]: [Action.CREATE, Action.READ, Action.UPDATE, Action.SUBMIT, Action.APPROVE],
      [ResourceType.REPORT]: [Action.CREATE, Action.READ, Action.EXPORT],
      [ResourceType.AUDIT_LOG]: [Action.READ],
      [ResourceType.NOTIFICATION]: [Action.READ, Action.UPDATE],
    },
  },

  // Inspector: Field staff, data entry only
  // Cannot delete historical records (regulatory requirement)
  [UserRole.INSPECTOR]: {
    canAccessAllOrganizations: false,
    allowedActions: {
      [ResourceType.ORGANIZATION]: [Action.READ],
      [ResourceType.USER]: [Action.READ],
      [ResourceType.ASSET]: [Action.CREATE, Action.READ, Action.UPDATE],
      [ResourceType.DOCUMENT]: [Action.CREATE, Action.READ],
      [ResourceType.COMPLIANCE_PLAN]: [Action.READ],
      [ResourceType.REPORT]: [Action.READ],
      [ResourceType.AUDIT_LOG]: [], // No audit log access
      [ResourceType.NOTIFICATION]: [Action.READ],
    },
  },

  // Auditor: Read-only, regulator role
  // Can access all organizations (regulatory audit rights)
  [UserRole.AUDITOR]: {
    canAccessAllOrganizations: true, // Key regulatory requirement!
    allowedActions: {
      [ResourceType.ORGANIZATION]: [Action.READ],
      [ResourceType.USER]: [Action.READ],
      [ResourceType.ASSET]: [Action.READ],
      [ResourceType.DOCUMENT]: [Action.READ, Action.EXPORT],
      [ResourceType.COMPLIANCE_PLAN]: [Action.READ, Action.EXPORT],
      [ResourceType.REPORT]: [Action.READ, Action.EXPORT],
      [ResourceType.AUDIT_LOG]: [Action.READ, Action.AUDIT],
      [ResourceType.NOTIFICATION]: [], // No notification access
    },
  },
};

/**
 * Check if user has permission for an action on a resource
 */
export function hasPermission(
  user: AuthenticatedUser,
  resource: ResourceType,
  action: Action,
  resourceOrganizationId?: string
): boolean {
  const roleConfig = ROLE_PERMISSIONS[user.role];

  // System Admin can do everything
  if (roleConfig.canPerformAllActions) {
    return true;
  }

  // Check if action is allowed for this role and resource
  const allowedActions = roleConfig.allowedActions?.[resource] || [];
  if (!allowedActions.includes(action)) {
    return false;
  }

  // Check organization access
  // Auditors can access all organizations (regulatory requirement)
  // Others can only access their own organization
  if (!roleConfig.canAccessAllOrganizations) {
    if (resourceOrganizationId && resourceOrganizationId !== user.organizationId) {
      return false;
    }
  }

  return true;
}

/**
 * Middleware: Require specific role(s)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireUser(request);

    if (!allowedRoles.includes(user.role)) {
      logSecurity({
        type: 'PERMISSION_DENIED',
        userId: user.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        reason: `Role ${user.role} not allowed, required: ${allowedRoles.join(', ')}`,
        metadata: {
          url: request.url,
          method: request.method,
        },
      });

      return reply.code(403).send({
        error: 'Insufficient permissions',
        message: `This action requires one of: ${allowedRoles.join(', ')}`,
      });
    }
  };
}

/**
 * Middleware: Require permission for resource and action
 */
export function requirePermission(resource: ResourceType, action: Action) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireUser(request);

    // Extract organization ID from request params or body
    const resourceOrgId =
      (request.params as any)?.organizationId ||
      (request.body as any)?.organizationId;

    if (!hasPermission(user, resource, action, resourceOrgId)) {
      logSecurity({
        type: 'PERMISSION_DENIED',
        userId: user.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        reason: `Permission denied for ${action} on ${resource}`,
        metadata: {
          url: request.url,
          method: request.method,
          resource,
          action,
          userRole: user.role,
          resourceOrgId,
          userOrgId: user.organizationId,
        },
      });

      return reply.code(403).send({
        error: 'Insufficient permissions',
        message: `You do not have permission to ${action} ${resource}`,
      });
    }
  };
}

/**
 * Middleware: Require same organization
 * Ensures user can only access resources in their organization
 * (except Auditors and System Admins)
 */
export function requireSameOrganization() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireUser(request);

    // System Admin and Auditor can access all organizations
    if (user.role === UserRole.SYSTEM_ADMIN || user.role === UserRole.AUDITOR) {
      return;
    }

    // Extract organization ID from request
    const resourceOrgId =
      (request.params as any)?.organizationId ||
      (request.body as any)?.organizationId ||
      (request.query as any)?.organizationId;

    if (resourceOrgId && resourceOrgId !== user.organizationId) {
      logSecurity({
        type: 'PERMISSION_DENIED',
        userId: user.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        reason: 'Cross-organization access attempt',
        metadata: {
          userOrgId: user.organizationId,
          requestedOrgId: resourceOrgId,
        },
      });

      return reply.code(403).send({
        error: 'Access denied',
        message: 'You can only access resources in your organization',
      });
    }
  };
}

/**
 * Middleware: Compliance Manager or above only
 * For DWSP submission and approval
 */
export function requireComplianceManager() {
  return requireRole(
    UserRole.SYSTEM_ADMIN,
    UserRole.ORG_ADMIN,
    UserRole.COMPLIANCE_MANAGER
  );
}

/**
 * Middleware: Auditor access
 * For regulatory inspections
 */
export function requireAuditor() {
  return requireRole(UserRole.SYSTEM_ADMIN, UserRole.AUDITOR);
}

/**
 * Check if user can submit DWSP to regulator
 * Regulatory requirement: Only Compliance Managers can submit
 */
export function canSubmitDWSP(user: AuthenticatedUser): boolean {
  return hasPermission(user, ResourceType.COMPLIANCE_PLAN, Action.SUBMIT);
}

/**
 * Check if user can approve DWSP
 */
export function canApproveDWSP(user: AuthenticatedUser): boolean {
  return hasPermission(user, ResourceType.COMPLIANCE_PLAN, Action.APPROVE);
}

/**
 * Check if user can access audit logs
 * Required for regulatory compliance
 */
export function canAccessAuditLogs(user: AuthenticatedUser): boolean {
  return hasPermission(user, ResourceType.AUDIT_LOG, Action.AUDIT);
}
