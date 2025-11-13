/**
 * Test Data Factories
 *
 * Reusable factory functions for generating test data
 * using faker.js for randomized, realistic test data.
 */

import { faker } from '@faker-js/faker';

/**
 * User Factory
 */
export const UserFactory = {
  build: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    role: 'VIEWER',
    organizationId: faker.string.uuid(),
    isActive: true,
    emailVerified: true,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    lastLoginAt: faker.date.recent(),
    deletedAt: null,
    ...overrides,
  }),

  buildAdmin: (overrides: Partial<any> = {}) =>
    UserFactory.build({ role: 'ORG_ADMIN', ...overrides }),

  buildComplianceManager: (overrides: Partial<any> = {}) =>
    UserFactory.build({ role: 'COMPLIANCE_MANAGER', ...overrides }),

  buildSystemAdmin: (overrides: Partial<any> = {}) =>
    UserFactory.build({ role: 'SYSTEM_ADMIN', ...overrides }),

  buildMany: (count: number, overrides: Partial<any> = {}) =>
    Array.from({ length: count }, () => UserFactory.build(overrides)),
};

/**
 * Organization Factory
 */
export const OrganizationFactory = {
  build: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    name: faker.company.name(),
    type: 'COUNCIL',
    contactEmail: faker.internet.email(),
    contactPhone: faker.phone.number(),
    address: faker.location.streetAddress(true),
    populationServed: faker.number.int({ min: 1000, max: 500000 }),
    isActive: true,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  buildMany: (count: number, overrides: Partial<any> = {}) =>
    Array.from({ length: count }, () => OrganizationFactory.build(overrides)),
};

/**
 * Asset Factory
 */
export const AssetFactory = {
  build: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    organizationId: faker.string.uuid(),
    name: faker.company.name() + ' Plant',
    assetCode: faker.string.alphanumeric(10).toUpperCase(),
    type: 'TREATMENT_PLANT',
    condition: 'GOOD',
    location: faker.location.city(),
    latitude: faker.location.latitude(),
    longitude: faker.location.longitude(),
    capacity: faker.number.int({ min: 100, max: 10000 }),
    installDate: faker.date.past({ years: 20 }),
    lastInspectionDate: faker.date.recent({ days: 90 }),
    nextInspectionDate: faker.date.future({ years: 1 }),
    riskLevel: 'MEDIUM',
    isCritical: false,
    maintenanceSchedule: 'Quarterly',
    manufacturer: faker.company.name(),
    modelNumber: faker.string.alphanumeric(8),
    serialNumber: faker.string.alphanumeric(12),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  buildCritical: (overrides: Partial<any> = {}) =>
    AssetFactory.build({
      riskLevel: 'CRITICAL',
      isCritical: true,
      condition: 'POOR',
      ...overrides
    }),

  buildMany: (count: number, overrides: Partial<any> = {}) =>
    Array.from({ length: count }, () => AssetFactory.build(overrides)),
};

/**
 * Compliance Plan Factory
 */
export const CompliancePlanFactory = {
  build: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    organizationId: faker.string.uuid(),
    title: `DWSP - ${faker.location.city()} Water Supply`,
    type: 'DWSP',
    status: 'DRAFT',
    targetCompletionDate: faker.date.future(),
    createdBy: faker.string.uuid(),
    waterSupplyName: faker.location.city() + ' Water Supply',
    waterSupplyDescription: faker.lorem.paragraph(),
    hazards: [],
    riskAssessments: [],
    preventiveMeasures: [],
    operationalMonitoring: [],
    verificationMonitoring: [],
    correctiveActions: [],
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  buildApproved: (overrides: Partial<any> = {}) =>
    CompliancePlanFactory.build({
      status: 'APPROVED',
      approvedBy: faker.string.uuid(),
      approvedAt: faker.date.recent(),
      ...overrides
    }),

  buildMany: (count: number, overrides: Partial<any> = {}) =>
    Array.from({ length: count }, () => CompliancePlanFactory.build(overrides)),
};

/**
 * Document Factory
 */
export const DocumentFactory = {
  build: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    organizationId: faker.string.uuid(),
    title: faker.system.fileName(),
    type: 'REPORT',
    fileName: faker.system.fileName({ extensionCount: 1 }),
    fileSize: faker.number.int({ min: 1024, max: 10485760 }),
    mimeType: 'application/pdf',
    s3Key: `documents/${faker.string.uuid()}/${faker.system.fileName()}`,
    s3Bucket: 'compliance-docs',
    uploadedBy: faker.string.uuid(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  buildMany: (count: number, overrides: Partial<any> = {}) =>
    Array.from({ length: count }, () => DocumentFactory.build(overrides)),
};

/**
 * Water Quality Test Factory
 */
export const WaterQualityTestFactory = {
  build: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    organizationId: faker.string.uuid(),
    waterSupplyComponentId: faker.string.uuid(),
    testDate: faker.date.recent({ days: 30 }),
    parameter: 'E_COLI',
    value: faker.number.float({ min: 0, max: 10, fractionDigits: 2 }),
    valuePrefix: '',
    unit: 'cfu/100mL',
    laboratory: faker.company.name() + ' Lab',
    isCompliant: true,
    sampleLocation: faker.location.streetAddress(),
    samplerName: faker.person.fullName(),
    notes: faker.lorem.sentence(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  buildNonCompliant: (overrides: Partial<any> = {}) =>
    WaterQualityTestFactory.build({
      isCompliant: false,
      value: faker.number.float({ min: 10, max: 100, fractionDigits: 2 }),
      ...overrides
    }),

  buildMany: (count: number, overrides: Partial<any> = {}) =>
    Array.from({ length: count }, () => WaterQualityTestFactory.build(overrides)),
};

/**
 * Report Factory
 */
export const ReportFactory = {
  build: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    organizationId: faker.string.uuid(),
    type: 'MONTHLY',
    title: `Monthly Report - ${faker.date.month()}`,
    status: 'DRAFT',
    generatedBy: faker.string.uuid(),
    parameters: {},
    filters: {},
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  buildCompleted: (overrides: Partial<any> = {}) =>
    ReportFactory.build({
      status: 'COMPLETED',
      completedAt: faker.date.recent(),
      fileS3Key: `reports/${faker.string.uuid()}.pdf`,
      fileSize: faker.number.int({ min: 102400, max: 10485760 }),
      ...overrides
    }),

  buildMany: (count: number, overrides: Partial<any> = {}) =>
    Array.from({ length: count }, () => ReportFactory.build(overrides)),
};

/**
 * Audit Log Factory
 */
export const AuditLogFactory = {
  build: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    organizationId: faker.string.uuid(),
    action: 'CREATE',
    resourceType: 'asset',
    resourceId: faker.string.uuid(),
    changes: {},
    ipAddress: faker.internet.ipv4(),
    userAgent: faker.internet.userAgent(),
    timestamp: faker.date.recent(),
    ...overrides,
  }),

  buildMany: (count: number, overrides: Partial<any> = {}) =>
    Array.from({ length: count }, () => AuditLogFactory.build(overrides)),
};

/**
 * Notification Factory
 */
export const NotificationFactory = {
  build: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    organizationId: faker.string.uuid(),
    type: 'INFO',
    title: faker.lorem.sentence(),
    message: faker.lorem.paragraph(),
    isRead: false,
    emailSent: false,
    createdAt: faker.date.recent(),
    ...overrides,
  }),

  buildMany: (count: number, overrides: Partial<any> = {}) =>
    Array.from({ length: count }, () => NotificationFactory.build(overrides)),
};
