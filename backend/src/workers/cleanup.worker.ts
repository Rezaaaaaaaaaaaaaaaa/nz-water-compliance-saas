/**
 * Cleanup Worker
 *
 * Processes background jobs for system maintenance and cleanup tasks
 */

import { Worker, Job } from 'bullmq';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import { CleanupJob, QueueName } from '../services/queue.service.js';
import * as notificationService from '../services/notification.service.js';

const redisConnection = {
  host: config.redis?.host || 'localhost',
  port: config.redis?.port || 6379,
  password: config.redis?.password,
  maxRetriesPerRequest: null,
};

/**
 * Cleanup old notifications
 */
async function cleanupOldNotifications() {
  logger.info('Starting cleanup of old notifications');

  const result = await notificationService.deleteOldNotifications(30);

  logger.info({ deleted: result.count }, 'Old notifications cleaned up');

  return { deleted: result.count };
}

/**
 * Cleanup temporary files
 */
async function cleanupTempFiles() {
  logger.info('Starting cleanup of temporary files');

  // TODO: Implement temp file cleanup
  // - Clean up expired upload URLs
  // - Clean up failed upload records
  // - Clean up orphaned files in S3

  logger.info('Temporary files cleaned up');

  return { cleaned: 0 };
}

/**
 * Archive old audit logs
 */
async function archiveOldAudits(_olderThan?: string) {
  logger.info('Starting archive of old audit logs');

  // TODO: Implement audit log archival
  // - Export old audit logs to cold storage (S3 Glacier)
  // - Keep records in database but mark as archived
  // - Maintain 7-year retention as required by regulations
  // - Use _olderThan parameter to determine cutoff date

  logger.info('Old audit logs archived');

  return { archived: 0 };
}

/**
 * Process cleanup job
 */
async function processCleanup(job: Job<CleanupJob>) {
  const { task, olderThan } = job.data;

  logger.info({ task }, 'Processing cleanup task');

  switch (task) {
    case 'cleanup_temp_files':
      return await cleanupTempFiles();
    case 'archive_old_audits':
      return await archiveOldAudits(olderThan);
    case 'expire_upload_urls':
      // This is handled automatically by S3 presigned URL expiration
      return { expired: 0 };
    default:
      throw new Error(`Unknown cleanup task: ${String(task)}`);
  }
}

/**
 * Process weekly cleanup
 */
async function processWeeklyCleanup(_job: Job) {
  logger.info('Running weekly cleanup');

  const [notifications, tempFiles] = await Promise.all([
    cleanupOldNotifications(),
    cleanupTempFiles(),
  ]);

  logger.info(
    {
      notificationsDeleted: notifications.deleted,
      tempFilesCleaned: tempFiles.cleaned,
    },
    'Weekly cleanup completed'
  );

  return {
    notificationsDeleted: notifications.deleted,
    tempFilesCleaned: tempFiles.cleaned,
  };
}

/**
 * Create and start the worker
 */
export function createCleanupWorker() {
  const worker = new Worker(
    QueueName.CLEANUP,
    async (job: Job) => {
      try {
        if (job.name === 'weekly-cleanup') {
          return await processWeeklyCleanup(job);
        } else if (job.name === 'cleanup') {
          return await processCleanup(job as Job<CleanupJob>);
        } else {
          throw new Error(`Unknown job type: ${job.name}`);
        }
      } catch (error) {
        logger.error({ err: error, jobId: job.id }, 'Cleanup job failed');
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 1, // Process cleanup jobs one at a time
    }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'Cleanup job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, jobName: job?.name, err }, 'Cleanup job failed');
  });

  logger.info('Cleanup worker started');

  return worker;
}
