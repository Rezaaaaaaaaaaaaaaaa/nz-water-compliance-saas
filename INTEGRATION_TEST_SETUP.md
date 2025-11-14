# Integration Test Setup Guide

## Current Status: ✅ Code Fixes Complete, ⚠️ Database Setup Required

This guide will help you set up and run the integration tests after the recent fixes.

## What's Been Fixed

### ✅ DWSP Title Field Mismatch (Primary Issue)
- **Problem**: Tests were sending `name` field but API expects `title`
- **Files Modified**: `backend/tests/integration/compliance.test.ts`
- **Changes**:
  - Replaced all `name:` with `title:` in test payloads
  - Added required fields matching `CreateDWSPRequest` schema
  - Updated test expectations to check `.data.title` instead of `.data.name`
  - Fixed version type expectation (`'1.0'` string vs number)

### ✅ Test Database Setup Script Created
- **New File**: `backend/scripts/setup-test-db.js`
- **Usage**: `npm run test:db:setup`
- **Features**:
  - Creates `compliance_test` database automatically
  - Runs Prisma migrations
  - Generates Prisma Client

### ✅ Dependencies Installed
- Added `pg` and `@types/pg` for database operations

---

## Setup Steps (Run These in Order)

### Step 1: Ensure Docker Desktop is Fully Running

1. Open Docker Desktop application
2. Wait for the status to show "Docker Desktop is running"
3. Verify with: `docker ps` (should not show connection errors)

**Troubleshooting**:
- If Docker Desktop shows errors, try restarting it
- Make sure Docker Desktop has fully initialized (may take 30-60 seconds)
- Check Docker Desktop settings to ensure Linux containers are enabled

### Step 2: Start Database Containers

```bash
cd backend
docker compose up -d
```

**Expected Output**:
```
✅ Container compliance-saas-postgres  Started
✅ Container compliance-saas-redis     Started
```

**Verify containers are running**:
```bash
docker ps --filter "name=compliance-saas"
```

Should show both containers with status "Up" and "healthy".

### Step 3: Create Test Database and Run Migrations

```bash
cd backend
npm run test:db:setup
```

**Expected Output**:
```
🔧 Setting up test database...
Step 1: Creating test database...
✅ Database 'compliance_test' created successfully
Step 2: Running Prisma migrations...
✅ Migrations completed
Step 3: Generating Prisma Client...
✅ Prisma Client generated
✅ Test database setup complete!
```

**Troubleshooting**:
- If you get "database already exists", that's fine - script will continue
- If connection fails, verify Docker containers are running (Step 2)
- Check `.env.test` for correct credentials (user: postgres, password: password)

### Step 4: Run Integration Tests

```bash
cd backend
npm run test:integration
```

**Expected Results**:
- Tests should run in ~8-10 seconds (vs 22+ minutes when Docker wasn't running)
- Some tests may still fail (see "Known Remaining Issues" below)

---

## Test Configuration

### Database Connection
- **URL**: `postgresql://postgres:password@localhost:5432/compliance_test`
- **Configured in**: `backend/.env.test`

### Required Services
- **PostgreSQL**: Port 5432 (via Docker)
- **Redis**: Port 6379 (via Docker)

---

## Known Remaining Issues

After database setup, these test issues still need to be fixed:

### 1. Document Foreign Key Constraint
- **Issue**: `Document_createdById_fkey` violation in test utilities
- **File**: `backend/tests/helpers/test-utils.ts`
- **Impact**: Document-related tests will fail

### 2. Auth Registration Validation
- **Issue**: Tests expecting 201 but getting 400
- **File**: `backend/tests/integration/auth.test.ts`
- **Impact**: Registration tests failing

### 3. API Response Structure
- **Issue**: Some endpoints missing `success` field in response
- **Files**: Various controller files
- **Impact**: Tests expecting standardized response format

### 4. DWSP List Response Structure
- **Issue**: Response returns object instead of array
- **File**: `backend/src/controllers/dwsp.controller.ts`
- **Impact**: List tests failing on `.forEach()`

---

## Quick Reference Commands

```bash
# Start Docker containers
cd backend && docker compose up -d

# Stop Docker containers
cd backend && docker compose down

# View container logs
docker logs compliance-saas-postgres
docker logs compliance-saas-redis

# Setup test database
cd backend && npm run test:db:setup

# Run all integration tests
cd backend && npm run test:integration

# Run specific test file
cd backend && npm run test:integration -- --testPathPattern=compliance.test.ts

# Run tests in watch mode
cd backend && npm run test:integration -- --watch

# View test coverage
cd backend && npm run test:coverage
```

---

## Test Results Baseline

**From last successful run** (before database setup):
- Test Suites: 5 failed, 5 total
- Tests: 68 failed, 47 passed, 115 total
- Time: 7.786 seconds ✅

**Target after all fixes**:
- Expect ~80-90% pass rate initially
- Remaining failures will be test logic and API response structure issues

---

## Next Steps

Once tests are running:

1. **Fix Document FK Constraint** - Update test utilities to properly handle `createdById`
2. **Fix Auth Validation** - Debug why registration returns 400 instead of 201
3. **Standardize API Responses** - Ensure all endpoints return consistent structure
4. **Fix DWSP List Endpoint** - Return array instead of object in list responses

---

## Helpful Tips

- **Running specific tests faster**: Use `--testPathPattern` to run only certain test files
- **Debug mode**: Add `--verbose` flag for more detailed output
- **Clean database**: If tests are inconsistent, run `docker compose down -v` to remove volumes, then start fresh
- **Check logs**: Use `docker logs` to see database errors if connection fails

---

**Last Updated**: 2025-11-15
**Status**: Ready for database setup and test execution
