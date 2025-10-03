/**
 * Jest Test Setup
 *
 * Global setup for all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-minimum-32-chars';
process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/compliance_saas_test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.LOG_LEVEL = 'silent';

// Increase test timeout for integration tests
jest.setTimeout(10000);

// Mock console methods to reduce test noise
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Global teardown
afterAll(async () => {
  // Clean up any open handles
  await new Promise((resolve) => setTimeout(resolve, 500));
});
