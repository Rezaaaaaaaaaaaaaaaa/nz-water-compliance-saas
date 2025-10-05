# DWQAR Excel Template - Complete Field Mapping

**Analysis Date:** 2025-10-05
**Template:** DWQAR_Reporting_Template.xlsx
**Purpose:** Map Excel columns to FlowComply database fields

---

## Overview

The DWQAR template has **3 sheets**:
1. **Reports** - High-level compliance reporting by rule
2. **Samples** - Individual water quality test samples
3. **RuleIDs** - Reference list of 381 Taumata Arowai rules

---

## Sheet 1: Reports (Compliance by Rule)

### Required Fields

| Column | Excel Header | Database Mapping | Data Type | Required | Notes |
|--------|--------------|------------------|-----------|----------|-------|
| A | Rule ID | `ComplianceRule.ruleId` | String | YES | References 381 rules (e.g., "T1.8-ecol") |
| B | Supply Component ID | `WaterSupplyComponent.componentId` | String | YES | Unique ID from Hinekōrako (e.g., "TP04026") |
| C | Complies With Rule | `RuleCompliance.complies` | Boolean | YES | True/False |
| D | Non Compliant Periods | `RuleCompliance.nonCompliantPeriods` | Integer | YES | Count of non-compliance periods |
| E | Notes | `RuleCompliance.notes` | Text | NO | Optional notes |

### Database Impact
**NEW MODEL NEEDED:** `RuleCompliance`
```prisma
model RuleCompliance {
  id                    String    @id @default(cuid())
  organizationId        String
  ruleId                String    // FK to ComplianceRule
  componentId           String    // FK to WaterSupplyComponent
  reportingPeriod       String    // e.g., "2024-Q1"
  complies              Boolean
  nonCompliantPeriods   Int       @default(0)
  notes                 String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}
```

---

## Sheet 2: Samples (Water Quality Tests)

### Required Fields

| Column | Excel Header | Database Mapping | Data Type | Required | Notes |
|--------|--------------|------------------|-----------|----------|-------|
| A | Rule ID | `WaterQualityTest.ruleId` | String | YES | Which rule this test relates to |
| B | Supply Component ID | `WaterQualityTest.componentId` | String | YES | Where sample was taken |
| C | External Sample ID | `WaterQualityTest.externalSampleId` | String | NO | Lab/tracking reference |
| D | Sample Date | `WaterQualityTest.sampleDate` | DateTime | YES | Format: "YYYY-MM-DD HH:MM:SS" |
| E | Parameter/Determinand | `WaterQualityTest.parameter` | String | YES | e.g., "ecol", "pH", "turbidity" |
| F | Value Prefix | `WaterQualityTest.valuePrefix` | String | NO | "<", ">", or empty |
| G | Value | `WaterQualityTest.value` | Decimal | YES | Numeric test result |
| H | Unit | `WaterQualityTest.unit` | String | YES | "mpn/100mL", "cfu/100mL", "NTU", etc. |
| I | Complies With Rule | `WaterQualityTest.compliesWithRule` | Boolean | YES | True/False based on limits |
| J | Source Class | `WaterQualityTest.sourceClass` | String | NO | Water source classification |
| K | Notes | `WaterQualityTest.notes` | Text | NO | Additional context |

### Database Impact
**NEW MODEL NEEDED:** `WaterQualityTest`
```prisma
model WaterQualityTest {
  id                  String    @id @default(cuid())
  organizationId      String
  componentId         String    // FK to WaterSupplyComponent
  ruleId              String    // FK to ComplianceRule

  // Sample Details
  externalSampleId    String?
  sampleDate          DateTime
  parameter           String    // "ecol", "pH", "turbidity", etc.

  // Test Results
  valuePrefix         String?   // "<", ">", or null
  value               Decimal   @db.Decimal(12, 4)
  unit                String    // "mpn/100mL", "cfu/100mL", "NTU"

  // Compliance
  compliesWithRule    Boolean
  sourceClass         String?
  notes               String?

  // Lab info
  labName             String?
  labAccreditation    String?
  testMethod          String?

  // Metadata
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  deletedAt           DateTime? // Soft delete
}
```

---

## Sheet 3: RuleIDs (Reference Data)

### Purpose
Contains **381 Taumata Arowai compliance rules** that water suppliers must report against.

