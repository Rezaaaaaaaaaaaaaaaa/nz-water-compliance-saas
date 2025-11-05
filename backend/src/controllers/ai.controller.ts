/**
 * AI Controller
 *
 * Handles all AI-powered features including compliance assistant,
 * document analysis, and water quality analysis.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import {
  askComplianceQuestion,
  getConversationHistoryForUser,
  deleteConversation,
} from '../services/ai-compliance-assistant.service.js';
import {
  analyzeDWSP,
  generateReportSummary,
} from '../services/ai-document-analysis.service.js';
import { analyzeWaterQuality } from '../services/ai-water-quality.service.js';
import {
  getAIUsageStats,
  updateOrganizationTier,
} from '../services/ai-usage.service.js';
import { logger } from '../config/logger.js';

/**
 * Ask compliance assistant a question
 * POST /api/ai/ask
 */
export async function askQuestion(
  request: FastifyRequest<{
    Body: {
      question: string;
      sessionId?: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { question, sessionId } = request.body;
    const user = (request as any).user;

    if (!question || question.trim().length === 0) {
      return reply.code(400).send({
        error: 'Question is required',
      });
    }

    const result = await askComplianceQuestion(
      user.id,
      user.organizationId,
      question,
      sessionId,
      request.ip,
      request.headers['user-agent']
    );

    logger.info('AI question answered', {
      userId: user.id,
      organizationId: user.organizationId,
      inputTokens: result.usage.inputTokens,
    });

    return reply.send({
      answer: result.answer,
      sessionId: result.sessionId,
      usage: result.usage,
    });
  } catch (error: any) {
    logger.error('AI question failed', {
      error: error.message,
      userId: (request as any).user?.id,
    });

    if (error.message.includes('quota')) {
      return reply.code(429).send({
        error: error.message,
        upgradeRequired: true,
      });
    }

    return reply.code(500).send({
      error: 'Failed to process question',
      details: error.message,
    });
  }
}

/**
 * Analyze DWSP document
 * POST /api/ai/analyze-dwsp
 */
export async function analyzeDwspDocument(
  request: FastifyRequest<{
    Body: {
      documentContent: string;
      documentId?: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { documentContent, documentId } = request.body;
    const user = (request as any).user;

    if (!documentContent || documentContent.trim().length === 0) {
      return reply.code(400).send({
        error: 'Document content is required',
      });
    }

    const result = await analyzeDWSP(
      user.id,
      user.organizationId,
      documentContent,
      documentId,
      request.ip,
      request.headers['user-agent']
    );

    logger.info('DWSP analysis completed', {
      userId: user.id,
      documentId,
      completenessScore: result.completenessScore,
    });

    return reply.send(result);
  } catch (error: any) {
    logger.error('DWSP analysis failed', {
      error: error.message,
      userId: (request as any).user?.id,
    });

    if (error.message.includes('quota')) {
      return reply.code(429).send({
        error: error.message,
        upgradeRequired: true,
      });
    }

    return reply.code(500).send({
      error: 'Failed to analyze document',
      details: error.message,
    });
  }
}

/**
 * Analyze water quality data
 * POST /api/ai/analyze-water-quality
 */
export async function analyzeWaterQualityData(
  request: FastifyRequest<{
    Body: {
      componentId: string;
      testPeriodDays?: number;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { componentId, testPeriodDays = 90 } = request.body;
    const user = (request as any).user;

    if (!componentId) {
      return reply.code(400).send({
        error: 'Component ID is required',
      });
    }

    const result = await analyzeWaterQuality(
      user.id,
      user.organizationId,
      componentId,
      testPeriodDays,
      request.ip,
      request.headers['user-agent']
    );

    logger.info('Water quality analysis completed', {
      userId: user.id,
      componentId,
      status: result.compliance.overallStatus,
    });

    return reply.send(result);
  } catch (error: any) {
    logger.error('Water quality analysis failed', {
      error: error.message,
      userId: (request as any).user?.id,
    });

    if (error.message.includes('quota')) {
      return reply.code(429).send({
        error: error.message,
        upgradeRequired: true,
      });
    }

    return reply.code(500).send({
      error: 'Failed to analyze water quality',
      details: error.message,
    });
  }
}

/**
 * Generate report summary
 * POST /api/ai/generate-summary
 */
export async function generateSummary(
  request: FastifyRequest<{
    Body: {
      reportData: {
        complianceEvents: any[];
        waterQualityTests: any[];
        nonCompliances: any[];
        year: number;
      };
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { reportData } = request.body;
    const user = (request as any).user;

    if (!reportData || !reportData.year) {
      return reply.code(400).send({
        error: 'Report data with year is required',
      });
    }

    const result = await generateReportSummary(
      user.id,
      user.organizationId,
      reportData,
      request.ip,
      request.headers['user-agent']
    );

    logger.info('Report summary generated', {
      userId: user.id,
      year: reportData.year,
    });

    return reply.send(result);
  } catch (error: any) {
    logger.error('Report summary generation failed', {
      error: error.message,
      userId: (request as any).user?.id,
    });

    if (error.message.includes('quota')) {
      return reply.code(429).send({
        error: error.message,
        upgradeRequired: true,
      });
    }

    return reply.code(500).send({
      error: 'Failed to generate summary',
      details: error.message,
    });
  }
}

/**
 * Get AI usage statistics
 * GET /api/ai/usage
 */
export async function getUsageStats(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const user = (request as any).user;

    const stats = await getAIUsageStats(user.organizationId);

    return reply.send(stats);
  } catch (error: any) {
    logger.error('Failed to get usage stats', {
      error: error.message,
      userId: (request as any).user?.id,
    });

    return reply.code(500).send({
      error: 'Failed to get usage statistics',
    });
  }
}

/**
 * Get conversation history
 * GET /api/ai/conversations
 */
export async function getConversations(
  request: FastifyRequest<{
    Querystring: {
      sessionId?: string;
      limit?: number;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { sessionId, limit = 50 } = request.query;
    const user = (request as any).user;

    const conversations = await getConversationHistoryForUser(
      user.id,
      sessionId,
      limit
    );

    return reply.send({ conversations });
  } catch (error: any) {
    logger.error('Failed to get conversations', {
      error: error.message,
      userId: (request as any).user?.id,
    });

    return reply.code(500).send({
      error: 'Failed to get conversation history',
    });
  }
}

/**
 * Delete conversation
 * DELETE /api/ai/conversations/:sessionId
 */
export async function deleteConversationHandler(
  request: FastifyRequest<{
    Params: {
      sessionId: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { sessionId } = request.params;
    const user = (request as any).user;

    await deleteConversation(user.id, sessionId);

    return reply.send({ success: true });
  } catch (error: any) {
    logger.error('Failed to delete conversation', {
      error: error.message,
      userId: (request as any).user?.id,
    });

    return reply.code(500).send({
      error: 'Failed to delete conversation',
    });
  }
}

/**
 * Update organization tier (admin only)
 * PUT /api/ai/tier
 */
export async function updateTier(
  request: FastifyRequest<{
    Body: {
      organizationId: string;
      tier: 'FREE' | 'BASIC' | 'PREMIUM';
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { organizationId, tier } = request.body;
    const user = (request as any).user;

    // Only system admins can update tiers
    if (user.role !== 'SYSTEM_ADMIN') {
      return reply.code(403).send({
        error: 'Only system administrators can update tiers',
      });
    }

    const result = await updateOrganizationTier(organizationId, tier);

    logger.info('Organization tier updated', {
      organizationId,
      tier,
      updatedBy: user.id,
    });

    return reply.send(result);
  } catch (error: any) {
    logger.error('Failed to update tier', {
      error: error.message,
      userId: (request as any).user?.id,
    });

    return reply.code(500).send({
      error: 'Failed to update tier',
    });
  }
}
