/**
 * Queue Service
 *
 * Manages background job queues using BullMQ
 * Used for scheduled compliance reminders, reports, notifications, etc.
 */

import { Queue, QueueEvents } from 'bullmq';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

// Queue names for different job types
export enum QueueName {
  COMPLIANCE_REMINDERS = 'compliance-reminders',
  REPORTS = 'reports',
  NOTIFICATIONS = 'notifications',
  DATA_IMPORT = 'data-import',
  DATA_EXPORT = 'data-export',
  CLEANUP = 'cleanup',
}

// Job data types
export interface ComplianceReminderJob {
  organizationId: string;
  compliancePlanId: string;
  reminderType: 'upcoming_deadline' | 'overdue' | 'review_required';
  dueDate: string;
}

export interface ReportGenerationJob {
  organizationId: string;
  reportType: 'monthly' | 'quarterly' | 'annual' | 'custom';
  startDate: string;
  endDate: string;
  userId: string;
}

export interface NotificationJob {
  userId: string;
  type: 'email' | 'in_app' | 'both';
  subject: string;
  message: string;
  metadata?: any;
}

export interface DataExportJob {
  organizationId: string;
  userId: string;
  resourceType: string;
  filters?: any;
  format: 'csv' | 'xlsx' | 'pdf';
}

export interface CleanupJob {
  task: 'expire_upload_urls' | 'archive_old_audits' | 'cleanup_temp_files';
  olderThan?: string;
}

// Redis connection configuration
const redisConnection = {
  host: config.redis?.host || 'localhost',
  port: config.redis?.port || 6379,
  password: config.redis?.password,
  maxRetriesPerRequest: null,
};

// Queue instances
const queues = new Map<QueueName, Queue>();

/**
 * Get or create queue instance
 */
function getQueue(queueName: QueueName): Queue {
  if (!queues.has(queueName)) {
    const queue = new Queue(queueName, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 86400, // Keep completed jobs for 24 hours
          count: 1000,
        },
        removeOnFail: {
          age: 604800, // Keep failed jobs for 7 days
        },
      },
    });

    queues.set(queueName, queue);

    // Setup queue events for monitoring
    const queueEvents = new QueueEvents(queueName, {
      connection: redisConnection,
    });

    queueEvents.on('completed', ({ jobId }) => {
      logger.info({ queue: queueName, jobId }, 'Job completed');
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      logger.error({ queue: queueName, jobId, failedReason }, 'Job failed');
    });
  }

  return queues.get(queueName)!;
}

/**
 * Add compliance reminder job
 */
export async function addComplianceReminderJob(
  data: ComplianceReminderJob,
  scheduledFor?: Date
) {
  const queue = getQueue(QueueName.COMPLIANCE_REMINDERS);

  return await queue.add('compliance-reminder', data, {
    delay: scheduledFor ? scheduledFor.getTime() - Date.now() : undefined,
    jobId: `reminder-${data.compliancePlanId}-${data.reminderType}`,
  });
}

/**
 * Add report generation job
 */
export async function addReportGenerationJob(data: ReportGenerationJob) {
  const queue = getQueue(QueueName.REPORTS);

  return await queue.add('generate-report', data, {
    priority: 1, // Higher priority for user-requested reports
  });
}

/**
 * Add notification job
 */
export async function addNotificationJob(data: NotificationJob, delay?: number) {
  const queue = getQueue(QueueName.NOTIFICATIONS);

  return await queue.add('send-notification', data, {
    delay,
  });
}

/**
 * Add data export job
 */
export async function addDataExportJob(data: DataExportJob) {
  const queue = getQueue(QueueName.DATA_EXPORT);

  return await queue.add('export-data', data, {
    // timeout: 300000, // 5 minute timeout for large exports - timeout is not a valid JobsOptions property
  });
}

/**
 * Add cleanup job
 */
export async function addCleanupJob(data: CleanupJob) {
  const queue = getQueue(QueueName.CLEANUP);

  return await queue.add('cleanup', data, {
    priority: 10, // Lower priority for cleanup tasks
  });
}

/**
 * Schedule recurring compliance checks
 * Runs daily to check for upcoming deadlines and overdue tasks
 */
export async function scheduleRecurringComplianceChecks() {
  const queue = getQueue(QueueName.COMPLIANCE_REMINDERS);

  // Run daily at 8 AM
  await queue.add(
    'daily-compliance-check',
    { checkType: 'all' },
    {
      repeat: {
        pattern: '0 8 * * *', // Cron: every day at 8 AM
      },
      jobId: 'recurring-compliance-check',
    }
  );

  logger.info('Scheduled recurring compliance checks');
}

/**
 * Schedule recurring cleanup tasks
 * Runs weekly to clean up expired data
 */
export async function scheduleRecurringCleanup() {
  const queue = getQueue(QueueName.CLEANUP);

  // Run weekly on Sunday at 2 AM
  await queue.add(
    'weekly-cleanup',
    { task: 'cleanup_temp_files' },
    {
      repeat: {
        pattern: '0 2 * * 0', // Cron: every Sunday at 2 AM
      },
      jobId: 'recurring-weekly-cleanup',
    }
  );

  logger.info('Scheduled recurring cleanup tasks');
}

/**
 * Get queue statistics
 */
export async function getQueueStats(queueName: QueueName) {
  const queue = getQueue(queueName);

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    queueName,
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + delayed,
  };
}

/**
 * Get all queue statistics
 */
export async function getAllQueueStats() {
  const stats = await Promise.all(
    Object.values(QueueName).map((queueName) => getQueueStats(queueName))
  );

  return stats;
}

/**
 * Shutdown all queues gracefully
 */
export async function shutdownQueues() {
  logger.info('Shutting down queues...');

  for (const [name, queue] of queues) {
    await queue.close();
    logger.info({ queue: name }, 'Queue closed');
  }
}
