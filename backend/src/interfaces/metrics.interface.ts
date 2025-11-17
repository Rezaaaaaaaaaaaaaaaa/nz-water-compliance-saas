/**
 * Metrics Provider Interface
 *
 * Infrastructure-agnostic metrics/monitoring abstraction.
 * Supports CloudWatch, Prometheus, Datadog, StatsD, and others.
 */

export interface IMetricTags {
  [key: string]: string | number;
}

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
}

export interface IMetricsProvider {
  /**
   * Increment a counter metric
   *
   * @param name - Metric name
   * @param value - Value to increment by (default: 1)
   * @param tags - Optional tags/labels
   */
  increment(name: string, value?: number, tags?: IMetricTags): void;

  /**
   * Decrement a counter metric
   *
   * @param name - Metric name
   * @param value - Value to decrement by (default: 1)
   * @param tags - Optional tags/labels
   */
  decrement(name: string, value?: number, tags?: IMetricTags): void;

  /**
   * Set a gauge metric (current value)
   *
   * @param name - Metric name
   * @param value - Current value
   * @param tags - Optional tags/labels
   */
  gauge(name: string, value: number, tags?: IMetricTags): void;

  /**
   * Record a histogram value (distribution)
   *
   * @param name - Metric name
   * @param value - Value to record
   * @param tags - Optional tags/labels
   */
  histogram(name: string, value: number, tags?: IMetricTags): void;

  /**
   * Time an operation
   *
   * @param name - Metric name
   * @param fn - Function to time
   * @param tags - Optional tags/labels
   * @returns Result of fn
   */
  timing<T>(name: string, fn: () => Promise<T>, tags?: IMetricTags): Promise<T>;

  /**
   * Start a timer (returns stop function)
   *
   * @param name - Metric name
   * @param tags - Optional tags/labels
   * @returns Function to stop the timer
   */
  startTimer(name: string, tags?: IMetricTags): () => void;

  /**
   * Flush metrics (for buffered providers)
   */
  flush(): Promise<void>;
}
