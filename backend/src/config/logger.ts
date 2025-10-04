/**
 * Logging Configuration
 *
 * Structured logging for the NZ Water Compliance SaaS backend
 * using Pino logger with appropriate settings for each environment.
 */

import pino from 'pino';
import { config } from './index.js';

/**
 * Create logger instance with environment-appropriate configuration
 */
export const logger = pino({
  level: config.logLevel,

  // Use pretty printing in development for better readability
  transport:
    config.nodeEnv === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        }
      : undefined,

  // Structured logging for production
  formatters:
    config.nodeEnv === 'production'
      ? {
          level: (label) => {
            return { level: label };
          },
          bindings: (bindings) => {
            return {
              pid: bindings.pid,
              hostname: bindings.hostname,
              node_version: process.version,
            };
          },
        }
      : undefined,

  // Base fields included in every log
  base: {
    env: config.nodeEnv,
    app: 'compliance-saas-backend',
  },

  // Timestamp format
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,

  // Redact sensitive information
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'secret',
      'apiKey',
      'aws.accessKeyId',
      'aws.secretAccessKey',
    ],
    censor: '[REDACTED]',
  },
});

/**
 * Create a child logger with additional context
 *
 * @param context - Additional context to include in all logs
 * @returns Child logger instance
 *
 * @example
 * const requestLogger = createLogger({ requestId: '123', userId: 'user-456' });
 * requestLogger.info('Processing request');
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

/**
 * Log audit events
 * Audit logs are critical for regulatory compliance and must be preserved
 *
 * @param event - Audit event details
 *
 * @example
 * logAudit({
 *   userId: 'user-123',
 *   action: 'DELETE_ASSET',
 *   resourceType: 'asset',
 *   resourceId: 'asset-456',
 *   organizationId: 'org-789',
 *   ipAddress: '192.168.1.1',
 *   changes: { before: {...}, after: {...} }
 * });
 */
export function logAudit(event: {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  organizationId: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: unknown;
  metadata?: Record<string, unknown>;
}) {
  // Audit logs use a specific level and format for easy filtering
  logger.info(
    {
      type: 'AUDIT',
      ...event,
      timestamp: new Date().toISOString(),
    },
    'Audit Event'
  );
}

/**
 * Log security events (authentication failures, authorization denials, etc.)
 *
 * @param event - Security event details
 *
 * @example
 * logSecurity({
 *   type: 'AUTH_FAILURE',
 *   userId: 'user-123',
 *   ipAddress: '192.168.1.1',
 *   reason: 'Invalid credentials'
 * });
 */
export function logSecurity(event: {
  type: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}) {
  logger.warn(
    {
      ...event,
      timestamp: new Date().toISOString(),
    },
    'Security Event'
  );
}

/**
 * Log performance metrics
 *
 * @param metric - Performance metric details
 *
 * @example
 * logPerformance({
 *   operation: 'database_query',
 *   duration: 245,
 *   query: 'SELECT * FROM assets',
 *   success: true
 * });
 */
export function logPerformance(metric: {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, unknown>;
}) {
  const level = metric.duration > 1000 ? 'warn' : 'debug';
  logger[level](
    {
      type: 'PERFORMANCE',
      ...metric,
      timestamp: new Date().toISOString(),
    },
    `Performance: ${metric.operation} took ${metric.duration}ms`
  );
}

export default logger;
