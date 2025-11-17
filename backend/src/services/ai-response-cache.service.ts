/**
 * AI Response Caching Service
 *
 * Caches AI responses to reduce costs and improve performance.
 * Estimated cost savings: 50-70% for repeated queries.
 */

import { get, set, CacheTTL } from './cache.service.js';
import { logger } from '../config/logger.js';
import * as crypto from 'crypto';

const CACHE_PREFIX = 'ai_response';
const DEFAULT_TTL = CacheTTL.DAY; // 24 hours

export interface CachedAIResponse {
  answer: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
  };
  cachedAt: Date;
  hits: number;
}

/**
 * Generate cache key from question and context
 *
 * @param question - User question
 * @param organizationId - Organization context
 * @param feature - AI feature type
 */
function generateCacheKey(question: string, organizationId: string, feature: string): string {
  // Normalize question (lowercase, trim, remove extra spaces)
  const normalizedQuestion = question.toLowerCase().trim().replace(/\s+/g, ' ');

  // Create hash of question for compact key
  const questionHash = crypto.createHash('sha256').update(normalizedQuestion).digest('hex').substring(0, 16);

  return `${CACHE_PREFIX}:${feature}:${organizationId}:${questionHash}`;
}

/**
 * Get cached AI response
 *
 * @param question - User question
 * @param organizationId - Organization context
 * @param feature - AI feature type
 * @returns Cached response or null
 */
export async function getCachedResponse(
  question: string,
  organizationId: string,
  feature: string
): Promise<CachedAIResponse | null> {
  try {
    const cacheKey = generateCacheKey(question, organizationId, feature);
    const cached = await get<CachedAIResponse>(cacheKey);

    if (cached) {
      // Increment hit counter
      cached.hits = (cached.hits || 0) + 1;
      await set(cacheKey, cached, DEFAULT_TTL);

      logger.info(
        {
          feature,
          organizationId,
          hits: cached.hits,
          savedTokens: cached.usage.inputTokens + cached.usage.outputTokens,
        },
        'AI response cache hit'
      );

      return cached;
    }

    return null;
  } catch (error) {
    logger.error({ err: error, feature }, 'Failed to get cached AI response');
    return null; // Fail gracefully, proceed with actual AI call
  }
}

/**
 * Cache AI response
 *
 * @param question - User question
 * @param organizationId - Organization context
 * @param feature - AI feature type
 * @param response - AI response to cache
 * @param ttl - Time to live in seconds (default: 24 hours)
 */
export async function cacheResponse(
  question: string,
  organizationId: string,
  feature: string,
  response: Omit<CachedAIResponse, 'cachedAt' | 'hits'>,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  try {
    const cacheKey = generateCacheKey(question, organizationId, feature);

    const cachedResponse: CachedAIResponse = {
      ...response,
      cachedAt: new Date(),
      hits: 0,
    };

    await set(cacheKey, cachedResponse, ttl);

    logger.info(
      {
        feature,
        organizationId,
        tokens: response.usage.inputTokens + response.usage.outputTokens,
      },
      'AI response cached'
    );
  } catch (error) {
    logger.error({ err: error, feature }, 'Failed to cache AI response');
    // Don't throw - caching failure shouldn't break the app
  }
}

/**
 * Get cache statistics
 *
 * @param organizationId - Organization ID
 * @param feature - AI feature type
 * @returns Cache statistics
 */
export async function getCacheStats(
  organizationId?: string,
  feature?: string
): Promise<{
  totalCached: number;
  totalHits: number;
  estimatedSavings: number;
}> {
  // This is a simplified version - in production, you'd track this in a separate stats table
  logger.warn('Cache stats not yet implemented - requires metrics tracking');

  return {
    totalCached: 0,
    totalHits: 0,
    estimatedSavings: 0,
  };
}

/**
 * Clear AI response cache
 *
 * @param organizationId - Optional organization ID to clear
 * @param feature - Optional feature to clear
 */
export async function clearAICache(organizationId?: string, feature?: string): Promise<void> {
  // This requires Redis SCAN or pattern deletion
  // For now, log a warning
  logger.warn(
    { organizationId, feature },
    'Cache clearing not yet implemented - requires Redis pattern deletion'
  );
}
