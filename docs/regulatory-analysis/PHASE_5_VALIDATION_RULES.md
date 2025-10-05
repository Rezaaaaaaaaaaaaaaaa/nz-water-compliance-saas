# Phase 5: Validation Rules from Regulatory Requirements

**Date:** October 5, 2025
**Phase:** 5 of 6
**Priority:** MEDIUM-HIGH
**Status:** DESIGN COMPLETE

---

## Executive Summary

Phase 5 defines comprehensive validation rules derived from NZ drinking water regulations. These rules ensure data integrity, prevent non-compliance, and guide users toward regulatory requirements.

**Validation Layers:**
1. **Schema Validation** - Data types, required fields (Zod)
2. **Business Rules** - Regulatory requirements (custom logic)
3. **Cross-Entity** - Relationships between models
4. **Temporal** - Deadlines and time-based rules
5. **Regulatory** - Taumata Arowai specific requirements

---

## Validation Strategy

### Three-Tier Approach

```
┌─────────────────────────────────────────────┐
│ TIER 1: BLOCKING ERRORS                    │
│ Prevent save/submit - must fix immediately │
│ Examples:                                    │
│ - Missing required field                    │
│ - Invalid data type                         │
│ - Constraint violation                      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ TIER 2: WARNINGS                            │
│ Allow save but flag - should fix soon       │
│ Examples:                                    │
│ - Recommended field missing                 │
│ - Data quality concern                      │
│ - Approaching deadline                      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ TIER 3: RECOMMENDATIONS                     │
│ Best practices - nice to have               │
│ Examples:                                    │
│ - Additional documentation                  │
│ - Improvement opportunities                 │
│ - Optimization suggestions                  │
└─────────────────────────────────────────────┘
```

---

## Validation Rules by Entity

### 1. WaterQualityTest

**Schema Validation (Zod):**

```typescript
import { z } from 'zod';

const WaterQualityTestSchema = z.object({
  // Required fields
  componentId: z.string().min(1, 'Supply component is required'),
  ruleId: z.string().min(1, 'Compliance rule is required'),
  sampleDate: z.date({ required_error: 'Sample date is required' }),
  parameter: z.enum(['ECOL', 'PH', 'TURBIDITY', /* ... */], {
    errorMap: () => ({ message: 'Invalid water parameter' })
  }),
  value: z.number().nonnegative('Test value must be non-negative'),
  unit: z.string().min(1, 'Unit is required'),
  compliesWithRule: z.boolean(),

  // Optional fields
  externalSampleId: z.string().optional(),
  valuePrefix: z.enum(['<', '>', '']).optional(),
  sourceClass: z.string().optional(),
  notes: z.string().max(500, 'Notes too long (max 500 characters)').optional(),

  // Lab info
  labName: z.string().optional(),
  labAccreditation: z.string().regex(/^IANZ-\d+$/, 'Invalid IANZ accreditation format').optional(),
  testMethod: z.string().optional()
}).refine(
  (data) => {
    // Business rule: E. coli tests must have lab accreditation
    if (data.parameter === 'ECOL' && !data.labAccreditation) {
      return false;
    }
    return true;
  },
  {
    message: 'E. coli tests require IANZ-accredited lab',
    path: ['labAccreditation']
  }
);
```

**Business Rules:**

```typescript
export class WaterQualityTestValidator {
  async validate(test: WaterQualityTest): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // RULE 1: Sample date cannot be in the future
    if (isAfter(test.sampleDate, new Date())) {
      errors.push({
        field: 'sampleDate',
        message: 'Sample date cannot be in the future',
        severity: 'ERROR'
      });
    }

    // RULE 2: E. coli value should trigger alert if > 1
    if (test.parameter === 'ECOL' && test.value > 1) {
      warnings.push({
        field: 'value',
        message: 'E. coli detected (${test.value} ${test.unit}). Corrective action required.',
        severity: 'WARNING',
        action: 'CREATE_INCIDENT'
      });
    }

    // RULE 3: External sample ID recommended for audit trail
    if (!test.externalSampleId) {
      warnings.push({
        field: 'externalSampleId',
        message: 'Lab sample ID recommended for traceability',
        severity: 'INFO'
      });
    }

    // RULE 4: Check if test is required by compliance rule
    const rule = await ComplianceRule.findByRuleId(test.ruleId);
    if (!rule || !rule.isActive) {
      warnings.push({
        field: 'ruleId',
        message: 'This rule may be superseded or inactive',
        severity: 'WARNING'
      });
    }

    // RULE 5: Validate compliance determination
    const expectedCompliance = await this.checkCompliance(test);
    if (test.compliesWithRule !== expectedCompliance) {
      warnings.push({
        field: 'compliesWithRule',
        message: `Compliance mismatch: Expected ${expectedCompliance}, got ${test.compliesWithRule}`,
        severity: 'WARNING'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private async checkCompliance(test: WaterQualityTest): Promise<boolean> {
    const rule = await ComplianceRule.findByRuleId(test.ruleId);
    if (!rule) return false;

    // Apply rule limits
    if (rule.maxValue && test.value > rule.maxValue) return false;
    if (rule.minValue && test.value < rule.minValue) return false;

    return true;
  }
}
```

