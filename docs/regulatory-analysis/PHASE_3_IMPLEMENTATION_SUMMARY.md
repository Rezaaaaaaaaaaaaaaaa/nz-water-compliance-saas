# Phase 3 Implementation Summary: Compliance Scoring Updates

**Date:** October 5, 2025
**Phase:** 3 of 6
**Priority:** HIGH
**Status:** DESIGN COMPLETE - READY FOR IMPLEMENTATION

---

## Executive Summary

Phase 3 updates FlowComply's compliance scoring algorithm to align with Taumata Arowai's **2025-2028 Compliance Strategy**. The new approach is **risk-based**, emphasizing DWSP quality, proactive reporting, and graduated enforcement.

### Key Changes

**Previous Approach (Equal Weighting):**
- All compliance areas weighted equally (15-20% each)
- Binary assessment (pass/fail)
- One-size-fits-all scoring

**New Approach (Risk-Based):**
- ✅ DWSP quality: 30% (increased from 20%)
- ✅ Reporting compliance: 25% (increased from 20%)
- ✅ Risk management: 20% (increased from 15%)
- ✅ Tier-based multipliers (Tier 1 supplies penalized more for violations)
- ✅ Graduated alert system (Critical/High/Medium)
- ✅ Quality metrics (not just existence)

---

## Regulatory Alignment: 2025-2028 Strategy

### Taumata Arowai's Risk-Based Regulation

**Core Principle:** *"Focus regulatory effort where risk to public health is highest"*

**Supply Tiers:**

| Tier | Population | Risk Level | Our Scoring Impact |
|------|-----------|------------|-------------------|
| Tier 1 | > 10,000 | Highest | **1.5x** penalty for violations |
| Tier 2 | 501-10,000 | High | **1.3x** penalty for violations |
| Tier 3 | 101-500 | Medium | **1.1x** penalty for violations |
| Tier 4 | 26-100 | Lower | **1.0x** (standard) |

**Example:**
- Tier 1 supply with E. coli detection: Score impact -30 points
- Tier 4 supply with E. coli detection: Score impact -20 points
- *Rationale:* Tier 1 affects 10x more people = higher public health risk

### Enforcement Priorities (2025-2028)

1. **DWSP Quality** (30% weight)
   - Not just "have a DWSP" but "implement a good DWSP"
   - Hazard identification adequacy
   - Preventive measures effectiveness
   - Annual review compliance

2. **Proactive Reporting** (25% weight)
   - DWQAR submissions on time
   - Water quality test compliance
   - Incident notifications within 24 hours

3. **Risk Management** (20% weight)
   - E. coli detection rate
   - Boil water notice frequency
   - Corrective actions documented

---

## Updated Scoring Algorithm

### Component Weights (NEW)

```typescript
const componentWeights = {
  dwsp: 30,        // UP from 20% - Primary compliance tool
  reporting: 25,   // UP from 20% - Mandatory submissions
  risk: 20,        // UP from 15% - Proactive management
  timeliness: 15,  // SAME - Deadlines still matter
  document: 5,     // DOWN from 15% - Supporting evidence
  asset: 5         // DOWN from 15% - Operational context
};
// Total: 100%
```

**Why the Changes?**

| Component | Old % | New % | Reason |
|-----------|-------|-------|--------|
| DWSP | 20 | **30** | 2025-2028 strategy emphasizes DWSP **quality** and **implementation** |
| Reporting | 20 | **25** | DWQAR compliance is non-negotiable, late = enforcement |
| Risk | 15 | **20** | Proactive risk management prevents incidents |
| Timeliness | 15 | **15** | Still important for organizational capability |
| Document | 15 | **5** | Documents support compliance but aren't primary indicator |
| Asset | 15 | **5** | Infrastructure context, not direct compliance measure |

---

## Key Algorithm Enhancements

### 1. DWSP Quality Metrics (Not Just Existence)

**Previous:** DWSP exists = full points

**New:** Quality assessment across 5 dimensions

```typescript
// OLD (binary)
if (plan.status === 'APPROVED') {
  score = 100;
}

// NEW (quality-based)
let score = 0;
if (plan.status === 'APPROVED') score += 20;  // Exists (20%)
score += (elementsPresent / 12) * 20;         // Complete (20%)
score += (hazards >= minRequired ? 20 : 0);   // Adequate hazards (20%)
score += (preventiveMeasures >= hazards ? 20 : 0); // Controls (20%)
score += (reviewCurrent ? 20 : 0);            // Current (20%)
```

