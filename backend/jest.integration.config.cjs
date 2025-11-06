module.exports = {
  displayName: 'integration',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Integration tests need more time
  testTimeout: 30000,

  // Run tests sequentially to avoid database conflicts
  maxWorkers: 1,

  // Transform TypeScript
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      }
    }]
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts'],

  // Coverage for integration tests
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/config/**',
  ],

  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
