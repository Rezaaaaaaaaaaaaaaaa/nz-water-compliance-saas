# Compliance Scoring Algorithm Design - Updated for 2025-2028 Strategy

**Date:** October 5, 2025
**Version:** 2.0 (Updated for Taumata Arowai Strategy 2025-2028)
**Reference:** Compliance, Monitoring and Enforcement Strategy 2025-2028

---

## Executive Summary

FlowComply's compliance scoring algorithm calculates a 0-100 score indicating how well a water supplier is meeting Taumata Arowai requirements. The score is **risk-based** and aligns with the regulator's **2025-2028 enforcement priorities**.

### Key Changes from Previous Version

**2025-2028 Strategy Focus:**
- ✅ Risk-based regulation (high-risk suppliers get more scrutiny)
- ✅ Proactive compliance support (education before enforcement)
- ✅ Graduated enforcement approach
- ✅ DWSP quality and implementation emphasis
- ✅ Incident response capability

**Previous (2022-2025) vs. Current (2025-2028):**

| Aspect | 2022-2025 | 2025-2028 |
|--------|-----------|-----------|
| Approach | Reactive | **Risk-based & Proactive** |
| Priority | Blanket compliance | **Tiered by risk level** |
| Enforcement | Standard for all | **Graduated by severity** |
| DWSP Focus | Existence | **Quality & Implementation** |
| Monitoring | Prescribed | **Risk-proportionate** |

---

## Regulatory Context: Taumata Arowai's Risk-Based Approach

### Supply Risk Categories (2025-2028)

Taumata Arowai categorizes water supplies into **4 tiers** based on:
- Population served
- Source water quality
- Treatment adequacy
- Historical compliance
- Organizational capacity

| Tier | Population | Risk Level | Regulatory Attention |
|------|-----------|------------|---------------------|
| **Tier 1** | > 10,000 | Highest | Maximum scrutiny |
| **Tier 2** | 501-10,000 | High | Enhanced monitoring |
| **Tier 3** | 101-500 | Medium | Standard monitoring |
| **Tier 4** | 26-100 | Lower | Proportionate oversight |

**FlowComply Implication:** Our scoring must reflect this tiered approach. A Tier 1 supply with the same violations as a Tier 4 should score lower (higher risk to public health).

---

## Current Scoring Model (Existing in FlowComply)

```prisma
model ComplianceScore {
  overallScore     Int  // 0-100 (weighted average)
  dwspScore        Int  // 0-100
  assetScore       Int  // 0-100
  documentScore    Int  // 0-100
  reportingScore   Int  // 0-100
  riskScore        Int  // 0-100
  timelinessScore  Int  // 0-100
}
```

### Current Weights (To Be Updated)

```typescript
// OLD WEIGHTS (equal weighting)
const weights = {
  dwsp: 20,
  asset: 15,
  document: 15,
  reporting: 20,
  risk: 15,
  timeliness: 15
}; // Total: 100
```

---

## New Scoring Algorithm (2025-2028 Aligned)

### Updated Weights (Risk-Based)

```typescript
// NEW WEIGHTS (risk-based, DWSP-focused)
const weights = {
  dwsp: 30,           // Increased: DWSP quality is #1 priority
  reporting: 25,      // Increased: DWQAR compliance critical
  risk: 20,           // Increased: Proactive risk management
  timeliness: 15,     // Same: Deadlines matter
  document: 5,        // Decreased: Supporting evidence
  asset: 5           // Decreased: Operational context
}; // Total: 100
```

**Rationale:**
1. **DWSP (30%)** - Taumata Arowai's primary tool for ensuring safe water. Quality of DWSP is now more important than just having one.
2. **Reporting (25%)** - DWQAR submissions are mandatory compliance activity. Late/missing reports = enforcement action.
3. **Risk Management (20%)** - Proactive hazard identification and control measures prevent incidents.
4. **Timeliness (15%)** - Meeting deadlines shows organizational capability.
5. **Documentation (5%)** - Supporting evidence, but not primary indicator.
6. **Assets (5%)** - Infrastructure context, but not direct compliance metric.

---

## Component Score Calculations

### 1. DWSP Score (30% weight)

**What we measure:**
- DWSP exists and approved
- All 12 mandatory elements present
- **NEW:** Quality of hazard identification (minimum 5 hazards for medium+ supplies)
- **NEW:** Preventive measures in place (>= 1 per high-risk hazard)
- Annual review completed on time
- **NEW:** DWSP implementation evidence (monitoring records exist)

**Calculation:**

