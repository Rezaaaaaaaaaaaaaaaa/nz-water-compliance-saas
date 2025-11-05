/**
 * AI Water Quality Analysis Service
 *
 * Analyzes water quality test results for anomalies, trends, and compliance risks
 * using Claude API for intelligent pattern detection.
 */

import Anthropic from '@anthropic-ai/sdk';
import { AIFeature, WaterQualityTest } from '@prisma/client';
import { checkAIQuota, logAIUsage } from './ai-usage.service.js';
import { logger } from '../config/logger.js';
import { config } from '../config/index.js';
import { prisma } from '../config/database.js';

const anthropic = new Anthropic({
  apiKey: config.ai.anthropicApiKey || '',
});

const MODEL = config.ai.model;

interface WaterQualityAnalysisResult {
  anomalies: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    parameter: string;
    issue: string;
    value: string;
    threshold: string;
    recommendation: string;
  }>;
  trends: Array<{
    parameter: string;
    direction: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
    concern: string;
    recommendation: string;
  }>;
  compliance: {
    overallStatus: 'compliant' | 'warning' | 'non-compliant';
    exceedances: Array<{
      parameter: string;
      count: number;
      severity: string;
    }>;
  };
  summary: string;
  recommendedActions: Array<{
    priority: 'urgent' | 'high' | 'medium' | 'low';
    action: string;
    reason: string;
  }>;
  usage: {
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
  };
}

/**
 * Analyze water quality test results
 */
export async function analyzeWaterQuality(
  userId: string,
  organizationId: string,
  componentId: string,
  testPeriodDays: number = 90,
  ipAddress?: string,
  userAgent?: string
): Promise<WaterQualityAnalysisResult> {
  const startTime = Date.now();

  // Check quota
  const quotaCheck = await checkAIQuota(organizationId, AIFeature.WATER_QUALITY_ANALYSIS, 4000);

  if (!quotaCheck.allowed) {
    throw new Error(quotaCheck.reason || 'AI quota exceeded');
  }

  // Get water quality tests
  const tests = await prisma.waterQualityTest.findMany({
    where: {
      organizationId,
      componentId,
      deletedAt: null,
      sampleDate: {
        gte: new Date(Date.now() - testPeriodDays * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { sampleDate: 'asc' },
    take: 200, // Limit to recent 200 tests
  });

  if (tests.length === 0) {
    throw new Error('No water quality test data available for analysis');
  }

  // Convert to CSV format for Claude
  const csvData = convertTestsToCSV(tests);

  const prompt = `You are a water quality expert analyzing test results for a New Zealand water supply regulated by Taumata Arowai.

Analyze this water quality data (last ${testPeriodDays} days, ${tests.length} tests):

${csvData}

Key NZ Standards:
- E. coli: MUST be 0 (absolute requirement)
- pH: Should be 7.0-8.5
- Chlorine (free residual): Should be 0.2-5.0 mg/L
- Turbidity: Should be <1.0 NTU (ideally <0.5)
- Protozoa (Cryptosporidium, Giardia): Must meet log reduction requirements

Provide analysis in JSON format:

{
  "anomalies": [
    {
      "severity": "<critical|high|medium|low>",
      "parameter": "<parameter name>",
      "issue": "<description>",
      "value": "<observed value>",
      "threshold": "<regulatory threshold>",
      "recommendation": "<specific action>"
    }
  ],
  "trends": [
    {
      "parameter": "<parameter name>",
      "direction": "<increasing|decreasing|stable|fluctuating>",
      "concern": "<why this trend matters>",
      "recommendation": "<what to do about it>"
    }
  ],
  "compliance": {
    "overallStatus": "<compliant|warning|non-compliant>",
    "exceedances": [
      {
        "parameter": "<parameter name>",
        "count": <number of exceedances>,
        "severity": "<critical|high|medium|low>"
      }
    ]
  },
  "summary": "<2-3 sentence executive summary>",
  "recommendedActions": [
    {
      "priority": "<urgent|high|medium|low>",
      "action": "<specific action to take>",
      "reason": "<why this is needed>"
    }
  ]
}

Focus on:
1. ANY E. coli detections (critical - immediate action required)
2. pH out of range
3. Chlorine residual issues (too high = taste, too low = safety)
4. Turbidity spikes
5. Trends that suggest deteriorating water quality
6. Regulatory compliance gaps`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 3072,
      messages: [{ role: 'user', content: prompt }],
    });

    const answerText = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const jsonMatch = answerText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : {
          anomalies: [],
          trends: [],
          compliance: { overallStatus: 'unknown', exceedances: [] },
          summary: 'Analysis failed',
          recommendedActions: [],
        };

    const latencyMs = Date.now() - startTime;

    await logAIUsage({
      organizationId,
      userId,
      feature: AIFeature.WATER_QUALITY_ANALYSIS,
      operation: 'analyze_water_quality',
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
        componentId,
        testsAnalyzed: tests.length,
        overallStatus: analysis.compliance.overallStatus,
      },
      'Water quality analysis completed'
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
      feature: AIFeature.WATER_QUALITY_ANALYSIS,
      operation: 'analyze_water_quality',
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
        componentId,
        error: error.message,
      },
      'Water quality analysis failed'
    );

    throw new Error(`Water quality analysis error: ${error.message}`);
  }
}

/**
 * Convert water quality tests to CSV format
 */
function convertTestsToCSV(tests: WaterQualityTest[]): string {
  const header = 'Date,Parameter,Value,Unit,Complies,Notes';
  const rows = tests.map((test) => {
    const date = test.sampleDate.toISOString().split('T')[0];
    const value = `${test.valuePrefix || ''}${test.value}`;
    const complies = test.compliesWithRule ? 'Yes' : 'No';
    const notes = test.notes || '';
    return `${date},${test.parameter},${value},${test.unit},${complies},"${notes}"`;
  });

  return [header, ...rows].join('\n');
}

function calculateCost(inputTokens: number, outputTokens: number): number {
  const INPUT_COST = 3.0 / 1000000;
  const OUTPUT_COST = 15.0 / 1000000;
  return Math.ceil((inputTokens * INPUT_COST + outputTokens * OUTPUT_COST) * 100);
}