---

### 2. CompliancePlan (DWSP)

**Schema Validation:**

```typescript
const CompliancePlanSchema = z.object({
  // Basic info (Element 1, 11)
  waterSupplyName: z.string().min(1, 'Water supply name is required'),
  supplyPopulation: z.number().int().positive('Population must be positive'),
  sourceTypes: z.array(z.string()).min(1, 'At least one source type required'),
  treatmentProcesses: z.array(z.string()).min(1, 'At least one treatment process required'),

  // Hazards (Element 2)
  hazards: z.array(z.object({
    description: z.string().min(10, 'Hazard description too short'),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    likelihood: z.enum(['RARE', 'UNLIKELY', 'POSSIBLE', 'LIKELY', 'ALMOST_CERTAIN']),
    consequence: z.enum(['INSIGNIFICANT', 'MINOR', 'MODERATE', 'MAJOR', 'CATASTROPHIC'])
  })).min(3, 'Minimum 3 hazards required for comprehensive DWSP'),

  // Preventive measures (Element 3)
  preventiveMeasures: z.array(z.object({
    hazardId: z.string(),
    description: z.string().min(10),
    effectiveness: z.enum(['LOW', 'MEDIUM', 'HIGH'])
  })).min(1, 'At least one preventive measure required'),

  // Emergency response (Element 7)
  emergencyContactPrimary: z.string().min(1, 'Primary emergency contact required'),
  emergencyContactPhone: z.string().regex(/^(\+64|0)\d{8,9}$/, 'Invalid NZ phone number'),

  // Management (Element 8)
  waterSupplyManager: z.string().min(1, 'Water supply manager required'),

  // Review (Element 12)
  nextReviewDate: z.date()
}).refine(
  (data) => {
    // BUSINESS RULE: Next review must be within 12 months
    const oneYearFromNow = addYears(new Date(), 1);
    return isBefore(data.nextReviewDate, oneYearFromNow);
  },
  {
    message: 'Next review must be scheduled within 12 months',
    path: ['nextReviewDate']
  }
).refine(
  (data) => {
    // BUSINESS RULE: High-risk hazards need preventive measures
    const highRiskHazards = data.hazards?.filter(h =>
      h.riskLevel === 'HIGH' || h.riskLevel === 'CRITICAL'
    ) || [];

    const hazardsWithControls = new Set(
      data.preventiveMeasures?.map(pm => pm.hazardId) || []
    );

    const uncontrolledHighRisk = highRiskHazards.filter(h =>
      !hazardsWithControls.has(h.id)
    );

    return uncontrolledHighRisk.length === 0;
  },
  {
    message: 'All high/critical risk hazards must have preventive measures',
    path: ['preventiveMeasures']
  }
);
```

**Business Rules:**

