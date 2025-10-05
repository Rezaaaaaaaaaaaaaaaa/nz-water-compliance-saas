# Phase 4: DWQAR Annual Reporting Workflow

**Date:** October 5, 2025
**Phase:** 4 of 6
**Priority:** HIGH
**Status:** DESIGN COMPLETE

---

## Executive Summary

Phase 4 designs the end-to-end workflow for annual DWQAR (Drinking Water Quality Assurance Rules) reporting - the primary compliance activity for NZ water suppliers.

**Key Process:** Water suppliers must submit annual DWQAR reports to Taumata Arowai by **July 31** each year, containing all water quality test results and compliance status for 378 regulatory rules.

---

## Regulatory Requirements

### Annual DWQAR Submission

**Deadline:** July 31 (for previous calendar year)
**Format:** Excel file matching official template exactly
**Submission Method:** Upload to Hinekōrako platform
**Mandatory For:** All registered water supplies (26+ people)

**Consequences of Non-Compliance:**
- Late submission (1-30 days): Compliance notice
- Late submission (30+ days): Enforcement proceedings
- Non-submission (60+ days): Supply closure possible

---

## Workflow Design

### User Journey (Compliance Manager)

```
┌─────────────────────────────────────────────────────┐
│ 1. PREPARATION (June-July)                         │
│    - System auto-aggregates test data              │
│    - Manager reviews for completeness              │
│    - Missing tests identified                       │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ 2. VALIDATION (Mid-July)                           │
│    - Pre-export validation check                    │
│    - Warnings for incomplete data                   │
│    - Recommendations for improvements               │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ 3. EXPORT (Late July)                              │
│    - Generate Excel matching official template      │
│    - Preview before download                        │
│    - Download to local computer                     │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ 4. SUBMISSION (Before July 31)                     │
│    - Log into Hinekōrako                           │
│    - Upload Excel file                              │
│    - Receive confirmation                           │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ 5. TRACKING (Post-submission)                      │
│    - Record submission in FlowComply                │
│    - Store confirmation for audit trail            │
│    - Update compliance score                        │
└─────────────────────────────────────────────────────┘
```

**Total Time:** 2-4 hours (if data complete)

---

## Implementation Components

### 1. Data Aggregation Service

**Automatic Nightly Aggregation:**

```typescript
// File: backend/src/services/dwqar-aggregation.service.ts

export class DWQARAggregationService {
  async aggregateReportingPeriod(
    organizationId: string,
    period: string // "2024-Annual" or "2024-Q1"
  ): Promise<DWQARReport> {

    // Get all water quality tests for period
    const tests = await getWaterQualityTests(organizationId, period);

    // Group by rule + component
    const ruleCompliances = await calculateRuleCompliance(tests);

    // Generate report structure
    return {
      reportingPeriod: period,
      organizationId,
      samplesData: tests.map(formatForExcel),
      reportsData: ruleCompliances.map(formatForExcel),
      generatedAt: new Date(),
      status: 'DRAFT'
    };
  }

  async calculateRuleCompliance(
    tests: WaterQualityTest[]
  ): Promise<RuleCompliance[]> {
    // For each unique (rule + component) combination
    // Calculate:
    // - Total samples
    // - Compliant samples
    // - Non-compliant periods
    // - Overall compliance (true/false)
  }
}
```

### 2. Validation Service

**Pre-Export Validation:**

```typescript
// File: backend/src/services/dwqar-validation.service.ts

export class DWQARValidationService {
  async validate(
    report: DWQARReport
  ): Promise<ValidationResult> {

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // CRITICAL ERRORS (prevent export)

    // 1. Required fields missing
    if (!report.samplesData.length) {
      errors.push({
        severity: 'ERROR',
        field: 'samplesData',
        message: 'No water quality samples recorded for this period'
      });
    }

    // 2. Invalid data formats
    for (const sample of report.samplesData) {
      if (!sample.sampleDate) {
        errors.push({
          severity: 'ERROR',
          field: `sample.${sample.id}.sampleDate`,
          message: 'Sample date is required'
        });
      }
      if (!sample.value || sample.value < 0) {
        errors.push({
          severity: 'ERROR',
          field: `sample.${sample.id}.value`,
          message: 'Invalid test value'
        });
      }
    }

    // WARNINGS (allow export but flag issues)

    // 1. Recommended tests missing
    const requiredTests = await getRequiredTestCount(report.organizationId);
    if (report.samplesData.length < requiredTests * 0.9) {
      warnings.push({
        severity: 'WARNING',
        field: 'samplesData',
        message: `Only ${report.samplesData.length}/${requiredTests} required tests performed (90% threshold)`
      });
    }

    // 2. Supply components not registered
    const unregisteredComponents = await findUnregisteredComponents(report);
    if (unregisteredComponents.length > 0) {
      warnings.push({
        severity: 'WARNING',
        field: 'components',
        message: `${unregisteredComponents.length} supply components missing Hinekōrako IDs`
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: `${errors.length} errors, ${warnings.length} warnings`
    };
  }
}
```