```typescript
function calculateDWSPScore(plan: CompliancePlan): number {
  let score = 0;

  // Base: DWSP exists and approved (20 points)
  if (plan.status === 'APPROVED' || plan.status === 'SUBMITTED') {
    score += 20;
  }

  // All 12 elements present (20 points)
  const elementsPresent = [
    !!plan.waterSupplyName,           // Element 1
    plan.hazards?.length > 0,         // Element 2
    plan.preventiveMeasures?.length > 0, // Element 3
    !!plan.operationalMonitoring,     // Element 4
    !!plan.verificationMonitoring,    // Element 5
    !!plan.correctiveActions,         // Element 6
    !!plan.incidentResponsePlan,      // Element 7 (NEW)
    !!plan.waterSupplyManager,        // Element 8 (NEW)
    !!plan.communicationPlan,         // Element 9
    !!plan.improvementPlan,           // Element 10 (NEW)
    !!plan.supplyPopulation,          // Element 11
    !!plan.nextReviewDate             // Element 12
  ];
  const elementsScore = (elementsPresent.filter(Boolean).length / 12) * 20;
  score += elementsScore;

  // QUALITY: Adequate hazard identification (20 points)
  const hazardCount = plan.hazards?.length || 0;
  const minHazards = plan.supplyPopulation > 100 ? 5 : 3;
  if (hazardCount >= minHazards) {
    score += 20;
  } else if (hazardCount > 0) {
    score += (hazardCount / minHazards) * 20;
  }

  // QUALITY: Preventive measures for high-risk hazards (20 points)
  const highRiskHazards = plan.hazards?.filter(h => h.riskLevel === 'HIGH' || h.riskLevel === 'CRITICAL') || [];
  const preventiveMeasuresCount = plan.preventiveMeasures?.length || 0;
  if (preventiveMeasuresCount >= highRiskHazards.length && highRiskHazards.length > 0) {
    score += 20;
  } else if (preventiveMeasuresCount > 0) {
    score += Math.min(20, (preventiveMeasuresCount / Math.max(1, highRiskHazards.length)) * 20);
  }

  // Annual review current (20 points)
  if (plan.nextReviewDate) {
    const daysSinceReview = plan.lastReviewDate
      ? daysBetween(plan.lastReviewDate, new Date())
      : daysBetween(plan.createdAt, new Date());

    if (daysSinceReview <= 365) {
      score += 20;
    } else if (daysSinceReview <= 395) { // 30-day grace
      score += 10;
    }
  }

  return Math.min(100, score);
}
```

**Example Scores:**
- Tier 1 supply with comprehensive DWSP: 95-100
- Tier 3 supply with basic DWSP: 70-80
- DWSP missing elements: 40-60
- No DWSP or expired: 0-20

---

### 2. Reporting Score (25% weight)

**What we measure:**
- **NEW:** DWQAR submissions on time (annual deadline)
- **NEW:** Water quality test results submitted
- Incident notifications submitted when required
- DWSP updates submitted after major changes
- **NEW:** Zero "Failure to Notify" violations

**Calculation:**

```typescript
function calculateReportingScore(org: Organization): number {
  let score = 100;

  // Check DWQAR submission (40 points)
  const dwqarDue = new Date(currentYear, 6, 31); // July 31 deadline
  const dwqarReport = await findDWQARReport(org.id, currentYear);

  if (!dwqarReport) {
    score -= 40; // Missing = major deduction
  } else if (dwqarReport.submittedAt > dwqarDue) {
    score -= 20; // Late = moderate deduction
  }

  // Check incident notifications (30 points)
  const incidents = await findIncidents(org.id, currentYear);
  const notifiedIncidents = incidents.filter(i => i.regulatorNotified);

  if (incidents.length > 0) {
    const notificationRate = notifiedIncidents.length / incidents.length;
    if (notificationRate < 1.0) {
      score -= 30 * (1 - notificationRate); // Deduct based on % not notified
    }
  }

  // Check water quality test compliance (30 points)
  const requiredTests = await getRequiredTestCount(org.id, currentYear);
  const actualTests = await getActualTestCount(org.id, currentYear);

  if (requiredTests > 0) {
    const testComplianceRate = Math.min(1, actualTests / requiredTests);
    if (testComplianceRate < 0.9) { // Less than 90% = deduction
      score -= 30 * (1 - testComplianceRate);
    }
  }

  return Math.max(0, Math.min(100, score));
}
```

**Example Scores:**
- All reports on time, all tests done: 100
- DWQAR late by 1 month: 80
- DWQAR missing, incident unreported: 30
- Multiple violations: 0-20

