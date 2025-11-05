/**
 * Authentication Controller
 *
 * Handles authentication endpoints
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { LoginRequest, RefreshTokenRequest } from '../types/auth.js';
import * as authService from '../services/auth.service.js';
import * as auditService from '../services/audit.service.js';
import { requireUser } from '../middleware/auth.js';
import { logSecurity } from '../config/logger.js';
import { prisma } from '../config/database.js';
import bcrypt from 'bcrypt';

/**
 * POST /api/v1/auth/login
 * User login
 *
 * NOTE: This is a placeholder. In production, use Auth0 or similar OAuth provider
 */
export async function login(request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) {
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
    const { accessToken, refreshToken } = await authService.generateTokens(request.server, user);

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
 * POST /api/v1/auth/register
 * User registration with organization creation
 */
export async function register(
  request: FastifyRequest<{
    Body: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      organizationName: string;
      organizationType: 'COUNCIL' | 'CCO' | 'PRIVATE_OPERATOR' | 'IWI_AUTHORITY';
      region?: string;
      contactEmail?: string;
    };
  }>,
  reply: FastifyReply
) {
  if (!request.body) {
    return reply.code(400).send({
      error: 'Registration data is required',
    });
  }

  const {
    firstName,
    lastName,
    email,
    password,
    organizationName,
    organizationType,
    region = 'NZ', // Default region
    contactEmail = email, // Default to user email
  } = request.body;

  try {
    // Validate input
    if (!email || !password || !firstName || !lastName || !organizationName || !organizationType) {
      return reply.code(400).send({
        error: 'All fields are required',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return reply.code(409).send({
        error: 'Email already in use',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create organization and user in transaction
    const { user } = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          type: organizationType,
          region,
          contactEmail,
        },
      });

      // Create user with ORG_ADMIN role
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          role: 'ORG_ADMIN',
          organizationId: organization.id,
          isActive: true,
        },
      });

      return { user: newUser };
    });

    // Generate tokens
    const { accessToken, refreshToken } = await authService.generateTokens(request.server, user);

    // Create response
    const response = authService.createLoginResponse(user, accessToken, refreshToken);

    // Log successful registration
    await auditService.auditLogin(user.id, user.organizationId, request);

    logSecurity({
      type: 'USER_REGISTERED',
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
      metadata: { email, organizationId: user.organizationId },
    });

    return reply.code(201).send(response);
  } catch (error) {
    request.log.error({ err: error }, 'Registration error');

    logSecurity({
      type: 'REGISTRATION_FAILURE',
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
      reason: error instanceof Error ? error.message : 'Unknown error',
    });

    return reply.code(500).send({
      error: 'Registration failed',
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
