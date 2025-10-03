/**
 * Notifications Worker
 *
 * Processes background jobs for sending notifications
 */

import { Worker, Job } from 'bullmq';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import { NotificationJob, QueueName } from '../services/queue.service.js';
import * as notificationService from '../services/notification.service.js';

const redisConnection = {
  host: config.redis?.host || 'localhost',
  port: config.redis?.port || 6379,
  password: config.redis?.password,
  maxRetriesPerRequest: null,
};

/**
 * Process notification job
 */
async function processNotification(job: Job<NotificationJob>) {
  const { userId, type, subject, message, metadata } = job.data;

  logger.info({ userId, type, subject }, 'Processing notification');

  await notificationService.sendNotification({
    userId,
    type,
    subject,
    message,
    metadata,
  });

  return { sent: true };
}

/**
 * Create and start the worker
 */
export function createNotificationsWorker() {
  const worker = new Worker(
    QueueName.NOTIFICATIONS,
    async (job: Job) => {
      try {
        if (job.name === 'send-notification') {
          return await processNotification(job as Job<NotificationJob>);
        } else {
          throw new Error(`Unknown job type: ${job.name}`);
        }
      } catch (error) {
        logger.error({ err: error, jobId: job.id }, 'Notification job failed');
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 10, // Process up to 10 notifications concurrently
    }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'Notification job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, jobName: job?.name, err }, 'Notification job failed');
  });

  logger.info('Notifications worker started');

  return worker;
}
