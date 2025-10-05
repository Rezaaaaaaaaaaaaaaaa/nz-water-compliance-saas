/**
 * AI Compliance Assistant Service
 *
 * Provides intelligent Q&A assistance for water compliance using Claude API.
 * Helps operators understand Taumata Arowai regulations and their compliance status.
 */

import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient, AIFeature } from '@prisma/client';
import { checkAIQuota, logAIUsage } from './ai-usage.service';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const MODEL = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
const MAX_TOKENS = parseInt(process.env.CLAUDE_MAX_TOKENS || '2048');

interface ComplianceContext {
  organizationName: string;
  complianceScore?: number;
  dwspStatus?: string;
  assetCount: number;
  recentReports?: number;
  criticalAssets?: number;
  overdueItems?: number;
}

/**
 * Ask the AI compliance assistant a question
 */
export async function askComplianceQuestion(
  userId: string,
  organizationId: string,
  question: string,
  sessionId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{
  answer: string;
  sessionId: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
  };
}> {
  const startTime = Date.now();

  // Check quota before making API call
  const quotaCheck = await checkAIQuota(
    organizationId,
    AIFeature.COMPLIANCE_ASSISTANT,
    3000 // Estimated tokens for Q&A
  );

  if (!quotaCheck.allowed) {
    throw new Error(quotaCheck.reason || 'AI quota exceeded');
  }

  // Get organizational context
  const context = await getOrganizationContext(organizationId);

  // Get conversation history for context (last 5 messages)
  const conversationHistory = sessionId
    ? await getConversationHistory(sessionId, 5)
    : [];

  // Build system prompt with context
  const systemPrompt = buildSystemPrompt(context);

  // Build messages array with history
  const messages: Anthropic.MessageParam[] = [];

  // Add conversation history
  for (const msg of conversationHistory) {
    messages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.message,
    });
  }

  // Add current question
  messages.push({
    role: 'user',
    content: question,
  });

  try {
    // Call Claude API
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages,
    });

    const answer = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Sorry, I could not generate a response.';

    const latencyMs = Date.now() - startTime;

    // Log usage
    await logAIUsage({
      organizationId,
      userId,
      feature: AIFeature.COMPLIANCE_ASSISTANT,
      operation: 'ask_question',
      model: MODEL,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      success: true,
      latencyMs,
      ipAddress,
      userAgent,
    });

    // Save conversation
    const newSessionId = sessionId || generateSessionId();
    await saveConversation(organizationId, userId, newSessionId, question, answer);

    logger.info('AI compliance question answered', {
      organizationId,
      userId,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      latencyMs,
    });

    return {
      answer,
      sessionId: newSessionId,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        estimatedCost: calculateCost(
          response.usage.input_tokens,
          response.usage.output_tokens
        ),
      },
    };
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;

    // Log failed usage
    await logAIUsage({
      organizationId,
      userId,
      feature: AIFeature.COMPLIANCE_ASSISTANT,
      operation: 'ask_question',
      model: MODEL,
      inputTokens: 0,
      outputTokens: 0,
      success: false,
      errorMessage: error.message,
      latencyMs,
      ipAddress,
      userAgent,
    });

    logger.error('AI compliance question failed', {
      organizationId,
      userId,
      error: error.message,
    });

    throw new Error(`AI assistant error: ${error.message}`);
  }
}

/**
 * Build system prompt with organizational context
 */
function buildSystemPrompt(context: ComplianceContext): string {
  return `You are an expert compliance assistant for New Zealand water utilities, specializing in Taumata Arowai regulations.

Organization Context:
- Name: ${context.organizationName}
- Compliance Score: ${context.complianceScore ? `${context.complianceScore}/100` : 'Not available'}
- DWSP Status: ${context.dwspStatus || 'Not submitted'}
- Total Assets: ${context.assetCount}
- Recent Reports: ${context.recentReports || 0}
- Critical Assets: ${context.criticalAssets || 0}
- Overdue Items: ${context.overdueItems || 0}

Your role:
1. Answer questions about NZ water compliance regulations clearly and accurately
2. Explain Taumata Arowai requirements in practical terms for operators
3. Provide specific guidance based on the organization's current status
4. Cite specific regulations when relevant (e.g., "Water Services Act 2021", "DWSP requirements")
5. Suggest actionable next steps when appropriate
6. Be encouraging but honest about compliance gaps

Guidelines:
- Use plain language, avoiding unnecessary jargon
- When discussing regulations, explain both the requirement AND why it matters
- If asked about their status, reference the context data provided
- Always prioritize public health and safety
- Be concise but thorough - aim for 2-3 paragraphs per answer
- If you don't know something specific, say so and suggest where to find the information

DO NOT:
- Provide legal advice (suggest consulting with qualified professionals)
- Make up specific regulation numbers or dates
- Guarantee compliance without full information
- Dismiss safety concerns

Format your responses in a professional but friendly tone, as if speaking to a busy water utility operator who needs practical help.`;
}

/**
 * Get organization context for AI
 */
async function getOrganizationContext(
  organizationId: string
): Promise<ComplianceContext> {
  const [org, assets, compliancePlans, reports, complianceScore] =
    await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
      }),
      prisma.asset.count({
        where: { organizationId, deletedAt: null },
      }),
      prisma.compliancePlan.findFirst({
        where: { organizationId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.report.count({
        where: {
          organizationId,
          createdAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
          },
        },
      }),
      prisma.complianceScore.findFirst({
        where: { organizationId },
        orderBy: { calculatedAt: 'desc' },
      }),
    ]);

  const criticalAssets = await prisma.asset.count({
    where: {
      organizationId,
      riskLevel: 'CRITICAL',
      deletedAt: null,
    },
  });

  return {
    organizationName: org?.name || 'Unknown',
    complianceScore: complianceScore?.overallScore,
    dwspStatus: compliancePlans?.status || 'Not created',
    assetCount: assets,
    recentReports: reports,
    criticalAssets,
    overdueItems: 0, // TODO: Calculate from deadlines
  };
}

/**
 * Get conversation history
 */
async function getConversationHistory(sessionId: string, limit: number = 5) {
  return await prisma.aIConversation.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: limit * 2, // Both user and assistant messages
  });
}

/**
 * Save conversation to database
 */
async function saveConversation(
  organizationId: string,
  userId: string,
  sessionId: string,
  question: string,
  answer: string
) {
  await prisma.aIConversation.createMany({
    data: [
      {
        organizationId,
        userId,
        sessionId,
        role: 'user',
        message: question,
        feature: AIFeature.COMPLIANCE_ASSISTANT,
      },
      {
        organizationId,
        userId,
        sessionId,
        role: 'assistant',
        message: answer,
        feature: AIFeature.COMPLIANCE_ASSISTANT,
      },
    ],
  });
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Calculate cost helper
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
  const INPUT_COST = 3.0 / 1000000; // $3 per million
  const OUTPUT_COST = 15.0 / 1000000; // $15 per million
  return Math.ceil((inputTokens * INPUT_COST + outputTokens * OUTPUT_COST) * 100);
}

/**
 * Get conversation history for user (for display)
 */
export async function getConversationHistoryForUser(
  userId: string,
  sessionId?: string,
  limit: number = 50
) {
  const where: any = { userId };
  if (sessionId) {
    where.sessionId = sessionId;
  }

  return await prisma.aIConversation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Delete conversation history
 */
export async function deleteConversation(userId: string, sessionId: string) {
  await prisma.aIConversation.deleteMany({
    where: {
      userId,
      sessionId,
    },
  });

  return { success: true };
}
