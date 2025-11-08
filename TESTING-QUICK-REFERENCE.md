# Comprehensive Testing - Quick Reference

> **TL;DR**: Run `npm run test:comprehensive:quick` before committing, and `npm run test:comprehensive` before creating a PR.

## Quick Commands

### Most Common

```bash
# Quick test (2 minutes) - Run before commits
npm run test:comprehensive:quick

# Full test without E2E (5 minutes) - Run before PRs
npm run test:comprehensive:skip-e2e

# Full test with E2E (10 minutes) - Run before merging to main
npm run test:comprehensive
```

### Specific Tests

```bash
# Unit tests only
npm run test:unit

# Integration tests only
node tools/test-comprehensive.js --integration

# Build verification
npm run test:build

# Security audit
npm run test:security

# Watch mode (instant feedback)
npm run test:comprehensive:watch
```

## Platform-Specific

### Windows PowerShell (Recommended)

```powershell
# Quick test
.\test-comprehensive.ps1 -Quick

# Full test
.\test-comprehensive.ps1

# Skip E2E
.\test-comprehensive.ps1 -SkipE2E

# Watch mode
.\test-comprehensive.ps1 -Unit -Watch
```

### Windows Command Prompt

```cmd
# Quick test
test-comprehensive.bat --quick

# Full test
test-comprehensive.bat

# Skip E2E
test-comprehensive.bat --skip-e2e
```

### Cross-Platform (macOS/Linux/Windows)

```bash
# Quick test
node tools/test-comprehensive.js --quick

# Full test
node tools/test-comprehensive.js

# Skip E2E
node tools/test-comprehensive.js --skip-e2e
```

## What Gets Tested

| Test Suite           | Quick | Skip E2E | Full | Time   |
|---------------------|-------|----------|------|--------|
| Prerequisites       | ✅     | ✅        | ✅    | 10s    |
| Dependencies        | ✅     | ✅        | ✅    | 60s    |
| Prisma Generation   | ✅     | ✅        | ✅    | 5s     |
| Lint & Format       | ❌     | ✅        | ✅    | 10s    |
| Unit Tests          | ✅     | ✅        | ✅    | 30s    |
| Integration Tests   | ❌     | ✅        | ✅    | 45s    |
| Backend Build       | ❌     | ✅        | ✅    | 60s    |
| Frontend Build      | ❌     | ❌        | ✅    | 120s   |
| Security Audit      | ❌     | ✅        | ✅    | 15s    |
| Health Check        | ❌     | ✅        | ✅    | 10s    |
| E2E Tests           | ❌     | ❌        | ✅    | 300s   |
| **Total Time**      | ~2min | ~5min    | ~10min|        |

## Test Output

### Success
```
============================================================================
  TEST SUMMARY
============================================================================

  Statistics:
    Total Test Suites: 8
    Failed: 0
    Duration: 127.45s

  Status: ALL TESTS PASSED!
  Ready for deployment
```

### Failure
```
============================================================================
  TEST SUMMARY
============================================================================

  Statistics:
    Total Test Suites: 8
    Failed: 2
    Duration: 89.32s

  Status: SOME TESTS FAILED
  Please review the log file: test-results-20250108-143052.log
```

## Common Issues

### Docker Services Won't Start
```bash
docker compose up -d postgres redis
```

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5432
netstat -ano | findstr :6379

# Kill process using the port (replace PID)
taskkill /PID <PID> /F
```

### Tests Fail After Git Pull
```bash
# Reinstall dependencies
cd backend && npm install
cd ../frontend && npm install

# Regenerate Prisma
cd backend && npx prisma generate
```

### Coverage Too Low
```bash
# See detailed coverage report
cd backend
npm test -- --coverage
open coverage/lcov-report/index.html
```

## Development Workflow

### 1. Daily Development
```bash
# Watch mode for instant feedback
npm run test:comprehensive:watch
```

### 2. Before Commit
```bash
# Quick validation (2 minutes)
npm run test:comprehensive:quick
```

### 3. Before PR
```bash
# Comprehensive validation (5 minutes)
npm run test:comprehensive:skip-e2e
```

### 4. Before Merge to Main
```bash
# Full validation including E2E (10 minutes)
npm run test:comprehensive
```

## Help & Documentation

- **Detailed Guide**: `docs/COMPREHENSIVE-TESTING.md`
- **Testing Docs**: `docs/TESTING.md`
- **GitHub Actions**: `.github/workflows/test.yml`

### Get Help

```bash
# Node.js script
node tools/test-comprehensive.js --help

# PowerShell script
.\test-comprehensive.ps1 -Help

# Batch script
test-comprehensive.bat --help
```

## Log Files

Each test run creates a timestamped log file:
```
test-results-20250108-143052.log
```

Check this file for detailed error messages and stack traces.

## Quick Troubleshooting

1. **Clear everything and rebuild**
   ```bash
   npm run clean
   npm run install:all
   npm run test:comprehensive:quick
   ```

2. **Reset Docker services**
   ```bash
   docker compose down
   docker compose up -d postgres redis
   ```

3. **Clear test database**
   ```bash
   cd backend
   npx prisma migrate reset --skip-generate
   ```

4. **Check service health**
   ```bash
   npm run health:check
   ```

## CI/CD Integration

This local test suite mirrors GitHub Actions:

- **Local Quick Test** ≈ GitHub Actions "Lint + Unit Tests"
- **Local Skip E2E** ≈ GitHub Actions "All except E2E"
- **Local Full Test** ≈ Complete GitHub Actions workflow

Run locally before pushing to save CI time and catch issues early!

---

**Need more details?** See `docs/COMPREHENSIVE-TESTING.md`

**Found a bug?** Check the log file and create an issue with relevant details
