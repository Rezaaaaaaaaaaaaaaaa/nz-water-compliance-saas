# Testing Guide - NZ Water Compliance SaaS
## Fast, Iterative Testing for Development & CI/CD

**Last Updated:** 2025-11-10
**Purpose:** Comprehensive testing that's faster than GitHub Actions and designed for iterative debugging

---

## 🎯 Testing Philosophy

Our testing approach is designed for **speed** and **iteration**:

1. **Fast Feedback** - Get results in < 30 seconds for quick validation
2. **Iterative Development** - Watch mode for continuous testing
3. **Comprehensive Validation** - Full suite matches GitHub Actions
4. **Debug-Friendly** - Easy to isolate and fix failing tests

---

## 📋 Testing Scripts Overview

| Script | Speed | Use Case | Coverage |
|--------|-------|----------|----------|
| `test-quick.sh` | ⚡ 30s | Pre-commit validation | Lint + Types + Unit |
| `test-watch.sh` | 🔄 Instant | Active development | Unit or Integration |
| `test-debug.sh` | 🐛 Variable | Debugging specific tests | Targeted |
| `test-all.sh` | 🧪 5-10min | Pre-push/deployment | Complete suite |

---

## ⚡ Quick Start (30 seconds)

**Perfect for: Pre-commit validation**

```bash
./scripts/test-quick.sh
```

**What it does:**
- ✅ Linting (5s)
- ✅ Type checking (5s)
- ✅ Unit tests (10s)
- ✅ Build verification (10s)

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚡ QUICK TEST - Fast Feedback
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ Linting backend... ✓
▶ Linting frontend... ✓
▶ Type checking... ✓
▶ Running unit tests... ✓
▶ Build check... ✓

✅ All checks passed (28s)
Ready to commit!
```

---

## 🔄 Watch Mode (Instant Feedback)

**Perfect for: Active development**

### Unit Tests (Fastest)
```bash
./scripts/test-watch.sh unit
```

**Features:**
- ✅ Runs only changed tests (< 2s feedback)
- ✅ Interactive filtering (press 'p' to filter)
- ✅ No database required
- ✅ Perfect for TDD

### Integration Tests
```bash
./scripts/test-watch.sh integration
```

**Features:**
- ✅ Database automatically started
- ✅ Runs affected tests
- ✅ Real API testing

### Specific File
```bash
./scripts/test-watch.sh file backend/src/services/asset.service.test.ts
```

**Interactive Commands:**
- Press `a` → Run all tests
- Press `f` → Run only failed tests
- Press `p` → Filter by pattern
- Press `t` → Filter by test name
- Press `q` → Quit

**Example Workflow:**
```bash
# 1. Start watch mode
./scripts/test-watch.sh unit

# 2. Edit src/services/asset.service.ts
# → Tests run automatically in < 2 seconds

# 3. Fix any failures
# → Tests re-run automatically

# 4. Press 'a' to run all tests before committing
```

---

## 🐛 Debug Mode (Targeted Testing)

**Perfect for: Debugging failing tests**

### Debug Specific Tests
```bash
# All asset-related tests
./scripts/test-debug.sh asset

# Specific test pattern (regex)
./scripts/test-debug.sh "auth.*login"

# Integration tests only
./scripts/test-debug.sh analytics --integration

# Stop on first failure
./scripts/test-debug.sh dwsp --bail

# With coverage
./scripts/test-debug.sh export --coverage
```

**Features:**
- ✅ Verbose output for debugging
- ✅ Pattern matching (regex)
- ✅ Coverage for specific tests
- ✅ Bail on first failure

**Example Output:**
```
╔════════════════════════════════════════════════════════════╗
║              🐛 DEBUG TEST MODE                            ║
╚════════════════════════════════════════════════════════════╝

Pattern: asset
Type:    Unit

