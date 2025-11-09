/**
 * Test Utilities and Helpers
 * Provides reusable functions for integration tests
 */

import { PrismaClient, UserRole, OrganizationType, AssetType, CompliancePlanType, CompliancePlanStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Generate a valid JWT token for testing
 */
export function generateTestToken(
  userId: string = uuidv4(),
  organizationId: string = uuidv4(),
  role: string = 'ADMIN',
  expiresIn: number = 3600 // 1 hour
): { token: string; userId: string; organizationId: string } {
  const payload = {
    userId,
    organizationId,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  };

  // Use the same JWT secret as the server for testing
  const secret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-integration-tests-32chars';

  // Create properly signed JWT token
  const header = { alg: 'HS256', typ: 'JWT' };

  // Base64URL encode header and payload
  const base64UrlEncode = (str: string) => {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  // Create HMAC-SHA256 signature
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const token = `${encodedHeader}.${encodedPayload}.${signature}`;

  return { token, userId, organizationId };
}

/**
 * Create a test user with organization
 */
export async function createTestUser(
  email: string = `test-${Date.now()}@example.com`,
  password: string = 'Test@123456'
) {
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create organization
  const organization = await prisma.organization.create({
    data: {
      name: `Test Org ${Date.now()}`,
      type: OrganizationType.COUNCIL,
      region: 'Auckland',
      contactEmail: email,
    },
  });

  // Create user
  const user = await prisma.user.create({
    data: {
      id: uuidv4(),
      email,
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      organizationId: organization.id,
      role: UserRole.ORG_ADMIN,
      isActive: true,
    },
  });

  return {
    user,
    organization,
    password, // Return plain password for login tests
  };
}

/**
 * Create multiple test users
 */
export async function createTestUsers(count: number = 3) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const userData = await createTestUser(
      `test-user-${i}-${Date.now()}@example.com`
    );
    users.push(userData);
  }
  return users;
}

/**
 * Create a test asset
 */
export async function createTestAsset(
  organizationId: string,
  overrides: any = {}
) {
  return prisma.asset.create({
    data: {
      id: uuidv4(),
      name: `Test Asset ${Date.now()}`,
      type: AssetType.WATER_TREATMENT_PLANT,
      location: 'Auckland, NZ',
      organizationId,
      ...overrides,
    },
  });
}

/**
 * Create test assets
 */
export async function createTestAssets(
  organizationId: string,
  count: number = 3
) {
  const assets = [];
  const assetTypes = [
    AssetType.WATER_TREATMENT_PLANT,
    AssetType.RESERVOIR,
    AssetType.PUMP_STATION,
    AssetType.PIPELINE
  ];

  for (let i = 0; i < count; i++) {
    const asset = await createTestAsset(organizationId, {
      name: `Test Asset ${i} ${Date.now()}`,
      type: assetTypes[i % assetTypes.length],
    });
    assets.push(asset);
  }
  return assets;
}

/**
 * Create a test DWSP (Drinking Water Safety Plan)
 */
export async function createTestDWSP(
  organizationId: string,
  overrides: any = {}
) {
  return prisma.compliancePlan.create({
    data: {
      id: uuidv4(),
      planType: CompliancePlanType.DWSP,
      title: `Test DWSP ${Date.now()}`,
      description: 'Test drinking water safety plan',
      organizationId,
      status: CompliancePlanStatus.DRAFT,
      version: '1.0',
      ...overrides,
    },
  });
}

/**
 * Create test documents
 */
export async function createTestDocument(
  organizationId: string,
  overrides: any = {}
) {
  const timestamp = Date.now();
  return prisma.document.create({
    data: {
      id: uuidv4(),
      title: `Test Document ${timestamp}`,
      fileName: `Test Document ${timestamp}.pdf`,
      fileType: 'application/pdf',
      fileSize: 102400,
      fileKey: `test-documents/${uuidv4()}.pdf`,
      documentType: 'COMPLIANCE_REPORT',
      organizationId,
      createdById: uuidv4(),
      ...overrides,
    },
  });
}

/**
 * Seed database with test data
 */
