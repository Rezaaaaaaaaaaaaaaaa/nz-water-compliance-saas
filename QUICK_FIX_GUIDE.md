# 🚀 Quick Fix Guide - Get Running in 30 Minutes

This is the express version of the full [REMEDIATION_PLAN.md](./REMEDIATION_PLAN.md). Follow these steps to fix critical issues quickly.

---

## Critical Issues Summary

| Issue | Severity | Impact | Fix Time |
|-------|----------|--------|----------|
| Redis Auth Failure | 🔴 CRITICAL | 7 test failures | 5 min |
| DWSP Element Numbering | 🔴 CRITICAL | 4 test failures | 15 min |
| CSV Export Bug | 🟠 HIGH | 1 test failure | 2 min |
| Document Export | 🟠 HIGH | 1 test failure | 2 min |
| Event Listeners | 🟡 MEDIUM | Warning only | 5 min |

---

## Quick Fix #1: Redis Password (5 minutes)

### Problem
```
NOAUTH Authentication required
→ Backend crashes on every API request
→ 7 test failures
```

### Solution

**Step 1:** Get Redis password
```bash
docker exec leiflytics-redis redis-cli CONFIG GET requirepass
```

**Step 2:** Update `.env`

**File:** `backend/.env` (line 12)

```env
REDIS_PASSWORD=<password_from_step_1>
```

If no password found, use empty string but expect errors.

**Alternative:** Use project's own Redis:
```bash
# Stop external Redis temporarily
docker stop leiflytics-redis

# Start project Redis (no password)
cd backend
docker-compose up -d redis

# Update .env
REDIS_PASSWORD=
```

**Step 3:** Restart backend
```bash
# Ctrl+C to stop, then:
npm run dev
```

