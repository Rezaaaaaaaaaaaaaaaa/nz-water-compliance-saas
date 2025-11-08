# Comprehensive Local Testing Guide

This guide covers the comprehensive local test suite that mirrors GitHub Actions workflows, allowing you to run the same tests locally before pushing to the repository.

## Overview

The comprehensive test suite includes:

- **Prerequisites Check**: Verifies required tools are installed
- **Service Startup**: Starts PostgreSQL and Redis via Docker
- **Dependency Installation**: Installs all required packages
- **Prisma Generation**: Generates database client
- **Lint & Code Quality**: ESLint and Prettier checks
- **Unit Tests**: Jest unit tests with coverage
- **Integration Tests**: API endpoint tests with real database
- **Build Verification**: Ensures both backend and frontend build successfully
- **Security Audit**: npm audit for vulnerabilities
- **Health Check**: Verifies all services are running correctly
- **E2E Tests**: Playwright end-to-end tests (optional)

## Quick Start

### Run Full Test Suite

```bash
# Using npm script (recommended)
npm run test:comprehensive

# Using PowerShell (Windows)
.\test-comprehensive.ps1

# Using Batch (Windows)
.\test-comprehensive.bat

# Using Node.js (cross-platform)
node tools/test-comprehensive.js
```

### Run Quick Tests (Skip builds and E2E)

```bash
npm run test:comprehensive:quick

# Or
.\test-comprehensive.ps1 -Quick
node tools/test-comprehensive.js --quick
```

### Run Specific Test Suites

```bash
# Unit tests only
npm run test:unit
node tools/test-comprehensive.js --unit

# Integration tests only
node tools/test-comprehensive.js --integration

# Build verification only
npm run test:build
node tools/test-comprehensive.js --build

# Security audit only
npm run test:security
node tools/test-comprehensive.js --security

# E2E tests only
node tools/test-comprehensive.js --e2e
```

### Watch Mode (Unit Tests)

```bash
npm run test:comprehensive:watch

# Or
.\test-comprehensive.ps1 -Watch
node tools/test-comprehensive.js --watch
```

## Available Scripts

### Windows Scripts

#### PowerShell Script (`test-comprehensive.ps1`)

**Features:**
- Color-coded output
- Detailed test results table
- Progress tracking
- Comprehensive logging
- Test duration tracking

**Usage:**
```powershell
# Full test suite
.\test-comprehensive.ps1

# Quick tests
.\test-comprehensive.ps1 -Quick

# Skip E2E tests
.\test-comprehensive.ps1 -SkipE2E

# Watch mode
.\test-comprehensive.ps1 -Unit -Watch

# Iterative mode with progress updates
.\test-comprehensive.ps1 -Iterative

# Verbose output
.\test-comprehensive.ps1 -Verbose

# Help
.\test-comprehensive.ps1 -Help
```

#### Batch Script (`test-comprehensive.bat`)

**Features:**
- Compatible with older Windows systems
- Color-coded output via PowerShell
- Comprehensive logging
- Interactive E2E prompts

**Usage:**
```cmd
# Full test suite
test-comprehensive.bat

# Quick tests
test-comprehensive.bat --quick

# Skip E2E tests
test-comprehensive.bat --skip-e2e

# Watch mode
test-comprehensive.bat --unit --watch

# Help
test-comprehensive.bat --help
```

### Cross-Platform Script

#### Node.js Script (`tools/test-comprehensive.js`)

**Features:**
- Cross-platform (Windows, macOS, Linux)
- JSON-based test results
- Detailed coverage reporting
- Iterative progress updates
- NPM integration

**Usage:**
```bash
# Full test suite
node tools/test-comprehensive.js

# Quick tests
node tools/test-comprehensive.js --quick

# Specific suites
node tools/test-comprehensive.js --unit
node tools/test-comprehensive.js --integration
node tools/test-comprehensive.js --e2e
node tools/test-comprehensive.js --build
node tools/test-comprehensive.js --security

# Skip E2E
node tools/test-comprehensive.js --skip-e2e

# Watch mode
node tools/test-comprehensive.js --unit --watch

# Iterative mode
node tools/test-comprehensive.js --iterative

# Verbose output
node tools/test-comprehensive.js --verbose

# Help
node tools/test-comprehensive.js --help
```

## Test Execution Flow

### Full Test Suite (`--full` or no arguments)

1. **Prerequisites Check** (10s)
   - Verify Node.js, npm, Docker installed
   - Check .env file exists

2. **Service Startup** (15s)
   - Start PostgreSQL and Redis via Docker Compose
   - Wait for services to be ready