export async function seedTestData() {
  const organization = await prisma.organization.create({
    data: {
      id: uuidv4(),
      name: 'Test Organization',
      type: OrganizationType.COUNCIL,
      region: 'Auckland',
      contactEmail: 'seed-org@example.com',
    },
  });

  const user = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'seed-user@example.com',
      password: await bcrypt.hash('SeedPassword@123', 10),
      firstName: 'Seed',
      lastName: 'User',
      organizationId: organization.id,
      role: UserRole.ORG_ADMIN,
      isActive: true,
    },
  });

  // Create some assets
  const assets = [];
  const assetTypesForSeed = [
    AssetType.WATER_TREATMENT_PLANT,
    AssetType.RESERVOIR,
    AssetType.PUMP_STATION
  ];
  for (let i = 0; i < 3; i++) {
    const asset = await prisma.asset.create({
      data: {
        id: uuidv4(),
        name: `Seed Asset ${i + 1}`,
        type: assetTypesForSeed[i],
        location: 'Auckland, NZ',
        organizationId: organization.id,
      },
    });
    assets.push(asset);
  }

  // Create a DWSP
  const dwsp = await prisma.compliancePlan.create({
    data: {
      id: uuidv4(),
      planType: CompliancePlanType.DWSP,
      title: 'Seed DWSP',
      description: 'Seeded test DWSP',
      organizationId: organization.id,
      status: CompliancePlanStatus.APPROVED,
      version: '1.0',
      createdById: user.id,
    },
  });

  return { organization, user, assets, dwsp };
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
  try {
    // Delete in order respecting foreign keys
    // AuditLog MUST be deleted first (has FKs to User and Organization)
    await prisma.auditLog.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.report.deleteMany({});
    await prisma.compliancePlan.deleteMany({});
    await prisma.asset.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

/**
 * Clean up specific data by organization
 */
export async function cleanupByOrganization(organizationId: string) {
  try {
    // AuditLog MUST be deleted first (has FKs to User and Organization)
    await prisma.auditLog.deleteMany({ where: { organizationId } });
    await prisma.document.deleteMany({ where: { organizationId } });
    await prisma.report.deleteMany({ where: { organizationId } });
    await prisma.compliancePlan.deleteMany({ where: { organizationId } });
    await prisma.asset.deleteMany({ where: { organizationId } });
    await prisma.user.deleteMany({ where: { organizationId } });
    await prisma.organization.delete({ where: { id: organizationId } });
  } catch (error) {
    console.error('Error cleaning up organization data:', error);
  }
}

/**
 * Disconnect Prisma client
 */
export async function disconnectDB() {
  await prisma.$disconnect();
}

/**
 * Connect to Prisma client
 */
export async function connectDB() {
  return prisma;
}

/**
 * Mock S3 file upload response
 */
export function mockS3UploadResponse(fileKey: string) {
  return {
    s3Key: fileKey,
    s3Url: `https://test-bucket.s3.amazonaws.com/${fileKey}`,
    fileSize: 102400,
    uploadedAt: new Date(),
  };
}

/**
 * Generate valid test email
 */
export function generateTestEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
}

/**
 * Generate test password (meets validation requirements)
 */
export function generateTestPassword() {
  return 'Test@Password123!';
}

/**
 * Create authorization header
 */
export function createAuthHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Parse JWT token (for testing purposes)
 */
export function parseTestToken(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Wait for condition (useful for async operations)
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Condition not met within timeout');
}

/**
 * Note: generateTestToken is defined for potential manual testing purposes,
 * but integration tests use the login endpoint to get authentic JWT tokens,
 * so this function is not exported or used in the test suite.
 *
 * JWT tokens for integration tests are obtained via:
 * 1. Create test user with createTestUser()
 * 2. Call login endpoint with test credentials
 * 3. Extract token from loginResponse.body.token
 */
export default {
  createTestUser,
  createTestUsers,
  createTestAsset,
  createTestAssets,
  createTestDWSP,
  createTestDocument,
  seedTestData,
  cleanupTestData,
  cleanupByOrganization,
  disconnectDB,
  connectDB,
  mockS3UploadResponse,
  generateTestEmail,
  generateTestPassword,
  createAuthHeader,
  parseTestToken,
  waitForCondition,
};
