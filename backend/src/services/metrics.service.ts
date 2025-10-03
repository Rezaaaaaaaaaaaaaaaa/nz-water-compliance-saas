/**
 * Metrics Service
 *
 * Sends custom application metrics to CloudWatch
 */

import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

const cloudwatch = new CloudWatchClient({
  region: config.aws.s3BucketRegion,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

const NAMESPACE = 'ComplianceSaaS';

/**
 * Send a metric to CloudWatch
 */
async function sendMetric(
  metricName: string,
  value: number,
  unit: string = 'Count',
  dimensions: Record<string, string> = {}
) {
  try {
    const command = new PutMetricDataCommand({
      Namespace: NAMESPACE,
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Timestamp: new Date(),
          Dimensions: Object.entries(dimensions).map(([name, value]) => ({
            Name: name,
            Value: value,
          })),
        },
      ],
    });

    await cloudwatch.send(command);
  } catch (error) {
    logger.error({ err: error, metricName, value }, 'Failed to send metric');
  }
}

/**
 * Track failed background job
 */
export async function trackFailedJob(jobName: string, error: Error) {
  await sendMetric('FailedJobs', 1, 'Count', {
    JobName: jobName,
    ErrorType: error.name,
  });
}

/**
 * Track compliance violation
 */
export async function trackComplianceViolation(
  organizationId: string,
  violationType: string
) {
  await sendMetric('ComplianceViolations', 1, 'Count', {
    OrganizationId: organizationId,
    ViolationType: violationType,
  });
}

/**
 * Track DWSP submission
 */
export async function trackDWSPSubmission(organizationId: string, status: string) {
  await sendMetric('DWSPSubmissions', 1, 'Count', {
    OrganizationId: organizationId,
    Status: status,
  });
}

/**
 * Track API response time
 */
export async function trackApiResponseTime(endpoint: string, duration: number) {
  await sendMetric('ApiResponseTime', duration, 'Milliseconds', {
    Endpoint: endpoint,
  });
}

/**
 * Track document upload
 */
export async function trackDocumentUpload(
  organizationId: string,
  documentType: string,
  sizeInBytes: number
) {
  await sendMetric('DocumentUploads', 1, 'Count', {
    OrganizationId: organizationId,
    DocumentType: documentType,
  });

  await sendMetric('DocumentUploadSize', sizeInBytes, 'Bytes', {
    OrganizationId: organizationId,
    DocumentType: documentType,
  });
}

/**
 * Track user login
 */
export async function trackUserLogin(role: string) {
  await sendMetric('UserLogins', 1, 'Count', {
    Role: role,
  });
}

/**
 * Track active users
 */
export async function trackActiveUsers(count: number) {
  await sendMetric('ActiveUsers', count, 'Count');
}

/**
 * Track asset risk levels
 */
export async function trackAssetRiskLevel(
  organizationId: string,
  riskLevel: string,
  count: number
) {
  await sendMetric('AssetsByRisk', count, 'Count', {
    OrganizationId: organizationId,
    RiskLevel: riskLevel,
  });
}

/**
 * Track report generation
 */
export async function trackReportGeneration(
  organizationId: string,
  reportType: string,
  duration: number
) {
  await sendMetric('ReportGenerations', 1, 'Count', {
    OrganizationId: organizationId,
    ReportType: reportType,
  });

  await sendMetric('ReportGenerationTime', duration, 'Milliseconds', {
    ReportType: reportType,
  });
}

/**
 * Track audit log creation
 */
export async function trackAuditLog(action: string, resourceType: string) {
  await sendMetric('AuditLogs', 1, 'Count', {
    Action: action,
    ResourceType: resourceType,
  });
}

/**
 * Track queue health
 */
export async function trackQueueHealth(
  queueName: string,
  waiting: number,
  active: number,
  failed: number
) {
  await sendMetric('QueueWaiting', waiting, 'Count', {
    QueueName: queueName,
  });

  await sendMetric('QueueActive', active, 'Count', {
    QueueName: queueName,
  });

  await sendMetric('QueueFailed', failed, 'Count', {
    QueueName: queueName,
  });
}

/**
 * Track database query performance
 */
export async function trackDatabaseQuery(queryType: string, duration: number) {
  await sendMetric('DatabaseQueryTime', duration, 'Milliseconds', {
    QueryType: queryType,
  });
}

/**
 * Send all current metrics (called periodically)
 */
export async function sendPeriodicMetrics() {
  try {
    // This would be called by a scheduled job to send periodic metrics
    logger.info('Sending periodic metrics to CloudWatch');

    // Add any periodic metric collection here
    // For example: active user count, queue depths, etc.
  } catch (error) {
    logger.error({ err: error }, 'Failed to send periodic metrics');
  }
}
