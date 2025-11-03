/**
 * Authentication Middleware
 *
 * JWT-based authentication for Fastify
 * Verifies tokens and attaches user to request
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { JWTPayload, AuthenticatedUser } from '../types/auth.js';
import { logSecurity } from '../config/logger.js';
import { prisma } from '../config/database.js';

/**
 * Authentication Decorator
 * Verifies JWT token and loads user from database
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Verify JWT token (Fastify JWT plugin)
    await request.jwtVerify();

    // Get payload from token
    const payload = request.user as JWTPayload;

    if (!payload || !payload.userId) {
      logSecurity({
        type: 'AUTH_FAILURE',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        reason: 'Invalid token payload',
      });

      return reply.code(401).send({
        error: 'Invalid authentication token',
      });
    }

    // Load user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        isActive: true,
        deletedAt: true,
      },
    });

    // Check user exists and is active
    if (!user || user.deletedAt !== null) {
      logSecurity({
        type: 'AUTH_FAILURE',
        userId: payload.userId,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        reason: 'User not found or deleted',
      });

      return reply.code(401).send({
        error: 'User not found',
      });
    }

    if (!user.isActive) {
      logSecurity({
        type: 'AUTH_FAILURE',
        userId: user.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        reason: 'User account inactive',
      });

      return reply.code(401).send({
        error: 'Account is inactive',
      });
    }

    // Attach user to request
    request.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organizationId: user.organizationId,
      role: user.role,
      isActive: user.isActive,
    } as AuthenticatedUser;

    // Update last login time (async, don't wait)
    prisma.user
      .update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })
      .catch((err) => {
        request.log.error({ err }, 'Failed to update last login time');
      });
  } catch (error) {
    logSecurity({
      type: 'AUTH_FAILURE',
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
      reason: error instanceof Error ? error.message : 'Unknown error',
    });

    return reply.code(401).send({
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Optional Authentication
 * Attempts to authenticate but doesn't fail if no token
 */
export async function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    // No token provided, continue without user
    return;
  }

  try {
    await authenticate(request, reply);
  } catch (error) {
    // Authentication failed, but optional so continue
    request.log.warn({ err: error }, 'Optional authentication failed');
  }
}

/**
 * Extract user from request or throw error
 */
export function requireUser(request: FastifyRequest): AuthenticatedUser {
  if (!request.user) {
    throw new Error('User not authenticated');
  }
  return request.user as AuthenticatedUser;
}

/**
 * Get user from request (may be undefined)
 */
export function getUser(request: FastifyRequest): AuthenticatedUser | undefined {
  return request.user as AuthenticatedUser | undefined;
}