---

### 3. Risk Score (20% weight)

**What we measure:**
- **NEW:** Risk assessment quality (hazards identified and documented)
- **NEW:** Preventive measures effectiveness
- Historical incident frequency
- **NEW:** Corrective actions taken when needed
- E. coli detections and response

**Calculation:**

```typescript
function calculateRiskScore(org: Organization, plan: CompliancePlan): number {
  let score = 100;

  // E. coli detections (40 points penalty for detections)
  const ecoliTests = await getWaterQualityTests(org.id, {
    parameter: 'ECOL',
    dateRange: 'lastYear'
  });

  const ecoliDetections = ecoliTests.filter(t => !t.compliesWithRule);
  if (ecoliDetections.length > 0) {
    score -= Math.min(40, ecoliDetections.length * 20); // Up to 40-point deduction
  }

  // Boil water notices issued (30 points penalty)
  const boilWaterNotices = await getBoilWaterNotices(org.id, 'lastYear');
  if (boilWaterNotices.length > 0) {
    score -= Math.min(30, boilWaterNotices.length * 15);
  }

  // Hazard identification adequacy (15 points)
  const criticalHazards = plan.hazards?.filter(h => h.riskLevel === 'CRITICAL') || [];
  if (criticalHazards.length > 0 && plan.preventiveMeasures?.length >= criticalHazards.length) {
    // Good: Identified critical hazards and have preventive measures
    // No deduction
  } else if (criticalHazards.length > 0) {
    score -= 15; // Identified hazards but missing controls
  }

  // Supply categorization risk factor (15 points)
  const riskMultiplier = getRiskMultiplier(org.populationServed);
  if (riskMultiplier > 1.0) {
    // Higher-risk suppliers (Tier 1, 2) penalized more for violations
    score = score * (1 / riskMultiplier);
  }

  return Math.max(0, Math.min(100, score));
}

function getRiskMultiplier(population: number): number {
  if (population > 10000) return 1.5;  // Tier 1
  if (population > 500) return 1.3;    // Tier 2
  if (population > 100) return 1.1;    // Tier 3
  return 1.0;                          // Tier 4
}
```

**Example Scores:**
- No incidents, comprehensive controls: 95-100
- 1 E. coli detection, corrective action taken: 75-85
- Multiple detections, boil water notice: 30-50
- Tier 1 supply with violations: (base score × 0.67) = heavily penalized

---

### 4. Timeliness Score (15% weight)

**What we measure:**
- DWSP review on schedule (annual)
- DWQAR submission before deadline
- Incident notifications within required timeframes
- Improvement plan milestones met

**Calculation:**

```typescript
function calculateTimelinessScore(org: Organization, plan: CompliancePlan): number {
  let score = 100;

  // DWSP annual review (40 points)
  if (plan.nextReviewDate) {
    const reviewOverdue = isAfter(new Date(), plan.nextReviewDate);
    if (reviewOverdue) {
      const daysOverdue = daysBetween(plan.nextReviewDate, new Date());
      score -= Math.min(40, daysOverdue * 2); // 2 points per day, max 40
    }
  } else {
    score -= 40; // No review scheduled
  }

  // DWQAR submission (30 points)
  const dwqarDue = new Date(currentYear, 6, 31);
  const dwqarReport = await findDWQARReport(org.id, currentYear);

  if (dwqarReport && dwqarReport.submittedAt) {
    const daysLate = daysBetween(dwqarDue, dwqarReport.submittedAt);
    if (daysLate > 0) {
      score -= Math.min(30, daysLate * 3); // 3 points per day late
    }
  } else if (isAfter(new Date(), dwqarDue)) {
    score -= 30; // Not submitted and deadline passed
  }

  // Incident notification timeliness (30 points)
  const incidents = await findIncidents(org.id, 'lastYear');
  const lateNotifications = incidents.filter(i => {
    if (!i.regulatorNotifiedAt || !i.occurredAt) return false;
    const hoursToNotify = hoursBetween(i.occurredAt, i.regulatorNotifiedAt);
    return hoursToNotify > 24; // Should notify within 24 hours
  });

  if (lateNotifications.length > 0) {
    score -= Math.min(30, lateNotifications.length * 15);
  }

  return Math.max(0, score);
}
```

**Example Scores:**
- Everything on time: 100
- DWSP review 10 days overdue: 80
- DWQAR 5 days late: 85
- Multiple delays: 40-60

---

### 5. Document Score (5% weight)

**What we measure:**
- DWSP document uploaded and accessible
- Water quality test certificates on file
- Training certificates current
- Asset records maintained