**Impact:** A barely-compliant DWSP now scores 60-70 instead of 100.

### 2. Risk-Based Penalties

**Tier Multipliers:**

```typescript
function getRiskMultiplier(population: number): number {
  if (population > 10000) return 1.5;  // Tier 1: Major suppliers
  if (population > 500) return 1.3;    // Tier 2: Large
  if (population > 100) return 1.1;    // Tier 3: Medium
  return 1.0;                          // Tier 4: Small
}

// Apply to risk score
const adjustedRiskScore = baseRiskScore * (1 / riskMultiplier);
```

**Example Scenario:**

Wellington Water (Tier 1, 180,000 people):
- E. coli detection: -40 points (base)
- Tier 1 multiplier: × 1.5
- **Actual impact: -60 points**

Waimate Council (Tier 4, 80 people):
- E. coli detection: -40 points (base)
- Tier 4 multiplier: × 1.0
- **Actual impact: -40 points**

*Rationale:* Wellington's violation affects 2,250x more people.

### 3. Graduated Alert System

**Old:** Generic "compliance alert" email

**New:** Priority-based with escalation

```typescript
// CRITICAL (Immediate CEO notification)
if (overallScore < 45) {
  sendAlert({
    priority: 'CRITICAL',
    recipients: ['CEO', 'Compliance Manager', 'Board'],
    message: 'Enforcement action likely within 30 days',
    actions: ['Schedule emergency meeting', 'Engage legal counsel']
  });
}

// HIGH (24-hour response required)
if (ecoliDetected && !correctiveActionLogged) {
  sendAlert({
    priority: 'HIGH',
    recipients: ['Compliance Manager', 'Operations'],
    message: 'E. coli detection requires immediate corrective action',
    actions: ['Log corrective action', 'Increase chlorination']
  });
}

// MEDIUM (Weekly digest)
if (overallScore 60-74) {
  sendAlert({
    priority: 'MEDIUM',
    recipients: ['Compliance Manager'],
    message: 'Compliance improvements recommended',
    actions: ['Review action plan', 'Update DWSP']
  });
}
```

---

## Score Interpretation & Regulatory Response

### Score Bands & Expected Outcomes

| Score | Status | What It Means | Regulator Response | FlowComply Actions |
|-------|--------|---------------|-------------------|-------------------|
| **90-100** | Excellent | Comprehensive compliance, best practices | Routine monitoring | Congratulate user |
| **75-89** | Good | Minor gaps, generally compliant | Standard oversight | Suggest improvements |
| **60-74** | Needs Work | Multiple gaps, enhanced scrutiny | Compliance assessment | Warning alerts |
| **45-59** | Poor | Significant violations, formal action | Compliance notice | Urgent action plan |
| **0-44** | Critical | Severe violations, enforcement | Legal proceedings | CRITICAL escalation |

### Real-World Examples

#### Example 1: Excellent Compliance (Score: 94)

**Profile:** Christchurch City Council (Tier 1, 380,000 people)
- DWSP: Comprehensive, 8 hazards identified, all controlled
- Reporting: DWQAR submitted 2 weeks early
- Testing: 100% compliance, zero E. coli detections
- Timeliness: All deadlines met

**Component Scores:**
- DWSP: 98 × 0.30 = 29.4
- Reporting: 100 × 0.25 = 25.0
- Risk: 100 × 0.20 = 20.0
- Timeliness: 100 × 0.15 = 15.0
- Document: 100 × 0.05 = 5.0
- Asset: 90 × 0.05 = 4.5
- **Overall: 94**

**Regulatory Action:** None. Routine monitoring.

---

#### Example 2: Needs Improvement (Score: 68)

**Profile:** Waimate District Council (Tier 3, 450 people)
- DWSP: Exists but only 3 hazards identified (needs 5)
- Reporting: DWQAR submitted 10 days late
- Testing: 90% compliance (1 missed E. coli test)
- Timeliness: DWSP review 15 days overdue

