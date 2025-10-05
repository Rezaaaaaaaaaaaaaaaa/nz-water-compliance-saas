# DWSP 12 Mandatory Elements - Complete Database Mapping

**Analysis Date:** October 5, 2025
**Templates Analyzed:**
- DWSP_Template_Small_26-100.pdf (12 pages, 9/12 elements)
- DWSP_Template_Medium_101-500.pdf (26 pages, 12/12 elements)

**Reference:** Taumata Arowai Drinking Water Safety Planning Requirements

---

## Overview

Drinking Water Safety Plans (DWSP) are **mandatory** for all registered water supplies in New Zealand. The plan must contain **12 mandatory elements** as specified by Taumata Arowai.

Our database model `CompliancePlan` already has most fields, but requires enhancements to fully support all 12 elements.

---

## The 12 Mandatory DWSP Elements

### Element 1: Description of the Drinking Water Supply

**Regulatory Requirement:**
> "What makes up your drinking water supply?"

**Current Database Fields:**
```prisma
model CompliancePlan {
  waterSupplyName       String?
  supplyPopulation      Int?
  sourceTypes           String[]  // e.g., ["BORE", "SURFACE_WATER"]
  treatmentProcesses    String[]
}
```

**Status:** ✅ COMPLETE

**Additional Fields Needed:** None

**Example Data:**
```json
{
  "waterSupplyName": "Waimate Township Water Supply",
  "supplyPopulation": 450,
  "sourceTypes": ["BORE"],
  "treatmentProcesses": ["CHLORINATION", "UV_DISINFECTION", "FILTRATION"]
}
```

---

### Element 2: Hazardous Events and Hazards

**Regulatory Requirement:**
> "What are the risks to your water supply and how will you control them?"

**Current Database Fields:**
```prisma
model CompliancePlan {
  hazards               Json?  // Array of hazardous events
  riskAssessments       Json?  // Risk matrix data
}
```

**Status:** ✅ COMPLETE

**JSON Structure:**
```json
{
  "hazards": [
    {
      "hazardId": "HAZ-001",
      "category": "Biological",
      "description": "E. coli contamination from animal intrusion",
      "location": "Bore head",
      "likelihood": "MEDIUM",
      "consequence": "HIGH",
      "riskLevel": "HIGH",
      "identifiedDate": "2024-01-15"
    },
    {
      "hazardId": "HAZ-002",
      "category": "Chemical",
      "description": "Nitrate leaching from farmland",
      "location": "Source water",
      "likelihood": "LOW",
      "consequence": "MEDIUM",
      "riskLevel": "MEDIUM",
      "identifiedDate": "2024-01-15"
    }
  ]
}
```

---

### Element 3: Preventive Measures for Hazards

**Regulatory Requirement:**
> "Control measures, barriers, and preventive actions for each identified hazard"

**Current Database Fields:**
```prisma
model CompliancePlan {
  preventiveMeasures    Json?  // Control measures
}
```

**Status:** ✅ COMPLETE

**JSON Structure:**
```json
{
  "preventiveMeasures": [
    {
      "measureId": "PM-001",
      "hazardId": "HAZ-001",
      "description": "Fenced enclosure 5m around bore head",
      "type": "PHYSICAL_BARRIER",
      "effectiveness": "HIGH",
      "responsiblePerson": "Site Manager",
      "inspectionFrequency": "Monthly",
      "implementedDate": "2023-06-01",
      "status": "ACTIVE"
    },
    {
      "measureId": "PM-002",
      "hazardId": "HAZ-001",
      "description": "Chlorination at 0.5-1.0 mg/L",
      "type": "TREATMENT",
      "effectiveness": "HIGH",
      "responsiblePerson": "Water Treatment Operator",
      "inspectionFrequency": "Daily",
      "implementedDate": "2020-01-01",
      "status": "ACTIVE"
    }
  ]
}
```

---

### Element 4: Operational Monitoring

**Regulatory Requirement:**
> "Daily/routine checks to ensure control measures are working"

**Current Database Fields:**
```prisma
model CompliancePlan {
  operationalMonitoring Json?  // Table 3.3 from DWSP
}
```

