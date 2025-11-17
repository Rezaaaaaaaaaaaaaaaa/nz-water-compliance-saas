/**
 * OpenTelemetry Configuration
 *
 * Production-ready APM integration for infrastructure-agnostic monitoring.
 * Supports multiple exporters: OTLP, Jaeger, Zipkin, Console.
 *
 * NOTE: This is a stub implementation when OpenTelemetry packages are not installed.
 * Install @opentelemetry/* packages for full telemetry support.
 */

import { logger } from './logger.js';
import { config } from './index.js';

// Type stubs for when OpenTelemetry packages aren't installed
type NodeSDK = any;

/**
 * OpenTelemetry SDK instance
 */
let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry
 *
 * Must be called before importing any instrumented modules.
 *
 * NOTE: Stub implementation - OpenTelemetry packages not installed.
 */
export function initTelemetry(): NodeSDK | null {
  // Only enable if configured
  if (!config.telemetry?.enabled) {
    logger.info('OpenTelemetry disabled');
    return null;
  }

  logger.warn('OpenTelemetry packages not installed - telemetry disabled. Install @opentelemetry/* packages for full support.');
  return null;
}

/**
 * Shutdown OpenTelemetry
 *
 * Call during application shutdown to flush pending telemetry.
 */
export async function shutdownTelemetry(): Promise<void> {
  if (sdk) {
    try {
      await sdk.shutdown();
      logger.info('OpenTelemetry shutdown complete');
    } catch (error) {
      logger.error({ err: error }, 'Error during OpenTelemetry shutdown');
    }
  }
}

/**
 * Get active span from context (stub exports)
 */
export const trace = null;
export const context = null;
export const SpanStatusCode = null;
