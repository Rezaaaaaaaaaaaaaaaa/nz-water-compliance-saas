/**
 * CSRF Protection Middleware
 *
 * Protects against Cross-Site Request Forgery attacks for state-changing operations.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import csrfProtection from '@fastify/csrf-protection';
import { logger } from '../config/logger.js';

/**
 * Register CSRF Protection
 *
 * Adds CSRF token generation and validation to Fastify.
 */
export async function registerCSRFProtection(fastify: FastifyInstance): Promise<void> {
  // Register CSRF plugin
  await fastify.register(csrfProtection, {
    // Session-based CSRF (requires session plugin)
    sessionPlugin: '@fastify/session',

    // Cookie options
    cookieOpts: {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      signed: true,
    },

    // Ignore GET, HEAD, OPTIONS (safe methods)
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  });

  logger.info('CSRF protection enabled');
}

/**
 * Generate CSRF Token Route Handler
 *
 * GET /api/v1/csrf-token
 */
export async function getCSRFToken(request: FastifyRequest, reply: FastifyReply): Promise<any> {
  // Generate token
  const token = await reply.generateCsrf();

  return {
    success: true,
    data: {
      csrfToken: token,
    },
  };
}

/**
 * CSRF Token Decorator
 *
 * Add CSRF token to response for forms
 */
export function addCSRFTokenDecorator(fastify: FastifyInstance): void {
  fastify.decorateReply('getCSRFToken', async function () {
    return await this.generateCsrf();
  });
}
