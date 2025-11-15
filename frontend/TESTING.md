# Frontend Testing Infrastructure

This document describes the test infrastructure setup for the NZ Water Compliance SaaS frontend application.

## Overview

The frontend now has a comprehensive testing infrastructure using:
- **Jest** - Test framework
- **React Testing Library** - Component testing utilities
- **TypeScript** - Type-safe test authoring
- **Next.js Jest Configuration** - Optimized for Next.js 15

## Test Configuration

### Files Created

1. **jest.config.js** - Main Jest configuration
   - TypeScript support via Next.js preset
   - Module path aliases (@/...)
   - Coverage reporting configuration
   - CSS and image mocking
   - React 19 compatibility fixes

2. **jest.setup.js** - Test environment setup
   - Testing Library DOM matchers
   - Next.js router mocking
   - Browser API mocks (matchMedia, IntersectionObserver, etc.)
   - localStorage mocking

3. **__mocks__/** - Mock files directory
   - styleMock.js - CSS import mocking
   - fileMock.js - Image import mocking
   - react-dom-test-utils.js - React 19 compatibility

## Running Tests

### Available Scripts

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (optimized for GitHub Actions)
npm run test:ci
```

## Test Examples

### 1. API Client Tests
**Location:** `lib/__tests__/api.test.ts`

Tests the custom APIError class:
- Error creation with status and message
- Error details handling
- HTTP status code support
- Error inheritance

**Example Output:**
```
PASS lib/__tests__/api.test.ts
  API Client
    APIError class
      ✓ creates error with status and message (5 ms)
      ✓ creates error with details (1 ms)
      ✓ extends Error class correctly
      ✓ has correct error name (1 ms)
      ✓ supports different HTTP status codes
      ✓ can be caught and handled like standard errors (6 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

### 2. Button Component Tests
**Location:** `components/ui/__tests__/Button.test.tsx`

Comprehensive tests for the Button UI component:
- Rendering with children
- All variant styles (primary, secondary, danger, ghost, outline)
- All sizes (sm, md, lg)
- Click event handling
- Disabled state
- Loading state with spinner
- Left and right icons
- Custom className handling
- Ref forwarding
- HTML attributes

### 3. Login Page Tests
**Location:** `app/login/__tests__/page.test.tsx`

Tests for the login page functionality:
- Form rendering
- Logo and branding display
- Form field validation
- Successful login flow
- Error handling
- Submit button states
- Navigation to registration

### 4. Dashboard Page Tests
**Location:** `app/dashboard/__tests__/page.test.tsx`

Tests for the dashboard page:
- Loading state display
- Welcome message with user name
- Statistics loading and display
- API integration
- Quick action links
- Error handling

## Coverage Reporting

Coverage is configured to track:
- `app/**` - All application pages
- `components/**` - All React components
- `lib/**` - Utility functions and API clients
- `contexts/**` - React contexts

### Current Coverage

```
File                | % Stmts | % Branch | % Funcs | % Lines
--------------------|---------|----------|---------|--------
lib/api.ts          |    9.72 |     6.89 |    1.47 |   10.34
```

Coverage reports are generated in the `coverage/` directory and can be viewed in HTML format.

## GitHub Actions Integration

The CI workflow (`.github/workflows/frontend-ci.yml`) automatically:
1. Runs linter
2. Performs type checking
3. Executes all unit tests with coverage
4. Uploads coverage reports as artifacts

## Known Issues & Workarounds

### React 19 Compatibility

The project uses React 19, which removed `react-dom/test-utils`. We've implemented:
- Custom mock for `react-dom/test-utils` in `__mocks__/react-dom-test-utils.js`
- Module name mapper in Jest config to resolve the compatibility issue

### Workspace/Monorepo Setup

Due to the workspace structure with both root and frontend package.json:
- Some React packages are installed in root `node_modules`
- Testing Library packages are installed in root
- This is handled via Jest's module resolution and Next.js preset

### Testing Library Version

We're using:
- `@testing-library/react@16.3.0` (supports React 19)
- `@testing-library/jest-dom@6.9.1`
- `@testing-library/user-event@14.6.1`
- `@testing-library/dom@10.4.0`

## Writing New Tests

### Component Test Template

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<MyComponent onClick={onClick} />);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

### Mocking APIs

```typescript
jest.mock('@/lib/api', () => ({
  authApi: {
    login: jest.fn(),
  },
}));

// In test
import * as api from '@/lib/api';
jest.spyOn(api.authApi, 'login').mockResolvedValue({ token: 'abc' });
```

### Mocking Next.js Router

The router is already mocked in `jest.setup.js`. To override:

```typescript
import { useRouter } from 'next/navigation';

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
  pathname: '/test',
  // ... other router properties
});
```

## Best Practices

1. **Test User Behavior** - Test what users see and do, not implementation details
2. **Use Semantic Queries** - Prefer `getByRole` > `getByLabelText` > `getByText` > `getByTestId`
3. **Async Testing** - Always use `await waitFor()` for async operations
4. **Mock External Dependencies** - Mock APIs, timers, and browser APIs
5. **Keep Tests Isolated** - Each test should be independent
6. **Descriptive Test Names** - Use clear, behavior-focused test names

## Future Improvements

1. Add integration tests for complete user flows
2. Implement visual regression testing
3. Add performance testing
4. Increase coverage to target thresholds:
   - Statements: 80%
   - Branches: 75%
   - Functions: 80%
   - Lines: 80%
5. Add E2E tests with Playwright (already configured)
6. Set up test database for integration tests
7. Implement snapshot testing for complex components

## Troubleshooting

### Tests not finding modules

Check that module aliases in `jest.config.js` match `tsconfig.json`:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

### React hooks errors

Make sure components are wrapped in appropriate providers (Auth, Query, etc.)

### Async test failures

Always use `await waitFor()` and increase timeout if needed:
```typescript
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
}, { timeout: 5000 });
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Next.js Testing](https://nextjs.org/docs/testing)