Running: npm test -- -t "asset" --verbose --no-cache

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 PASS  src/__tests__/services/asset.service.test.ts
  Asset Service
    calculateRiskLevel
      ✓ should return CRITICAL for critical poor condition asset (5 ms)
      ✓ should return HIGH for critical fair condition asset (2 ms)
      ✓ should return MEDIUM for non-critical poor condition (1 ms)
      ...

✅ Tests passed
```

---

## 🧪 Full Test Suite (Comprehensive)

**Perfect for: Pre-push validation, CI/CD**

### Run Everything
```bash
./scripts/test-all.sh
```

**What it does (matches GitHub Actions):**
1. ✅ Prerequisites check (Node, Docker)
2. ✅ Docker services (PostgreSQL, Redis)
3. ✅ Dependencies installation
4. ✅ Database setup (Prisma)
5. ✅ Linting & formatting
6. ✅ Unit tests with coverage
7. ✅ Integration tests
8. ✅ Build verification
9. ✅ E2E tests (Playwright)
10. ✅ Security audit

**Time:** ~5-10 minutes (vs 15-20 minutes in GitHub Actions)

### Skip Slow Parts
```bash
# Skip E2E tests (saves ~5 minutes)
./scripts/test-all.sh --skip-e2e

# Skip build verification
./scripts/test-all.sh --skip-build

# Skip security audit
./scripts/test-all.sh --skip-security

# Stop on first failure
./scripts/test-all.sh --bail

# Verbose output
./scripts/test-all.sh --verbose
```

**Example Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PREREQUISITES CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ Checking Node.js version... ✓
▶ Checking npm... ✓
▶ Checking Docker... ✓
▶ Checking Docker Compose... ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DOCKER SERVICES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ Docker services already running... ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  UNIT TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ Backend unit tests with coverage... ✓

... [continues for all steps]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TEST RESULTS SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Steps:   25
Passed:        25
Failed:        0
Duration:      8m 34s

✅ ALL TESTS PASSED
🎉 Ready for deployment!
```

---

## 🔧 Recommended Development Workflows

### Workflow 1: TDD (Test-Driven Development)
```bash
# 1. Start watch mode
./scripts/test-watch.sh unit

# 2. Write failing test
# 3. Write code to pass test
# 4. Refactor
# 5. Repeat

# Before committing:
./scripts/test-quick.sh
```

### Workflow 2: Feature Development
```bash
# 1. Start watch mode for affected service
./scripts/test-watch.sh file backend/src/services/asset.service.test.ts

# 2. Develop feature
# 3. Tests run automatically

# When feature complete:
./scripts/test-quick.sh        # Quick validation
./scripts/test-all.sh --skip-e2e  # Full backend tests

# Before pushing:
./scripts/test-all.sh          # Complete suite
```

### Workflow 3: Bug Fix
```bash
# 1. Reproduce bug with test
./scripts/test-debug.sh "bug-pattern" --bail

# 2. Fix in watch mode
./scripts/test-watch.sh unit

# 3. Verify fix
./scripts/test-debug.sh "bug-pattern"

# 4. Run integration tests
./scripts/test-debug.sh "bug-pattern" --integration

# 5. Full validation
./scripts/test-quick.sh
```

### Workflow 4: Pre-Commit
```bash
# Quick validation before every commit
./scripts/test-quick.sh

# If quick test passes, commit
git add .
git commit -m "Your message"
```

### Workflow 5: Pre-Push
```bash
# Full validation before push
./scripts/test-all.sh --skip-e2e

# If all tests pass, push
git push
```

---

## 🎨 Output Examples

### Success (Green)
```
✅ All checks passed (28s)
Ready to commit!
```

### Failure (Red)
```
❌ 2 check(s) failed (31s)

Fix issues and run:
  ./scripts/test-quick.sh    # Try again
  ./scripts/test-watch.sh    # Interactive mode
  ./scripts/test-all.sh      # Full suite
```

