-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SYSTEM_ADMIN', 'ORG_ADMIN', 'COMPLIANCE_MANAGER', 'INSPECTOR', 'AUDITOR');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('COUNCIL', 'CCO', 'PRIVATE_OPERATOR', 'IWI_AUTHORITY');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('WATER_TREATMENT_PLANT', 'RESERVOIR', 'PUMP_STATION', 'PIPELINE', 'VALVE', 'METER', 'CHLORINATION_STATION', 'UV_DISINFECTION', 'FILTRATION_SYSTEM', 'INTAKE_STRUCTURE', 'STORAGE_TANK', 'PRESSURE_REDUCING_VALVE', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'VERY_POOR', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DWSP', 'ASSET_MANAGEMENT_PLAN', 'COMPLIANCE_REPORT', 'INSPECTION_REPORT', 'WATER_QUALITY_REPORT', 'INCIDENT_REPORT', 'MAINTENANCE_RECORD', 'TRAINING_CERTIFICATE', 'AUDIT_REPORT', 'POLICY', 'PROCEDURE', 'DRAWING', 'PHOTO', 'OTHER');

-- CreateEnum
CREATE TYPE "CompliancePlanStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'REQUIRES_UPDATE');

-- CreateEnum
CREATE TYPE "CompliancePlanType" AS ENUM ('DWSP', 'WASTEWATER_PLAN', 'ASSET_MANAGEMENT_PLAN', 'EMERGENCY_RESPONSE_PLAN', 'WATER_CONSERVATION_PLAN');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'SUBMIT', 'APPROVE', 'REJECT', 'REGULATION_REVIEW_TRIGGERED', 'EXPORT', 'LOGIN', 'LOGOUT', 'PERMISSION_DENIED', 'DWSP_CREATED', 'DWSP_SUBMITTED', 'REPORT_GENERATED', 'ASSET_CREATED', 'DOCUMENT_UPLOADED', 'COMPLIANCE_VIOLATION', 'CALCULATE_COMPLIANCE_SCORE', 'VIEW_ANALYTICS', 'SEND_EMAIL');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('ANNUAL_COMPLIANCE', 'INFORMATION_DISCLOSURE', 'ASSET_CONDITION', 'WATER_QUALITY', 'FINANCIAL_PERFORMANCE', 'CUSTOM', 'DWQAR');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'PENDING', 'GENERATING', 'COMPLETED', 'FAILED', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DEADLINE_REMINDER', 'PLAN_APPROVED', 'PLAN_REJECTED', 'DOCUMENT_UPLOADED', 'INSPECTION_DUE', 'REVIEW_REQUIRED', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "WaterSupplyComponentType" AS ENUM ('TREATMENT_PLANT', 'DISTRIBUTION_ZONE', 'SOURCE_BORE', 'SOURCE_SURFACE_WATER', 'STORAGE_RESERVOIR', 'PUMPING_STATION');

-- CreateEnum
CREATE TYPE "ComplianceRuleCategory" AS ENUM ('WATER_QUALITY', 'TREATMENT', 'MONITORING', 'OPERATIONAL', 'VERIFICATION', 'MANAGEMENT', 'BACTERIOLOGICAL', 'CHEMICAL', 'RADIOLOGICAL', 'PROTOZOA');

-- CreateEnum
CREATE TYPE "WaterParameter" AS ENUM ('ECOL', 'ENTEROCOCCI', 'COLIFORM_TOTAL', 'CRYPTOSPORIDIUM', 'GIARDIA', 'PH', 'TURBIDITY', 'CHLORINE_FREE', 'CHLORINE_TOTAL', 'FLUORIDE', 'LEAD', 'COPPER', 'ARSENIC', 'NITRATE', 'NITRITE', 'AMMONIA', 'IRON', 'MANGANESE', 'ALUMINIUM', 'TRIHALOMETHANES', 'HAA5', 'PESTICIDES', 'TEMPERATURE', 'CONDUCTIVITY', 'HARDNESS', 'ALKALINITY', 'OTHER');

