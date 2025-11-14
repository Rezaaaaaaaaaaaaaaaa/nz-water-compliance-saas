/**
 * Prometheus Metrics
 *
 * Application performance monitoring with Prometheus-compatible metrics
 */

import { Registry, Histogram, Counter, Gauge, collectDefaultMetrics } from 'prom-client';
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../config/logger.js';

// Create registry
export const register = new Registry();

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

/**
 * HTTP Request Metrics
 */
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestSize = new Histogram({
  name: 'http_request_size_bytes',
  help: 'Size of HTTP requests in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 10000, 100000, 1000000],
  registers: [register],
});

export const httpResponseSize = new Histogram({
  name: 'http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 10000, 100000, 1000000],
  registers: [register],
});

/**
 * Database Query Metrics
 */
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

export const dbQueryTotal = new Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'model', 'status'],
  registers: [register],
});

export const dbConnectionsActive = new Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections',
  registers: [register],
});

/**
 * Cache Metrics
 */
export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_name'],
  registers: [register],
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_name'],
  registers: [register],
});

export const cacheOperationDuration = new Histogram({
  name: 'cache_operation_duration_seconds',
  help: 'Duration of cache operations',
  labelNames: ['operation', 'cache_name'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1],
  registers: [register],
});

/**
 * Business Metrics
 */
export const complianceScoreGauge = new Gauge({
  name: 'compliance_score',
  help: 'Current compliance score for organizations',
  labelNames: ['organization_id'],
  registers: [register],
});

export const assetsTotal = new Gauge({
  name: 'assets_total',
  help: 'Total number of assets',
  labelNames: ['organization_id', 'type', 'risk_level'],
  registers: [register],
});

export const criticalAssetsGauge = new Gauge({
  name: 'critical_assets_total',
  help: 'Number of critical assets',
  labelNames: ['organization_id'],
  registers: [register],
});

export const compliancePlansTotal = new Gauge({
  name: 'compliance_plans_total',
  help: 'Total number of compliance plans',
  labelNames: ['organization_id', 'status'],
  registers: [register],
});

export const waterQualityTestsTotal = new Counter({
  name: 'water_quality_tests_total',
  help: 'Total number of water quality tests',
  labelNames: ['organization_id', 'parameter', 'is_compliant'],
  registers: [register],
});

export const anomaliesDetected = new Counter({
  name: 'water_quality_anomalies_total',
  help: 'Total number of water quality anomalies detected',
  labelNames: ['organization_id', 'parameter'],
  registers: [register],
});

/**
 * AI Metrics
 */
export const aiRequestsTotal = new Counter({
  name: 'ai_requests_total',
  help: 'Total number of AI requests',
  labelNames: ['feature', 'status'],
  registers: [register],
});

export const aiTokensUsed = new Counter({
  name: 'ai_tokens_used_total',
  help: 'Total number of AI tokens used',
  labelNames: ['feature'],
  registers: [register],
});

export const aiRequestDuration = new Histogram({
  name: 'ai_request_duration_seconds',
  help: 'Duration of AI requests',
  labelNames: ['feature'],
  buckets: [1, 2, 5, 10, 30, 60],
  registers: [register],
});

export const aiCostTotal = new Counter({
  name: 'ai_cost_total_cents',
  help: 'Total AI cost in cents',
  labelNames: ['organization_id', 'feature'],
  registers: [register],
});

/**
 * WebSocket Metrics
 */
export const wsConnectionsActive = new Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

export const wsMessagesTotal = new Counter({
  name: 'websocket_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['type', 'direction'],
  registers: [register],
});

/**
 * Job Queue Metrics
 */
export const jobsProcessed = new Counter({
  name: 'jobs_processed_total',
  help: 'Total number of jobs processed',
  labelNames: ['queue', 'status'],
  registers: [register],
});

export const jobDuration = new Histogram({
  name: 'job_duration_seconds',
  help: 'Duration of job processing',
  labelNames: ['queue', 'job_name'],
  buckets: [1, 5, 10, 30, 60, 300, 600],
  registers: [register],
});

export const jobsWaiting = new Gauge({
  name: 'jobs_waiting',
  help: 'Number of jobs waiting in queue',
  labelNames: ['queue'],
  registers: [register],
});

/**
 * Error Metrics
 */
export const errorsTotal = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'severity'],
  registers: [register],
});

/**
 * Metrics Middleware
 *
 * Automatically tracks HTTP request metrics
 */
export function metricsMiddleware() {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const start = Date.now();

    reply.addHook('onSend', async (request, reply) => {
      const duration = (Date.now() - start) / 1000;
      const route = request.routeOptions.url || request.url;
      const method = request.method;
      const statusCode = reply.statusCode;

      // Record metrics
      httpRequestDuration.labels(method, route, statusCode.toString()).observe(duration);
      httpRequestTotal.labels(method, route, statusCode.toString()).inc();

      // Log slow requests
      if (duration > 5) {
        logger.warn({
          method,
          route,
          duration,
          statusCode,
        }, 'Slow request detected');
      }
    });
  };
}

/**
 * Update business metrics
 */
export async function updateBusinessMetrics(organizationId: string, data: any): Promise<void> {
  try {
    if (data.complianceScore !== undefined) {
      complianceScoreGauge.labels(organizationId).set(data.complianceScore);
    }

    if (data.criticalAssets !== undefined) {
      criticalAssetsGauge.labels(organizationId).set(data.criticalAssets);
    }

    // Update other metrics as needed
  } catch (error) {
    logger.error({ error, organizationId }, 'Failed to update business metrics');
  }
}

/**
 * Record database query
 */
export function recordDbQuery(operation: string, model: string, duration: number, success: boolean): void {
  dbQueryDuration.labels(operation, model).observe(duration);
  dbQueryTotal.labels(operation, model, success ? 'success' : 'error').inc();
}

/**
 * Record cache operation
 */
export function recordCacheOperation(operation: 'hit' | 'miss', cacheName: string, duration?: number): void {
  if (operation === 'hit') {
    cacheHits.labels(cacheName).inc();
  } else {
    cacheMisses.labels(cacheName).inc();
  }

  if (duration !== undefined) {
    cacheOperationDuration.labels(operation, cacheName).observe(duration);
  }
}

/**
 * Record AI request
 */
export function recordAiRequest(
  feature: string,
  tokensUsed: number,
  costCents: number,
  duration: number,
  organizationId: string,
  success: boolean
): void {
  aiRequestsTotal.labels(feature, success ? 'success' : 'error').inc();
  aiTokensUsed.labels(feature).inc(tokensUsed);
  aiRequestDuration.labels(feature).observe(duration);
  aiCostTotal.labels(organizationId, feature).inc(costCents);
}
