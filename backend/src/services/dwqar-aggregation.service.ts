import { WaterQualityTest } from '@prisma/client';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * DWQAR Report Structure for Annual Submission
 */
export interface DWQARReport {
  reportingPeriod: string; // "2024-Annual" or "2024-Q1"
  organizationId: string;
  samplesData: WaterQualityTestData[];
  reportsData: RuleComplianceData[];
  generatedAt: Date;
  status: 'DRAFT' | 'VALIDATED' | 'SUBMITTED';
  completeness: number; // 0-100%
  totalSamples: number;
  totalRules: number;
}

/**
 * Water Quality Test Data for Excel Export (Samples sheet)
 */
export interface WaterQualityTestData {
  ruleId: string;
  componentId: string;
  externalSampleId: string | null;
  sampleDate: Date;
  parameter: string;
  valuePrefix: string | null;
  value: number;
  unit: string;
  compliesWithRule: boolean;
  sourceClass: string | null;
  notes: string | null;
}

/**
 * Rule Compliance Data for Excel Export (Reports sheet)
 */
export interface RuleComplianceData {
  ruleId: string;
  componentId: string;
  complies: boolean;
  nonCompliantPeriods: number;
  notes: string | null;
  totalSamples: number;
  compliantSamples: number;
}

/**
 * DWQAR Aggregation Service
 * Handles automatic nightly aggregation of water quality data for DWQAR reporting
 */
export class DWQARAggregationService {
  /**
   * Aggregate all water quality data for a reporting period
   * @param organizationId - Organization ID
   * @param period - Reporting period (e.g., "2024-Annual", "2024-Q1")
   * @returns Complete DWQAR report structure
   */
  async aggregateReportingPeriod(organizationId: string, period: string): Promise<DWQARReport> {
    logger.info({ organizationId, period }, 'Aggregating DWQAR data');

    // Parse reporting period
    const { startDate, endDate } = this.parseReportingPeriod(period);

    // Get all water quality tests for period
    const tests = await this.getWaterQualityTests(organizationId, startDate, endDate);

    logger.info({ count: tests.length }, 'Water quality tests retrieved');

    // Transform to samples data
    const samplesData: WaterQualityTestData[] = tests.map((test) => ({
      ruleId: test.ruleId,
      componentId: test.componentId,
      externalSampleId: test.externalSampleId,
      sampleDate: test.sampleDate,
      parameter: test.parameter,
      valuePrefix: test.valuePrefix,
      value: Number(test.value),
      unit: test.unit,
      compliesWithRule: test.compliesWithRule,
      sourceClass: test.sourceClass,
      notes: test.notes,
    }));

    // Group by rule + component and calculate compliance
    const reportsData = await this.calculateRuleCompliance(tests, organizationId, period);

    logger.info(
      { count: reportsData.length },
      'Calculated compliance for rule-component combinations'
    );

    // Calculate completeness
    const completeness = await this.calculateCompleteness(
      organizationId,
      tests.length,
      reportsData.length
    );

    return {
      reportingPeriod: period,
      organizationId,
      samplesData,
      reportsData,
      generatedAt: new Date(),
      status: 'DRAFT',
      completeness,
      totalSamples: tests.length,
      totalRules: reportsData.length,
    };
  }

  /**
   * Parse reporting period string into date range
   */
  private parseReportingPeriod(period: string): {
    startDate: Date;
    endDate: Date;
  } {
    const [year, periodType] = period.split('-');
    const yearNum = parseInt(year);

    if (periodType === 'Annual') {
      return {
        startDate: new Date(yearNum, 0, 1), // Jan 1
        endDate: new Date(yearNum, 11, 31, 23, 59, 59), // Dec 31
      };
    } else if (periodType.startsWith('Q')) {
      const quarter = parseInt(periodType.replace('Q', ''));
      const startMonth = (quarter - 1) * 3;
      return {
        startDate: new Date(yearNum, startMonth, 1),
        endDate: new Date(yearNum, startMonth + 3, 0, 23, 59, 59),
      };
    } else {
      throw new Error(`Invalid reporting period format: ${period}`);
    }
  }

