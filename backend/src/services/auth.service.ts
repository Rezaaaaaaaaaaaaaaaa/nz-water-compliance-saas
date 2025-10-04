/**
 * Authentication Service
 *
 * Handles user authentication, token generation, and session management
 */

import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { JWTPayload, LoginResponse } from '../types/auth.js';
import { config } from '../config/index.js';

const prisma = new PrismaClient();

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
  email: string,
  _password: string
): Promise<User | null> {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || user.deletedAt !== null) {
    return null;
  }

  // Check if user is active
  if (!user.isActive) {
    return null;
  }

  // For now, we don't have password field in schema
  // This would require adding password field to User model
  // For MVP, we'll use Auth0 or similar OAuth provider
  // Placeholder for password verification:
  // const passwordMatch = await bcrypt.compare(_password, user.password);
  // if (!passwordMatch) {
  //   return null;
  // }

  return user;
}

/**
 * Generate JWT payload from user
 */
export function createJWTPayload(user: User): JWTPayload {
  return {
    userId: user.id,
    email: user.email,
    organizationId: user.organizationId,
    role: user.role,
  };
}

/**
 * Generate access token and refresh token
 */
export async function generateTokens(
  fastify: any,
  user: User
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = createJWTPayload(user);

  // Generate access token (short-lived: 15 minutes)
  const accessToken = fastify.jwt.sign(payload, {
    expiresIn: config.jwtExpiresIn,
  });

  // Generate refresh token (long-lived: 7 days)
  const refreshToken = fastify.jwt.sign(payload, {
    expiresIn: config.refreshTokenExpiresIn,
  });

  return { accessToken, refreshToken };
}

/**
 * Verify refresh token and generate new access token
 */
export async function refreshAccessToken(
  fastify: any,
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    // Verify refresh token
    const decoded = fastify.jwt.verify(refreshToken) as JWTPayload;

    // Load user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.deletedAt !== null || !user.isActive) {
      return null;
    }

    // Generate new tokens
    return await generateTokens(fastify, user);
  } catch (error) {
    return null;
  }
}

/**
 * Create login response
 */
export function createLoginResponse(
  user: User,
  accessToken: string,
  refreshToken: string
): LoginResponse {
  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId,
    },
    accessToken,
    refreshToken,
    expiresIn: config.jwtExpiresIn,
  };
}

/**
 * Hash password (for future use)
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify password (for future use)
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}