**Calculation:**

```typescript
function calculateDocumentScore(org: Organization): number {
  let score = 0;

  // DWSP document exists (40 points)
  const dwspDoc = await findDocument(org.id, { type: 'DWSP', latest: true });
  if (dwspDoc) score += 40;

  // Water quality reports (30 points)
  const wqReports = await countDocuments(org.id, {
    type: 'WATER_QUALITY_REPORT',
    dateRange: 'lastYear'
  });
  if (wqReports >= 12) score += 30;      // Monthly reports
  else if (wqReports >= 4) score += 20;  // Quarterly
  else if (wqReports > 0) score += 10;

  // Training certificates (30 points)
  const trainingDocs = await countDocuments(org.id, {
    type: 'TRAINING_CERTIFICATE',
    expiryAfter: new Date()
  });
  if (trainingDocs > 0) score += 30;

  return Math.min(100, score);
}
```

---

### 6. Asset Score (5% weight)

**What we measure:**
- Critical assets identified
- Asset condition assessments up to date
- Maintenance records exist
- Supply components registered with Hinekōrako

**Calculation:**

```typescript
function calculateAssetScore(org: Organization): number {
  let score = 0;

  // Critical assets identified (30 points)
  const criticalAssets = await countAssets(org.id, { isCritical: true });
  if (criticalAssets >= 3) score += 30;
  else score += criticalAssets * 10;

  // Assets have condition ratings (30 points)
  const totalAssets = await countAssets(org.id);
  const assetsWithCondition = await countAssets(org.id, {
    condition: { not: 'UNKNOWN' }
  });
  if (totalAssets > 0) {
    score += (assetsWithCondition / totalAssets) * 30;
  }

  // Supply components registered (40 points)
  const components = await countWaterSupplyComponents(org.id);
  if (components > 0) score += 40;

  return Math.min(100, score);
}
```

---

## Overall Score Calculation

```typescript
async function calculateOverallComplianceScore(orgId: string): Promise<ComplianceScore> {
  const org = await getOrganization(orgId);
  const plan = await getLatestCompliancePlan(orgId);

  // Calculate component scores
  const dwspScore = await calculateDWSPScore(plan);
  const reportingScore = await calculateReportingScore(org);
  const riskScore = await calculateRiskScore(org, plan);
  const timelinessScore = await calculateTimelinessScore(org, plan);
  const documentScore = await calculateDocumentScore(org);
  const assetScore = await calculateAssetScore(org);

  // Apply weights
  const overallScore = Math.round(
    dwspScore * 0.30 +
    reportingScore * 0.25 +
    riskScore * 0.20 +
    timelinessScore * 0.15 +
    documentScore * 0.05 +
    assetScore * 0.05
  );

  return {
    organizationId: orgId,
    overallScore,
    dwspScore,
    reportingScore,
    riskScore,
    timelinessScore,
    documentScore,
    assetScore,
    calculatedAt: new Date()
  };
}
```

---

## Score Interpretation & Actions

### Score Ranges

| Score | Status | Risk Level | Regulator Action | FlowComply Alerts |
|-------|--------|------------|------------------|-------------------|
| 90-100 | Excellent | Low | Routine monitoring | None |
| 75-89 | Good | Low-Medium | Standard oversight | Minor improvements suggested |
| 60-74 | Needs Improvement | Medium | Enhanced monitoring | Warnings for missing items |
| 45-59 | Poor | High | Compliance notice likely | Urgent action required |
| 0-44 | Critical | Very High | Enforcement action | Critical alerts, escalation |

### Graduated Enforcement (2025-2028 Approach)

**Taumata Arowai's Response by Score Band:**

#### 90-100: Excellent
- **Regulatory Action:** Routine monitoring
- **FlowComply Action:** Congratulate user, share best practices

#### 75-89: Good
- **Regulatory Action:** Standard oversight, periodic audits
- **FlowComply Action:** Highlight improvement areas, offer guidance

#### 60-74: Needs Improvement
- **Regulatory Action:** Enhanced monitoring, compliance assessment visit
- **FlowComply Action:**
  - Email alerts for gaps
  - Action plan required
  - Monthly progress tracking

#### 45-59: Poor
- **Regulatory Action:** Formal compliance notice, improvement plan required
- **FlowComply Action:**
  - Urgent dashboard alerts
  - Escalation to management
  - Weekly reporting
  - External consultant recommended