### Watch Mode
```
╔════════════════════════════════════════════════════════════╗
║     🔄 ITERATIVE TEST WATCHER - NZ Water Compliance       ║
╚════════════════════════════════════════════════════════════╝

ℹ Watching unit tests (fastest, no database needed)

Press 'a' to run all tests
Press 'f' to run only failed tests
Press 'p' to filter by file pattern
Press 'q' to quit

Test Suites: 8 passed, 8 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        2.341 s

Ran all test suites related to changed files.

Watch Usage
 › Press a to run all tests.
 › Press f to run only failed tests.
 › Press p to filter by a filename regex pattern.
 › Press t to filter by a test name regex pattern.
 › Press q to quit watch mode.
 › Press Enter to trigger a test run.
```

---

## 🚀 Performance Comparison

| Test Type | GitHub Actions | Local Scripts | Speedup |
|-----------|---------------|---------------|---------|
| Quick validation | 3-4 minutes | 30 seconds | **6-8x** |
| Unit tests only | 2 minutes | 10 seconds | **12x** |
| Integration tests | 5 minutes | 30 seconds | **10x** |
| Full suite (no E2E) | 12 minutes | 3 minutes | **4x** |
| Full suite (with E2E) | 20 minutes | 8 minutes | **2.5x** |
| Watch mode (changed files) | N/A | 2 seconds | **∞** |

**Why faster locally?**
- ✅ No Docker image building
- ✅ Cached node_modules
- ✅ Cached Prisma client
- ✅ Local Docker (no network latency)
- ✅ Watch mode (incremental)
- ✅ Parallel execution

---

## 🔍 Debugging Failing Tests

### Step 1: Identify the failure
```bash
./scripts/test-all.sh --bail
```
Stops on first failure, shows exact error.

### Step 2: Debug specific test
```bash
./scripts/test-debug.sh "failing-test-name" --verbose
```
Shows detailed output for that test only.

### Step 3: Watch mode for iteration
```bash
./scripts/test-watch.sh file path/to/test-file.test.ts
```
Make changes, see results instantly.

### Step 4: Check coverage
```bash
./scripts/test-debug.sh "test-name" --coverage
```
See exactly which code paths are tested.

### Step 5: Integration test if needed
```bash
./scripts/test-debug.sh "test-name" --integration
```
Test with real database if unit test passes but integration fails.

---

## 💡 Pro Tips

### 1. Use Watch Mode Constantly
```bash
# Leave this running in a terminal
./scripts/test-watch.sh unit
```
**Benefit:** Instant feedback on every save (< 2 seconds)

### 2. Filter by Pattern
```bash
# In watch mode, press 'p' then type:
asset.*create

# Only runs tests matching pattern
```
**Benefit:** Focus on what you're working on

### 3. Run Failed Tests First
```bash
# In watch mode, press 'f'
```
**Benefit:** Fix failures quickly

### 4. Quick Pre-Commit Hook
Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
./scripts/test-quick.sh
```
**Benefit:** Never commit broken code

### 5. Parallel Development
```bash
# Terminal 1: Watch tests
./scripts/test-watch.sh unit

# Terminal 2: Run server
cd backend && npm run dev

# Terminal 3: Your editor
code .
```
**Benefit:** See test results while coding

### 6. Test Specific Services
```bash
# Only test asset service
./scripts/test-debug.sh asset

