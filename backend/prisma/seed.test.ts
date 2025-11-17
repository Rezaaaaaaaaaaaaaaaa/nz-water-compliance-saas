/**
 * Test Database Seed Script
 *
 * Seeds the test database with sample data for comprehensive testing.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test database...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.complianceReport.deleteMany();
  await prisma.waterSupply.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Create test organizations
  const org1 = await prisma.organization.create({
    data: {
      name: 'Test Water Authority 1',
      domain: 'test1.water.nz',
      subscriptionTier: 'PROFESSIONAL',
      subscriptionStatus: 'ACTIVE',
    },
  });

  const org2 = await prisma.organization.create({
    data: {
      name: 'Test Water Authority 2',
      domain: 'test2.water.nz',
      subscriptionTier: 'ENTERPRISE',
      subscriptionStatus: 'ACTIVE',
    },
  });

  console.log('✅ Created test organizations');

  // Create test users
  const passwordHash = await bcrypt.hash('Test123!@#', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.flowcomply.nz',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      organizationId: org1.id,
      emailVerified: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@test.flowcomply.nz',
      passwordHash,
      firstName: 'Manager',
      lastName: 'User',
      role: 'MANAGER',
      organizationId: org1.id,
      emailVerified: true,
    },
  });

  const operator = await prisma.user.create({
    data: {
      email: 'operator@test.flowcomply.nz',
      passwordHash,
      firstName: 'Operator',
      lastName: 'User',
      role: 'OPERATOR',
      organizationId: org1.id,
      emailVerified: true,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@test.flowcomply.nz',
      passwordHash,
      firstName: 'Viewer',
      lastName: 'User',
      role: 'VIEWER',
      organizationId: org2.id,
      emailVerified: true,
    },
  });

  // User with MFA enabled
  const mfaUser = await prisma.user.create({
    data: {
      email: 'mfa@test.flowcomply.nz',
      passwordHash,
      firstName: 'MFA',
      lastName: 'User',
      role: 'MANAGER',
      organizationId: org1.id,
      emailVerified: true,
      mfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP', // Test secret
    },
  });

  console.log('✅ Created test users');

  // Create test water supplies
  const supply1 = await prisma.waterSupply.create({
    data: {
      name: 'Test Supply Station 1',
      location: 'Auckland Test Site',
      type: 'SURFACE_WATER',
      capacity: 10000,
      organizationId: org1.id,
      status: 'ACTIVE',
    },
  });

  const supply2 = await prisma.waterSupply.create({
    data: {
      name: 'Test Supply Station 2',
      location: 'Wellington Test Site',
      type: 'GROUNDWATER',
      capacity: 5000,
      organizationId: org1.id,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created test water supplies');

  // Create test compliance reports
  const report1 = await prisma.complianceReport.create({
    data: {
      title: 'Test Monthly Compliance Report - January 2025',
      reportDate: new Date('2025-01-31'),
      reportType: 'MONTHLY',
      status: 'SUBMITTED',
      organizationId: org1.id,
      waterSupplyId: supply1.id,
      submittedById: manager.id,
      submittedAt: new Date('2025-02-01'),
    },
  });

  const report2 = await prisma.complianceReport.create({
    data: {
      title: 'Test Quarterly Compliance Report - Q4 2024',
      reportDate: new Date('2024-12-31'),
      reportType: 'QUARTERLY',
      status: 'APPROVED',
      organizationId: org1.id,
      waterSupplyId: supply1.id,
      submittedById: manager.id,
      submittedAt: new Date('2025-01-05'),
      approvedById: admin.id,
      approvedAt: new Date('2025-01-10'),
    },
  });

  const report3 = await prisma.complianceReport.create({
    data: {
      title: 'Test Draft Report',
      reportDate: new Date(),
      reportType: 'MONTHLY',
      status: 'DRAFT',
      organizationId: org1.id,
      waterSupplyId: supply2.id,
    },
  });

  console.log('✅ Created test compliance reports');

  // Create test audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        action: 'USER_LOGIN',
        userId: admin.id,
        organizationId: org1.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      },
      {
        action: 'REPORT_CREATED',
        userId: manager.id,
        organizationId: org1.id,
        resourceType: 'ComplianceReport',
        resourceId: report1.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      },
      {
        action: 'REPORT_SUBMITTED',
        userId: manager.id,
        organizationId: org1.id,
        resourceType: 'ComplianceReport',
        resourceId: report1.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      },
    ],
  });

  console.log('✅ Created test audit logs');

  console.log('\n🎉 Test database seeding completed!\n');
  console.log('Test Credentials:');
  console.log('==================');
  console.log('Admin:    admin@test.flowcomply.nz / Test123!@#');
  console.log('Manager:  manager@test.flowcomply.nz / Test123!@#');
  console.log('Operator: operator@test.flowcomply.nz / Test123!@#');
  console.log('Viewer:   viewer@test.flowcomply.nz / Test123!@#');
  console.log('MFA User: mfa@test.flowcomply.nz / Test123!@# (MFA enabled)');
  console.log('==================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
