/**
 * AWS CloudWatch Metrics Provider
 *
 * Production-ready metrics for AWS cloud deployments.
 * Integrates with CloudWatch for monitoring, alerting, and dashboards.
 */

import { IMetricsProvider, IMetricTags } from '../../interfaces/metrics.interface.js';
import { logger } from '../../config/logger.js';
import {
  CloudWatchClient,
  PutMetricDataCommand,
  MetricDatum,
  StandardUnit,
} from '@aws-sdk/client-cloudwatch';

export interface CloudWatchConfig {
  region: string;
  namespace: string; // e.g., 'FlowComply/Production'
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
}

export class CloudWatchMetricsProvider implements IMetricsProvider {
  private client: CloudWatchClient;
  private namespace: string;
  private buffer: MetricDatum[] = [];
  private bufferSize: number = 20; // CloudWatch allows max 20 metrics per request
  private flushInterval: NodeJS.Timeout;

  constructor(config: CloudWatchConfig) {
    this.namespace = config.namespace;

    this.client = new CloudWatchClient({
      region: config.region,
      credentials: config.accessKeyId
        ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey!,
            sessionToken: config.sessionToken,
          }
        : undefined,
    });

    // Auto-flush every 60 seconds
    this.flushInterval = setInterval(() => {
      this.flush().catch((err) => {
        logger.error({ err }, 'Failed to auto-flush CloudWatch metrics');
      });
    }, 60000);

    logger.info({ namespace: config.namespace }, 'CloudWatch metrics provider initialized');
  }

  private convertTags(tags?: IMetricTags): Array<{ Name: string; Value: string }> {
    if (!tags) return [];

    return Object.entries(tags).map(([key, value]) => ({
      Name: key,
      Value: String(value),
    }));
  }

  private addToBuffer(metricDatum: MetricDatum): void {
    this.buffer.push(metricDatum);

    if (this.buffer.length >= this.bufferSize) {
      this.flush().catch((err) => {
        logger.error({ err }, 'Failed to flush CloudWatch metrics buffer');
      });
    }
  }

  increment(name: string, value: number = 1, tags?: IMetricTags): void {
    try {
      const metricDatum: MetricDatum = {
        MetricName: name,
        Value: value,
        Unit: StandardUnit.Count,
        Timestamp: new Date(),
        Dimensions: this.convertTags(tags),
      };

      this.addToBuffer(metricDatum);
    } catch (error) {
      logger.error({ err: error, name }, 'Failed to increment CloudWatch metric');
    }
  }

  decrement(name: string, value: number = 1, tags?: IMetricTags): void {
    // CloudWatch doesn't have native decrement, use negative value
    this.increment(name, -value, tags);
  }

  gauge(name: string, value: number, tags?: IMetricTags): void {
    try {
      const metricDatum: MetricDatum = {
        MetricName: name,
        Value: value,
        Unit: StandardUnit.None,
        Timestamp: new Date(),
        Dimensions: this.convertTags(tags),
      };

      this.addToBuffer(metricDatum);
    } catch (error) {
      logger.error({ err: error, name }, 'Failed to set CloudWatch gauge');
    }
  }

  histogram(name: string, value: number, tags?: IMetricTags): void {
    try {
      const metricDatum: MetricDatum = {
        MetricName: name,
        Value: value,
        Unit: StandardUnit.None,
        Timestamp: new Date(),
        Dimensions: this.convertTags(tags),
      };

      this.addToBuffer(metricDatum);
    } catch (error) {
      logger.error({ err: error, name }, 'Failed to observe CloudWatch histogram');
    }
  }

  async timing<T>(name: string, fn: () => Promise<T>, tags?: IMetricTags): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.histogram(`${name}_duration`, duration, { ...tags, unit: 'milliseconds' });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.histogram(`${name}_duration`, duration, {
        ...tags,
        error: 'true',
        unit: 'milliseconds',
      });
      throw error;
    }
  }

  startTimer(name: string, tags?: IMetricTags): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.histogram(`${name}_duration`, duration, { ...tags, unit: 'milliseconds' });
    };
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    try {
      const metricsToSend = this.buffer.splice(0, this.bufferSize);

      const command = new PutMetricDataCommand({
        Namespace: this.namespace,
        MetricData: metricsToSend,
      });

      await this.client.send(command);

      logger.debug({ count: metricsToSend.length }, 'Flushed CloudWatch metrics');
    } catch (error) {
      logger.error({ err: error }, 'Failed to flush CloudWatch metrics');
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    this.flush().catch((err) => {
      logger.error({ err }, 'Failed to flush on destroy');
    });
  }
}