3. **Dependency Installation** (30-60s)
   - Install backend dependencies
   - Install frontend dependencies (if not skipping E2E)

4. **Prisma Generation** (5s)
   - Generate Prisma client for database access

5. **Lint & Code Quality** (10s)
   - Run ESLint on backend code
   - Run Prettier format check

6. **Unit Tests** (20-30s)
   - Run Jest unit tests with coverage
   - Display coverage summary (lines, branches, functions)

7. **Integration Tests** (30-45s)
   - Setup test database
   - Run API integration tests with real database

8. **Build Verification** (60-120s)
   - Build backend TypeScript to JavaScript
   - Build frontend Next.js application

9. **Security Audit** (15s)
   - Run npm audit on backend
   - Run npm audit on frontend

10. **Health Check** (10s)
    - Verify backend API responds
    - Check database connectivity
    - Check Redis connectivity

11. **E2E Tests** (3-5 minutes, optional)
    - Run Playwright tests in Chromium
    - Test critical user journeys

**Total Time:** 5-10 minutes (full), 1-2 minutes (quick)

### Quick Test Suite (`--quick`)

Runs only essential tests:
1. Prerequisites Check
2. Dependency Installation
3. Prisma Generation
4. Unit Tests

**Total Time:** 1-2 minutes

## Test Results

### Log Files

Every test run creates a timestamped log file:
```
test-results-20250108-143052.log
```

Contains:
- All command outputs
- Test results
- Error messages
- Warnings
- Timing information

### Console Output

Color-coded console output:
- **Green**: Successful steps
- **Red**: Failed steps
- **Yellow**: Warnings
- **Cyan**: Information

### Test Summary

At the end of each run, you'll see:

```
============================================================================
  TEST SUMMARY
============================================================================

  Test Results:

  Name                    Status    Duration      Details
  ----------------------  --------  ------------  ------------------
  Backend Dependencies    Success   1234ms
  Prisma Generation       Success   567ms
  Unit Tests              Success   23456ms       Coverage: 85.2%
  Integration Tests       Success   34567ms
  Backend Build           Success   45678ms
  Security Audit          Warning   2345ms        Vulnerabilities detected

  Statistics:
    Total Test Suites: 8
    Failed: 0
    Duration: 127.45s

  Status: ALL TESTS PASSED!
  Ready for deployment

============================================================================
```

## Prerequisites

### Required

- **Node.js 20+**: `node --version`
- **npm 10+**: `npm --version`
- **Git**: `git --version`

### Optional (but recommended)

- **Docker**: For running PostgreSQL and Redis
  - If not using Docker, ensure PostgreSQL and Redis are running manually

### Environment Variables

Create `.env` file in `backend/`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/compliance_test
REDIS_URL=redis://localhost:6379/1
JWT_SECRET=test-secret-key
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=us-east-1
```

## Troubleshooting

### Docker Services Won't Start

```bash
# Check if Docker is running
docker ps

# Manually start services
docker compose up -d postgres redis

# Check service logs
docker compose logs postgres
docker compose logs redis
```

### Tests Fail Due to Port Conflicts

```bash
# Check what's using ports 5432 (PostgreSQL) and 6379 (Redis)
# Windows
netstat -ano | findstr :5432
netstat -ano | findstr :6379

# Kill processes or change ports in docker-compose.yml
```

### Prisma Generation Fails

```bash
# Clear Prisma cache
cd backend
rm -rf node_modules/.prisma
npx prisma generate
```

### Unit Tests Fail

```bash
# Clear Jest cache
cd backend
npx jest --clearCache

# Run tests with verbose output
npm test -- --verbose
```

### Build Fails

```bash
# Clear build artifacts
rm -rf backend/dist
rm -rf frontend/.next

# Reinstall dependencies
cd backend && npm install
cd ../frontend && npm install
```

### E2E Tests Timeout

Ensure services are running:

```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start frontend
cd frontend && npm run dev

# Terminal 3: Run E2E tests
npx playwright test
```

## CI/CD Integration

The local test suite mirrors GitHub Actions workflows:

### GitHub Actions Workflow

`.github/workflows/test.yml` runs on every push and PR:

1. Lint & Code Quality
2. Unit Tests (with coverage upload)
3. Integration Tests (with PostgreSQL & Redis services)
4. Build Verification
5. E2E Tests (with Playwright)
6. Security Check
7. Health Check

### Pre-Push Hook

Add to `.git/hooks/pre-push`:

```bash
#!/bin/bash