**Status:** ⚠️ NEEDS ENHANCEMENT

**Recommended New Model:**
```prisma
model OperationalMonitoringPoint {
  id                    String    @id @default(cuid())
  compliancePlanId      String

  // What to monitor
  parameter             String    // "Chlorine residual", "Flow rate", "Turbidity"
  location              String    // Where the check happens

  // How to monitor
  method                String    // "Visual inspection", "Online sensor", "Manual test"
  target                String    // "0.5-1.0 mg/L", "> 10 L/min", "< 1 NTU"

  // When to monitor
  frequency             String    // "Hourly", "Daily", "Weekly"
  responsiblePerson     String

  // What to do if out of spec
  correctiveActionId    String?

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  compliancePlan        CompliancePlan @relation(fields: [compliancePlanId], references: [id])
}
```

**Example Data:**
```json
{
  "operationalMonitoring": [
    {
      "id": "OMP-001",
      "parameter": "Chlorine residual",
      "location": "Treatment plant outlet",
      "method": "DPD colorimetric test",
      "target": "0.5-1.0 mg/L",
      "frequency": "Daily at 9am",
      "responsiblePerson": "John Smith (Treatment Operator)",
      "correctiveAction": "If < 0.2 mg/L: Increase chlorine dose, retest in 1 hour"
    }
  ]
}
```

---

### Element 5: Verification Monitoring

**Regulatory Requirement:**
> "Independent testing to verify the DWSP is working (usually lab testing)"

**Current Database Fields:**
```prisma
model CompliancePlan {
  verificationMonitoring Json?  // Table 3.4 from DWSP
}
```

**Status:** ✅ COMPLETE (links to WaterQualityTest model from Phase 1)

**JSON Structure:**
```json
{
  "verificationMonitoring": [
    {
      "parameter": "E. coli",
      "compliance_rule": "T1.8-ecol",
      "frequency": "Monthly",
      "samplingPoint": "Consumer tap - Main Street",
      "laboratory": "Hill Laboratories",
      "labAccreditation": "IANZ #123",
      "responsiblePerson": "Compliance Manager"
    },
    {
      "parameter": "pH",
      "compliance_rule": "T2.1-pH",
      "frequency": "Monthly",
      "samplingPoint": "Treatment plant outlet",
      "laboratory": "Hill Laboratories",
      "labAccreditation": "IANZ #123",
      "responsiblePerson": "Compliance Manager"
    }
  ]
}
```

**Note:** Actual test results stored in `WaterQualityTest` model (Phase 1)

---

### Element 6: Corrective Action

**Regulatory Requirement:**
> "What to do when things go wrong - immediate responses to failures"

**Current Database Fields:**
```prisma
model CompliancePlan {
  correctiveActions     Json?  // Table 3.5 from DWSP
}
```

**Status:** ✅ COMPLETE

**JSON Structure:**
```json
{
  "correctiveActions": [
    {
      "actionId": "CA-001",
      "trigger": "Chlorine residual < 0.2 mg/L",
      "immediateAction": "Increase chlorine dose by 20%, retest in 1 hour",
      "responsiblePerson": "Treatment Operator on duty",
      "notificationRequired": true,
      "notifyWho": ["Compliance Manager", "Taumata Arowai if not resolved in 4 hours"],
      "escalation": "If not resolved in 4 hours: Issue boil water notice, notify Medical Officer of Health"
    },
    {
      "actionId": "CA-002",
      "trigger": "E. coli detected in sample",
      "immediateAction": "Resample immediately, increase chlorine to 1.5 mg/L",
      "responsiblePerson": "Compliance Manager",
      "notificationRequired": true,
      "notifyWho": ["Taumata Arowai", "Medical Officer of Health", "Council CEO"],
      "escalation": "Issue boil water notice within 24 hours if positive resample"
    }
  ]
}
```

---

### Element 7: Incident and Emergency Response

**Regulatory Requirement:**
> "How will you respond when an incident occurs?"

**Current Database Fields:**
```prisma
model CompliancePlan {
  // MISSING - Need to add
}
```

