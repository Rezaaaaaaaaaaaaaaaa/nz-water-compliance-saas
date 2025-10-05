/**
 * AI Routes
 *
 * API routes for AI-powered features with authentication and rate limiting.
 */

import { FastifyInstance } from 'fastify';
import {
  askQuestion,
  analyzeDwspDocument,
  analyzeWaterQualityData,
  generateSummary,
  getUsageStats,
  getConversations,
  deleteConversationHandler,
  updateTier,
} from '../controllers/ai.controller';

export async function aiRoutes(fastify: FastifyInstance) {
  // Compliance Assistant (Chat)
  fastify.post('/api/ai/ask', {
    schema: {
      description: 'Ask the AI compliance assistant a question',
      tags: ['AI'],
      body: {
        type: 'object',
        required: ['question'],
        properties: {
          question: { type: 'string', minLength: 1, maxLength: 1000 },
          sessionId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            answer: { type: 'string' },
            sessionId: { type: 'string' },
            usage: {
              type: 'object',
              properties: {
                inputTokens: { type: 'number' },
                outputTokens: { type: 'number' },
                estimatedCost: { type: 'number' },
              },
            },
          },
        },
      },
    },
    handler: askQuestion,
  });

  // DWSP Document Analysis
  fastify.post('/api/ai/analyze-dwsp', {
    schema: {
      description: 'Analyze a DWSP document for compliance',
      tags: ['AI'],
      body: {
        type: 'object',
        required: ['documentContent'],
        properties: {
          documentContent: { type: 'string', minLength: 100 },
          documentId: { type: 'string' },
        },
      },
    },
    handler: analyzeDwspDocument,
  });

  // Water Quality Analysis
  fastify.post('/api/ai/analyze-water-quality', {
    schema: {
      description: 'Analyze water quality test results for anomalies',
      tags: ['AI'],
      body: {
        type: 'object',
        required: ['componentId'],
        properties: {
          componentId: { type: 'string' },
          testPeriodDays: { type: 'number', minimum: 1, maximum: 365 },
        },
      },
    },
    handler: analyzeWaterQualityData,
  });

  // Report Summary Generation
  fastify.post('/api/ai/generate-summary', {
    schema: {
      description: 'Generate executive summary for DWQAR',
      tags: ['AI'],
      body: {
        type: 'object',
        required: ['reportData'],
        properties: {
          reportData: {
            type: 'object',
            required: ['year'],
            properties: {
              complianceEvents: { type: 'array' },
              waterQualityTests: { type: 'array' },
              nonCompliances: { type: 'array' },
              year: { type: 'number' },
            },
          },
        },
      },
    },
    handler: generateSummary,
  });

  // Usage Statistics
  fastify.get('/api/ai/usage', {
    schema: {
      description: 'Get AI usage statistics for organization',
      tags: ['AI'],
      response: {
        200: {
          type: 'object',
          properties: {
            quota: { type: 'object' },
            recentLogs: { type: 'array' },
            summary: { type: 'object' },
          },
        },
      },
    },
    handler: getUsageStats,
  });

  // Conversation History
  fastify.get('/api/ai/conversations', {
    schema: {
      description: 'Get conversation history',
      tags: ['AI'],
      querystring: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' },
          limit: { type: 'number', minimum: 1, maximum: 100 },
        },
      },
    },
    handler: getConversations,
  });

  // Delete Conversation
  fastify.delete('/api/ai/conversations/:sessionId', {
    schema: {
      description: 'Delete conversation history',
      tags: ['AI'],
      params: {
        type: 'object',
        required: ['sessionId'],
        properties: {
          sessionId: { type: 'string' },
        },
      },
    },
    handler: deleteConversationHandler,
  });

  // Update Tier (Admin Only)
  fastify.put('/api/ai/tier', {
    schema: {
      description: 'Update organization AI tier (admin only)',
      tags: ['AI', 'Admin'],
      body: {
        type: 'object',
        required: ['organizationId', 'tier'],
        properties: {
          organizationId: { type: 'string' },
          tier: { type: 'string', enum: ['FREE', 'BASIC', 'PREMIUM'] },
        },
      },
    },
    handler: updateTier,
  });
}
