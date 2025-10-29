/**
 * Authentication Controller
 *
 * Handles authentication endpoints
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { LoginRequest, RefreshTokenRequest } from '../types/auth.js';
import * as authService from '../services/auth.service.js';
import * as auditService from '../services/audit.service.js';
import { requireUser } from '../middleware/auth.js';
import { logSecurity } from '../config/logger.js';

const prisma = new PrismaClient();

/**
 * POST /api/v1/auth/login
 * User login
 *
 * NOTE: This is a placeholder. In production, use Auth0 or similar OAuth provider
 */
export async function login(
  request: FastifyRequest<{ Body: LoginRequest }>,
  reply: FastifyReply
) {
  // Safely handle missing body
  if (!request.body) {
    return reply.code(400).send({
      error: 'Email and password are required',
    });
  }

  const { email, password } = request.body;

  try {
    // Validate input
    if (!email || !password) {
      return reply.code(400).send({
        error: 'Email and password are required',
      });
    }

    // TEMPORARY: For development, accept any password for seeded users
    // In production, use Auth0 or implement proper password authentication
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || user.deletedAt !== null || !user.isActive) {
      logSecurity({
        type: 'AUTH_FAILURE',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        reason: 'Invalid credentials',
        metadata: { email },
      });

      return reply.code(401).send({
        error: 'Invalid credentials',
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = await authService.generateTokens(
      request.server,
      user
    );

    // Create response
    const response = authService.createLoginResponse(user, accessToken, refreshToken);

    // Log successful login
    await auditService.auditLogin(user.id, user.organizationId, request);

    return reply.code(200).send(response);
  } catch (error) {
    request.log.error({ err: error }, 'Login error');

    logSecurity({
      type: 'AUTH_FAILURE',
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
      reason: error instanceof Error ? error.message : 'Unknown error',
    });

    return reply.code(500).send({
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
export async function refresh(
  request: FastifyRequest<{ Body: RefreshTokenRequest }>,
  reply: FastifyReply
) {
  // Safely handle missing body
  if (!request.body) {
    return reply.code(401).send({
      error: 'Refresh token is required',
    });
  }

  const { refreshToken } = request.body;

  try {
    if (!refreshToken) {
      return reply.code(401).send({
        error: 'Refresh token is required',
      });
    }

    // Refresh token
    const tokens = await authService.refreshAccessToken(request.server, refreshToken);

    if (!tokens) {
      return reply.code(401).send({
        error: 'Invalid refresh token',
      });
    }

    return reply.code(200).send({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    request.log.error({ err: error }, 'Token refresh error');
    return reply.code(401).send({
      error: 'Token refresh failed',
    });
  }
}

/**
 * POST /api/v1/auth/logout
 * User logout
 */
export async function logout(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = requireUser(request);

    // Log logout
    await auditService.auditLogout(user.id, user.organizationId, request);

    // In a more sophisticated system, we would:
    // - Invalidate the refresh token
    // - Add the access token to a blacklist
    // - Clear any server-side sessions

    return reply.code(200).send({
      message: 'Logged out successfully',
    });
  } catch (error) {
    request.log.error({ err: error }, 'Logout error');
    return reply.code(500).send({
      error: 'Logout failed',
    });
  }
}

/**
 * GET /api/v1/auth/me
 * Get current user info
 */
export async function getCurrentUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = requireUser(request);

    // Load full user details from database
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            region: true,
          },
        },
      },
    });

    if (!fullUser) {
      return reply.code(404).send({
        error: 'User not found',
      });
    }

    return reply.code(200).send({
      user: fullUser,
    });
  } catch (error) {
    request.log.error({ err: error }, 'Get current user error');
    return reply.code(500).send({
      error: 'Failed to get user information',
    });
  }
}
