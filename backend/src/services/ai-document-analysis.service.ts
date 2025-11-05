/**
 * AI Document Analysis Service
 *
 * Analyzes compliance documents (especially DWSPs) using Claude API
 * to check for completeness, compliance gaps, and improvement opportunities.
 */

import Anthropic from '@anthropic-ai/sdk';
import { AIFeature } from '@prisma/client';
import { checkAIQuota, logAIUsage } from './ai-usage.service.js';
import { logger } from '../config/logger.js';
import { config } from '../config/index.js';

const anthropic = new Anthropic({
  apiKey: config.ai.anthropicApiKey || '',
});

const MODEL = config.ai.model;
const MAX_TOKENS = 4096; // Higher for document analysis

interface DWSPAnalysisResult {
  completenessScore: number; // 0-100
  missingElements: string[];
  recommendations: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    issue: string;
    recommendation: string;
  }>;
  strengths: string[];
  complianceRisks: string[];
  summary: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
  };
}

/**
 * Analyze a DWSP document for compliance
 */
export async function analyzeDWSP(
  userId: string,
  organizationId: string,
  documentContent: string,
  documentId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<DWSPAnalysisResult> {
  const startTime = Date.now();

  // Check quota
  const quotaCheck = await checkAIQuota(
    organizationId,
    AIFeature.DWSP_ANALYSIS,
    6000 // Estimated tokens for DWSP analysis
  );

  if (!quotaCheck.allowed) {
    throw new Error(quotaCheck.reason || 'AI quota exceeded');
  }

  // Truncate if too long (max ~15,000 tokens ~= 60,000 chars)
  const truncatedContent =
    documentContent.length > 60000
      ? documentContent.substring(0, 60000) + '\n\n[Document truncated...]'
      : documentContent;

  const prompt = `You are an expert in New Zealand water compliance, specifically Drinking Water Safety Plans (DWSP) as required by Taumata Arowai.

Analyze this DWSP document and provide a comprehensive assessment:

${truncatedContent}

Provide your analysis in the following JSON format:

{
  "completenessScore": <number 0-100>,
  "missingElements": [<array of strings - which of the 12 mandatory elements are missing or incomplete>],
  "recommendations": [
    {
      "severity": "<critical|high|medium|low>",
      "category": "<element name or category>",
      "issue": "<description of the problem>",
      "recommendation": "<specific actionable recommendation>"
    }
  ],
  "strengths": [<array of strings - positive aspects found>],
  "complianceRisks": [<array of strings - potential non-compliance issues>],
  "summary": "<2-3 paragraph executive summary of the analysis>"
}

The 12 mandatory DWSP elements are:
1. Water Supply Description
2. Hazard Identification
3. Risk Assessment
4. Preventive Measures/Control Measures
5. Operational Monitoring
6. Verification Monitoring
7. Corrective Actions
8. Emergency Response Procedures
9. Residual Disinfection (or exemption)
10. Water Quantity Planning
11. Incident and Event Recording
12. Review and Amendment Procedures

Focus on:
- Completeness of all 12 elements
- Quality and depth of hazard identification
- Adequacy of risk assessments
- Specificity of preventive measures
- Clarity of monitoring procedures
- Practical applicability of procedures
- Regulatory compliance alignment`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const answerText = response.content[0].type === 'text' ? response.content[0].text : '{}';

    // Parse JSON response
    const jsonMatch = answerText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : {
          completenessScore: 0,
          missingElements: [],
          recommendations: [],
          strengths: [],
          complianceRisks: [],
          summary: 'Failed to parse analysis',
        };

    const latencyMs = Date.now() - startTime;

    // Log usage
    await logAIUsage({
      organizationId,
      userId,
      feature: AIFeature.DWSP_ANALYSIS,
      operation: 'analyze_dwsp',
      model: MODEL,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      success: true,
      latencyMs,
      ipAddress,
      userAgent,
    });

    logger.info(
      {
        organizationId,
        userId,
        documentId,
        completenessScore: analysis.completenessScore,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      'DWSP analysis completed'
    );

    return {
      ...analysis,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        estimatedCost: calculateCost(response.usage.input_tokens, response.usage.output_tokens),
      },
    };
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;

    await logAIUsage({
      organizationId,
      userId,
      feature: AIFeature.DWSP_ANALYSIS,
      operation: 'analyze_dwsp',
      model: MODEL,
      inputTokens: 0,
      outputTokens: 0,
      success: false,
      errorMessage: error.message,
      latencyMs,
      ipAddress,
      userAgent,
    });

    logger.error(
      {
        organizationId,
        userId,
        error: error.message,
      },
      'DWSP analysis failed'
    );

    throw new Error(`Document analysis error: ${error.message}`);
  }
}

/**
 * Generate DWQAR summary
 */
export async function generateReportSummary(
  userId: string,
  organizationId: string,
  reportData: {
    complianceEvents: any[];
    waterQualityTests: any[];
    nonCompliances: any[];
    year: number;
  },
  ipAddress?: string,
  userAgent?: string
): Promise<{
  summary: string;
  keyAchievements: string[];
  issuesAddressed: string[];
  improvementActions: string[];
  usage: any;
}> {
  const startTime = Date.now();

  const quotaCheck = await checkAIQuota(organizationId, AIFeature.REPORT_GENERATION, 3000);

  if (!quotaCheck.allowed) {
    throw new Error(quotaCheck.reason || 'AI quota exceeded');
  }

  const prompt = `Generate an executive summary for the Drinking Water Quality Annual Report (DWQAR) for ${reportData.year}.

Data:
- Compliance Events: ${reportData.complianceEvents.length}
- Water Quality Tests Conducted: ${reportData.waterQualityTests.length}
- Non-Compliance Incidents: ${reportData.nonCompliances.length}

Create a professional summary suitable for submission to Taumata Arowai in JSON format:

{
  "summary": "<2-3 paragraph executive summary>",
  "keyAchievements": [<array of key accomplishments this year>],
  "issuesAddressed": [<array of problems that were resolved>],
  "improvementActions": [<array of planned improvements>]
}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const answerText = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const jsonMatch = answerText.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    const latencyMs = Date.now() - startTime;

    await logAIUsage({
      organizationId,
      userId,
      feature: AIFeature.REPORT_GENERATION,
      operation: 'generate_dwqar_summary',
      model: MODEL,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      success: true,
      latencyMs,
      ipAddress,
      userAgent,
    });

    return {
      ...result,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        estimatedCost: calculateCost(response.usage.input_tokens, response.usage.output_tokens),
      },
    };
  } catch (error: any) {
    await logAIUsage({
      organizationId,
      userId,
      feature: AIFeature.REPORT_GENERATION,
      operation: 'generate_dwqar_summary',
      model: MODEL,
      inputTokens: 0,
      outputTokens: 0,
      success: false,
      errorMessage: error.message,
      latencyMs: Date.now() - startTime,
      ipAddress,
      userAgent,
    });

    throw new Error(`Report generation error: ${error.message}`);
  }
}

function calculateCost(inputTokens: number, outputTokens: number): number {
  const INPUT_COST = 3.0 / 1000000;
  const OUTPUT_COST = 15.0 / 1000000;
  return Math.ceil((inputTokens * INPUT_COST + outputTokens * OUTPUT_COST) * 100);
}