**Component Scores:**
- DWSP: 65 × 0.30 = 19.5
- Reporting: 70 × 0.25 = 17.5
- Risk: 85 × 0.20 = 17.0
- Timeliness: 70 × 0.15 = 10.5
- Document: 80 × 0.05 = 4.0
- Asset: 60 × 0.05 = 3.0
- **Overall: 68**

**Regulatory Action:** Enhanced monitoring. Likely compliance assessment visit within 6 months.

**FlowComply Actions:**
- Email alert to Compliance Manager
- Dashboard shows "Needs Improvement" status
- Action items:
  1. Add 2+ hazards to DWSP
  2. Complete overdue DWSP review
  3. Schedule missed E. coli test
  4. Set reminder for next DWQAR deadline

---

#### Example 3: Critical (Score: 38)

**Profile:** Small Community Supply (Tier 4, 85 people)
- DWSP: Expired 2 years ago, not reviewed
- Reporting: DWQAR not submitted (60 days overdue)
- Testing: E. coli detected twice, no corrective action documented
- Timeliness: Multiple deadlines missed

**Component Scores:**
- DWSP: 20 × 0.30 = 6.0
- Reporting: 30 × 0.25 = 7.5
- Risk: 25 × 0.20 = 5.0 (Tier 4, × 1.0)
- Timeliness: 10 × 0.15 = 1.5
- Document: 40 × 0.05 = 2.0
- Asset: 50 × 0.05 = 2.5
- **Overall: 38**

**Regulatory Action:** CRITICAL. Formal compliance notice issued. Potential supply closure if not resolved within 30 days.

**FlowComply Actions:**
- CRITICAL system alert
- Email to CEO, Compliance Manager, Board Chair
- Dashboard: RED status with countdown timer
- Emergency action plan generated:
  1. Engage consultant immediately
  2. Submit DWQAR within 7 days
  3. Update and submit DWSP within 14 days
  4. Document corrective actions for E. coli
  5. Implement daily monitoring

---

## Alert Configuration

### Critical Alerts (Immediate Action)

Trigger instant notifications to senior management:

```typescript
const criticalAlerts = [
  {
    id: 'SCORE_CRITICAL',
    condition: (score) => score.overallScore < 45,
    priority: 'CRITICAL',
    recipients: ['CEO', 'Compliance Manager', 'Board Chair'],
    channels: ['email', 'sms', 'dashboard'],
    message: 'Compliance score CRITICAL (${score}/100). Enforcement action likely within 30 days.',
    actions: [
      'Schedule emergency compliance meeting',
      'Review with legal counsel',
      'Prepare improvement plan',
      'Consider engaging external consultant'
    ]
  },
  {
    id: 'ECOLI_DETECTION',
    condition: (test) => test.parameter === 'ECOL' && !test.compliesWithRule,
    priority: 'CRITICAL',
    recipients: ['Compliance Manager', 'Operations Manager'],
    notifyRegulator: true,
    channels: ['email', 'sms', 'dashboard'],
    message: 'E. coli detected in sample ${test.externalSampleId}. Value: ${test.value} ${test.unit}',
    actions: [
      'Log corrective action immediately',
      'Resample within 24 hours',
      'Notify Taumata Arowai within 1 hour',
      'Assess need for boil water notice'
    ]
  },
  {
    id: 'DWQAR_CRITICALLY_OVERDUE',
    condition: (report) => !report && daysAfterDeadline > 30,
    priority: 'CRITICAL',
    recipients: ['CEO', 'Compliance Manager'],
    channels: ['email', 'dashboard'],
    message: 'DWQAR submission overdue by 30+ days. Compliance notice imminent.',
    actions: [
      'Submit DWQAR immediately',
      'Prepare explanation for delay',
      'Contact Taumata Arowai proactively'
    ]
  }
];
```

### High Priority Alerts (24-48 hour response)

```typescript
const highPriorityAlerts = [
  {
    id: 'SCORE_POOR',
    condition: (score) => score.overallScore >= 45 && score.overallScore < 60,
    priority: 'HIGH',
    recipients: ['Compliance Manager'],
    channels: ['email', 'dashboard'],
    message: 'Compliance score POOR (${score}/100). Regulatory assessment likely.',
    actions: [
      'Develop improvement plan',
      'Address critical gaps',
      'Schedule internal audit'
    ]
  },
  {
    id: 'DWSP_REVIEW_OVERDUE',
    condition: (plan) => daysOverdue(plan.nextReviewDate) > 30,
    priority: 'HIGH',
    recipients: ['Compliance Manager', 'Water Supply Manager'],
    channels: ['email', 'dashboard'],
    message: 'DWSP annual review overdue by 30+ days.',
    actions: [
      'Schedule review meeting',
      'Update hazard assessment',
      'Submit updated DWSP to Taumata Arowai'
    ]
  }
];
```

