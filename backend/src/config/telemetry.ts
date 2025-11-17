/**
 * OpenTelemetry Tracing Utilities
 *
 * Helper functions for manual instrumentation and custom spans.
 */

import { trace, context, SpanStatusCode, Span } from '@opentelemetry/api';
import { logger } from './logger.js';

const tracer = trace.getTracer('flowcomply-backend');

/**
 * Create a custom span for manual instrumentation
 *
 * @param name - Span name
 * @param fn - Function to execute within span
 * @param attributes - Optional span attributes
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      // Add custom attributes
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      }

      // Execute function
      const result = await fn(span);

      // Mark span as successful
      span.setStatus({ code: SpanStatusCode.OK });

      return result;
    } catch (error: any) {
      // Record error
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });

      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Add custom attributes to current span
 *
 * @param attributes - Attributes to add
 */
export function addSpanAttributes(attributes: Record<string, string | number | boolean>): void {
  const span = trace.getActiveSpan();
  if (span) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }
}

/**
 * Record an event in the current span
 *
 * @param name - Event name
 * @param attributes - Event attributes
 */
export function recordSpanEvent(
  name: string,
  attributes?: Record<string, string | number | boolean>
): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Trace a database query
 *
 * @param operation - Query operation (SELECT, INSERT, UPDATE, DELETE)
 * @param table - Table name
 * @param fn - Query function
 */
export async function traceDbQuery<T>(
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> {
  return withSpan(
    `db.${operation.toLowerCase()}`,
    async (span) => {
      span.setAttribute('db.operation', operation);
      span.setAttribute('db.table', table);
      span.setAttribute('db.system', 'postgresql');

      return await fn();
    }
  );
}

/**
 * Trace an external API call
 *
 * @param service - Service name (e.g., 'anthropic', 'stripe')
 * @param operation - Operation name
 * @param fn - API call function
 */
export async function traceExternalCall<T>(
  service: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return withSpan(
    `external.${service}.${operation}`,
    async (span) => {
      span.setAttribute('external.service', service);
      span.setAttribute('external.operation', operation);

      return await fn();
    }
  );
}

/**
 * Trace a cache operation
 *
 * @param operation - Cache operation (get, set, delete)
 * @param key - Cache key
 * @param fn - Cache operation function
 */
export async function traceCacheOperation<T>(
  operation: 'get' | 'set' | 'delete',
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  return withSpan(
    `cache.${operation}`,
    async (span) => {
      span.setAttribute('cache.operation', operation);
      span.setAttribute('cache.key', key);
      span.setAttribute('cache.system', 'redis');

      return await fn();
    }
  );
}

/**
 * Trace an AI operation
 *
 * @param model - AI model name
 * @param operation - Operation name
 * @param fn - AI operation function
 */
export async function traceAIOperation<T>(
  model: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return withSpan(
    `ai.${operation}`,
    async (span) => {
      span.setAttribute('ai.model', model);
      span.setAttribute('ai.operation', operation);
      span.setAttribute('ai.provider', 'anthropic');

      return await fn();
    }
  );
}

export { trace, context, SpanStatusCode, tracer };
