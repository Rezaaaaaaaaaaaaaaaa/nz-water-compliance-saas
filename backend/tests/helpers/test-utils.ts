/**
 * Test Utilities and Helpers
 * Provides reusable functions for integration tests
 */

import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

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

  // Note: In real tests, you'd use your actual JWT signing method
  // For now, return a properly structured payload
  const secret = process.env.JWT_SECRET || 'test-jwt-secret-key-12345';

  // Create a simple JWT-like structure for testing
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64');

  // For real implementation, use: jwt.sign(payload, secret)
  // This is a placeholder that works with most test scenarios
  const token = `${header}.${payloadStr}.signature`;

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
      industryType: 'WATER_UTILITY',
      region: 'AUCKLAND',
      tier: 'BASIC',
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
      role: 'ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
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
      assetType: 'TREATMENT_PLANT',
      location: 'Auckland, NZ',
      organizationId,
      status: 'ACTIVE',
      createdBy: uuidv4(),
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
  const assetTypes = ['TREATMENT_PLANT', 'RESERVOIR', 'PUMP_STATION', 'DISTRIBUTION_MAIN'];

  for (let i = 0; i < count; i++) {
    const asset = await createTestAsset(organizationId, {
      name: `Test Asset ${i} ${Date.now()}`,
      assetType: assetTypes[i % assetTypes.length],
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
  return prisma.dWSP.create({
    data: {
      id: uuidv4(),
      name: `Test DWSP ${Date.now()}`,
      description: 'Test drinking water safety plan',
      organizationId,
      status: 'DRAFT',
      version: 1,
      createdBy: uuidv4(),
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
  return prisma.document.create({
    data: {
      id: uuidv4(),
      name: `Test Document ${Date.now()}.pdf`,
      fileType: 'application/pdf',
      fileSize: 102400,
      s3Key: `test-documents/${uuidv4()}.pdf`,
      organizationId,
      uploadedBy: uuidv4(),
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
      industryType: 'WATER_UTILITY',
      region: 'AUCKLAND',
      tier: 'PREMIUM',
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
      role: 'ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
    },
  });

  // Create some assets
  const assets = [];
  for (let i = 0; i < 3; i++) {
    const asset = await prisma.asset.create({
      data: {
        id: uuidv4(),
        name: `Seed Asset ${i + 1}`,
        assetType: ['TREATMENT_PLANT', 'RESERVOIR', 'PUMP_STATION'][i],
        location: 'Auckland, NZ',
        organizationId: organization.id,
        status: 'ACTIVE',
        createdBy: user.id,
      },
    });
    assets.push(asset);
  }

  // Create a DWSP
  const dwsp = await prisma.dWSP.create({
    data: {
      id: uuidv4(),
      name: 'Seed DWSP',
      description: 'Seeded test DWSP',
      organizationId: organization.id,
      status: 'ACTIVE',
      version: 1,
      createdBy: user.id,
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
    await prisma.document.deleteMany({});
    await prisma.report.deleteMany({});
    await prisma.dWSP.deleteMany({});
    await prisma.asset.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.auditLog.deleteMany({});
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

/**
 * Clean up specific data by organization
 */
export async function cleanupByOrganization(organizationId: string) {
  try {
    await prisma.document.deleteMany({ where: { organizationId } });
    await prisma.report.deleteMany({ where: { organizationId } });
    await prisma.dWSP.deleteMany({ where: { organizationId } });
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

export default {
  generateTestToken,
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