### Medium Priority Alerts (Weekly digest)

```typescript
const mediumPriorityAlerts = [
  {
    id: 'SCORE_NEEDS_IMPROVEMENT',
    condition: (score) => score.overallScore >= 60 && score.overallScore < 75,
    priority: 'MEDIUM',
    recipients: ['Compliance Manager'],
    channels: ['email-digest'],
    message: 'Compliance score: ${score}/100. Improvements recommended.',
    actions: [
      'Review component scores',
      'Address low-scoring areas',
      'Update documentation'
    ]
  },
  {
    id: 'IMPROVEMENT_MILESTONE_UPCOMING',
    condition: (milestone) => daysUntil(milestone.dueDate) <= 14,
    priority: 'MEDIUM',
    recipients: ['Operations Manager'],
    channels: ['email-digest'],
    message: 'Improvement plan milestone due in ${days} days: ${milestone.description}',
    actions: ['Complete milestone', 'Update progress']
  }
];
```

---

## Implementation Checklist

### Phase 3A: Update Scoring Algorithm (6-8 hours)

**File:** `backend/src/services/compliance-scoring.service.ts`

- [ ] Update component weights (30/25/20/15/5/5)
- [ ] Implement DWSP quality checks (hazard count, preventive measures)
- [ ] Add tier-based risk multipliers
- [ ] Implement E. coli detection penalties
- [ ] Add reporting compliance checks
- [ ] Create timeliness calculation
- [ ] Unit tests for all scoring functions

**Code Structure:**
```typescript
export class ComplianceScoringService {
  async calculateOverallScore(orgId: string): Promise<ComplianceScore>;
  async calculateDWSPScore(plan: CompliancePlan): Promise<number>;
  async calculateReportingScore(org: Organization): Promise<number>;
  async calculateRiskScore(org: Organization): Promise<number>;
  async calculateTimelinessScore(org: Organization): Promise<number>;
  async calculateDocumentScore(org: Organization): Promise<number>;
  async calculateAssetScore(org: Organization): Promise<number>;
}
```

### Phase 3B: Alert System (4-6 hours)

**File:** `backend/src/services/alert.service.ts`

- [ ] Define alert conditions (Critical/High/Medium)
- [ ] Implement alert checking logic
- [ ] Email notification service integration
- [ ] SMS notification for critical alerts (optional)
- [ ] Dashboard alert display
- [ ] Alert history tracking
- [ ] Alert acknowledgment workflow

**Code Structure:**
```typescript
export class AlertService {
  async checkAlerts(score: ComplianceScore): Promise<Alert[]>;
  async sendAlert(alert: Alert): Promise<void>;
  async acknowledgeAlert(alertId: string, userId: string): Promise<void>;
  async getActiveAlerts(orgId: string): Promise<Alert[]>;
}
```

### Phase 3C: Background Jobs (2-3 hours)

**File:** `backend/src/jobs/compliance-scoring.job.ts`

- [ ] Nightly score recalculation job (runs at 2am)
- [ ] Alert checking job (runs hourly)
- [ ] Weekly digest compilation
- [ ] Job monitoring and error handling

**Schedule:**
```typescript
// Recalculate all scores nightly
cron.schedule('0 2 * * *', async () => {
  await recalculateAllScores();
});

// Check for new alerts hourly
cron.schedule('0 * * * *', async () => {
  await checkAndSendAlerts();
});
```

### Phase 3D: Dashboard UI (4-6 hours)

**Files:**
- `frontend/components/dashboard/ComplianceScoreCard.tsx`
- `frontend/components/dashboard/ScoreBreakdown.tsx`
- `frontend/components/dashboard/AlertsList.tsx`

**Components:**
- [ ] Score gauge (0-100 with color coding)
- [ ] Component score breakdown (6 bars)
- [ ] Trend chart (last 12 months)
- [ ] Active alerts section
- [ ] Recommendations list
- [ ] Action items tracker

