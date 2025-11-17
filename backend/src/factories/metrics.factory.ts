/**
 * Metrics Provider Factory
 *
 * Creates metrics provider instances based on environment configuration.
 */

import { IMetricsProvider } from '../interfaces/metrics.interface.js';
import { PrometheusMetricsProvider } from '../providers/metrics/prometheus.provider.js';
import { CloudWatchMetricsProvider } from '../providers/metrics/cloudwatch.provider.js';
import { DatadogMetricsProvider } from '../providers/metrics/datadog.provider.js';
import { logger } from '../config/logger.js';

export type MetricsProviderType = 'prometheus' | 'cloudwatch' | 'datadog';

/**
 * Create metrics provider instance
 *
 * @param type - Provider type
 * @returns Metrics provider instance
 */
export function createMetricsProvider(type?: MetricsProviderType): IMetricsProvider {
  const providerType = type || (process.env.METRICS_PROVIDER as MetricsProviderType) || 'prometheus';

  logger.info({ provider: providerType }, 'Creating metrics provider');

  switch (providerType) {
    case 'prometheus':
      return new PrometheusMetricsProvider();

    case 'cloudwatch':
      return new CloudWatchMetricsProvider({
        region: process.env.AWS_REGION || 'ap-southeast-2',
        namespace: process.env.CLOUDWATCH_NAMESPACE || 'FlowComply/Production',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });

    case 'datadog':
      return new DatadogMetricsProvider({
        host: process.env.DATADOG_AGENT_HOST || 'localhost',
        port: parseInt(process.env.DATADOG_AGENT_PORT || '8125', 10),
        prefix: process.env.DATADOG_METRIC_PREFIX || 'flowcomply.',
      });

    default:
      throw new Error(`Unknown metrics provider: ${providerType}`);
  }
}

/**
 * Global metrics provider instance
 */
let metricsProvider: IMetricsProvider | null = null;

/**
 * Get metrics provider singleton
 */
export function getMetricsProvider(): IMetricsProvider {
  if (!metricsProvider) {
    metricsProvider = createMetricsProvider();
  }
  return metricsProvider;
}