```typescript
export class CompliancePlanValidator {
  async validate(plan: CompliancePlan): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // RULE 1: Population-based hazard requirements
    const minHazards = plan.supplyPopulation > 100 ? 5 : 3;
    const actualHazards = plan.hazards?.length || 0;

    if (actualHazards < minHazards) {
      warnings.push({
        field: 'hazards',
        message: `Supply serving ${plan.supplyPopulation} people should identify at least ${minHazards} hazards (currently ${actualHazards})`,
        severity: 'WARNING'
      });
    }

    // RULE 2: DWSP review overdue check
    if (plan.nextReviewDate && isBefore(plan.nextReviewDate, new Date())) {
      errors.push({
        field: 'nextReviewDate',
        message: `DWSP review overdue by ${daysBetween(plan.nextReviewDate, new Date())} days`,
        severity: 'ERROR',
        action: 'SCHEDULE_REVIEW'
      });
    }

    // RULE 3: All 12 elements present check
    const elements = this.checkAllElements(plan);
    const missingElements = elements.filter(e => !e.present);

    if (missingElements.length > 0) {
      errors.push({
        field: 'elements',
        message: `Missing ${missingElements.length} mandatory DWSP elements: ${missingElements.map(e => e.name).join(', ')}`,
        severity: 'ERROR'
      });
    }

    // RULE 4: Improvement plan timeline check
    if (plan.improvementPlan) {
      const overdueImprovements = plan.improvementPlan.filter(item =>
        item.targetDate && isBefore(item.targetDate, new Date()) && item.status !== 'COMPLETED'
      );

      if (overdueImprovements.length > 0) {
        warnings.push({
          field: 'improvementPlan',
          message: `${overdueImprovements.length} improvement items overdue`,
          severity: 'WARNING'
        });
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private checkAllElements(plan: CompliancePlan) {
    return [
      { name: 'Description', present: !!plan.waterSupplyName },
      { name: 'Hazards', present: plan.hazards?.length > 0 },
      { name: 'Preventive Measures', present: plan.preventiveMeasures?.length > 0 },
      { name: 'Operational Monitoring', present: !!plan.operationalMonitoring },
      { name: 'Verification Monitoring', present: !!plan.verificationMonitoring },
      { name: 'Corrective Actions', present: !!plan.correctiveActions },
      { name: 'Emergency Response', present: !!plan.emergencyContactPrimary },
      { name: 'Management', present: !!plan.waterSupplyManager },
      { name: 'Documentation', present: !!plan.communicationPlan },
      { name: 'Improvement Plan', present: !!plan.improvementPlan },
      { name: 'Supply Details', present: !!plan.supplyPopulation },
      { name: 'Review Schedule', present: !!plan.nextReviewDate }
    ];
  }
}
```

---

### 3. WaterSupplyComponent

**Validation Rules:**

```typescript
const WaterSupplyComponentSchema = z.object({
  componentId: z.string()
    .min(1, 'Hinekōrako Component ID required')
    .regex(/^[A-Z]{2}\d{5}$/, 'Invalid Hinekōrako ID format (e.g., TP04026)'),

  name: z.string().min(3, 'Component name too short'),

  componentType: z.enum([
    'TREATMENT_PLANT',
    'DISTRIBUTION_ZONE',
    'SOURCE_BORE',
    'SOURCE_SURFACE_WATER',
    'STORAGE_RESERVOIR',
    'PUMPING_STATION'
  ]),

  populationServed: z.number().int().positive().optional(),

  // Location (recommended for emergency response)
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional()
}).refine(
  (data) => {
    // If population > 500, location should be provided
    if (data.populationServed && data.populationServed > 500) {
      return !!data.latitude && !!data.longitude;
    }
    return true;
  },
  {
    message: 'Location coordinates recommended for supplies > 500 people',
    path: ['latitude']
  }
);
```

---

### 4. Cross-Entity Validation

**Regulatory Compliance Checks:**

```typescript
export class CrossEntityValidator {
  // RULE: Supply must have registered components before DWQAR export
  async validateDWQARReadiness(organizationId: string): Promise<ValidationResult> {
    const components = await WaterSupplyComponent.findByOrg(organizationId);

    if (components.length === 0) {
      return {
        valid: false,
        errors: [{
          field: 'components',
          message: 'No supply components registered. Register components in Hinekōrako first.',
          severity: 'ERROR'
        }]
      };
    }

    return { valid: true, errors: [], warnings: [] };
  }

  // RULE: Tests must match active compliance rules
  async validateTestAgainstRule(test: WaterQualityTest): Promise<ValidationResult> {
    const rule = await ComplianceRule.findByRuleId(test.ruleId);

    if (!rule) {
      return {
        valid: false,
        errors: [{
          field: 'ruleId',
          message: `Rule ${test.ruleId} not found in compliance rules database`,
          severity: 'ERROR'
        }]
      };
    }

    if (!rule.isActive) {
      return {
        valid: true,
        warnings: [{
          field: 'ruleId',
          message: `Rule ${test.ruleId} is inactive or superseded`,
          severity: 'WARNING'
        }]
      };
    }

    return { valid: true, errors: [], warnings: [] };
  }

  // RULE: DWSP hazards should map to water quality testing
  async validateHazardTestingAlignment(planId: string): Promise<ValidationResult> {
    const plan = await CompliancePlan.findById(planId);
    const tests = await WaterQualityTest.findByOrg(plan.organizationId);

    const warnings: ValidationWarning[] = [];

    // Check if E. coli hazard identified but no E. coli testing
    const hasEcoliHazard = plan.hazards?.some(h =>
      h.description.toLowerCase().includes('e. coli') ||
      h.description.toLowerCase().includes('ecoli') ||
      h.description.toLowerCase().includes('bacterial')
    );

    const hasEcoliTesting = tests.some(t => t.parameter === 'ECOL');

    if (hasEcoliHazard && !hasEcoliTesting) {
      warnings.push({
        field: 'hazards',
        message: 'E. coli hazard identified but no E. coli testing recorded',
        severity: 'WARNING',
        action: 'ADD_ECOLI_TESTING'
      });
    }

    return { valid: true, errors: [], warnings };
  }
}
```