### 3. Excel Export Service

**Generate Official Format:**

```typescript
// File: backend/src/services/dwqar-excel-export.service.ts

import ExcelJS from 'exceljs';

export class DWQARExcelExportService {
  async generateExcel(
    report: DWQARReport
  ): Promise<Buffer> {

    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Reports
    const reportsSheet = workbook.addWorksheet('Reports');
    this.formatReportsSheet(reportsSheet, report.reportsData);

    // Sheet 2: Samples
    const samplesSheet = workbook.addWorksheet('Samples');
    this.formatSamplesSheet(samplesSheet, report.samplesData);

    // Sheet 3: RuleIDs (reference - read-only)
    const rulesSheet = workbook.addWorksheet('RuleIDs');
    await this.addRuleIDsReference(rulesSheet);

    // Apply formatting to match official template
    this.applyOfficialFormatting(workbook);

    // Generate buffer
    return await workbook.xlsx.writeBuffer();
  }

  private formatReportsSheet(
    sheet: ExcelJS.Worksheet,
    data: RuleComplianceData[]
  ): void {
    // Add headers (row 13 in official template)
    sheet.addRow([
      'Rule ID',
      'Supply Component ID',
      'Complies With Rule',
      'Non Compliant Periods',
      'Notes'
    ]);

    // Add data rows
    for (const item of data) {
      sheet.addRow([
        item.ruleId,
        item.componentId,
        item.complies ? 'True' : 'False',
        item.nonCompliantPeriods,
        item.notes || ''
      ]);
    }

    // Format headers (bold, centered)
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };
  }

  private formatSamplesSheet(
    sheet: ExcelJS.Worksheet,
    data: WaterQualityTestData[]
  ): void {
    // Add headers (row 1 in official template)
    sheet.addRow([
      'Rule ID',
      'Supply Component ID',
      'External Sample ID',
      'Sample Date',
      'Parameter/Determinand',
      'Value Prefix',
      'Value',
      'Unit',
      'Complies With Rule',
      'Source Class',
      'Notes'
    ]);

    // Add data rows
    for (const test of data) {
      sheet.addRow([
        test.ruleId,
        test.componentId,
        test.externalSampleId || '',
        this.formatDate(test.sampleDate), // "YYYY-MM-DD HH:MM:SS"
        test.parameter,
        test.valuePrefix || '',
        test.value,
        test.unit,
        test.compliesWithRule ? 'True' : 'False',
        test.sourceClass || '',
        test.notes || ''
      ]);
    }
  }

  private formatDate(date: Date): string {
    // Official format: "YYYY-MM-DD HH:MM:SS"
    return format(date, 'yyyy-MM-dd HH:mm:ss');
  }
}
```

### 4. Submission Tracking

**Record Submission Details:**

```typescript
// Extend Report model with submission fields

model Report {
  // ... existing fields ...

  // DWQAR-specific
  reportingPeriod       String?   // "2024-Annual"
  hinekōrakoSubmissionId String?   // Confirmation number
  submissionConfirmation String?   // PDF confirmation
  regulatorAcknowledged  Boolean   @default(false)
  acknowledgedAt         DateTime?
}
```

### 5. Dashboard Timeline

**Visual Workflow Tracker:**

```typescript
// Frontend component showing DWQAR workflow status

export function DWQARWorkflowTimeline({ organizationId }: Props) {
  const currentYear = new Date().getFullYear();
  const deadline = new Date(currentYear, 6, 31); // July 31

  const steps = [
    {
      id: 1,
      title: 'Data Collection',
      status: 'COMPLETE', // All 12 months of tests recorded
      dueDate: new Date(currentYear, 5, 30), // June 30
      completedDate: new Date(currentYear, 5, 15)
    },
    {
      id: 2,
      title: 'Validation',
      status: 'IN_PROGRESS', // Reviewing for completeness
      dueDate: new Date(currentYear, 6, 15), // July 15
      completedDate: null
    },
    {
      id: 3,
      title: 'Export & Review',
      status: 'PENDING',
      dueDate: new Date(currentYear, 6, 25), // July 25
      completedDate: null
    },
    {
      id: 4,
      title: 'Submit to Hinekōrako',
      status: 'PENDING',
      dueDate: deadline,
      completedDate: null,
      critical: true
    },
    {
      id: 5,
      title: 'Confirmation',
      status: 'PENDING',
      dueDate: new Date(currentYear, 7, 5), // Aug 5
      completedDate: null
    }
  ];

  return (
    <Timeline steps={steps} />
  );
}
```