-- CreateEnum
CREATE TYPE "AIFeature" AS ENUM ('COMPLIANCE_ASSISTANT', 'DWSP_ANALYSIS', 'WATER_QUALITY_ANALYSIS', 'REPORT_GENERATION', 'REGULATORY_ANALYSIS', 'RISK_ASSESSMENT');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "region" TEXT NOT NULL,
    "populationServed" INTEGER,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "auth0Id" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "notificationPreferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "description" TEXT,
    "assetCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "location" TEXT,
    "installationDate" TIMESTAMP(3),
    "expectedLife" INTEGER,
    "replacementValue" DECIMAL(12,2),
    "condition" "AssetCondition" NOT NULL DEFAULT 'UNKNOWN',
    "lastInspectionDate" TIMESTAMP(3),
    "nextInspectionDate" TIMESTAMP(3),
    "maintenanceSchedule" TEXT,
    "capacity" TEXT,
    "material" TEXT,
    "manufacturer" TEXT,
    "modelNumber" TEXT,
    "serialNumber" TEXT,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "documentType" "DocumentType" NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "parentDocumentId" TEXT,
    "tags" TEXT[],
    "createdById" TEXT NOT NULL,
    "uploadedById" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "effectiveDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "reviewDate" TIMESTAMP(3),
    "retentionUntil" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetDocument" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompliancePlan" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planType" "CompliancePlanType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "CompliancePlanStatus" NOT NULL DEFAULT 'DRAFT',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "createdById" TEXT,
    "assignedToId" TEXT,
    "waterSupplyName" TEXT,
    "supplyPopulation" INTEGER,
    "sourceTypes" TEXT[],
    "treatmentProcesses" TEXT[],
    "reportingPeriod" TEXT,
    "targetDate" TIMESTAMP(3),
    "reviewDate" TIMESTAMP(3),
    "hazards" JSONB,
    "riskAssessments" JSONB,
    "preventiveMeasures" JSONB,
    "operationalMonitoring" JSONB,
    "verificationMonitoring" JSONB,
    "correctiveActions" JSONB,
    "managementProcedures" JSONB,
    "communicationPlan" JSONB,
    "documentControl" JSONB,
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "acknowledgmentReceived" TIMESTAMP(3),
    "regulatorFeedback" TEXT,
    "lastReviewDate" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalNotes" TEXT,
    "incidentResponsePlan" JSONB,
    "emergencyContactPrimary" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactSecondary" TEXT,
    "emergencyContactPhone2" TEXT,
    "waterSupplyManager" TEXT,
    "waterSupplyManagerPhone" TEXT,
    "operatorCompetency" JSONB,
    "staffRoles" JSONB,
    "improvementPlan" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CompliancePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompliancePlanDocument" (
    "id" TEXT NOT NULL,
    "compliancePlanId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompliancePlanDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetCompliancePlan" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "compliancePlanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetCompliancePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "reason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT,
    "submittedById" TEXT,
    "reportType" "ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "reportingPeriod" TEXT,
    "hinekorakoSubmissionId" TEXT,
    "parameters" JSONB,
    "fileKey" TEXT,
    "fileSize" INTEGER,
    "fileType" TEXT,
    "data" JSONB,
    "jobId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "submittedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceScore" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "dwspScore" INTEGER NOT NULL,
    "assetScore" INTEGER NOT NULL,
    "documentScore" INTEGER NOT NULL,
    "reportingScore" INTEGER NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "timelinessScore" INTEGER NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterSupplyComponent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "componentType" "WaterSupplyComponentType" NOT NULL,
    "description" TEXT,
    "populationServed" INTEGER,
    "capacity" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "commissionedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WaterSupplyComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRule" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "category" "ComplianceRuleCategory",
    "description" TEXT,
    "parameter" TEXT,
    "maxValue" DECIMAL(12,4),
    "minValue" DECIMAL(12,4),
    "unit" TEXT,
    "frequency" TEXT,
    "applicability" TEXT,
    "supplyCategory" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "supersededDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterQualityTest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "externalSampleId" TEXT,
    "sampleDate" TIMESTAMP(3) NOT NULL,
    "parameter" "WaterParameter" NOT NULL,
    "valuePrefix" TEXT,
    "value" DECIMAL(12,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "compliesWithRule" BOOLEAN NOT NULL,
    "sourceClass" TEXT,
    "notes" TEXT,
    "labName" TEXT,
    "labAccreditation" TEXT,
    "testMethod" TEXT,
    "samplingPoint" TEXT,
    "samplerName" TEXT,
    "weatherConditions" TEXT,
    "temperature" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WaterQualityTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleCompliance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "reportingPeriod" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "complies" BOOLEAN NOT NULL,
    "nonCompliantPeriods" INTEGER NOT NULL DEFAULT 0,
    "totalSamples" INTEGER NOT NULL DEFAULT 0,
    "compliantSamples" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "correctiveActions" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuleCompliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" "AIFeature" NOT NULL,
    "operation" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "estimatedCost" INTEGER NOT NULL,
    "requestSize" INTEGER,
    "responseSize" INTEGER,
    "latencyMs" INTEGER,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageQuota" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "maxRequests" INTEGER NOT NULL DEFAULT 100,
    "maxTokens" INTEGER NOT NULL DEFAULT 100000,
    "maxCostCents" INTEGER NOT NULL DEFAULT 1000,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "maxChatRequests" INTEGER NOT NULL DEFAULT 50,
    "maxDocumentAnalyses" INTEGER NOT NULL DEFAULT 20,
    "maxWaterQualityAnalyses" INTEGER NOT NULL DEFAULT 20,
    "maxReportGenerations" INTEGER NOT NULL DEFAULT 10,
    "chatRequestCount" INTEGER NOT NULL DEFAULT 0,
    "documentAnalysisCount" INTEGER NOT NULL DEFAULT 0,
    "waterQualityAnalysisCount" INTEGER NOT NULL DEFAULT 0,
    "reportGenerationCount" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIUsageQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "feature" "AIFeature" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Organization_type_idx" ON "Organization"("type");

-- CreateIndex
CREATE INDEX "Organization_deletedAt_idx" ON "Organization"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_auth0Id_key" ON "User"("auth0Id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_assetCode_key" ON "Asset"("assetCode");

-- CreateIndex
CREATE INDEX "Asset_organizationId_idx" ON "Asset"("organizationId");

-- CreateIndex
CREATE INDEX "Asset_type_idx" ON "Asset"("type");

-- CreateIndex
CREATE INDEX "Asset_condition_idx" ON "Asset"("condition");

-- CreateIndex
CREATE INDEX "Asset_isCritical_idx" ON "Asset"("isCritical");

-- CreateIndex
CREATE INDEX "Asset_deletedAt_idx" ON "Asset"("deletedAt");

-- CreateIndex
CREATE INDEX "Document_organizationId_idx" ON "Document"("organizationId");

-- CreateIndex
CREATE INDEX "Document_documentType_idx" ON "Document"("documentType");

-- CreateIndex
CREATE INDEX "Document_createdById_idx" ON "Document"("createdById");

-- CreateIndex
CREATE INDEX "Document_uploadedById_idx" ON "Document"("uploadedById");

-- CreateIndex
CREATE INDEX "Document_deletedAt_idx" ON "Document"("deletedAt");

-- CreateIndex
CREATE INDEX "AssetDocument_assetId_idx" ON "AssetDocument"("assetId");

-- CreateIndex
CREATE INDEX "AssetDocument_documentId_idx" ON "AssetDocument"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetDocument_assetId_documentId_key" ON "AssetDocument"("assetId", "documentId");

-- CreateIndex
CREATE INDEX "CompliancePlan_organizationId_idx" ON "CompliancePlan"("organizationId");

-- CreateIndex
CREATE INDEX "CompliancePlan_status_idx" ON "CompliancePlan"("status");

-- CreateIndex
CREATE INDEX "CompliancePlan_planType_idx" ON "CompliancePlan"("planType");

-- CreateIndex
CREATE INDEX "CompliancePlan_createdById_idx" ON "CompliancePlan"("createdById");

-- CreateIndex
CREATE INDEX "CompliancePlan_assignedToId_idx" ON "CompliancePlan"("assignedToId");

-- CreateIndex
CREATE INDEX "CompliancePlan_deletedAt_idx" ON "CompliancePlan"("deletedAt");

-- CreateIndex
CREATE INDEX "CompliancePlanDocument_compliancePlanId_idx" ON "CompliancePlanDocument"("compliancePlanId");

-- CreateIndex
CREATE INDEX "CompliancePlanDocument_documentId_idx" ON "CompliancePlanDocument"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "CompliancePlanDocument_compliancePlanId_documentId_key" ON "CompliancePlanDocument"("compliancePlanId", "documentId");

-- CreateIndex
CREATE INDEX "AssetCompliancePlan_assetId_idx" ON "AssetCompliancePlan"("assetId");

-- CreateIndex
CREATE INDEX "AssetCompliancePlan_compliancePlanId_idx" ON "AssetCompliancePlan"("compliancePlanId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetCompliancePlan_assetId_compliancePlanId_key" ON "AssetCompliancePlan"("assetId", "compliancePlanId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "Report_organizationId_idx" ON "Report"("organizationId");

-- CreateIndex
CREATE INDEX "Report_reportType_idx" ON "Report"("reportType");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_createdById_idx" ON "Report"("createdById");

-- CreateIndex
CREATE INDEX "Report_deletedAt_idx" ON "Report"("deletedAt");

-- CreateIndex
CREATE INDEX "Report_reportingPeriod_idx" ON "Report"("reportingPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "Report_organizationId_reportType_reportingPeriod_key" ON "Report"("organizationId", "reportType", "reportingPeriod");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "ComplianceScore_organizationId_calculatedAt_idx" ON "ComplianceScore"("organizationId", "calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WaterSupplyComponent_componentId_key" ON "WaterSupplyComponent"("componentId");

-- CreateIndex
CREATE INDEX "WaterSupplyComponent_organizationId_idx" ON "WaterSupplyComponent"("organizationId");

-- CreateIndex
CREATE INDEX "WaterSupplyComponent_componentId_idx" ON "WaterSupplyComponent"("componentId");

-- CreateIndex
CREATE INDEX "WaterSupplyComponent_deletedAt_idx" ON "WaterSupplyComponent"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceRule_ruleId_key" ON "ComplianceRule"("ruleId");

-- CreateIndex
CREATE INDEX "ComplianceRule_ruleId_idx" ON "ComplianceRule"("ruleId");

-- CreateIndex
CREATE INDEX "ComplianceRule_category_idx" ON "ComplianceRule"("category");

-- CreateIndex
CREATE INDEX "ComplianceRule_isActive_idx" ON "ComplianceRule"("isActive");

-- CreateIndex
CREATE INDEX "WaterQualityTest_organizationId_idx" ON "WaterQualityTest"("organizationId");

-- CreateIndex
CREATE INDEX "WaterQualityTest_componentId_idx" ON "WaterQualityTest"("componentId");

-- CreateIndex
CREATE INDEX "WaterQualityTest_ruleId_idx" ON "WaterQualityTest"("ruleId");

-- CreateIndex
CREATE INDEX "WaterQualityTest_sampleDate_idx" ON "WaterQualityTest"("sampleDate");

-- CreateIndex
CREATE INDEX "WaterQualityTest_parameter_idx" ON "WaterQualityTest"("parameter");

-- CreateIndex
CREATE INDEX "WaterQualityTest_deletedAt_idx" ON "WaterQualityTest"("deletedAt");

-- CreateIndex
CREATE INDEX "RuleCompliance_organizationId_idx" ON "RuleCompliance"("organizationId");

-- CreateIndex
CREATE INDEX "RuleCompliance_reportingPeriod_idx" ON "RuleCompliance"("reportingPeriod");

-- CreateIndex
CREATE INDEX "RuleCompliance_complies_idx" ON "RuleCompliance"("complies");

-- CreateIndex
CREATE UNIQUE INDEX "RuleCompliance_ruleId_componentId_reportingPeriod_key" ON "RuleCompliance"("ruleId", "componentId", "reportingPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "RuleCompliance_organizationId_ruleId_componentId_reportingP_key" ON "RuleCompliance"("organizationId", "ruleId", "componentId", "reportingPeriod");

-- CreateIndex
CREATE INDEX "AIUsageLog_organizationId_createdAt_idx" ON "AIUsageLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AIUsageLog_userId_createdAt_idx" ON "AIUsageLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AIUsageLog_feature_idx" ON "AIUsageLog"("feature");

-- CreateIndex
CREATE INDEX "AIUsageLog_createdAt_idx" ON "AIUsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "AIUsageQuota_organizationId_idx" ON "AIUsageQuota"("organizationId");

-- CreateIndex
CREATE INDEX "AIUsageQuota_year_month_idx" ON "AIUsageQuota"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "AIUsageQuota_organizationId_year_month_key" ON "AIUsageQuota"("organizationId", "year", "month");

-- CreateIndex
CREATE INDEX "AIConversation_organizationId_sessionId_createdAt_idx" ON "AIConversation"("organizationId", "sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "AIConversation_userId_createdAt_idx" ON "AIConversation"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AIConversation_sessionId_idx" ON "AIConversation"("sessionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_parentDocumentId_fkey" FOREIGN KEY ("parentDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDocument" ADD CONSTRAINT "AssetDocument_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDocument" ADD CONSTRAINT "AssetDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompliancePlan" ADD CONSTRAINT "CompliancePlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompliancePlan" ADD CONSTRAINT "CompliancePlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompliancePlan" ADD CONSTRAINT "CompliancePlan_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompliancePlanDocument" ADD CONSTRAINT "CompliancePlanDocument_compliancePlanId_fkey" FOREIGN KEY ("compliancePlanId") REFERENCES "CompliancePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompliancePlanDocument" ADD CONSTRAINT "CompliancePlanDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetCompliancePlan" ADD CONSTRAINT "AssetCompliancePlan_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetCompliancePlan" ADD CONSTRAINT "AssetCompliancePlan_compliancePlanId_fkey" FOREIGN KEY ("compliancePlanId") REFERENCES "CompliancePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceScore" ADD CONSTRAINT "ComplianceScore_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterSupplyComponent" ADD CONSTRAINT "WaterSupplyComponent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterQualityTest" ADD CONSTRAINT "WaterQualityTest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterQualityTest" ADD CONSTRAINT "WaterQualityTest_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "WaterSupplyComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterQualityTest" ADD CONSTRAINT "WaterQualityTest_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ComplianceRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleCompliance" ADD CONSTRAINT "RuleCompliance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleCompliance" ADD CONSTRAINT "RuleCompliance_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ComplianceRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleCompliance" ADD CONSTRAINT "RuleCompliance_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "WaterSupplyComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsageLog" ADD CONSTRAINT "AIUsageLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsageLog" ADD CONSTRAINT "AIUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsageQuota" ADD CONSTRAINT "AIUsageQuota_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