---

### 5. Temporal Validation (Deadlines)

**Time-Based Rules:**

```typescript
export class TemporalValidator {
  // RULE: DWQAR deadline (July 31)
  async checkDWQARDeadline(organizationId: string): Promise<ValidationResult> {
    const currentYear = new Date().getFullYear();
    const deadline = new Date(currentYear, 6, 31); // July 31
    const daysUntilDeadline = daysBetween(new Date(), deadline);

    const report = await Report.findDWQAR(organizationId, currentYear);

    if (!report && daysUntilDeadline < 0) {
      return {
        valid: false,
        errors: [{
          field: 'dwqar',
          message: `DWQAR ${currentYear} is ${Math.abs(daysUntilDeadline)} days overdue`,
          severity: 'ERROR',
          priority: 'CRITICAL'
        }]
      };
    }

    if (!report && daysUntilDeadline <= 14) {
      return {
        valid: true,
        warnings: [{
          field: 'dwqar',
          message: `DWQAR ${currentYear} due in ${daysUntilDeadline} days`,
          severity: 'WARNING',
          priority: daysUntilDeadline <= 7 ? 'HIGH' : 'MEDIUM'
        }]
      };
    }

    return { valid: true, errors: [], warnings: [] };
  }

  // RULE: Monthly water quality testing
  async checkMonthlyTestingCompliance(
    organizationId: string,
    parameter: WaterParameter
  ): Promise<ValidationResult> {
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

    const tests = await WaterQualityTest.find({
      organizationId,
      parameter,
      sampleDate: { gte: lastMonthStart, lte: lastMonthEnd }
    });

    if (tests.length === 0) {
      return {
        valid: true,
        warnings: [{
          field: 'testing',
          message: `No ${parameter} tests recorded for last month`,
          severity: 'WARNING',
          action: 'SCHEDULE_TEST'
        }]
      };
    }

    return { valid: true, errors: [], warnings: [] };
  }
}
```

---

## Implementation Checklist

### Phase 5A: Schema Validation (6-8 hours)
- [ ] Install Zod: `npm install zod`
- [ ] Create Zod schemas for all entities
- [ ] Export TypeScript types from schemas
- [ ] Unit tests for schema validation

### Phase 5B: Business Rules (8-10 hours)
- [ ] Implement entity-specific validators
- [ ] Cross-entity validation logic
- [ ] Temporal validation rules
- [ ] Integration with services

### Phase 5C: Frontend Validation (6-8 hours)
- [ ] Form-level validation (React Hook Form + Zod)
- [ ] Real-time field validation
- [ ] Error message display
- [ ] Inline help tooltips

### Phase 5D: API Integration (4-6 hours)
- [ ] Validation middleware for API routes
- [ ] Standardized error responses
- [ ] Validation endpoint: `POST /api/validate/{entity}`

### Phase 5E: Testing (4-6 hours)
- [ ] Unit tests for all validators (50+ test cases)
- [ ] Integration tests for workflows
- [ ] Edge case testing
- [ ] Performance testing

**Total Estimated Effort:** 28-38 hours (3.5-5 days)

---

## Success Criteria

- [ ] 100% of required fields validated
- [ ] All regulatory rules implemented as validation logic
- [ ] User-friendly error messages
- [ ] Validation prevents invalid data submission
- [ ] 90%+ test coverage on validation logic
- [ ] Zero false positives in production (after 1 month)

---

**Status:** DESIGN COMPLETE ✅ | READY FOR IMPLEMENTATION

**Next Phase:** Phase 6 - Final Implementation Report