**Status:** ❌ MISSING

**Required New Fields:**
```prisma
model CompliancePlan {
  // Add these fields:
  incidentResponsePlan      Json?
  emergencyContactPrimary   String?  // Name
  emergencyContactPhone     String?  // Phone
  emergencyContactSecondary String?  // Backup person
  emergencyContactPhone2    String?  // Backup phone
  boilWaterNoticeProcedure  String?  // How to issue BWN
  mediaContactPerson        String?  // Who speaks to media
}
```

**JSON Structure for incidentResponsePlan:**
```json
{
  "incidentResponsePlan": {
    "primaryContact": {
      "name": "Sarah Johnson",
      "role": "Compliance Manager",
      "phone": "027-123-4567",
      "email": "sarah.johnson@waimate.govt.nz"
    },
    "secondaryContact": {
      "name": "Mike Williams",
      "role": "Operations Manager",
      "phone": "027-234-5678",
      "email": "mike.williams@waimate.govt.nz"
    },
    "incidentTypes": [
      {
        "type": "Bacteriological contamination",
        "response": "Immediate resampling, increase chlorination, assess need for boil water notice",
        "notifyWithin": "1 hour",
        "notifyWho": ["Taumata Arowai", "Medical Officer of Health"]
      },
      {
        "type": "Loss of chlorination",
        "response": "Activate backup chlorinator, if unavailable issue boil water notice",
        "notifyWithin": "4 hours",
        "notifyWho": ["Taumata Arowai", "All consumers"]
      }
    ],
    "boilWaterNotice": {
      "authorizedBy": "Compliance Manager or Operations Manager",
      "issueMethod": "Social media, local radio, door-knock if < 100 properties",
      "templateLocation": "/documents/boil-water-notice-template.pdf"
    }
  }
}
```

---

### Element 8: Management of the Drinking Water Supply

**Regulatory Requirement:**
> "Who is responsible? Roles, training, competencies"

**Current Database Fields:**
```prisma
model CompliancePlan {
  managementProcedures  Json?
  createdById           String?
  assignedToId          String?
  approvedBy            String?
}
```

**Status:** ⚠️ NEEDS ENHANCEMENT

**Recommended Additional Fields:**
```prisma
model CompliancePlan {
  // Add these:
  waterSupplyManager        String?  // Person responsible
  waterSupplyManagerPhone   String?
  operatorCompetency        Json?    // Training records
  staffRoles                Json?    // Who does what
}
```

**JSON Structure:**
```json
{
  "managementProcedures": {
    "supplyManager": {
      "name": "Sarah Johnson",
      "role": "Water Supply Manager",
      "phone": "027-123-4567",
      "qualifications": ["Level 3 Water Treatment Operator", "NZQA Unit Standard 28125"],
      "trainingCurrent": true,
      "lastTraining": "2024-03-15"
    },
    "staffRoles": [
      {
        "role": "Treatment Plant Operator",
        "person": "John Smith",
        "responsibilities": [
          "Daily chlorine checks",
          "Equipment maintenance",
          "Record keeping"
        ],
        "competency": "Level 2 Water Treatment",
        "trainingExpiry": "2025-12-31"
      }
    ],
    "succession": {
      "backupManager": "Mike Williams",
      "backupOperator": "Jane Doe"
    }
  }
}
```

---

### Element 9: Documentation and Communication

**Regulatory Requirement:**
> "How will you keep records and communicate with stakeholders?"

**Current Database Fields:**
```prisma
model CompliancePlan {
  documentControl       Json?
  communicationPlan     Json?
}
```

**Status:** ✅ COMPLETE

