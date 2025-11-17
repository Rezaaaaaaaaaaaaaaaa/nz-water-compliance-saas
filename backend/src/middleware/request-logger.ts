/**
 * Request/Response Logging Middleware
 *
 * Structured logging of all HTTP requests and responses
 * for debugging, auditing, and performance monitoring.
 */

import { FastifyRequest, FastifyReply, FastifyPluginCallback } from 'fastify';

/**
 * Request Logger Middleware
 *
 * Logs incoming requests and outgoing responses with:
 * - Request details (method, URL, headers, query, body)
 * - Response details (status code, duration)
 * - User context (if authenticated)
 * - Correlation ID for tracing
 */
export async function requestLoggerMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const start = Date.now();

  // Log incoming request
  request.log.info({
    type: 'request',
    method: request.method,
    url: request.url,
    correlationId: request.id,
    query: request.query,
    userId: (request as any).user?.id,
    organizationId: (request as any).user?.organizationId,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
    referer: request.headers.referer,
  }, 'Incoming request');

  // Store start time for response hook
  (reply as any).startTime = start;
}

/**
 * Fastify Plugin for Request Logging
 */
export const requestLoggerPlugin: FastifyPluginCallback = (fastify, _options, done) => {
  fastify.addHook('onRequest', requestLoggerMiddleware);

  // Log response when sent
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const start = (reply as any).startTime || Date.now();
    const duration = Date.now() - start;

    const logData = {
      type: 'response',
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration,
      correlationId: request.id,
      userId: (request as any).user?.id,
      contentLength: reply.getHeader('content-length'),
    };

    // Log based on status code
    if (reply.statusCode >= 500) {
      request.log.error(logData, 'Response sent (server error)');
    } else if (reply.statusCode >= 400) {
      request.log.warn(logData, 'Response sent (client error)');
    } else if (duration > 5000) {
      // Slow request warning
      request.log.warn(logData, 'Response sent (slow request)');
    } else {
      request.log.info(logData, 'Response sent');
    }
  });

  done();
};
