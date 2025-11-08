/**
 * Regulation Review Worker
 *
 * Quarterly monitoring system to check for regulatory updates
 * Ensures compliance with Taumata Arowai requirements
 */

import { Worker, Job } from 'bullmq';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import * as notificationService from '../services/notification.service.js';
import { prisma } from '../config/database.js';

const redisConnection = {
  host: config.redis?.host || 'localhost',
  port: config.redis?.port || 6379,
  password: config.redis?.password,
  maxRetriesPerRequest: null,
};

interface RegulationReviewJob {
  quarter: number;
  year: number;
}

/**
 * Process quarterly regulation review
 */
async function processQuarterlyReview(job: Job<RegulationReviewJob>) {
  const { quarter, year } = job.data;

  logger.info({ quarter, year }, 'Starting quarterly regulation review');

  // Get all system admins and compliance managers
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ['SYSTEM_ADMIN', 'COMPLIANCE_MANAGER'],
      },
      deletedAt: null,
    },
  });

  const reviewTasks = [
    {
      category: 'DWSP Requirements',
      description: 'Review Taumata Arowai DWSP requirements for any updates or changes',
      url: 'https://www.taumataarowai.govt.nz/for-water-suppliers/drinking-water-safety-plans/',
      priority: 'HIGH',
    },
    {
      category: 'Water Quality Standards',
      description: 'Review Drinking Water Quality Assurance Rules (DWQAR) for updates',
      url: 'https://www.taumataarowai.govt.nz/for-water-suppliers/drinking-water-quality-assurance-rules/',
      priority: 'HIGH',
    },
    {
      category: 'Reporting Requirements',
      description: 'Check for changes in compliance reporting requirements',
      url: 'https://www.taumataarowai.govt.nz/for-water-suppliers/compliance-reporting/',
      priority: 'MEDIUM',
    },
    {
      category: 'Asset Management',
      description: 'Review asset management plan requirements and best practices',
      url: 'https://www.taumataarowai.govt.nz/',
      priority: 'MEDIUM',
    },
    {
      category: 'Water Testing',
      description: 'Verify water quality testing protocols and frequencies',
      url: 'https://www.taumataarowai.govt.nz/',
      priority: 'HIGH',
    },
    {
      category: 'Documentation Standards',
      description: 'Review record-keeping and documentation retention requirements',
      url: 'https://www.taumataarowai.govt.nz/',
      priority: 'MEDIUM',
    },
  ];

  // Create notifications for each user
  for (const user of users) {
    const message = `
      Quarterly Regulation Review - Q${quarter} ${year}

      It's time for the quarterly review of Taumata Arowai regulations and requirements.

      Please review the following areas:
      ${reviewTasks
        .map(
          (task, index) => `
        ${index + 1}. ${task.category} [${task.priority}]
           ${task.description}
           Reference: ${task.url}
      `
        )
        .join('\n')}

      This review is critical to ensure our compliance system remains aligned
      with current regulatory requirements.

      Please document any changes or updates found and update the system accordingly.
    `;

    await notificationService.sendNotification({
      userId: user.id,
      type: 'both',
      subject: `Quarterly Regulation Review Required - Q${quarter} ${year}`,
      message: message.trim(),
      metadata: {
        quarter,
        year,
        reviewType: 'REGULATION_UPDATE',
        tasks: reviewTasks,
        notificationType: 'regulation_review',
        review: {
          quarter,
          year,
          tasks: reviewTasks,
        },
      },
    });
  }

  // Create audit log for this review cycle
  await prisma.auditLog.create({
    data: {
      organizationId: 'SYSTEM',
      userId: 'SYSTEM',
      action: 'REGULATION_REVIEW_TRIGGERED',
      resourceType: 'SYSTEM',
      resourceId: `Q${quarter}-${year}`,
      changes: {
        quarter,
        year,
        tasksAssigned: reviewTasks.length,
        usersNotified: users.length,
      },
      ipAddress: 'SYSTEM',
      userAgent: 'Regulation Review Worker',
      timestamp: new Date(),
    },
  });

  logger.info(
    { quarter, year, usersNotified: users.length },
    'Quarterly regulation review notifications sent'
  );

  return {
    quarter,
    year,
    usersNotified: users.length,
    tasksAssigned: reviewTasks.length,
  };
}

/**
 * Schedule next quarterly review
 */
async function scheduleNextQuarterlyReview() {
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const currentYear = now.getFullYear();

  // Calculate next quarter
  let nextQuarter = currentQuarter + 1;
  let nextYear = currentYear;

  if (nextQuarter > 4) {
    nextQuarter = 1;
    nextYear += 1;
  }

  // Schedule for the first day of the next quarter
  const nextQuarterDate = new Date(nextYear, (nextQuarter - 1) * 3, 1);

  logger.info(
    { nextQuarter, nextYear, scheduledDate: nextQuarterDate },
    'Scheduling next quarterly review'
  );

  // This would be added to the queue scheduler
  // For now, we'll just log it
}

/**
 * Create manual regulation review
 */
export async function triggerManualReview(triggeredByUserId: string, reason: string) {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  const year = now.getFullYear();

  logger.info({ triggeredByUserId, reason, quarter, year }, 'Manual regulation review triggered');

  // Process the review immediately
  return await processQuarterlyReview({
    id: 'manual-review',
    name: 'manual-review',
    data: { quarter, year },
  } as Job<RegulationReviewJob>);
}

/**
 * Get regulation review history
 */
export async function getRegulationReviewHistory(limit: number = 12) {
  return await prisma.auditLog.findMany({
    where: {
      action: 'REGULATION_REVIEW_TRIGGERED',
      resourceType: 'SYSTEM',
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: limit,
  });
}

/**
 * Create and start the worker
 */
export function createRegulationReviewWorker() {
  const worker = new Worker(
    'regulation-review',
    async (job: Job) => {
      try {
        if (job.name === 'quarterly-review') {
          return await processQuarterlyReview(job as Job<RegulationReviewJob>);
        } else {
          throw new Error(`Unknown job type: ${job.name}`);
        }
      } catch (error) {
        logger.error({ err: error, jobId: job.id }, 'Regulation review job failed');
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 1,
    }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Regulation review job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Regulation review job failed');
  });

  logger.info('Regulation review worker started');

  // Schedule next review on startup
  void scheduleNextQuarterlyReview();

  return worker;
}