**JSON Structure:**
```json
{
  "documentControl": {
    "recordKeeping": [
      {
        "documentType": "Daily operational logs",
        "location": "Treatment plant office, electronic backup",
        "retentionPeriod": "7 years",
        "responsiblePerson": "Treatment Operator"
      },
      {
        "documentType": "Water quality test results",
        "location": "FlowComply system + paper copies",
        "retentionPeriod": "10 years",
        "responsiblePerson": "Compliance Manager"
      }
    ]
  },
  "communicationPlan": {
    "consumers": {
      "method": "Annual water quality report, website updates",
      "frequency": "Annual + as needed for incidents"
    },
    "regulator": {
      "method": "Hinekōrako portal, DWQAR reports",
      "frequency": "Annual + incident notifications"
    },
    "staff": {
      "method": "Team meetings, email updates",
      "frequency": "Monthly"
    }
  }
}
```

---

### Element 10: Improvement Planning

**Regulatory Requirement:**
> "What improvements are needed and when will they be done?"

**Current Database Fields:**
```prisma
model CompliancePlan {
  // MISSING - Need to add
}
```

**Status:** ❌ MISSING

**Recommended New Fields:**
```prisma
model CompliancePlan {
  // Add this:
  improvementPlan       Json?
}
```

**JSON Structure:**
```json
{
  "improvementPlan": [
    {
      "improvementId": "IMP-001",
      "description": "Install backup chlorinator",
      "priority": "HIGH",
      "reason": "Current single point of failure risk",
      "estimatedCost": 15000,
      "budgetYear": "2024/2025",
      "targetCompletionDate": "2025-06-30",
      "responsiblePerson": "Operations Manager",
      "status": "PLANNED",
      "dependencies": ["Budget approval", "Supplier quote"]
    },
    {
      "improvementId": "IMP-002",
      "description": "Upgrade to automated monitoring system",
      "priority": "MEDIUM",
      "reason": "Improve compliance tracking and reduce manual work",
      "estimatedCost": 8000,
      "budgetYear": "2025/2026",
      "targetCompletionDate": "2026-03-31",
      "responsiblePerson": "Compliance Manager",
      "status": "UNDER_REVIEW"
    }
  ]
}
```

---

### Element 11: Supply Details

**Regulatory Requirement:**
> "Population served, sources, treatment, infrastructure"

**Current Database Fields:**
```prisma
model CompliancePlan {
  waterSupplyName       String?
  supplyPopulation      Int?
  sourceTypes           String[]
  treatmentProcesses    String[]
}
```

**Status:** ✅ COMPLETE

**Additional data from linked models:**
- `Asset` table - Infrastructure details
- `WaterSupplyComponent` table (Phase 1) - Components with Hinekōrako IDs

---

### Element 12: Review and Approval

**Regulatory Requirement:**
> "When will the plan be reviewed? Who approved it?"

**Current Database Fields:**
```prisma
model CompliancePlan {
  lastReviewDate        DateTime?
  nextReviewDate        DateTime?
  reviewNotes           String?
  approvedBy            String?
  approvedAt            DateTime?
  approvalNotes         String?
}
```

**Status:** ✅ COMPLETE

**Note:** Annual review is mandatory under Taumata Arowai regulations

---

## Summary of Required Database Changes

### ✅ Already Complete (9/12 elements)
- Element 1: Description ✅
- Element 2: Hazards ✅
- Element 3: Preventive Measures ✅
- Element 5: Verification Monitoring ✅
- Element 6: Corrective Action ✅
- Element 9: Documentation ✅
- Element 11: Supply Details ✅
- Element 12: Review and Approval ✅

### ⚠️ Needs Minor Enhancement (1/12)
- Element 4: Operational Monitoring (current JSON structure adequate, but could add dedicated model)
- Element 8: Management (add staff roles and competency fields)

### ❌ Missing Fields (2/12)
- Element 7: Incident/Emergency Response (need 6 new fields)
- Element 10: Improvement Planning (need 1 JSON field)

---

## Recommended Schema Updates

### Option 1: Minimal Changes (Add Missing Fields)

```prisma
model CompliancePlan {
  // ... existing fields ...

  // Element 7: Incident & Emergency Response
  incidentResponsePlan      Json?
  emergencyContactPrimary   String?
  emergencyContactPhone     String?
  emergencyContactSecondary String?
  emergencyContactPhone2    String?

  // Element 8: Management enhancements
  waterSupplyManager        String?
  waterSupplyManagerPhone   String?
  operatorCompetency        Json?
  staffRoles                Json?

  // Element 10: Improvement Planning
  improvementPlan           Json?
}
```

