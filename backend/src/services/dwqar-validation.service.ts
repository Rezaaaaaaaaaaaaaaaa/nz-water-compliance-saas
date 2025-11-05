import { DWQARReport } from './dwqar-aggregation.service.js';
import { prisma } from '../config/database.js';

/**
 * Validation Error (blocks export)
 */
export interface ValidationError {
  severity: 'ERROR';
  field: string;
  message: string;
  code: string;
}

/**
 * Validation Warning (allows export but flags issues)
 */
export interface ValidationWarning {
  severity: 'WARNING';
  field: string;
  message: string;
  code: string;
  recommendation?: string;
}

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  canExport: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: string;
  timestamp: Date;
}

/**
 * DWQAR Validation Service
 * Performs pre-export validation to ensure data quality and completeness
 */
export class DWQARValidationService {
  /**
   * Validate DWQAR report before export
   * @param report - DWQAR report to validate
   * @returns Validation result with errors and warnings
   */
  async validate(report: DWQARReport): Promise<ValidationResult> {
    console.log(`[DWQAR Validation] Starting validation for ${report.reportingPeriod}`);

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // === CRITICAL ERRORS (prevent export) ===

    // 1. No samples recorded
    if (report.samplesData.length === 0) {
      errors.push({
        severity: 'ERROR',
        field: 'samplesData',
        message: 'No water quality samples recorded for this period',
        code: 'NO_SAMPLES',
      });
    }

    // 2. No rule compliance data
    if (report.reportsData.length === 0) {
      errors.push({
        severity: 'ERROR',
        field: 'reportsData',
        message: 'No compliance rule data available',
        code: 'NO_COMPLIANCE_DATA',
      });
    }

    // 3. Validate sample data fields
    for (const sample of report.samplesData) {
      if (!sample.sampleDate) {
        errors.push({
          severity: 'ERROR',
          field: `sample.${sample.ruleId}_${sample.componentId}.sampleDate`,
          message: 'Sample date is required',
          code: 'MISSING_SAMPLE_DATE',
        });
      }

      if (sample.value === null || sample.value === undefined) {
        errors.push({
          severity: 'ERROR',
          field: `sample.${sample.ruleId}_${sample.componentId}.value`,
          message: 'Test value is required',
          code: 'MISSING_VALUE',
        });
      }

      if (sample.value < 0) {
        errors.push({
          severity: 'ERROR',
          field: `sample.${sample.ruleId}_${sample.componentId}.value`,
          message: 'Test value cannot be negative',
          code: 'INVALID_VALUE',
        });
      }

      if (!sample.unit) {
        errors.push({
          severity: 'ERROR',
          field: `sample.${sample.ruleId}_${sample.componentId}.unit`,
          message: 'Unit is required for test result',
          code: 'MISSING_UNIT',
        });
      }
    }

    // 4. Validate component IDs exist in Hinekōrako
    const unregisteredComponents = await this.findUnregisteredComponents(
      report.organizationId,
      report.samplesData.map((s) => s.componentId)
    );

    if (unregisteredComponents.length > 0) {
      errors.push({
        severity: 'ERROR',
        field: 'components',
        message: `${unregisteredComponents.length} supply components missing Hinekōrako IDs: ${unregisteredComponents.join(', ')}`,
        code: 'UNREGISTERED_COMPONENTS',
      });
    }

    // === WARNINGS (allow export but flag issues) ===

    // 1. Low completeness
    if (report.completeness < 90) {
      warnings.push({
        severity: 'WARNING',
        field: 'completeness',
        message: `Report completeness is ${report.completeness.toFixed(1)}% (below 90% threshold)`,
        code: 'LOW_COMPLETENESS',
        recommendation: 'Review missing tests and add data before final submission',
      });
    }

    // 2. Missing recommended tests
    const requiredTestCount = await this.getRequiredTestCount(
      report.organizationId
    );
    if (report.totalSamples < requiredTestCount * 0.9) {
      warnings.push({
        severity: 'WARNING',
        field: 'samplesData',
        message: `Only ${report.totalSamples}/${requiredTestCount} required tests performed (90% threshold)`,
        code: 'INSUFFICIENT_TESTS',
        recommendation: 'Consider additional testing to meet regulatory requirements',
      });
    }

    // 3. Non-compliant rules detected
    const nonCompliantRules = report.reportsData.filter((r) => !r.complies);
    if (nonCompliantRules.length > 0) {
      warnings.push({
        severity: 'WARNING',
        field: 'compliance',
        message: `${nonCompliantRules.length} compliance rules failed`,
        code: 'NON_COMPLIANCE',
        recommendation: 'Address non-compliant issues before submission to avoid regulatory action',
      });
    }

    // 4. Missing lab accreditation
    const samplesWithoutAccreditation = report.samplesData.filter(
      (s) => !s.sourceClass
    );
    if (samplesWithoutAccreditation.length > 0) {
      warnings.push({
        severity: 'WARNING',
        field: 'labAccreditation',
        message: `${samplesWithoutAccreditation.length} samples missing lab accreditation/source class`,
        code: 'MISSING_ACCREDITATION',
        recommendation: 'Ensure all tests are performed by IANZ-accredited labs',
      });
    }

    // 5. Recent deadline warning
    const deadline = this.getDeadlineDate(report.reportingPeriod);
    const daysUntilDeadline = Math.ceil(
      (deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDeadline <= 7 && daysUntilDeadline > 0) {
      warnings.push({
        severity: 'WARNING',
        field: 'deadline',
        message: `URGENT: Submission deadline in ${daysUntilDeadline} days (July 31)`,
        code: 'DEADLINE_APPROACHING',
        recommendation: 'Submit to Hinekōrako immediately after export',
      });
    } else if (daysUntilDeadline <= 0) {
      errors.push({
        severity: 'ERROR',
        field: 'deadline',
        message: `OVERDUE: Submission deadline passed ${Math.abs(daysUntilDeadline)} days ago`,
        code: 'DEADLINE_PASSED',
      });
    }

    // Generate summary
    const summary = `${errors.length} errors, ${warnings.length} warnings`;
    const canExport = errors.length === 0;

    console.log(`[DWQAR Validation] ${summary} - ${canExport ? 'PASSED' : 'FAILED'}`);

    return {
      valid: errors.length === 0 && warnings.length === 0,
      canExport,
      errors,
      warnings,
      summary,
      timestamp: new Date(),
    };
  }

  /**
   * Find components not registered with Hinekōrako
   */
  private async findUnregisteredComponents(
    _organizationId: string,
    componentIds: string[]
  ): Promise<string[]> {
    const uniqueComponentIds = [...new Set(componentIds)];
    const unregistered: string[] = [];

    for (const componentId of uniqueComponentIds) {
      const component = await prisma.waterSupplyComponent.findUnique({
        where: { componentId },
      });

      // Check if component exists and has Hinekōrako ID
      if (!component || !component.componentId.match(/^[A-Z]{2}\d{5}$/)) {
        unregistered.push(componentId);
      }
    }

    return unregistered;
  }

  /**
   * Get required test count for organization
   * Based on components and applicable rules
   */
  private async getRequiredTestCount(
    organizationId: string
  ): Promise<number> {
    // Get active components
    const components = await prisma.waterSupplyComponent.count({
      where: { organizationId, isActive: true },
    });

    // Estimate: Each component tested monthly for applicable rules
    // Simplified: assume 50 core rules per component, 12 times per year
    return components * 50 * 12;
  }

  /**
   * Get deadline date for reporting period
   */
  private getDeadlineDate(reportingPeriod: string): Date {
    const [year] = reportingPeriod.split('-');
    const yearNum = parseInt(year);

    // DWQAR deadline is July 31 (for previous calendar year)
    return new Date(yearNum + 1, 6, 31); // July 31 of following year
  }

  /**
   * Quick validation check (for UI indicators)
   */
  async quickValidate(
    _organizationId: string,
    _period: string
  ): Promise<{ valid: boolean; errorCount: number; warningCount: number }> {
    // This would call aggregation service to get report
    // For now, return placeholder
    return {
      valid: true,
      errorCount: 0,
      warningCount: 0,
    };
  }
}

export const dwqarValidationService = new DWQARValidationService();
