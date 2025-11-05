# Testing Guide

Complete guide to testing the NZ Water Compliance SaaS application.

## Overview

This project includes three layers of automated testing:
- **Unit Tests**: Test individual functions using Jest
- **Integration Tests**: Test API endpoints using Supertest
- **E2E Tests**: Test user journeys using Playwright

## Quick Start

### Run All Tests
```bash
# Backend unit + integration tests
cd backend && npm run test:all

# E2E tests (requires running services)
npm run test:e2e

# Full suite
npm run test:full
```

### Run Specific Tests
```bash
# Unit tests only
cd backend && npm test

# Integration tests only
cd backend && npm run test:integration

# E2E tests
npx playwright test

# Watch mode
cd backend && npm run test:watch

# With coverage
cd backend && npm run test:coverage
```

## Unit Tests

Located in: `backend/src/**/*.test.ts`

### Running
```bash
cd backend
npm test                    # Run once
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

### Writing Unit Tests
```typescript
describe('MyFunction', () => {
  it('should return expected value', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

## Integration Tests

Located in: `backend/tests/integration/`

Tests API endpoints against a real database in test mode.

### Setup
```bash
cd backend
npm run test:integration
```

### Key Files
- `auth.test.ts` - Authentication endpoints
- `assets.test.ts` - Asset CRUD operations
- `compliance.test.ts` - DWSP compliance features
- `documents.test.ts` - Document upload/management
- `analytics.test.ts` - Analytics and reporting

### Environment Variables
```bash
# Create .env.test file
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/compliance_test
REDIS_URL=redis://localhost:6379/1
JWT_SECRET=test-secret-key
```

### Writing Integration Tests
```typescript
describe('Assets API', () => {
  let token: string;

  beforeAll(async () => {
    // Setup
    const user = await testUtils.createTestUser();
    token = generateTestToken(user.id);
  });

  it('should create asset', async () => {
    const response = await request(app.server)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Asset' });

    expect(response.status).toBe(201);
  });

  afterAll(async () => {
    await testUtils.cleanupTestData();
  });
});
```

## End-to-End Tests

Located in: `tests/e2e/`

Tests real user workflows in browsers.

### Prerequisites
- Backend running on http://localhost:3000
- Frontend running on http://localhost:3002
- Services: PostgreSQL, Redis

### Running
```bash
# Run all browsers
npx playwright test

# Run single browser
npx playwright test --project=chromium

# Run with UI
npx playwright test --ui

# Run single file
npx playwright test tests/e2e/auth.spec.ts

# Debug mode
npx playwright test --debug
```

### Writing E2E Tests
```typescript
import { test, expect } from './fixtures/auth.fixture';

test('should login and view dashboard', async ({ authenticatedPage }) => {
  // authenticatedPage is pre-authenticated
  await authenticatedPage.goto('/dashboard');

  await expect(authenticatedPage.locator('text=Dashboard')).toBeVisible();
});
```

### Available Fixtures
- `authenticatedPage` - Pre-logged in user
- `adminPage` - Pre-logged in admin user
- Helper functions: `loginUser()`, `logoutUser()`, `isAuthenticated()`

## Health Monitoring

Monitor all services are running properly.

```bash
# Continuous monitoring (every 30s)
cd backend && npm run health:monitor

# Single check
cd backend && npm run health:check-once
```

Checks:
- Backend API
- PostgreSQL Database
- Redis Cache
- Frontend Application
- AWS S3 Storage

## Test Data

Located in: `backend/tests/helpers/test-utils.ts`

Utility functions for test data:
```typescript
import * as testUtils from '../helpers/test-utils';

// Create test user
const user = await testUtils.createTestUser();

// Create test assets
const assets = await testUtils.createTestAssets(organizationId, 5);

// Create test DWSP
const dwsp = await testUtils.createTestDWSP(organizationId);

// Cleanup
await testUtils.cleanupTestData();
```

## Coverage Requirements

- **Minimum**: 80% code coverage
- **Target**: 90% code coverage

View coverage report:
```bash
cd backend
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

## CI/CD Pipeline

### GitHub Actions Workflows

#### Test Workflow (.github/workflows/test.yml)
Runs on every push and pull request:
1. Lint code
2. Run unit tests
3. Run integration tests
4. Build applications
5. Run E2E tests

#### Security Workflow (.github/workflows/security.yml)
Runs weekly and on push to main:
1. npm audit
2. Snyk vulnerability scan
3. Dependency checks

## Best Practices

### Unit Tests
- ✅ Test edge cases and error conditions
- ✅ Mock external dependencies
- ✅ Use descriptive test names
- ❌ Don't test implementation details
- ❌ Don't make external API calls

### Integration Tests
- ✅ Test realistic scenarios
- ✅ Use test database
- ✅ Clean up data after each test
- ✅ Test error responses
- ❌ Don't modify production data
- ❌ Don't skip authentication tests

### E2E Tests
- ✅ Test critical user journeys
- ✅ Use stable selectors (data-testid)
- ✅ Wait for elements properly
- ✅ Test across browsers
- ❌ Don't test everything (too slow)
- ❌ Don't hardcode delays

## Troubleshooting

### Integration Tests Failing
```bash
# Check database connection
psql postgresql://localhost/compliance_test

# Reset test database
npm run prisma:migrate -- --reset --skip-generate

# Check Redis
redis-cli ping
```

### E2E Tests Timing Out
```bash
# Increase timeout in playwright.config.ts
timeout: 60 * 1000

# Run single test in debug mode
npx playwright test --debug tests/e2e/auth.spec.ts
```

### Tests Pass Locally but Fail in CI
- Check environment variables
- Verify database/Redis available
- Check port availability
- Review logs in GitHub Actions

## Common Commands

```bash
# Run everything
npm run test:full

# Development workflow
npm run test:all -- --watch

# Before committing
npm run lint && npm run test:all

# Full CI simulation
npm run test:full && npm run health:check

# Generate coverage badge
npx coverage-badge -o coverage.svg
```

## Test Reporting

Reports are generated in:
- Unit tests: `backend/coverage/`
- Integration tests: `backend/coverage/` (merged)
- E2E tests: `playwright-report/`
- CI artifacts: GitHub Actions

Access E2E report:
```bash
npx playwright show-report
```

## Performance Benchmarks

- Unit tests: < 10 seconds
- Integration tests: < 30 seconds
- E2E tests: < 5 minutes
- Health check: < 10 seconds

## Security Testing

- ✅ Authentication required for protected endpoints
- ✅ Authorization checks per resource
- ✅ Input validation on all forms
- ✅ CORS headers correct
- ✅ No sensitive data in logs

## Next Steps

1. **Add more E2E tests** for critical workflows
2. **Implement visual regression testing**
3. **Add performance testing** with k6
4. **Setup Codecov** for coverage tracking
5. **Add Slack notifications** for CI failures

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Playwright Documentation](https://playwright.dev/)
- [GitHub Actions](https://docs.github.com/en/actions)

## Support

For testing issues, check:
1. `backend/logs/` - Application logs
2. `playwright-report/` - E2E test reports
3. GitHub Actions runs for CI logs

---

**Last Updated**: November 2025