---

## API Endpoints

```typescript
// DWQAR Workflow Endpoints

// 1. Get current report status
GET /api/dwqar/current
Response: {
  reportingPeriod: "2024-Annual",
  status: "DRAFT",
  samplesCount: 156,
  rulesCount: 12,
  completeness: 92.5, // percentage
  daysUntilDeadline: 15
}

// 2. Validate before export
POST /api/dwqar/validate
Body: { organizationId, period: "2024-Annual" }
Response: {
  valid: true,
  errors: [],
  warnings: [
    { field: "samplesData", message: "2 recommended tests missing" }
  ]
}

// 3. Generate Excel export
GET /api/dwqar/export?period=2024-Annual
Response: Excel file (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

// 4. Record submission
POST /api/dwqar/submit
Body: {
  period: "2024-Annual",
  hinekōrakoId: "SUBM-2024-12345",
  confirmationPdf: "base64..."
}
Response: { success: true, reportId: "..." }

// 5. Get submission history
GET /api/dwqar/history
Response: [
  { period: "2024-Annual", submittedAt: "2024-07-28", status: "CONFIRMED" },
  { period: "2023-Annual", submittedAt: "2023-07-25", status: "CONFIRMED" }
]
```

---

## Alert & Reminder System

### Deadline Reminders

```typescript
const dwqarReminders = [
  {
    trigger: '90 days before deadline', // May 1
    message: 'DWQAR reporting period begins. Ensure monthly testing continues.',
    recipients: ['Compliance Manager'],
    priority: 'INFO'
  },
  {
    trigger: '30 days before deadline', // July 1
    message: 'DWQAR submission due in 30 days. Review data completeness.',
    recipients: ['Compliance Manager'],
    priority: 'MEDIUM'
  },
  {
    trigger: '14 days before deadline', // July 17
    message: 'DWQAR submission due in 2 weeks. Export and review report.',
    recipients: ['Compliance Manager', 'CEO'],
    priority: 'HIGH'
  },
  {
    trigger: '7 days before deadline', // July 24
    message: 'URGENT: DWQAR due in 7 days. Submit to Hinekōrako immediately.',
    recipients: ['Compliance Manager', 'CEO'],
    priority: 'URGENT'
  },
  {
    trigger: 'On deadline day', // July 31
    message: 'CRITICAL: DWQAR submission deadline is TODAY.',
    recipients: ['CEO', 'Compliance Manager', 'Board'],
    priority: 'CRITICAL'
  },
  {
    trigger: '1 day after deadline', // August 1
    message: 'OVERDUE: DWQAR submission missed. Compliance notice likely.',
    recipients: ['CEO', 'Compliance Manager', 'Board'],
    priority: 'CRITICAL'
  }
];
```

---

## Implementation Checklist

### Phase 4A: Aggregation Service (6-8 hours)
- [ ] Create DWQARAggregationService
- [ ] Implement rule compliance calculation
- [ ] Nightly batch job to aggregate data
- [ ] API endpoint for current status

### Phase 4B: Validation Service (4-6 hours)
- [ ] Create DWQARValidationService
- [ ] Define validation rules (errors vs warnings)
- [ ] API endpoint for pre-export validation
- [ ] UI to display validation results

### Phase 4C: Excel Export (8-10 hours)
- [ ] Install ExcelJS library
- [ ] Create DWQARExcelExportService
- [ ] Implement 3-sheet generation
- [ ] Match official template formatting exactly
- [ ] Test with Hinekōrako platform

### Phase 4D: Submission Tracking (3-4 hours)
- [ ] Add submission fields to Report model
- [ ] API endpoint to record submission
- [ ] Upload confirmation PDF
- [ ] Submission history view

### Phase 4E: Dashboard Timeline (4-6 hours)
- [ ] Create workflow timeline component
- [ ] Visual progress indicators
- [ ] Deadline countdown
- [ ] Action button for each step

### Phase 4F: Reminders & Alerts (2-3 hours)
- [ ] Schedule reminder jobs
- [ ] Email notifications
- [ ] Dashboard alerts
- [ ] Escalation for overdue

**Total Estimated Effort:** 27-37 hours (3.5-5 days)

---

## Success Criteria

- [ ] User can generate DWQAR Excel export in < 2 minutes
- [ ] Export matches official template exactly (validation test)
- [ ] File uploads to Hinekōrako without errors
- [ ] Validation catches 100% of critical errors
- [ ] Reminders sent at correct intervals
- [ ] Submission recorded with confirmation
- [ ] Dashboard shows workflow status clearly

---

**Status:** DESIGN COMPLETE ✅ | READY FOR IMPLEMENTATION

**Next Phase:** Phase 5 - Validation Rules