**UI Mockup:**
```
┌─────────────────────────────────────────────┐
│ Compliance Score                     [ 68 ] │ 🟡
├─────────────────────────────────────────────┤
│ DWSP Quality        ████████░░ 65/100  30%  │
│ Reporting           ███████░░░ 70/100  25%  │
│ Risk Management     ████████░░ 85/100  20%  │
│ Timeliness          ███████░░░ 70/100  15%  │
│ Documentation       ████████░░ 80/100   5%  │
│ Assets              ██████░░░░ 60/100   5%  │
├─────────────────────────────────────────────┤
│ Status: NEEDS IMPROVEMENT                   │
│ Regulator Action: Enhanced monitoring       │
├─────────────────────────────────────────────┤
│ Active Alerts (3)                           │
│ ⚠️  DWSP review overdue by 15 days          │
│ ⚠️  DWQAR submission due in 14 days         │
│ ℹ️  2 improvement milestones upcoming       │
└─────────────────────────────────────────────┘
```

### Phase 3E: Testing (2-3 hours)

- [ ] Unit tests for scoring algorithm (10+ test cases)
- [ ] Alert trigger tests
- [ ] Integration tests for background jobs
- [ ] Manual testing with real scenarios
- [ ] Performance testing (1000+ organizations)

**Test Scenarios:**
```typescript
describe('Compliance Scoring', () => {
  it('Tier 1 supply penalized more than Tier 4 for same violation');
  it('DWSP with insufficient hazards scores lower');
  it('E. coli detection triggers critical alert');
  it('Late DWQAR reduces reporting score');
  it('Score calculation completes in < 500ms');
});
```

---

## API Endpoints

### New Endpoints Required

```typescript
// Get current compliance score
GET /api/compliance-scores/:organizationId/current

// Get score history (trend)
GET /api/compliance-scores/:organizationId/history?months=12

// Get active alerts
GET /api/alerts?organizationId=xxx&status=active

// Acknowledge alert
PUT /api/alerts/:alertId/acknowledge

// Get scoring breakdown (detailed)
GET /api/compliance-scores/:organizationId/breakdown

// Trigger manual recalculation (admin only)
POST /api/compliance-scores/:organizationId/recalculate
```

---

## Success Criteria

### Phase 3 Complete When:

- [ ] Scoring algorithm uses new weights (30/25/20/15/5/5)
- [ ] Tier-based risk multipliers implemented
- [ ] DWSP quality metrics calculated (hazard count, preventive measures)
- [ ] Alert system triggers at correct thresholds
- [ ] Dashboard displays score breakdown
- [ ] Nightly recalculation job runs successfully
- [ ] Email alerts sent for critical issues
- [ ] 90%+ test coverage on scoring logic

**Current Status:** 0/8 complete (0%)

---

## Estimated Effort

| Task | Hours |
|------|-------|
| Update scoring service | 6-8 |
| Build alert system | 4-6 |
| Background jobs | 2-3 |
| Dashboard UI | 4-6 |
| Testing | 2-3 |
| **Total** | **18-26 hours (2.5-3.5 days)** |

**Original Estimate:** 2-3 days
**Revised Estimate:** 2.5-3.5 days (more complex than initially estimated)

---

## Dependencies

### Completed (Phases 1 & 2)
- ✅ Database schema with all models
- ✅ WaterQualityTest model for E. coli tracking
- ✅ CompliancePlan with all 12 DWSP elements
- ✅ RuleCompliance for DWQAR tracking

### External
- Email service (SendGrid/AWS SES) for alerts
- Cron scheduler for background jobs

---

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Algorithm complexity | MEDIUM | Extensive unit testing, phased rollout |
| Alert fatigue | MEDIUM | Smart prioritization, digest mode for low-priority |
| Performance (1000+ orgs) | LOW | Batch processing, caching, indexes |
| User confusion | MEDIUM | Clear dashboard explanations, help tooltips |

---

**Document Version:** 1.0
**Last Updated:** October 5, 2025
**Author:** FlowComply Development Team
**Review Status:** Ready for Implementation

**Phase 3 Status:** DESIGN COMPLETE ✅ | READY FOR IMPLEMENTATION

**Next Phase:** Phase 4 - DWQAR Annual Reporting Workflow (3-4 days estimated)
