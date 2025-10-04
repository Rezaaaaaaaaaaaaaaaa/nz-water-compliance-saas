/**
 * Analytics Controller
 *
 * Handles analytics and dashboard data requests
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import * as analyticsService from '../services/analytics.service.js';
import * as cacheService from '../services/cache.service.js';
import { logger } from '../config/logger.js';
import type { AuthenticatedUser } from '../server.js';

// Helper to get authenticated user from request
function getUser(request: FastifyRequest): AuthenticatedUser {
  return request.user as AuthenticatedUser;
}

/**
 * Get dashboard data for organization (with caching)
 */
export async function getDashboard(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const organizationId = getUser(request).organizationId;
    const cacheKey = cacheService.getDashboardKey(organizationId);

    // Try to get from cache first
    const dashboard = await cacheService.getOrSet(
      cacheKey,
      () => analyticsService.getDashboardData(organizationId),
      cacheService.CacheTTL.MEDIUM // 5 minutes
    );

    reply.send({
      success: true,
      data: dashboard,
      cached: await cacheService.exists(cacheKey),
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get dashboard data');
    reply.status(500).send({
      success: false,
      error: 'Failed to load dashboard data',
    });
  }
}

/**
 * Get compliance overview
 */
export async function getComplianceOverview(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const organizationId = getUser(request).organizationId;

    const overview = await analyticsService.getComplianceOverview(organizationId);

    reply.send({
      success: true,
      data: overview,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get compliance overview');
    reply.status(500).send({
      success: false,
      error: 'Failed to load compliance overview',
    });
  }
}

/**
 * Get asset analytics (with caching)
 */
export async function getAssetAnalytics(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const organizationId = getUser(request).organizationId;
    const cacheKey = cacheService.getAssetAnalyticsKey(organizationId);

    const analytics = await cacheService.getOrSet(
      cacheKey,
      () => analyticsService.getAssetAnalytics(organizationId),
      cacheService.CacheTTL.MEDIUM
    );

    reply.send({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get asset analytics');
    reply.status(500).send({
      success: false,
      error: 'Failed to load asset analytics',
    });
  }
}

/**
 * Get document analytics (with caching)
 */
export async function getDocumentAnalytics(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const organizationId = getUser(request).organizationId;
    const cacheKey = cacheService.getDocumentAnalyticsKey(organizationId);

    const analytics = await cacheService.getOrSet(
      cacheKey,
      () => analyticsService.getDocumentAnalytics(organizationId),
      cacheService.CacheTTL.MEDIUM
    );

    reply.send({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get document analytics');
    reply.status(500).send({
      success: false,
      error: 'Failed to load document analytics',
    });
  }
}

/**
 * Get activity timeline
 */
export async function getActivityTimeline(
  request: FastifyRequest<{
    Querystring: { days?: string };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const organizationId = getUser(request).organizationId;
    const days = request.query.days ? parseInt(request.query.days) : 90;

    const timeline = await analyticsService.getActivityTimeline(organizationId, days);

    reply.send({
      success: true,
      data: timeline,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get activity timeline');
    reply.status(500).send({
      success: false,
      error: 'Failed to load activity timeline',
    });
  }
}

/**
 * Get DWSP trends
 */
export async function getDWSPTrends(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const organizationId = getUser(request).organizationId;

    const trends = await analyticsService.getDWSPTrends(organizationId);

    reply.send({
      success: true,
      data: trends,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get DWSP trends');
    reply.status(500).send({
      success: false,
      error: 'Failed to load DWSP trends',
    });
  }
}

/**
 * Get user activity summary
 */
export async function getUserActivitySummary(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const organizationId = getUser(request).organizationId;

    const summary = await analyticsService.getUserActivitySummary(organizationId);

    reply.send({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get user activity summary');
    reply.status(500).send({
      success: false,
      error: 'Failed to load user activity summary',
    });
  }
}

/**
 * Get system-wide analytics (System Admin only)
 */
export async function getSystemAnalytics(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Check if user is System Admin
    if (getUser(request).role !== 'SYSTEM_ADMIN') {
      reply.status(403).send({
        success: false,
        error: 'Only System Admins can access system-wide analytics',
      });
      return;
    }

    const analytics = await analyticsService.getSystemAnalytics();

    reply.send({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get system analytics');
    reply.status(500).send({
      success: false,
      error: 'Failed to load system analytics',
    });
  }
}
