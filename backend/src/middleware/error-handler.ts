/**
 * Global Error Handler Middleware
 *
 * Provides centralized error handling with consistent response format
 * and comprehensive logging for all API errors.
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { logger } from '../config/logger.js';
import { ZodError } from 'zod';

/**
 * Custom Application Error
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: Record<string, any>): AppError {
    return new AppError(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = 'Unauthorized'): AppError {
    return new AppError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Forbidden'): AppError {
    return new AppError(403, message, 'FORBIDDEN');
  }

  static notFound(resource: string = 'Resource'): AppError {
    return new AppError(404, `${resource} not found`, 'NOT_FOUND');
  }

  static conflict(message: string, details?: Record<string, any>): AppError {
    return new AppError(409, message, 'CONFLICT', details);
  }

  static internal(message: string = 'Internal server error'): AppError {
    return new AppError(500, message, 'INTERNAL_ERROR');
  }

  static validation(message: string, details?: Record<string, any>): AppError {
    return new AppError(422, message, 'VALIDATION_ERROR', details);
  }
}

/**
 * Format Zod validation errors
 */
function formatZodError(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(err.message);
  });

  return formatted;
}

/**
 * Global Error Handler
 *
 * Handles all errors thrown in route handlers and middleware
 */
export async function errorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const correlationId = request.id;
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: Record<string, any> | undefined;

  // Handle known error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    errorCode = error.code || 'APPLICATION_ERROR';
    message = error.message;
    details = error.details;
  } else if (error instanceof ZodError) {
    statusCode = 422;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = { fields: formatZodError(error) };
  } else if ('statusCode' in error && error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
    errorCode = error.code || 'HTTP_ERROR';
  } else if (error.name === 'PrismaClientKnownRequestError') {
    // Handle Prisma errors
    statusCode = 400;
    errorCode = 'DATABASE_ERROR';
    message = 'Database operation failed';
    details = { code: (error as any).code };
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = 'Authentication failed';
  } else {
    message = error.message || message;
  }

  // Log error with context
  const logContext = {
    err: error,
    correlationId,
    statusCode,
    errorCode,
    userId: (request as any).user?.id,
    organizationId: (request as any).user?.organizationId,
    path: request.url,
    method: request.method,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  };

  if (statusCode >= 500) {
    logger.error(logContext, 'Internal server error');
  } else if (statusCode >= 400) {
    logger.warn(logContext, 'Client error');
  }

  // Send error response
  const errorResponse: any = {
    success: false,
    error: {
      message,
      code: errorCode,
      statusCode,
      correlationId,
    },
  };

  // Add details if present
  if (details) {
    errorResponse.error.details = details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    errorResponse.error.stack = error.stack.split('\n');
  }

  // Add timestamp
  errorResponse.error.timestamp = new Date().toISOString();

  reply.code(statusCode).send(errorResponse);
}

/**
 * Not Found Handler
 *
 * Handles 404 errors for undefined routes
 */
export function notFoundHandler(request: FastifyRequest, reply: FastifyReply): void {
  reply.code(404).send({
    success: false,
    error: {
      message: `Route ${request.method} ${request.url} not found`,
      code: 'NOT_FOUND',
      statusCode: 404,
      correlationId: request.id,
      timestamp: new Date().toISOString(),
    },
  });
}
