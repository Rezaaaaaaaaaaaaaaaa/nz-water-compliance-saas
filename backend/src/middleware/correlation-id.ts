/**
 * Correlation ID Middleware
 *
 * Adds a unique correlation ID to each request for distributed tracing
 * and debugging across services.
 */

import { FastifyRequest, FastifyReply, FastifyPluginCallback } from 'fastify';
import { randomUUID } from 'crypto';

/**
 * Correlation ID Middleware
 *
 * - Extracts correlation ID from request headers or generates new one
 * - Attaches to request object
 * - Adds to response headers
 * - Adds to logger context
 */
export async function correlationIdMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Get correlation ID from header or generate new one
  const correlationId =
    (request.headers['x-correlation-id'] as string) ||
    (request.headers['x-request-id'] as string) ||
    randomUUID();

  // Store on request for easy access
  request.id = correlationId;

  // Add to response headers
  reply.header('x-correlation-id', correlationId);
  reply.header('x-request-id', correlationId);

  // Add to logger context (child logger)
  request.log = request.log.child({ correlationId });
}

/**
 * Fastify Plugin for Correlation ID
 *
 * Registers the middleware as a Fastify plugin
 */
export const correlationIdPlugin: FastifyPluginCallback = (fastify, _options, done) => {
  fastify.addHook('onRequest', correlationIdMiddleware);
  done();
};