echo "Running comprehensive tests before push..."
npm run test:comprehensive:quick

if [ $? -ne 0 ]; then
  echo "Tests failed. Push aborted."
  exit 1
fi
```

Make it executable:
```bash
chmod +x .git/hooks/pre-push
```

## Best Practices

### Before Committing

Run quick tests to catch obvious issues:
```bash
npm run test:comprehensive:quick
```

### Before Creating PR

Run full test suite except E2E:
```bash
npm run test:comprehensive:skip-e2e
```

### Before Merging to Main

Run complete test suite including E2E:
```bash
npm run test:comprehensive
```

### During Development

Use watch mode for rapid feedback:
```bash
npm run test:comprehensive:watch
```

## Performance Benchmarks

Expected execution times on typical development machine:

| Test Suite           | Time    | Can Skip? |
|---------------------|---------|-----------|
| Prerequisites       | 10s     | No        |
| Service Startup     | 15s     | Sometimes |
| Dependencies        | 60s     | Sometimes |
| Prisma Generation   | 5s      | No        |
| Lint & Format       | 10s     | Yes       |
| Unit Tests          | 30s     | No        |
| Integration Tests   | 45s     | Sometimes |
| Backend Build       | 60s     | Sometimes |
| Frontend Build      | 120s    | Yes       |
| Security Audit      | 15s     | Yes       |
| Health Check        | 10s     | Yes       |
| E2E Tests           | 300s    | Yes       |

**Full Suite:** ~10 minutes
**Quick Suite:** ~2 minutes
**Watch Mode:** Instant feedback

## Advanced Usage

### Parallel Test Execution

For faster execution on multi-core systems:

```bash
# Run unit and integration tests in parallel
node tools/test-comprehensive.js --unit & \
node tools/test-comprehensive.js --integration &
wait
```

### Custom Test Combinations

```bash
# Lint + Unit + Build only
.\test-comprehensive.ps1 -Quick
node tools/test-comprehensive.js --build

# Security-focused testing
node tools/test-comprehensive.js --security
npm audit fix
node tools/test-comprehensive.js --security
```

### Continuous Testing

```bash
# Re-run tests on file changes (using nodemon)
npx nodemon --exec "npm run test:comprehensive:quick" --watch backend/src
```

### Docker-less Testing

If Docker is not available:

```bash
# Start PostgreSQL and Redis manually
# Then run tests with --skip-e2e
node tools/test-comprehensive.js --skip-e2e
```

## Comparison with GitHub Actions

| Feature                  | Local Script | GitHub Actions |
|-------------------------|--------------|----------------|
| Lint & Code Quality     | ✅            | ✅              |
| Unit Tests              | ✅            | ✅              |
| Integration Tests       | ✅            | ✅              |
| Build Verification      | ✅            | ✅              |
| E2E Tests               | ✅            | ✅              |
| Security Audit          | ✅            | ✅              |
| Health Check            | ✅            | ✅              |
| Coverage Upload         | ❌            | ✅              |
| PR Comments             | ❌            | ✅              |
| Artifacts Upload        | ❌            | ✅              |
| Multi-browser Testing   | ❌ (Chromium) | ✅ (Chrome, FF) |
| Execution Time          | ~10 min      | ~15 min        |
| Cost                    | Free         | Free (Actions) |

## Integration with IDEs

### VS Code

Add to `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Run Comprehensive Tests",
      "type": "shell",
      "command": "npm run test:comprehensive:quick",
      "problemMatcher": [],
      "group": {
        "kind": "test",
        "isDefault": true
      }
    }
  ]
}
```

Run with: `Ctrl+Shift+B` (Windows/Linux) or `Cmd+Shift+B` (macOS)

### JetBrains IDEs (WebStorm, IntelliJ)

1. Go to Run → Edit Configurations
2. Add new "npm" configuration
3. Command: `run`
4. Scripts: `test:comprehensive:quick`

## Support and Documentation

- **Main Testing Guide**: `docs/TESTING.md`
- **GitHub Actions**: `.github/workflows/test.yml`
- **Script Help**: Run any script with `--help` flag
- **Issue Reporting**: Create issue with test logs attached

## Changelog

### v1.0.0 (2025-11-08)
- Initial release of comprehensive test suite
- Support for Windows (PowerShell, Batch) and cross-platform (Node.js)
- Iterative testing with detailed progress reporting
- Mirrors GitHub Actions workflow
- Test result logging and summaries
- Watch mode support
- Flexible test suite selection

---

**Last Updated**: 2025-11-08
**Maintainer**: Development Team