### Database Impact
**NEW MODEL NEEDED:** `ComplianceRule`
```prisma
model ComplianceRule {
  id                String    @id @default(cuid())
  ruleId            String    @unique  // "T1.8-ecol", "T2.1-pH", etc.
  category          String?   // "Water Quality", "Treatment", "Monitoring"
  description       String?
  parameter         String?   // "ecol", "pH", "turbidity"
  applicability     String?   // Which supply sizes/types
  effectiveDate     DateTime?
  supersededDate    DateTime?

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

**ACTION REQUIRED:** Import all 381 rules from Excel into database as reference data.

---

## Additional Required Models

### 1. WaterSupplyComponent

Water supplies can have multiple components (treatment plants, zones, sources).

```prisma
model WaterSupplyComponent {
  id                  String    @id @default(cuid())
  organizationId      String
  componentId         String    @unique  // Hinekōrako ID (e.g., "TP04026")

  // Component Details
  name                String
  type                String    // "Treatment Plant", "Distribution Zone", "Source"
  description         String?

  // Population & Capacity
  populationServed    Int?
  capacity            String?   // "500 L/min"

  // Location
  latitude            Float?
  longitude           Float?
  address             String?

  // Status
  isActive            Boolean   @default(true)
  commissonedDate     DateTime?

  // Metadata
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  deletedAt           DateTime?

  // Relations
  waterQualityTests   WaterQualityTest[]
  ruleCompliances     RuleCompliance[]
}
```

---

## Summary of Database Changes Needed

### New Models (4)
1. ✅ `ComplianceRule` - 381 Taumata Arowai rules
2. ✅ `WaterSupplyComponent` - Supply components with Hinekōrako IDs
3. ✅ `WaterQualityTest` - Individual water samples/tests
4. ✅ `RuleCompliance` - Per-rule compliance status

### Modified Models (0)
No changes to existing models - additive only.

### New Enums
```prisma
enum WaterParameter {
  ECOL                // E. coli
  ENTEROCOCCI
  CRYPTOSPORIDIUM
  GIARDIA
  PH
  TURBIDITY
  CHLORINE_FREE
  CHLORINE_TOTAL
  FLUORIDE
  LEAD
  COPPER
  ARSENIC
  NITRATE
  TEMPERATURE
  // ... many more
}

enum ComplianceRuleCategory {
  WATER_QUALITY
  TREATMENT
  MONITORING
  OPERATIONAL
  VERIFICATION
  MANAGEMENT
}
```

---

## Export Logic

### For "Reports" Sheet:
```typescript
// Group all tests by Rule + Component
// Calculate compliance status per rule
// Count non-compliant periods

const reportsData = await db.ruleCompliance.findMany({
  where: {
    organizationId,
    reportingPeriod: '2024-Q1'
  },
  include: {
    rule: true,
    component: true
  }
});

// Export to Excel Reports sheet
```

### For "Samples" Sheet:
```typescript
// Get all water quality tests for reporting period

const samplesData = await db.waterQualityTest.findMany({
  where: {
    organizationId,
    sampleDate: {
      gte: startDate,
      lte: endDate
    }
  },
  orderBy: { sampleDate: 'asc' }
});

// Export to Excel Samples sheet with exact column mapping
```

---

## Migration Plan

### Step 1: Add New Models to Schema
- Update `backend/prisma/schema.prisma`
- Add 4 new models + 2 enums

### Step 2: Generate Migration
```bash
npx prisma migrate dev --name add_dwqar_models
```

### Step 3: Seed Compliance Rules
```bash
# Import 381 rules from DWQAR_Reporting_Template.xlsx RuleIDs sheet
node scripts/seed_compliance_rules.js
```

### Step 4: Create Export Service
- `backend/src/services/dwqar-export.service.ts`
- Generate Excel file matching template exactly
- Validate all required fields present

### Step 5: Add API Endpoints
```
GET  /api/export/dwqar?period=2024-Q1
POST /api/water-quality-tests
GET  /api/water-quality-tests?componentId=TP04026
GET  /api/compliance-rules
POST /api/supply-components
```

---

## Field Validation Rules

### Required Fields (Cannot be null)
- Rule ID
- Supply Component ID
- Sample Date
- Parameter
- Value
- Unit
- Complies With Rule

### Date Format
- **Excel Format:** `YYYY-MM-DD HH:MM:SS`
- **Database Storage:** `DateTime` (ISO 8601)
- **Timezone:** NZ local time (NZST/NZDT)

### Boolean Values
- **Excel:** `True` / `False` (case-sensitive)
- **Database:** `true` / `false`

### Numeric Values
- **Value Prefix:** Optional, one of: `<`, `>`, or empty
- **Value:** Decimal with up to 4 decimal places
- **Example:** `< 1` means "less than 1"

---

## Example Data Flow

### 1. User Records Water Sample
```typescript
POST /api/water-quality-tests
{
  "componentId": "TP04026",
  "ruleId": "T1.8-ecol",
  "sampleDate": "2024-03-15T10:30:00",
  "parameter": "ecol",
  "value": 2,
  "unit": "cfu/100mL",
  "externalSampleId": "LAB-2024-0315-001"
}
```

### 2. System Auto-Calculates Compliance
```typescript
// Check if value exceeds regulatory limit for E. coli
const limit = await getParameterLimit("ecol", "TP04026");
const complies = value <= limit; // 2 <= 1 = false
```

### 3. Generate DWQAR Export
```typescript
GET /api/export/dwqar?period=2024-Q1&format=xlsx

// Returns: DWQAR_Report_2024Q1_FlowComply.xlsx
// Matches official template exactly
```

### 4. Upload to Hinekōrako
- User downloads Excel file
- Logs into Hinekōrako platform
- Uploads file (validation passes ✓)
- Submission successful

---

## Success Criteria

1. ✅ All 16 Excel columns mapped to database fields
2. ✅ 381 compliance rules imported as reference data
3. ✅ Export matches official template byte-for-byte (headers, formatting)
4. ✅ File validates successfully in Hinekōrako
5. ✅ No manual data entry required - all from database
6. ✅ Historical data preserved for annual reporting
7. ✅ API endpoints for CRUD operations on tests/samples

---

**Next Step:** Update `backend/prisma/schema.prisma` with new models.