  /**
   * Get all water quality tests for a date range
   */
  private async getWaterQualityTests(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WaterQualityTest[]> {
    return prisma.waterQualityTest.findMany({
      where: {
        organizationId,
        sampleDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [{ componentId: 'asc' }, { ruleId: 'asc' }, { sampleDate: 'asc' }],
    });
  }

  /**
   * Calculate rule compliance for each (rule + component) combination
   */
  private async calculateRuleCompliance(
    tests: WaterQualityTest[],
    organizationId: string,
    period: string
  ): Promise<RuleComplianceData[]> {
    // Group tests by (ruleId + componentId)
    const grouped = new Map<string, WaterQualityTest[]>();

    for (const test of tests) {
      const key = `${test.ruleId}|${test.componentId}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(test);
    }

    // Calculate compliance for each group
    const results: RuleComplianceData[] = [];

    for (const [key, groupTests] of grouped.entries()) {
      const [ruleId, componentId] = key.split('|');

      const totalSamples = groupTests.length;
      const compliantSamples = groupTests.filter((t) => t.compliesWithRule).length;
      const nonCompliantPeriods = groupTests.filter((t) => !t.compliesWithRule).length;

      // Overall compliance: all samples must comply
      const complies = nonCompliantPeriods === 0;

      results.push({
        ruleId,
        componentId,
        complies,
        nonCompliantPeriods,
        notes: complies ? null : `${nonCompliantPeriods} non-compliant samples`,
        totalSamples,
        compliantSamples,
      });

      // Also save to RuleCompliance table for tracking
      await prisma.ruleCompliance.upsert({
        where: {
          organizationId_ruleId_componentId_reportingPeriod: {
            organizationId,
            ruleId,
            componentId,
            reportingPeriod: period,
          },
        },
        update: {
          complies,
          nonCompliantPeriods,
          totalSamples,
          compliantSamples,
          lastCalculated: new Date(),
        },
        create: {
          organizationId,
          ruleId,
          componentId,
          reportingPeriod: period,
          startDate: new Date(`${period.split('-')[0]}-01-01`),
          endDate: new Date(`${period.split('-')[0]}-12-31`),
          complies,
          nonCompliantPeriods,
          totalSamples,
          compliantSamples,
          lastCalculated: new Date(),
        },
      });
    }

    return results;
  }

  /**
   * Calculate report completeness (percentage)
   * Compares actual tests vs required tests
   */
  private async calculateCompleteness(
    organizationId: string,
    actualTests: number,
    actualRules: number
  ): Promise<number> {
    // Get all active compliance rules
    const totalActiveRules = await prisma.complianceRule.count({
      where: { isActive: true },
    });

    // Get number of water supply components
    const totalComponents = await prisma.waterSupplyComponent.count({
      where: { organizationId, isActive: true },
    });

    // Expected: Each component should be tested against applicable rules
    // For now, use simple heuristic: average of test and rule coverage
    const expectedTests = totalActiveRules * totalComponents * 12; // Monthly testing
    const expectedRules = totalActiveRules * totalComponents;

    const testCompleteness = Math.min((actualTests / expectedTests) * 100, 100);
    const ruleCompleteness = Math.min((actualRules / expectedRules) * 100, 100);

    return (testCompleteness + ruleCompleteness) / 2;
  }

  /**
   * Get current report status (for dashboard)
   */
  async getCurrentStatus(organizationId: string): Promise<{
    reportingPeriod: string;
    status: string;
    samplesCount: number;
    rulesCount: number;
    completeness: number;
    daysUntilDeadline: number;
  }> {
    const currentYear = new Date().getFullYear();
    const period = `${currentYear}-Annual`;

    // July 31 deadline
    const deadline = new Date(currentYear, 6, 31);
    const today = new Date();
    const daysUntilDeadline = Math.ceil(
      (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get aggregated report
    const report = await this.aggregateReportingPeriod(organizationId, period);

    return {
      reportingPeriod: period,
      status: report.status,
      samplesCount: report.totalSamples,
      rulesCount: report.totalRules,
      completeness: Math.round(report.completeness * 10) / 10,
      daysUntilDeadline,
    };
  }
}

export const dwqarAggregationService = new DWQARAggregationService();