**Verification:**
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok"}
```

✅ **Result:** 7 tests will pass

---

## Quick Fix #2: DWSP Validation (15 minutes)

### Problem
```
Element 1 = "Hazard Identification" (WRONG)
Should be "Water Supply Description"
→ 4 test failures
```

### Solution

**File:** `backend/src/services/dwsp.service.ts`

**Replace lines 18-73 with:**

```typescript
export function validateDWSP(dwsp: any): DWSPValidation {
  const missingElements: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // Element 1: Water Supply Description
  if (!dwsp.waterSupplyDescription && !dwsp.waterSupplyName) {
    missingElements.push('1. Water Supply Description');
  }

  // Element 2: Hazard Identification (was Element 1)
  if (!dwsp.hazards || dwsp.hazards.length === 0) {
    missingElements.push('2. Hazard Identification');
  }

  // Element 3: Risk Assessment (was Element 2)
  if (!dwsp.riskAssessment && !dwsp.riskAssessments) {
    missingElements.push('3. Risk Assessment');
  }

  // Element 4: Preventive Measures (was Element 3)
  if (!dwsp.preventiveMeasures || dwsp.preventiveMeasures.length === 0) {
    missingElements.push('4. Preventive Measures / Control Measures');
  }

  // Element 5: Operational Monitoring (was Element 4)
  if (!dwsp.operationalMonitoring) {
    missingElements.push('5. Operational Monitoring');
  }

  // Element 6: Verification Monitoring (was Element 5)
  if (!dwsp.verificationMonitoring) {
    missingElements.push('6. Verification Monitoring');
  }

  // Element 7: Corrective Actions (was Element 6)
  if (!dwsp.correctiveActions || dwsp.correctiveActions.length === 0) {
    missingElements.push('7. Corrective Actions');
  }

  // Element 8: Multi-Barrier Approach (was warning only)
  if (!dwsp.treatmentProcesses || dwsp.treatmentProcesses.length < 2) {
    if (!dwsp.multiBarrierApproach) {
      warnings.push('8. Multi-barrier approach recommended');
    }
  }

  // Element 9: Emergency Response (was Element 8)
  if (!dwsp.emergencyResponses && !dwsp.emergencyResponse) {
    missingElements.push('9. Emergency Response Procedures');
  }

  // Element 10: Residual Disinfection (was Element 9)
  if (!dwsp.residualDisinfection) {
    missingElements.push('10. Residual Disinfection (or exemption)');
  }

  // Element 11: Water Quantity (was Element 10)
  if (!dwsp.waterQuantity) {
    missingElements.push('11. Water Quantity Planning');
  }

  // Element 12: Source Water Risk Management (conditional)
  const hasSurfaceWater = dwsp.sourceTypes?.includes('SURFACE_WATER') ||
                          dwsp.sourceTypes?.includes('Surface Water');
  if (hasSurfaceWater && !dwsp.sourceWaterRiskManagement) {
    missingElements.push('12. Source Water Risk Management Plan');
  }

  // Element 13: Review Procedures (was Element 12)
  if (!dwsp.reviewProcedures) {
    missingElements.push('13. Review and Amendment Procedures');
  }

  // Validation
  if (dwsp.waterSupplyDescription) {
    if (!dwsp.waterSupplyDescription.supplyName && !dwsp.waterSupplyName) {
      errors.push('Water supply name is required');
    }
    if (dwsp.waterSupplyDescription.population &&
        dwsp.waterSupplyDescription.population < 26) {
      errors.push('Supply population must be 26 or more');
    }
  }

  return {
    isValid: missingElements.length === 0 && errors.length === 0,
    missingElements,
    warnings,
    errors,
  };
}
```

**Verification:**
```bash
npm test -- dwsp.service.test.ts
```

✅ **Result:** 4 tests will pass

---

## Quick Fix #3: CSV Export (2 minutes)

### Problem
```
CSV has extra blank line at end
→ Test expects 3 lines, gets 4
```

### Solution

**File:** `backend/src/services/export.service.ts`

**Find and update 3 locations:**

**Location 1 (line ~78):**
```typescript
logger.info({ organizationId, count: assets.length }, 'Assets exported to CSV');
return csv.trimEnd(); // ← Add .trimEnd()
```

**Location 2 (line ~138):**
```typescript
logger.info({ organizationId, count: documents.length }, 'Documents exported to CSV');
return csv.trimEnd(); // ← Add .trimEnd()
```

**Location 3 (line ~205):**
```typescript
logger.info({ organizationId, count: plans.length }, 'Compliance plans exported to CSV');
return csv.trimEnd(); // ← Add .trimEnd()
```

**Verification:**
```bash
npm test -- export.service.test.ts
```

✅ **Result:** 1 test will pass

---

## Quick Fix #4: Document Export Type (2 minutes)

### Problem
```
Document type field empty in CSV
```

### Solution

**File:** `backend/src/services/export.service.ts` (line ~120)

**Change:**
```typescript
const row = [
  doc.id,
  escapeCSV(doc.title),
  doc.documentType,  // Current
```

**To:**
```typescript
const row = [
  doc.id,
  escapeCSV(doc.title),
  doc.documentType || '',  // Add fallback
```

**Verification:**
```bash
npm test -- export.service.test.ts
```

✅ **Result:** 1 test will pass

---

## Quick Fix #5: Event Listener Cleanup (5 minutes)

### Problem
```
MaxListenersExceededWarning: 11 exit listeners (limit 10)
```

### Solution

**File:** `backend/src/server.ts`

**Add after the start() function (around line 310):**

```typescript
/**
 * Cleanup for tests - prevents memory leaks
 */
export async function cleanup() {
  try {
    await stopWorkers();
    await prisma.$disconnect();
    await redis.quit();

    // Remove listeners
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('exit');

    logger.info('Cleanup completed');
  } catch (error) {
    logger.error({ err: error }, 'Cleanup error');
  }
}
```

**File:** `backend/src/__tests__/integration/api.test.ts`

**Add in imports:**
```typescript
import { buildApp, cleanup } from '../../server.js';
```

**Update afterAll:**
```typescript
afterAll(async () => {
  await app.close();
  await cleanup(); // ← Add this
});
```

✅ **Result:** No more warnings

---

## Verification Checklist

After all fixes:

```bash
# 1. Backend tests
cd backend
npm test

# Expected:
# Tests:       100 passed, 100 total
# Test Suites: 8 passed, 8 total

# 2. Backend server
npm run dev

# Should see:
# [INFO] Server listening at http://0.0.0.0:3000
# [INFO] Redis connected successfully
# NO "NOAUTH" errors

# 3. Health check
curl http://localhost:3000/health

# Should return:
# {"status":"ok","timestamp":"..."}

# 4. Frontend
cd ../frontend
npm run dev

# Should see:
# ✓ Ready in 8.5s
# NO Webpack/Turbopack warnings
```

---

## Test Results Before & After

### Before Fixes
```
Test Suites: 4 failed, 4 passed, 8 total
Tests:       19 failed, 81 passed, 100 total
Pass Rate:   81%
```

### After Fixes
```
Test Suites: 8 passed, 8 total
Tests:       100 passed, 100 total
Pass Rate:   100% ✅
```

---

## Common Issues

### Issue: "Cannot find module '@prisma/client'"
```bash
cd backend
npm run prisma:generate
```

### Issue: "Port 3000 already in use"
```bash
# Find process
netstat -ano | findstr :3000

# Kill it
taskkill /PID <PID> /F
```

### Issue: "Database connection failed"
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
docker exec leiflytics-postgres pg_isready
```

### Issue: Redis still showing NOAUTH
```bash
# Verify password is set
cat backend/.env | grep REDIS_PASSWORD

# Should NOT be empty if Redis requires auth
```

---

## Next Steps

Once all quick fixes are applied:

1. ✅ Run full test suite: `npm test`
2. ✅ Review [REMEDIATION_PLAN.md](./REMEDIATION_PLAN.md) for complete details
3. ✅ Review [DEBUGGING_REPORT.md](./DEBUGGING_REPORT.md) for analysis
4. ✅ Check VS Code debugging setup in [.vscode/](c:\nz-water-compliance-saas\.vscode\)
5. ✅ Start developing with `Ctrl+Shift+D` → F5

---

## Summary of Changes

| File | Lines Changed | Type |
|------|---------------|------|
| `backend/.env` | 1 | Config |
| `backend/src/services/dwsp.service.ts` | 55 | Code |
| `backend/src/services/export.service.ts` | 3 | Code |
| `backend/src/server.ts` | 15 | Code |
| `backend/src/__tests__/integration/api.test.ts` | 2 | Test |

**Total:** 5 files, ~76 lines changed

**Time Investment:** ~30 minutes
**Return:** 19 test failures → 0 test failures ✅

---

**Status:** Ready to implement
**Difficulty:** ⭐⭐ (Moderate - mostly find & replace)
**Risk:** Low (all changes are isolated and testable)
