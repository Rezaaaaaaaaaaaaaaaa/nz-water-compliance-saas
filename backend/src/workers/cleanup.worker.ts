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
import { prisma } from '../config/database.js';

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

  // Clean up orphaned documents (deleted but files still in S3)
  // Find documents that were soft-deleted more than 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const orphanedDocuments = await prisma.document.findMany({
    where: {
      deletedAt: {
        lte: thirtyDaysAgo,
      },
    },
    select: {
      id: true,
      fileKey: true,
      fileName: true,
    },
  });

  let deletedCount = 0;
  let errorCount = 0;

  // Delete files from S3 and database
  for (const doc of orphanedDocuments) {
    try {
      // Delete from S3
      const { deleteFile } = await import('../services/s3.service.js');
      await deleteFile(doc.fileKey);

      // Permanently delete from database
      await prisma.document.delete({
        where: { id: doc.id },
      });

      deletedCount++;
      logger.debug({ fileKey: doc.fileKey }, 'Deleted orphaned file');
    } catch (error) {
      errorCount++;
      logger.error({ err: error, fileKey: doc.fileKey }, 'Failed to delete orphaned file');
    }
  }

  logger.info(
    { deleted: deletedCount, errors: errorCount, total: orphanedDocuments.length },
    'Temporary files cleaned up'
  );

  return { cleaned: deletedCount, errors: errorCount };
}

/**
 * Archive old audit logs
 * Regulatory requirement: 7-year retention for compliance records
 */
async function archiveOldAudits(olderThan?: string) {
  logger.info('Starting archive of old audit logs');

  // Default to archiving logs older than 1 year (365 days)
  // Keep them in database for the full 7 years, but flag for potential export
  const cutoffDate = olderThan ? new Date(olderThan) : new Date();
  if (!olderThan) {
    cutoffDate.setDate(cutoffDate.getDate() - 365);
  }

  // Count audit logs that could be archived to cold storage
  // For now, we just count them. In production, this would:
  // 1. Export to S3 Glacier for long-term storage
  // 2. Add an 'archived' flag to the schema
  // 3. Potentially compress the data
  const oldAuditCount = await prisma.auditLog.count({
    where: {
      timestamp: {
        lte: cutoffDate,
      },
    },
  });

  // Calculate 7-year retention cutoff (regulatory requirement)
  const sevenYearsAgo = new Date();
  sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);

  // Count logs that have exceeded retention period
  // These could be candidates for deletion after proper archival
  const expiredCount = await prisma.auditLog.count({
    where: {
      timestamp: {
        lte: sevenYearsAgo,
      },
    },
  });

  logger.info(
    {
      eligibleForArchive: oldAuditCount,
      expiredRetention: expiredCount,
      cutoffDate: cutoffDate.toISOString(),
    },
    'Audit log archival analysis complete'
  );

  // Future implementation:
  // 1. Export old logs to S3 Glacier in JSON format
  // 2. Add 'archivedAt' and 'archiveLocation' fields to schema
  // 3. Compress logs before archival
  // 4. Maintain database records but flag as archived
  // 5. Implement retrieval mechanism for archived logs
  //
  // Example:
  // const logsToArchive = await prisma.auditLog.findMany({
  //   where: { timestamp: { lte: cutoffDate } },
  //   take: 10000, // Batch process
  // });
  //
  // const archiveKey = `audit-logs/archive-${Date.now()}.json.gz`;
  // await uploadToS3Glacier(archiveKey, compress(JSON.stringify(logsToArchive)));
  //
  // await prisma.auditLog.updateMany({
  //   where: { id: { in: logsToArchive.map(l => l.id) } },
  //   data: { archivedAt: new Date(), archiveLocation: archiveKey },
  // });

  return {
    archived: 0, // Will be actual count when implemented
    eligibleForArchive: oldAuditCount,
    expiredRetention: expiredCount,
  };
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
