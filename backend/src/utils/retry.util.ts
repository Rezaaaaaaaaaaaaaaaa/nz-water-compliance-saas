/**
 * Retry Utility
 *
 * Provides retry logic for operations that may fail temporarily
 */

import { logger } from '../config/logger.js';

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  exponentialBackoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    exponentialBackoff = true,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        logger.error(
          { err: error, attempts: maxAttempts },
          'Operation failed after max retry attempts'
        );
        throw error;
      }

      const delay = exponentialBackoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;

      logger.warn(
        { attempt, maxAttempts, delay, err: error },
        'Operation failed, retrying...'
      );

      if (onRetry) {
        onRetry(attempt, lastError);
      }

      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Database connection errors
  if (error.code === 'P2024' || error.code === 'P2034') {
    return true;
  }

  // HTTP 5xx errors (server errors)
  if (error.statusCode >= 500 && error.statusCode < 600) {
    return true;
  }

  // Rate limit errors (429)
  if (error.statusCode === 429) {
    return true;
  }

  return false;
}

/**
 * Retry only if error is retryable
 */
export async function retryIfRetryable<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return retryOperation(operation, {
    ...options,
    maxAttempts: options.maxAttempts || 3,
  }).catch(async (error) => {
    if (isRetryableError(error)) {
      logger.info('Retryable error detected, attempting retry');
      return retryOperation(operation, options);
    }
    throw error;
  });
}
