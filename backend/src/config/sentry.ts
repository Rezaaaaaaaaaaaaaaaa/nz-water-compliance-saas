/**
 * Sentry Configuration
 *
 * Error monitoring and performance tracking with Sentry
 */

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { config } from './index.js';

/**
 * Initialize Sentry
 *
 * Call this early in the application lifecycle
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.warn('Sentry DSN not configured. Error monitoring disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: config.nodeEnv,

    // Performance Monitoring
    tracesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0,

    // Profiling
    profilesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0,
    integrations: [
      new ProfilingIntegration(),
    ],

    // Release tracking
    release: process.env.SENTRY_RELEASE || 'unknown',

    // Filter sensitive data
    beforeSend(event, hint) {
      // Don't send certain errors
      if (event.exception) {
        const error = hint.originalException;

        // Skip 4xx client errors
        if (error && typeof error === 'object' && 'statusCode' in error) {
          const statusCode = (error as any).statusCode;
          if (statusCode >= 400 && statusCode < 500) {
            return null;
          }
        }
      }

      // Remove sensitive data
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
      }

      return event;
    },
  });

  console.log('Sentry initialized successfully');
}

/**
 * Capture exception with context
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture message with severity
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; [key: string]: any }): void {
  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUser(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Fastify Plugin for Sentry
 *
 * Automatically captures errors and adds request context
 */
export function sentryPlugin(fastify: FastifyInstance, options: any, done: () => void): void {
  // Add request data to Sentry scope
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    Sentry.getCurrentScope().setContext('request', {
      method: request.method,
      url: request.url,
      correlationId: request.id,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });

    // Add user context if available
    const user = (request as any).user;
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role,
      });
    }
  });

  // Capture errors
  fastify.addHook('onError', async (request, reply, error) => {
    // Add additional context
    Sentry.getCurrentScope().setExtra('correlationId', request.id);
    Sentry.getCurrentScope().setExtra('statusCode', reply.statusCode);

    // Capture exception (will be filtered by beforeSend)
    Sentry.captureException(error);
  });

  // Clear user context after response
  fastify.addHook('onResponse', async () => {
    Sentry.setUser(null);
  });

  done();
}