# Only test auth
./scripts/test-debug.sh auth
```
**Benefit:** Faster feedback for focused work

### 7. Use Bail for Quick Fixes
```bash
./scripts/test-all.sh --bail
```
**Benefit:** Don't wait for all tests if one fails

### 8. Skip Slow Tests During Development
```bash
./scripts/test-all.sh --skip-e2e --skip-build
```
**Benefit:** 3 minutes vs 8 minutes

---

## 📊 Test Coverage

### View Coverage Report
```bash
cd backend
npm test -- --coverage
```

**Opens in browser:**
```bash
open backend/coverage/lcov-report/index.html
```

### Coverage Thresholds
Currently configured in `jest.config.js`:
- Lines: 70%
- Branches: 70%
- Functions: 70%
- Statements: 70%

### Check Coverage for Specific File
```bash
./scripts/test-debug.sh asset --coverage
```

---

## 🐳 Docker Management

All scripts automatically manage Docker services, but you can also:

### Manual Control
```bash
# Start services
cd backend && docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f postgres
docker compose logs -f redis

# Reset database
docker compose down -v
docker compose up -d
cd backend && npx prisma migrate deploy
```

### Service Health Checks
```bash
# PostgreSQL
docker exec $(docker ps -q -f name=postgres) pg_isready -U postgres

# Redis
docker exec $(docker ps -q -f name=redis) redis-cli ping
```

---

## ⚙️ Environment Variables

### Required for Tests
```env
# Backend tests
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/compliance_test
REDIS_URL=redis://localhost:6379/1
NODE_ENV=test
JWT_SECRET=test-secret-min-32-chars-long-for-testing

# E2E tests
FRONTEND_URL=http://localhost:3002
BACKEND_URL=http://localhost:3000
```

### Optional for Tests
```env
# Disable Prisma warnings
PRISMA_HIDE_UPDATE_MESSAGE=true

# Speed up Prisma
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=true
```

---

## 📝 Writing Tests

### Unit Test Template
```typescript
// src/__tests__/services/example.service.test.ts
import { exampleService } from '../../services/example.service';

describe('Example Service', () => {
  describe('functionName', () => {
    it('should do expected behavior', () => {
      const result = exampleService.functionName(input);
      expect(result).toBe(expected);
    });

    it('should handle edge case', () => {
      const result = exampleService.functionName(edgeInput);
      expect(result).toThrow();
    });
  });
});
```

### Integration Test Template
```typescript
// tests/integration/example.test.ts
import request from 'supertest';
import { app } from '../../src/server';
import { createTestUser, createTestOrg } from '../test-utils';

describe('Example API', () => {
  let token: string;

  beforeAll(async () => {
    const { accessToken } = await createTestUser();
    token = accessToken;
  });

  it('should create resource', async () => {
    const response = await request(app)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

### E2E Test Template
```typescript
// e2e/example.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Example Flow', () => {
  test('should complete user journey', async ({ page }) => {
    await page.goto('http://localhost:3002');

    await page.click('[data-testid="login-button"]');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
  });
});
```

---

## 🆘 Troubleshooting

### Tests Won't Run
```bash
# Clean everything
cd backend
rm -rf node_modules dist coverage
npm install
npx prisma generate

# Try again
./scripts/test-quick.sh
```

### Database Connection Errors
```bash
# Restart Docker services
cd backend
docker compose down
docker compose up -d

# Wait for services
sleep 5

# Run migrations
npx prisma migrate deploy
```

### Port Already in Use
```bash
# Kill processes on ports 3000, 3002, 5432, 6379
lsof -ti:3000 | xargs kill -9
lsof -ti:3002 | xargs kill -9
lsof -ti:5432 | xargs kill -9
lsof -ti:6379 | xargs kill -9
```

### Playwright Browsers Missing
```bash
npx playwright install chromium firefox
```

### Tests Timeout
```bash
# Increase Jest timeout
npm test -- --testTimeout=30000
```

### Coverage Not Generated
```bash
# Delete old coverage
rm -rf backend/coverage

# Run with coverage
cd backend && npm test -- --coverage
```

---

## 🎯 Next Steps

1. **Start using watch mode** during development
2. **Run quick tests** before every commit
3. **Run full suite** before every push
4. **Add more tests** as you develop features
5. **Aim for 80%+ coverage** on new code

---

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Supertest GitHub](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

---

**Happy Testing! 🧪**
