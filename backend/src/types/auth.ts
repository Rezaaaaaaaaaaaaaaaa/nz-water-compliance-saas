/**
 * Authentication and Authorization Types
 *
 * Type definitions for JWT tokens, user sessions, and permissions
 */

import { UserRole } from '@prisma/client';

/**
 * JWT Token Payload
 */
export interface JWTPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: UserRole;
  iat?: number; // Issued at
  exp?: number; // Expires at
}

/**
 * Authenticated User (attached to request)
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  role: UserRole;
  isActive: boolean;
}

/**
 * Login Request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login Response
 */
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    organizationId: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * Refresh Token Request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Permission Check Result
 */
export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}

/**
 * Resource Types (for permission checking)
 */
export enum ResourceType {
  ORGANIZATION = 'Organization',
  USER = 'User',
  ASSET = 'Asset',
  DOCUMENT = 'Document',
  COMPLIANCE_PLAN = 'CompliancePlan',
  REPORT = 'Report',
  AUDIT_LOG = 'AuditLog',
  NOTIFICATION = 'Notification',
}

/**
 * Actions (CRUD + Special)
 */
export enum Action {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SUBMIT = 'SUBMIT', // Submit compliance plan to regulator
  APPROVE = 'APPROVE', // Approve compliance plan
  EXPORT = 'EXPORT', // Export data/reports
  AUDIT = 'AUDIT', // View audit logs
}

/**
 * Permission Definition
 */
export interface Permission {
  resource: ResourceType;
  action: Action;
  organizationId?: string; // For org-specific permissions
  resourceId?: string; // For resource-specific permissions
}

/**
 * Role Permissions Map
 * Defines what each role can do
 */
export type RolePermissions = {
  [key in UserRole]: {
    resources: ResourceType[];
    actions: Action[];
    crossOrganization?: boolean; // Can access other orgs
    restrictions?: string[];
  };
};

/**
 * Session Data
 */
export interface Session {
  userId: string;
  organizationId: string;
  role: UserRole;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  expiresAt: Date;
}