**Effort:** 30 minutes
**Migration:** Simple additive migration

### Option 2: Normalize with Dedicated Models (Future Enhancement)

Create separate models for better data integrity:
- `OperationalMonitoringPoint`
- `CorrectiveAction`
- `ImprovementItem`
- `StaffRole`

**Effort:** 4-6 hours
**Benefit:** Better querying, validation, and reporting

**Recommendation:** Start with Option 1, migrate to Option 2 in Phase 3 or later

---

## DWSP Builder UI Requirements

### Form Flow (Wizard-style)

1. **Step 1: Supply Information** (Element 1, 11)
   - Water supply name
   - Population served
   - Source types (multi-select)
   - Treatment processes (multi-select)

2. **Step 2: Risk Assessment** (Element 2, 3)
   - Hazard identification table
   - Preventive measures for each hazard
   - Risk matrix visualization

3. **Step 3: Monitoring** (Element 4, 5)
   - Operational monitoring table
   - Verification monitoring schedule
   - Link to WaterQualityTest records

4. **Step 4: Response Plans** (Element 6, 7)
   - Corrective actions table
   - Emergency contacts
   - Incident response procedures

5. **Step 5: Management** (Element 8, 9)
   - Responsible persons
   - Staff roles and training
   - Documentation procedures

6. **Step 6: Improvement & Review** (Element 10, 12)
   - Planned improvements
   - Review schedule
   - Approval workflow

### UI Components Needed

- **Hazard Matrix:** Interactive risk assessment grid (Likelihood × Consequence)
- **Monitoring Tables:** Editable tables matching DWSP template format
- **Contact Cards:** Visual display of emergency contacts
- **Gantt Chart:** Timeline for improvement projects
- **PDF Export:** Generate DWSP PDF matching official template

---

## Validation Rules

### Mandatory Fields (Cannot Submit Without)
- Water supply name
- Population served
- At least 1 source type
- At least 1 treatment process
- At least 3 hazards identified
- At least 1 preventive measure per hazard
- Emergency contact details
- Review schedule set

### Data Quality Checks
- Population > 0 and < 1,000,000
- Next review date within 12 months
- All staff have current training (< 3 years old)
- All improvement items have target dates
- All operational monitoring has frequency set

---

## Export Formats

### 1. PDF Export (Priority 1)
- Matches official Taumata Arowai template exactly
- All 12 elements in correct order
- Professional formatting for regulator submission

### 2. Upload to Hinekōrako (Priority 1)
- Follow "Quick_Guide_to_Uploading_DWSP.pdf"
- Format validation before upload
- Track submission status

### 3. Internal Reports (Priority 2)
- Summary dashboard
- Compliance checklist
- Risk register report

---

## Implementation Checklist

### Phase 2A: Database (1-2 hours)
- [ ] Add 10 new fields to CompliancePlan model
- [ ] Run Prisma migration
- [ ] Update Zod validation schemas

### Phase 2B: Backend (2-3 hours)
- [ ] Update CompliancePlan service with new fields
- [ ] Add DWSP validation endpoint
- [ ] Create DWSP PDF export service

### Phase 2C: Frontend (8-10 hours)
- [ ] Build 6-step DWSP wizard
- [ ] Create hazard matrix component
- [ ] Build monitoring tables
- [ ] Add PDF preview
- [ ] Emergency contact forms

### Phase 2D: Testing (3-4 hours)
- [ ] Unit tests for validation
- [ ] Integration tests for DWSP workflow
- [ ] PDF export test (manual)

### Phase 2E: Documentation (1 hour)
- [ ] User guide: "Creating Your DWSP"
- [ ] Admin guide: "DWSP Approval Workflow"

---

**Total Estimated Effort: 15-20 hours (2-3 days)**

**Original Estimate:** 5-7 days
**Revised Estimate:** 2-3 days (analysis complete, minimal schema changes needed)

---

**Next Document:** PHASE_2_IMPLEMENTATION_SUMMARY.md
