/**
 * Test Setup
 *
 * Global test configuration and setup
 */

import { jest } from '@jest/globals';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    organization: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    asset: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    document: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    compliancePlan: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    report: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  })),
  UserRole: {
    SYSTEM_ADMIN: 'SYSTEM_ADMIN',
    AUDITOR: 'AUDITOR',
    COMPLIANCE_MANAGER: 'COMPLIANCE_MANAGER',
    OPERATOR: 'OPERATOR',
    VIEWER: 'VIEWER',
  },
  AssetType: {
    TREATMENT_PLANT: 'TREATMENT_PLANT',
    RESERVOIR: 'RESERVOIR',
    PUMP_STATION: 'PUMP_STATION',
    PIPELINE: 'PIPELINE',
    BORE: 'BORE',
    OTHER: 'OTHER',
  },
  AssetCondition: {
    EXCELLENT: 'EXCELLENT',
    GOOD: 'GOOD',
    FAIR: 'FAIR',
    POOR: 'POOR',
    VERY_POOR: 'VERY_POOR',
  },
  RiskLevel: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  },
  DocumentType: {
    DWSP: 'DWSP',
    POLICY: 'POLICY',
    PROCEDURE: 'PROCEDURE',
    REPORT: 'REPORT',
    CERTIFICATE: 'CERTIFICATE',
    INSPECTION: 'INSPECTION',
    TEST_RESULT: 'TEST_RESULT',
    OTHER: 'OTHER',
  },
  ReportType: {
    MONTHLY: 'MONTHLY',
    QUARTERLY: 'QUARTERLY',
    ANNUAL: 'ANNUAL',
    CUSTOM: 'CUSTOM',
  },
  ReportStatus: {
    DRAFT: 'DRAFT',
    SUBMITTED: 'SUBMITTED',
  },
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Increase timeout for async operations
jest.setTimeout(10000);
