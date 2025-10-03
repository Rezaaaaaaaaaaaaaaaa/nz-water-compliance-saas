/**
 * Input Validation Middleware
 *
 * Comprehensive validation for request parameters
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z, ZodSchema } from 'zod';
import { logger } from '../config/logger.js';

/**
 * Common validation schemas
 */
export const CommonSchemas = {
  // Date range validation
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }).refine((data) => {
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);

      // End date must be after start date
      if (end <= start) {
        return false;
      }

      // Maximum 1 year range
      const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 365;
    }
    return true;
  }, {
    message: "Invalid date range: end must be after start, max 1 year range"
  }),

  // Pagination validation
  pagination: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1)).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional(),
  }),

  // ID validation
  cuid: z.string().cuid(),

  // Email validation
  email: z.string().email().toLowerCase(),

  // Export format validation
  exportFormat: z.enum(['csv', 'excel', 'pdf', 'text']).optional().default('csv'),
};

/**
 * Validate query parameters
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = schema.safeParse(request.query);

      if (!result.success) {
        logger.warn({ errors: result.error.errors }, 'Query validation failed');
        reply.status(400).send({
          success: false,
          error: 'Invalid query parameters',
          details: result.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }

      // Replace query with validated data
      request.query = result.data;
    } catch (error) {
      logger.error({ err: error }, 'Query validation error');
      reply.status(500).send({
        success: false,
        error: 'Validation error',
      });
    }
  };
}

/**
 * Validate request body
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = schema.safeParse(request.body);

      if (!result.success) {
        logger.warn({ errors: result.error.errors }, 'Body validation failed');
        reply.status(400).send({
          success: false,
          error: 'Invalid request body',
          details: result.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }

      // Replace body with validated data
      request.body = result.data;
    } catch (error) {
      logger.error({ err: error }, 'Body validation error');
      reply.status(500).send({
        success: false,
        error: 'Validation error',
      });
    }
  };
}

/**
 * Validate route parameters
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = schema.safeParse(request.params);

      if (!result.success) {
        logger.warn({ errors: result.error.errors }, 'Params validation failed');
        reply.status(400).send({
          success: false,
          error: 'Invalid route parameters',
          details: result.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }

      // Replace params with validated data
      request.params = result.data;
    } catch (error) {
      logger.error({ err: error }, 'Params validation error');
      reply.status(500).send({
        success: false,
        error: 'Validation error',
      });
    }
  };
}

/**
 * Sanitize string input (prevent injection)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}
