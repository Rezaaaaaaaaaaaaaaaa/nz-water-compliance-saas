/**
 * Datadog Metrics Provider
 *
 * Production-ready metrics for infrastructure-agnostic monitoring.
 * Supports StatsD protocol with Datadog extensions (tags, distributions).
 */

import { IMetricsProvider, IMetricTags } from '../../interfaces/metrics.interface.js';
import { logger } from '../../config/logger.js';
import { StatsD } from 'hot-shots';

export interface DatadogConfig {
  host?: string; // Default: localhost
  port?: number; // Default: 8125
  prefix?: string; // Metric prefix, e.g., 'flowcomply.'
  globalTags?: IMetricTags; // Tags applied to all metrics
  cacheDns?: boolean; // Cache DNS lookups for hostname
  errorHandler?: (error: Error) => void;
}

export class DatadogMetricsProvider implements IMetricsProvider {
  private client: StatsD;

  constructor(config: DatadogConfig = {}) {
    this.client = new StatsD({
      host: config.host || 'localhost',
      port: config.port || 8125,
      prefix: config.prefix || 'flowcomply.',
      globalTags: this.convertTags(config.globalTags),
      cacheDns: config.cacheDns ?? true,
      errorHandler: config.errorHandler || this.defaultErrorHandler,
    });

    logger.info(
      { host: config.host || 'localhost', port: config.port || 8125 },
      'Datadog metrics provider initialized'
    );
  }

  private defaultErrorHandler(error: Error): void {
    logger.error({ err: error }, 'Datadog StatsD error');
  }

  private convertTags(tags?: IMetricTags): string[] | undefined {
    if (!tags) return undefined;

    return Object.entries(tags).map(([key, value]) => `${key}:${value}`);
  }

  increment(name: string, value: number = 1, tags?: IMetricTags): void {
    try {
      this.client.increment(name, value, this.convertTags(tags));
    } catch (error) {
      logger.error({ err: error, name }, 'Failed to increment Datadog counter');
    }
  }

  decrement(name: string, value: number = 1, tags?: IMetricTags): void {
    try {
      this.client.decrement(name, value, this.convertTags(tags));
    } catch (error) {
      logger.error({ err: error, name }, 'Failed to decrement Datadog counter');
    }
  }

  gauge(name: string, value: number, tags?: IMetricTags): void {
    try {
      this.client.gauge(name, value, this.convertTags(tags));
    } catch (error) {
      logger.error({ err: error, name }, 'Failed to set Datadog gauge');
    }
  }

  histogram(name: string, value: number, tags?: IMetricTags): void {
    try {
      // Use Datadog's distribution metric for better percentile calculations
      this.client.distribution(name, value, this.convertTags(tags));
    } catch (error) {
      logger.error({ err: error, name }, 'Failed to observe Datadog histogram');
    }
  }

  async timing<T>(name: string, fn: () => Promise<T>, tags?: IMetricTags): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.client.timing(name, duration, this.convertTags(tags));
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.client.timing(name, duration, this.convertTags({ ...tags, error: 'true' }));
      throw error;
    }
  }

  startTimer(name: string, tags?: IMetricTags): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.client.timing(name, duration, this.convertTags(tags));
    };
  }

  async flush(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.close((error) => {
        if (error) {
          logger.error({ err: error }, 'Failed to flush Datadog metrics');
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Send a service check to Datadog
   *
   * @param name - Service check name
   * @param status - 0 = OK, 1 = WARNING, 2 = CRITICAL, 3 = UNKNOWN
   * @param tags - Optional tags
   * @param message - Optional message
   */
  serviceCheck(
    name: string,
    status: 0 | 1 | 2 | 3,
    tags?: IMetricTags,
    message?: string
  ): void {
    try {
      this.client.check(name, status, {
        tags: this.convertTags(tags),
        message,
      });
    } catch (error) {
      logger.error({ err: error, name }, 'Failed to send Datadog service check');
    }
  }

  /**
   * Send an event to Datadog
   *
   * @param title - Event title
   * @param text - Event text
   * @param tags - Optional tags
   * @param alertType - 'info', 'warning', 'error', 'success'
   */
  event(
    title: string,
    text: string,
    tags?: IMetricTags,
    alertType: 'info' | 'warning' | 'error' | 'success' = 'info'
  ): void {
    try {
      this.client.event(title, text, {
        tags: this.convertTags(tags),
        alert_type: alertType,
      });
    } catch (error) {
      logger.error({ err: error, title }, 'Failed to send Datadog event');
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.client.close((error) => {
      if (error) {
        logger.error({ err: error }, 'Error closing Datadog client');
      }
    });
  }
}
