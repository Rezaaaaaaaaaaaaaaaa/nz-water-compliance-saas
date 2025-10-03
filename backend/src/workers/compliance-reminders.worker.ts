/**
 * Compliance Reminders Worker
 *
 * Processes background jobs for compliance reminders and deadline checks
 */

import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import { ComplianceReminderJob, QueueName } from '../services/queue.service.js';
import * as notificationService from '../services/notification.service.js';

const prisma = new PrismaClient();

const redisConnection = {
  host: config.redis?.host || 'localhost',
  port: config.redis?.port || 6379,
  password: config.redis?.password,
  maxRetriesPerRequest: null,
};

/**
 * Process daily compliance check
 * Checks all active compliance plans for upcoming deadlines and overdue items
 */
async function processDailyComplianceCheck(job: Job) {
  logger.info('Running daily compliance check');

  // Get all active compliance plans
  const plans = await prisma.compliancePlan.findMany({
    where: {
      deletedAt: null,
      status: {
        in: ['DRAFT', 'IN_REVIEW', 'APPROVED'],
      },
    },
    include: {
      organization: true,
      assignedTo: true,
    },
  });

  let remindersCreated = 0;

  for (const plan of plans) {
    const now = new Date();

    // Check for upcoming deadlines (7 days before)
    if (plan.targetDate) {
      const daysUntilDeadline = Math.ceil(
        (plan.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilDeadline <= 7 && daysUntilDeadline > 0) {
        // Send reminder for upcoming deadline
        if (plan.assignedTo) {
          await notificationService.sendNotification({
            userId: plan.assignedTo.id,
            type: 'email',
            subject: `Compliance Plan Deadline Approaching - ${plan.title}`,
            message: `Your compliance plan "${plan.title}" is due in ${daysUntilDeadline} days (${plan.targetDate.toLocaleDateString()}).`,
            metadata: {
              compliancePlanId: plan.id,
              organizationId: plan.organizationId,
              reminderType: 'upcoming_deadline',
              notificationType: 'deadline_reminder',
              deadline: {
                type: 'Compliance Plan',
                name: plan.title,
                dueDate: plan.targetDate,
                daysUntilDue: daysUntilDeadline,
              },
            },
          });
          remindersCreated++;
        }
      }

      // Check for overdue items
      if (daysUntilDeadline < 0) {
        if (plan.assignedTo) {
          await notificationService.sendNotification({
            userId: plan.assignedTo.id,
            type: 'both',
            subject: `Compliance Plan OVERDUE - ${plan.title}`,
            message: `Your compliance plan "${plan.title}" was due on ${plan.targetDate.toLocaleDateString()} and is now overdue.`,
            metadata: {
              compliancePlanId: plan.id,
              organizationId: plan.organizationId,
              reminderType: 'overdue',
              priority: 'high',
              notificationType: 'deadline_reminder',
              deadline: {
                type: 'Compliance Plan',
                name: plan.title,
                dueDate: plan.targetDate,
                daysUntilDue: daysUntilDeadline,
              },
            },
          });
          remindersCreated++;
        }
      }
    }

    // Check for review dates
    if (plan.reviewDate) {
      const daysUntilReview = Math.ceil(
        (plan.reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilReview <= 14 && daysUntilReview > 0) {
        // Send reminder for upcoming review
        if (plan.assignedTo) {
          await notificationService.sendNotification({
            userId: plan.assignedTo.id,
            type: 'email',
            subject: `Compliance Plan Review Required - ${plan.title}`,
            message: `Your compliance plan "${plan.title}" requires review in ${daysUntilReview} days (${plan.reviewDate.toLocaleDateString()}).`,
            metadata: {
              compliancePlanId: plan.id,
              organizationId: plan.organizationId,
              reminderType: 'review_required',
            },
          });
          remindersCreated++;
        }
      }
    }
  }

  logger.info({ remindersCreated }, 'Daily compliance check completed');

  return { remindersCreated, plansChecked: plans.length };
}

/**
 * Process individual compliance reminder
 */
async function processComplianceReminder(job: Job<ComplianceReminderJob>) {
  const { organizationId, compliancePlanId, reminderType, dueDate } = job.data;

  logger.info(
    { organizationId, compliancePlanId, reminderType },
    'Processing compliance reminder'
  );

  // Get compliance plan
  const plan = await prisma.compliancePlan.findUnique({
    where: { id: compliancePlanId },
    include: {
      assignedTo: true,
      organization: true,
    },
  });

  if (!plan || plan.deletedAt) {
    logger.warn({ compliancePlanId }, 'Compliance plan not found or deleted');
    return;
  }

  // Send notification based on reminder type
  let subject: string;
  let message: string;

  switch (reminderType) {
    case 'upcoming_deadline':
      subject = `Compliance Plan Deadline Approaching - ${plan.title}`;
      message = `Your compliance plan "${plan.title}" is due on ${dueDate}.`;
      break;
    case 'overdue':
      subject = `Compliance Plan OVERDUE - ${plan.title}`;
      message = `Your compliance plan "${plan.title}" was due on ${dueDate} and is now overdue.`;
      break;
    case 'review_required':
      subject = `Compliance Plan Review Required - ${plan.title}`;
      message = `Your compliance plan "${plan.title}" requires review by ${dueDate}.`;
      break;
  }

  if (plan.assignedTo) {
    await notificationService.sendNotification({
      userId: plan.assignedTo.id,
      type: reminderType === 'overdue' ? 'both' : 'email',
      subject,
      message,
      metadata: {
        compliancePlanId: plan.id,
        organizationId: plan.organizationId,
        reminderType,
      },
    });
  }

  logger.info({ compliancePlanId, reminderType }, 'Compliance reminder sent');

  return { sent: true };
}

/**
 * Create and start the worker
 */
export function createComplianceRemindersWorker() {
  const worker = new Worker(
    QueueName.COMPLIANCE_REMINDERS,
    async (job: Job) => {
      try {
        if (job.name === 'daily-compliance-check') {
          return await processDailyComplianceCheck(job);
        } else if (job.name === 'compliance-reminder') {
          return await processComplianceReminder(job as Job<ComplianceReminderJob>);
        } else {
          throw new Error(`Unknown job type: ${job.name}`);
        }
      } catch (error) {
        logger.error({ err: error, jobId: job.id }, 'Compliance reminder job failed');
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 5, // Process up to 5 jobs concurrently
    }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'Compliance reminder job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error(
      { jobId: job?.id, jobName: job?.name, err },
      'Compliance reminder job failed'
    );
  });

  logger.info('Compliance reminders worker started');

  return worker;
}