#### 0-44: Critical
- **Regulatory Action:** Enforcement proceedings, potential fines, supply closure
- **FlowComply Action:**
  - CRITICAL system-wide alerts
  - CEO/Board notification
  - Emergency action plan
  - Legal/regulatory support recommended

---

## Alert Triggers (Priority-Based)

### Critical Alerts (Immediate)

```typescript
const criticalAlerts = [
  {
    condition: 'overallScore < 45',
    message: 'CRITICAL: Compliance score below 45. Enforcement action likely. Immediate action required.',
    recipients: ['CEO', 'Compliance Manager', 'Board Chair']
  },
  {
    condition: 'ecoliDetection && !correctiveActionWithin24Hours',
    message: 'CRITICAL: E. coli detected. Corrective action not recorded within 24 hours.',
    recipients: ['Compliance Manager', 'Operations Manager', 'Taumata Arowai']
  },
  {
    condition: 'dwqarOverdue > 30',
    message: 'CRITICAL: DWQAR submission overdue by 30+ days. Compliance notice imminent.',
    recipients: ['Compliance Manager', 'CEO']
  }
];
```

### High Priority Alerts (24-48 hours)

```typescript
const highPriorityAlerts = [
  {
    condition: 'overallScore 45-59',
    message: 'HIGH PRIORITY: Compliance score 45-59. Regulatory assessment visit likely.',
    recipients: ['Compliance Manager']
  },
  {
    condition: 'dwspReviewOverdue > 30',
    message: 'HIGH PRIORITY: DWSP annual review overdue by 30+ days.',
    recipients: ['Compliance Manager', 'Water Supply Manager']
  },
  {
    condition: 'requiredTestsMissed > 2',
    message: 'HIGH PRIORITY: Multiple required water quality tests missed.',
    recipients: ['Compliance Manager', 'Laboratory Contact']
  }
];
```

### Medium Priority Alerts (Weekly digest)

```typescript
const mediumPriorityAlerts = [
  {
    condition: 'overallScore 60-74',
    message: 'MEDIUM: Compliance score 60-74. Improvements needed.',
    recipients: ['Compliance Manager']
  },
  {
    condition: 'improvementPlanMilestoneDue < 14',
    message: 'MEDIUM: Improvement plan milestone due within 2 weeks.',
    recipients: ['Operations Manager']
  }
];
```

---

## Implementation Plan

### Phase 3A: Update Scoring Service (6-8 hours)

```typescript
// File: backend/src/services/compliance-scoring.service.ts

export class ComplianceScoringService {
  async calculateScore(organizationId: string): Promise<ComplianceScore> {
    // Implement new algorithm
  }

  async scheduleScoreCalculation(): Promise<void> {
    // Nightly batch job to recalculate all scores
  }

  async triggerAlerts(score: ComplianceScore): Promise<void> {
    // Check alert conditions and send notifications
  }
}
```

### Phase 3B: Alert System (4-6 hours)

```typescript
// File: backend/src/services/alert.service.ts

export class AlertService {
  async checkCriticalAlerts(score: ComplianceScore): Promise<Alert[]> {
    // Check critical conditions
  }

  async sendAlert(alert: Alert): Promise<void> {
    // Email + in-app notification
  }
}
```

### Phase 3C: Dashboard Updates (4-6 hours)

```typescript
// File: frontend/components/dashboard/ComplianceScoreCard.tsx

export function ComplianceScoreCard({ score }: Props) {
  const statusColor = getStatusColor(score.overallScore);
  const recommendations = getRecommendations(score);

  return (
    <Card>
      <ScoreGauge value={score.overallScore} />
      <ComponentBreakdown scores={score} />
      <RecommendationsList items={recommendations} />
    </Card>
  );
}
```

### Phase 3D: Testing (2-3 hours)

- Unit tests for scoring algorithms
- Test with real-world scenarios
- Validate alert triggers

---

## Success Metrics

### Phase 3 Complete When:

- [ ] Scoring algorithm updated with new weights
- [ ] Risk-based multipliers implemented (Tier 1-4)
- [ ] DWSP quality metrics added (hazard count, preventive measures)
- [ ] Alert system implemented (Critical/High/Medium)
- [ ] Dashboard shows score breakdown
- [ ] Nightly batch job recalculates scores
- [ ] Email notifications sent for critical alerts

---

## Estimated Effort

**Total: 16-23 hours (2-3 days)**

- Scoring algorithm update: 6-8 hours
- Alert system: 4-6 hours
- Dashboard UI: 4-6 hours
- Testing: 2-3 hours

---

**Next Phase:** Phase 4 - DWQAR Reporting Workflow Implementation
