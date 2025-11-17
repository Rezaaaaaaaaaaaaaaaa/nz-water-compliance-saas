/**
 * Prometheus Metrics Provider
 *
 * Exports metrics in Prometheus format for infrastructure-agnostic monitoring.
 */

import { IMetricsProvider, IMetricTags, MetricType } from '../../interfaces/metrics.interface.js';
import { logger } from '../../config/logger.js';
import promClient from 'prom-client';

export class PrometheusMetricsProvider implements IMetricsProvider {
  private registry: promClient.Registry;
  private counters: Map<string, promClient.Counter>;
  private gauges: Map<string, promClient.Gauge>;
  private histograms: Map<string, promClient.Histogram>;

  constructor() {
    this.registry = new promClient.Registry();
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();

    // Collect default metrics (CPU, memory, etc.)
    promClient.collectDefaultMetrics({ register: this.registry });

    logger.info('Prometheus metrics provider initialized');
  }

  private getOrCreateCounter(name: string): promClient.Counter {
    if (!this.counters.has(name)) {
      const counter = new promClient.Counter({
        name: this.sanitizeMetricName(name),
        help: `Counter for ${name}`,
        labelNames: ['tag_key'],
        registers: [this.registry],
      });
      this.counters.set(name, counter);
    }
    return this.counters.get(name)!;
  }

  private getOrCreateGauge(name: string): promClient.Gauge {
    if (!this.gauges.has(name)) {
      const gauge = new promClient.Gauge({
        name: this.sanitizeMetricName(name),
        help: `Gauge for ${name}`,
        labelNames: ['tag_key'],
        registers: [this.registry],
      });
      this.gauges.set(name, gauge);
    }
    return this.gauges.get(name)!;
  }

  private getOrCreateHistogram(name: string): promClient.Histogram {
    if (!this.histograms.has(name)) {
      const histogram = new promClient.Histogram({
        name: this.sanitizeMetricName(name),
        help: `Histogram for ${name}`,
        labelNames: ['tag_key'],
        registers: [this.registry],
      });
      this.histograms.set(name, histogram);
    }
    return this.histograms.get(name)!;
  }

  private sanitizeMetricName(name: string): string {
    // Prometheus metric names must match [a-zA-Z_:][a-zA-Z0-9_:]*
    return name.replace(/[^a-zA-Z0-9_:]/g, '_');
  }

  private convertTags(tags?: IMetricTags): Record<string, string> {
    if (!tags) return {};

    const converted: Record<string, string> = {};
    for (const [key, value] of Object.entries(tags)) {
      converted[key] = String(value);
    }
    return converted;
  }

  increment(name: string, value: number = 1, tags?: IMetricTags): void {
    try {
      const counter = this.getOrCreateCounter(name);
      counter.inc(this.convertTags(tags), value);
    } catch (error) {
      logger.error({ err: error, name }, 'Failed to increment Prometheus counter');
    }
  }

  decrement(name: string, value: number = 1, tags?: IMetricTags): void {
    // Prometheus doesn't support decrement on counters
    // Use gauge instead
    this.gauge(name, -value, tags);
  }

  gauge(name: string, value: number, tags?: IMetricTags): void {
    try {
      const gauge = this.getOrCreateGauge(name);
      gauge.set(this.convertTags(tags), value);
    } catch (error) {
      logger.error({ err: error, name }, 'Failed to set Prometheus gauge');
    }
  }

  histogram(name: string, value: number, tags?: IMetricTags): void {
    try {
      const histogram = this.getOrCreateHistogram(name);
      histogram.observe(this.convertTags(tags), value);
    } catch (error) {
      logger.error({ err: error, name }, 'Failed to observe Prometheus histogram');
    }
  }

  async timing<T>(name: string, fn: () => Promise<T>, tags?: IMetricTags): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = (Date.now() - start) / 1000; // Convert to seconds
      this.histogram(`${name}_duration`, duration, tags);
      return result;
    } catch (error) {
      const duration = (Date.now() - start) / 1000;
      this.histogram(`${name}_duration`, duration, { ...tags, error: 'true' });
      throw error;
    }
  }

  startTimer(name: string, tags?: IMetricTags): () => void {
    const start = Date.now();
    return () => {
      const duration = (Date.now() - start) / 1000;
      this.histogram(`${name}_duration`, duration, tags);
    };
  }

  async flush(): Promise<void> {
    // Prometheus doesn't need explicit flushing
    // Metrics are scraped by Prometheus server
  }

  /**
   * Get metrics in Prometheus format
   *
   * For /metrics endpoint
   */
  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  /**
   * Get metrics in JSON format
   */
  async getMetricsJSON(): Promise<promClient.metric[]> {
    return await this.registry.getMetricsAsJSON();
  }
}
