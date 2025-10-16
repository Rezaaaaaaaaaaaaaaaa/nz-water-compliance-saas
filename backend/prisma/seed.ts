/**
 * Database Seed Script for NZ Water Compliance SaaS
 *
 * Populates the database with sample data for development and testing
 */

import { PrismaClient, UserRole, OrganizationType, AssetType, AssetCondition, RiskLevel, DocumentType, CompliancePlanStatus, CompliancePlanType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data (development only!)
  if (process.env.NODE_ENV === 'development') {
    console.log('Clearing existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.report.deleteMany();
    await prisma.assetCompliancePlan.deleteMany();
    await prisma.compliancePlanDocument.deleteMany();
    await prisma.assetDocument.deleteMany();
    await prisma.compliancePlan.deleteMany();
    await prisma.document.deleteMany();
    await prisma.asset.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
    console.log('✓ Data cleared\n');
  }

  // ========================================================================
  // Organizations
  // ========================================================================
  console.log('Creating organizations...');

  const wellingtonCouncil = await prisma.organization.create({
    data: {
      name: 'Wellington City Council',
      type: OrganizationType.COUNCIL,
      region: 'Wellington',
      populationServed: 215000,
      contactEmail: 'water@wcc.govt.nz',
      contactPhone: '+64-4-499-4444',
      address: '101 Wakefield Street, Wellington 6011',
    },
  });

  const watercareServices = await prisma.organization.create({
    data: {
      name: 'Watercare Services Limited',
      type: OrganizationType.CCO,
      region: 'Auckland',
      populationServed: 1700000,
      contactEmail: 'info@watercare.co.nz',
      contactPhone: '+64-9-442-2222',
      address: '73 Remuera Road, Newmarket, Auckland 1050',
    },
  });

  const taumataarowai = await prisma.organization.create({
    data: {
      name: 'Taumata Arowai',
      type: OrganizationType.IWI_AUTHORITY,
      region: 'National',
      contactEmail: 'info@taumataarowai.govt.nz',
      contactPhone: '+64-4-901-7800',
      address: 'PO Box 388, Wellington 6140',
    },
  });

  console.log('✓ Created 3 organizations\n');

  // ========================================================================
  // Users
  // ========================================================================
  console.log('Creating users...');

  // Hash password for all test users (password123)
  const hashedPassword = await bcrypt.hash('password123', 10);

  const systemAdmin = await prisma.user.create({
    data: {
      email: 'admin@compliance-saas.co.nz',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.SYSTEM_ADMIN,
      organizationId: wellingtonCouncil.id,
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  const complianceManager = await prisma.user.create({
    data: {
      email: 'compliance@wcc.govt.nz',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Thompson',
      role: UserRole.COMPLIANCE_MANAGER,
      organizationId: wellingtonCouncil.id,
      isActive: true,
    },
  });

  const inspector = await prisma.user.create({
    data: {
      email: 'inspector@wcc.govt.nz',
      password: hashedPassword,
      firstName: 'James',
      lastName: 'Wilson',
      role: UserRole.INSPECTOR,
      organizationId: wellingtonCouncil.id,
      isActive: true,
    },
  });

  const auditor = await prisma.user.create({
    data: {
      email: 'auditor@taumataarowai.govt.nz',
      password: hashedPassword,
      firstName: 'Maria',
      lastName: 'Rodriguez',
      role: UserRole.AUDITOR,
      organizationId: taumataarowai.id,
      isActive: true,
    },
  });

  console.log('✓ Created 4 users (password: password123)\n');

  // ========================================================================
  // Assets
  // ========================================================================
  console.log('Creating assets...');

  const treatmentPlant = await prisma.asset.create({
    data: {
      name: 'Karori Water Treatment Plant',
      type: AssetType.WATER_TREATMENT_PLANT,
      description: 'Main water treatment facility serving western Wellington suburbs',
      assetCode: 'WTP-001',
      latitude: -41.2889,
      longitude: 174.7353,
      address: '15 Makara Peak Road, Karori, Wellington',
      installationDate: new Date('2010-06-15'),
      expectedLife: 50,
      replacementValue: 15000000.00,
      condition: AssetCondition.GOOD,
      lastInspectionDate: new Date('2025-09-01'),
      nextInspectionDate: new Date('2026-03-01'),
      isCritical: true,
      riskLevel: RiskLevel.HIGH,
      organizationId: wellingtonCouncil.id,
      metadata: {
        capacity: '50,000 m³/day',
        treatmentType: ['coagulation', 'filtration', 'chlorination'],
        operatingHours: '24/7',
      },
    },
  });

  const reservoir = await prisma.asset.create({
    data: {
      name: 'Brooklyn Reservoir',
      type: AssetType.RESERVOIR,
      description: 'Storage reservoir for treated water',
      assetCode: 'RES-002',
      latitude: -41.2924,
      longitude: 174.7662,
      address: 'Brooklyn Wind Turbine Road, Brooklyn, Wellington',
      installationDate: new Date('1995-03-20'),
      expectedLife: 80,
      replacementValue: 8000000.00,
      condition: AssetCondition.FAIR,
      lastInspectionDate: new Date('2025-08-15'),
      nextInspectionDate: new Date('2026-02-15'),
      isCritical: true,
      riskLevel: RiskLevel.MEDIUM,
      organizationId: wellingtonCouncil.id,
      metadata: {
        capacity: '25,000 m³',
        material: 'Reinforced concrete',
        elevation: '180m above sea level',
      },
    },
  });

  const pumpStation = await prisma.asset.create({
    data: {
      name: 'Ngaio Pump Station',
      type: AssetType.PUMP_STATION,
      description: 'Booster pump station for hill suburbs',
      assetCode: 'PS-003',
      latitude: -41.2556,
      longitude: 174.7551,
      address: '50 Cummings Street, Ngaio, Wellington',
      installationDate: new Date('2015-11-10'),
      expectedLife: 30,
      replacementValue: 1200000.00,
      condition: AssetCondition.EXCELLENT,
      lastInspectionDate: new Date('2025-09-20'),
      nextInspectionDate: new Date('2026-03-20'),
      isCritical: false,
      riskLevel: RiskLevel.LOW,
      organizationId: wellingtonCouncil.id,
      metadata: {
        pumpCapacity: '500 L/s',
        motorPower: '150 kW',
        numberOfPumps: 3,
      },
    },
  });

  console.log('✓ Created 3 assets\n');

  // ========================================================================
  // Documents
  // ========================================================================
  console.log('Creating documents...');

  const dwspDocument = await prisma.document.create({
    data: {
      title: 'Wellington City Drinking Water Safety Plan 2025',
      description: 'Comprehensive DWSP for Wellington City water supply network',
      documentType: DocumentType.DWSP,
      fileKey: 'documents/wellington/dwsp-2025-v1.pdf',
      fileSize: 5242880,
      fileType: 'application/pdf',
      fileName: 'wellington-dwsp-2025.pdf',
      version: '1.0',
      tags: ['dwsp', 'taumata-arowai', '2025'],
      createdById: complianceManager.id,
      isPublic: false,
      effectiveDate: new Date('2025-01-01'),
      reviewDate: new Date('2026-01-01'),
      organizationId: wellingtonCouncil.id,
    },
  });

  const inspectionReport = await prisma.document.create({
    data: {
      title: 'Karori WTP Quarterly Inspection Report Q3 2025',
      description: 'Routine inspection findings for Q3 2025',
      documentType: DocumentType.INSPECTION_REPORT,
      fileKey: 'documents/wellington/inspection-q3-2025.pdf',
      fileSize: 1048576,
      fileType: 'application/pdf',
      fileName: 'karori-wtp-inspection-q3-2025.pdf',
      version: '1.0',
      tags: ['inspection', 'karori-wtp', 'q3-2025'],
      createdById: inspector.id,
      isPublic: false,
      effectiveDate: new Date('2025-09-30'),
      organizationId: wellingtonCouncil.id,
    },
  });

  const assetManagementPlan = await prisma.document.create({
    data: {
      title: 'Wellington Water Asset Management Plan 2025-2035',
      description: '10-year asset management strategy',
      documentType: DocumentType.ASSET_MANAGEMENT_PLAN,
      fileKey: 'documents/wellington/amp-2025-2035.pdf',
      fileSize: 10485760,
      fileType: 'application/pdf',
      fileName: 'wellington-amp-2025-2035.pdf',
      version: '2.0',
      tags: ['amp', 'asset-management', '10-year-plan'],
      createdById: complianceManager.id,
      isPublic: true,
      effectiveDate: new Date('2025-07-01'),
      reviewDate: new Date('2028-07-01'),
      organizationId: wellingtonCouncil.id,
    },
  });

  // Link documents to assets
  await prisma.assetDocument.create({
    data: {
      assetId: treatmentPlant.id,
      documentId: inspectionReport.id,
    },
  });

  console.log('✓ Created 3 documents\n');

  // ========================================================================
  // Compliance Plans
  // ========================================================================
  console.log('Creating compliance plans...');

  const dwsp = await prisma.compliancePlan.create({
    data: {
      planType: CompliancePlanType.DWSP,
      title: 'Wellington City Drinking Water Safety Plan 2025',
      description: 'Comprehensive DWSP covering all water supplies',
      status: CompliancePlanStatus.APPROVED,
      version: '1.0',
      waterSupplyName: 'Wellington City Water Supply',
      supplyPopulation: 215000,
      sourceTypes: ['SURFACE_WATER', 'GROUNDWATER'],
      treatmentProcesses: ['COAGULATION', 'FILTRATION', 'CHLORINATION', 'UV_DISINFECTION'],
      hazards: [
        {
          id: 1,
          hazard: 'Microbiological contamination',
          source: 'Surface water intake',
          likelihood: 'Possible',
          consequence: 'Major',
          riskRating: 'High',
        },
        {
          id: 2,
          hazard: 'Chemical contamination',
          source: 'Agricultural runoff',
          likelihood: 'Unlikely',
          consequence: 'Moderate',
          riskRating: 'Medium',
        },
      ],
      riskAssessments: {
        methodology: 'Taumata Arowai Risk Matrix',
        assessmentDate: '2025-01-15',
        nextAssessmentDate: '2026-01-15',
      },
      preventiveMeasures: [
        {
          hazard: 'Microbiological contamination',
          controlMeasure: 'Multi-barrier treatment',
          responsibility: 'Treatment Plant Operator',
          criticalLimit: 'Chlorine residual > 0.2 mg/L',
        },
      ],
      operationalMonitoring: {
        parameters: ['pH', 'Turbidity', 'Chlorine residual', 'Flow rate'],
        frequency: 'Continuous',
        location: 'Treatment plant outlet',
      },
      verificationMonitoring: {
        parameters: ['E. coli', 'Total coliforms', 'Chemical suite'],
        frequency: 'Weekly',
        laboratory: 'Accredited lab',
      },
      correctiveActions: [
        {
          situation: 'High turbidity',
          action: 'Increase coagulant dose, notify supervisor',
          responsibility: 'Operator',
          timeline: 'Immediate',
        },
      ],
      managementProcedures: {
        documentControl: 'Version controlled in EDMS',
        training: 'Annual refresher training',
        incidents: 'Notify Taumata Arowai within 24 hours',
      },
      lastReviewDate: new Date('2025-01-15'),
      nextReviewDate: new Date('2026-01-15'),
      approvedBy: complianceManager.id,
      approvedAt: new Date('2025-01-20'),
      submittedAt: new Date('2025-01-25'),
      submittedBy: complianceManager.id,
      acknowledgmentReceived: new Date('2025-02-01'),
      organizationId: wellingtonCouncil.id,
    },
  });

  // Link compliance plan to assets
  await prisma.assetCompliancePlan.create({
    data: {
      assetId: treatmentPlant.id,
      compliancePlanId: dwsp.id,
    },
  });

  await prisma.assetCompliancePlan.create({
    data: {
      assetId: reservoir.id,
      compliancePlanId: dwsp.id,
    },
  });

  // Link compliance plan to document
  await prisma.compliancePlanDocument.create({
    data: {
      compliancePlanId: dwsp.id,
      documentId: dwspDocument.id,
    },
  });

  console.log('✓ Created 1 compliance plan\n');

  // ========================================================================
  // Audit Logs
  // ========================================================================
  console.log('Creating audit logs...');

  await prisma.auditLog.createMany({
    data: [
      {
        organizationId: wellingtonCouncil.id,
        userId: complianceManager.id,
        action: 'CREATE',
        resourceType: 'CompliancePlan',
        resourceId: dwsp.id,
        ipAddress: '203.109.123.45',
        userAgent: 'Mozilla/5.0',
        changes: {
          after: { title: dwsp.title, status: 'DRAFT' },
        },
        timestamp: new Date('2025-01-10T09:30:00Z'),
      },
      {
        organizationId: wellingtonCouncil.id,
        userId: complianceManager.id,
        action: 'SUBMIT',
        resourceType: 'CompliancePlan',
        resourceId: dwsp.id,
        ipAddress: '203.109.123.45',
        userAgent: 'Mozilla/5.0',
        reason: 'Annual DWSP submission to Taumata Arowai',
        timestamp: new Date('2025-01-25T14:15:00Z'),
      },
      {
        organizationId: wellingtonCouncil.id,
        userId: auditor.id,
        action: 'VIEW',
        resourceType: 'CompliancePlan',
        resourceId: dwsp.id,
        ipAddress: '202.88.145.67',
        userAgent: 'Mozilla/5.0',
        reason: 'Regulatory audit',
        timestamp: new Date('2025-02-05T10:00:00Z'),
      },
    ],
  });

  console.log('✓ Created 3 audit log entries\n');

  // ========================================================================
  // Notifications
  // ========================================================================
  console.log('Creating notifications...');

  await prisma.notification.createMany({
    data: [
      {
        organizationId: wellingtonCouncil.id,
        userId: complianceManager.id,
        type: 'DEADLINE_REMINDER',
        title: 'DWSP Annual Review Due',
        message: 'Your Drinking Water Safety Plan requires annual review by January 15, 2026',
        link: `/compliance/plans/${dwsp.id}`,
        isRead: false,
      },
      {
        organizationId: wellingtonCouncil.id,
        userId: inspector.id,
        type: 'INSPECTION_DUE',
        title: 'Asset Inspection Due',
        message: 'Karori Water Treatment Plant inspection is due on March 1, 2026',
        link: `/assets/${treatmentPlant.id}`,
        isRead: false,
      },
      {
        organizationId: wellingtonCouncil.id,
        userId: complianceManager.id,
        type: 'PLAN_APPROVED',
        title: 'DWSP Approved',
        message: 'Your Drinking Water Safety Plan has been approved by Taumata Arowai',
        link: `/compliance/plans/${dwsp.id}`,
        isRead: true,
        readAt: new Date('2025-02-02T08:30:00Z'),
        emailSent: true,
        emailSentAt: new Date('2025-02-01T16:00:00Z'),
      },
    ],
  });

  console.log('✓ Created 3 notifications\n');

  // ========================================================================
  // Reports
  // ========================================================================
  console.log('Creating reports...');

  await prisma.report.create({
    data: {
      reportType: 'ANNUAL_COMPLIANCE',
      title: 'Annual Compliance Report 2024',
      description: 'Comprehensive compliance report for Taumata Arowai',
      status: 'COMPLETED',
      parameters: {
        year: 2024,
        includeAssets: true,
        includeWaterQuality: true,
      },
      fileKey: 'reports/wellington/annual-compliance-2024.pdf',
      fileSize: 8388608,
      fileType: 'application/pdf',
      jobId: 'job-12345',
      startedAt: new Date('2025-01-05T10:00:00Z'),
      completedAt: new Date('2025-01-05T10:15:00Z'),
      organizationId: wellingtonCouncil.id,
    },
  });

  console.log('✓ Created 1 report\n');

  // ========================================================================
  // Summary
  // ========================================================================
  console.log('========================================');
  console.log('✅ Database seeding completed!\n');
  console.log('Summary:');
  console.log(`  - Organizations: 3`);
  console.log(`  - Users: 4`);
  console.log(`  - Assets: 3`);
  console.log(`  - Documents: 3`);
  console.log(`  - Compliance Plans: 1`);
  console.log(`  - Audit Logs: 3`);
  console.log(`  - Notifications: 3`);
  console.log(`  - Reports: 1`);
  console.log('========================================\n');

  console.log('Test Users (all passwords: password123):');
  console.log(`  Admin:      admin@compliance-saas.co.nz`);
  console.log(`  Manager:    compliance@wcc.govt.nz`);
  console.log(`  Inspector:  inspector@wcc.govt.nz`);
  console.log(`  Auditor:    auditor@taumataarowai.govt.nz`);
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
