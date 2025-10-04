/**
 * Cache Invalidation Middleware
 *
 * Automatically invalidates cache when data is modified
 *
 * NOTE: This middleware is currently disabled due to architectural issues with FastifyReply
 * Cache invalidation should be handled in the service layer instead.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import * as cacheService from '../services/cache.service.js';
import { logger } from '../config/logger.js';

/**
 * Invalidate organization cache after mutations
 *
 * DISABLED: This function has architectural issues with FastifyReply.addHook
 * Use cache invalidation in service layer instead.
 */
export async function invalidateOrganizationCache(
  _request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  // Disabled - implement cache invalidation in service layer
  /*
  // Only invalidate on successful responses
  reply.addHook('onSend', async (request, reply, payload) => {
    // Check if response was successful (2xx status code)
    const statusCode = reply.statusCode;
    if (statusCode >= 200 && statusCode < 300) {
      // Check if this was a mutation (POST, PUT, PATCH, DELETE)
      const method = request.method;
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const organizationId = request.user?.organizationId;

        if (organizationId) {
          try {
            await cacheService.invalidateOrganization(organizationId);
            logger.debug(
              { organizationId, method, url: request.url },
              'Cache invalidated after mutation'
            );
          } catch (error) {
            // Log error but don't fail the request
            logger.error({ err: error }, 'Failed to invalidate cache');
          }
        }
      }
    }

    return payload;
  });
  */
}

/**
 * Invalidate specific cache keys
 *
 * DISABLED: This function has architectural issues with FastifyReply.addHook
 * Use cache invalidation in service layer instead.
 */
export function createInvalidationHook(cacheKeys: string[]) {
  return async function (_request: FastifyRequest, _reply: FastifyReply) {
    // Disabled - implement cache invalidation in service layer
    // Prevent unused variable warnings
    void cacheKeys;
    void cacheService;
    void logger;
    /*
    reply.addHook('onSend', async (request, reply, payload) => {
      const statusCode = reply.statusCode;
      if (statusCode >= 200 && statusCode < 300) {
        try {
          await Promise.all(cacheKeys.map((key) => cacheService.del(key)));
          logger.debug({ cacheKeys }, 'Specific cache keys invalidated');
        } catch (error) {
          logger.error({ err: error }, 'Failed to invalidate specific cache keys');
        }
      }

      return payload;
    });
    */
  };
}
