/**
 * Worker Initialization
 *
 * Starts all background job workers
 */

import { Worker } from 'bullmq';
import { logger } from '../config/logger.js';
import { createComplianceRemindersWorker } from './compliance-reminders.worker.js';
import { createNotificationsWorker } from './notifications.worker.js';
import { createCleanupWorker } from './cleanup.worker.js';
import { createRegulationReviewWorker } from './regulation-review.worker.js';
import {
  scheduleRecurringComplianceChecks,
  scheduleRecurringCleanup,
} from '../services/queue.service.js';

const workers: Worker[] = [];

/**
 * Initialize and start all workers
 */
export async function startWorkers() {
  logger.info('Starting background workers...');

  try {
    // Start individual workers
    workers.push(createComplianceRemindersWorker());
    workers.push(createNotificationsWorker());
    workers.push(createCleanupWorker());
    workers.push(createRegulationReviewWorker());

    // Schedule recurring jobs
    await scheduleRecurringComplianceChecks();
    await scheduleRecurringCleanup();

    logger.info({ workerCount: workers.length }, 'All workers started successfully');
  } catch (error) {
    logger.error({ err: error }, 'Failed to start workers');
    throw error;
  }
}

/**
 * Gracefully shutdown all workers
 */
export async function stopWorkers() {
  logger.info('Stopping background workers...');

  for (const worker of workers) {
    await worker.close();
  }

  logger.info('All workers stopped');
}

/**
 * Get worker health status
 */
export function getWorkerStatus() {
  return workers.map((worker) => ({
    name: worker.name,
    isRunning: worker.isRunning(),
    isPaused: worker.isPaused(),
  }));
}
