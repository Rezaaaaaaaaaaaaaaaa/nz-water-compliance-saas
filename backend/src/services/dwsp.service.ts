/**
 * DWSP (Drinking Water Safety Plan) Service
 *
 * Business logic for managing DWSPs according to Taumata Arowai requirements
 */

import { PrismaClient, CompliancePlanStatus, CompliancePlanType } from '@prisma/client';
import { CreateDWSPRequest, DWSPValidation } from '../types/dwsp.js';
import { AuthenticatedUser } from '../types/auth.js';
import * as auditService from './audit.service.js';

const prisma = new PrismaClient();

/**
 * Validate DWSP completeness
 * Checks for all 12 required elements
 */
export function validateDWSP(dwsp: any): DWSPValidation {
  const missingElements: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check required elements
  if (!dwsp.hazards || dwsp.hazards.length === 0) {
    missingElements.push('1. Hazard Identification');
  }

  if (!dwsp.riskAssessments) {
    missingElements.push('2. Risk Assessment');
  }

  if (!dwsp.preventiveMeasures || dwsp.preventiveMeasures.length === 0) {
    missingElements.push('3. Preventive Measures / Control Measures');
  }

  if (!dwsp.operationalMonitoring) {
    missingElements.push('4. Operational Monitoring');
  }

  if (!dwsp.verificationMonitoring) {
    missingElements.push('5. Verification Monitoring');
  }

  if (!dwsp.correctiveActions || dwsp.correctiveActions.length === 0) {
    missingElements.push('6. Corrective Actions');
  }

  // Multi-barrier approach (Element 7)
  if (!dwsp.treatmentProcesses || dwsp.treatmentProcesses.length < 2) {
    warnings.push('Multi-barrier approach: Consider implementing multiple treatment barriers');
  }

  if (!dwsp.emergencyResponses) {
    missingElements.push('8. Emergency Response Procedures');
  }

  if (!dwsp.residualDisinfection) {
    missingElements.push('9. Residual Disinfection (or exemption)');
  }

  if (!dwsp.waterQuantity) {
    missingElements.push('10. Water Quantity Planning');
  }

  // Source water risk management (Element 11 - conditional)
  const hasSurfaceWater = dwsp.sourceTypes?.includes('SURFACE_WATER') || dwsp.sourceTypes?.includes('Surface Water');
  if (hasSurfaceWater && !dwsp.sourceWaterRiskManagement) {
    missingElements.push('11. Source Water Risk Management Plan (required for surface water sources)');
  }

  if (!dwsp.reviewProcedures) {
    missingElements.push('12. Review and Amendment Procedures');
  }

  // Additional validation
  if (!dwsp.waterSupplyName) {
    errors.push('Water supply name is required');
  }

  if (!dwsp.supplyPopulation || dwsp.supplyPopulation < 26) {
    errors.push('Supply population must be 26 or more (DWSP requirement)');
  }

  return {
    isValid: missingElements.length === 0 && errors.length === 0,
    missingElements,
    warnings,
    errors,
  };
}

/**
 * Create new DWSP
 */
export async function createDWSP(
  user: AuthenticatedUser,
  data: CreateDWSPRequest,
  request: any
) {
  // Validate DWSP
  const validation = validateDWSP(data);

  const dwsp = await prisma.compliancePlan.create({
    data: {
      organizationId: user.organizationId,
      planType: CompliancePlanType.DWSP,
      title: data.title,
      description: data.description,
      status: CompliancePlanStatus.DRAFT,
      version: '1.0',

      // Water Supply Info
      waterSupplyName: data.waterSupplyName,
      supplyPopulation: data.supplyPopulation,
      sourceTypes: data.sourceTypes,
      treatmentProcesses: data.treatmentProcesses,

      // 12 Required DWSP Elements
      hazards: data.hazards,
      riskAssessments: data.riskAssessments,
      preventiveMeasures: data.preventiveMeasures,
      operationalMonitoring: data.operationalMonitoring,
      verificationMonitoring: data.verificationMonitoring,
      correctiveActions: data.correctiveActions,
      managementProcedures: data.managementProcedures,
      communicationPlan: data.communicationPlan,

      // Review schedule (Element 12)
      nextReviewDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from now
    },
  });

  // Link assets
  if (data.assetIds && data.assetIds.length > 0) {
    await prisma.assetCompliancePlan.createMany({
      data: data.assetIds.map((assetId) => ({
        assetId,
        compliancePlanId: dwsp.id,
      })),
    });
  }

  // Link documents
  if (data.documentIds && data.documentIds.length > 0) {
    await prisma.compliancePlanDocument.createMany({
      data: data.documentIds.map((documentId) => ({
        documentId,
        compliancePlanId: dwsp.id,
      })),
    });
  }

  // Audit log
  await auditService.auditCreate(user, 'CompliancePlan', dwsp.id, dwsp, request);

  return {
    dwsp,
    validation,
  };
}

/**
 * Get DWSP by ID
 */
export async function getDWSP(id: string, user: AuthenticatedUser) {
  const dwsp = await prisma.compliancePlan.findFirst({
    where: {
      id,
      deletedAt: null,
      // User can only access their org's plans (unless Auditor/Admin)
      ...(user.role !== 'AUDITOR' && user.role !== 'SYSTEM_ADMIN'
        ? { organizationId: user.organizationId }
        : {}),
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      assets: {
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              type: true,
              assetCode: true,
            },
          },
        },
      },
      documents: {
        include: {
          document: {
            select: {
              id: true,
              title: true,
              documentType: true,
              version: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  return dwsp;
}

/**
 * List DWSPs for organization
 */
export async function listDWSPs(
  user: AuthenticatedUser,
  filters: {
    status?: CompliancePlanStatus;
    limit?: number;
    offset?: number;
  }
) {
  const where: any = {
    planType: CompliancePlanType.DWSP,
    deletedAt: null,
  };

  // Filter by organization (unless Auditor/Admin)
  if (user.role !== 'AUDITOR' && user.role !== 'SYSTEM_ADMIN') {
    where.organizationId = user.organizationId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  const [plans, total] = await Promise.all([
    prisma.compliancePlan.findMany({
      where,
      take: filters.limit || 50,
      skip: filters.offset || 0,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.compliancePlan.count({ where }),
  ]);

  return {
    plans,
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  };
}

/**
 * Update DWSP
 */
export async function updateDWSP(
  id: string,
  user: AuthenticatedUser,
  data: Partial<CreateDWSPRequest>,
  request: any
) {
  // Get existing plan
  const existing = await getDWSP(id, user);
  if (!existing) {
    throw new Error('DWSP not found');
  }

  // Can't update if submitted or approved
  if (existing.status === CompliancePlanStatus.SUBMITTED ||
      existing.status === CompliancePlanStatus.ACCEPTED) {
    throw new Error('Cannot update submitted or accepted DWSP. Create a new version instead.');
  }

  const updated = await prisma.compliancePlan.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      waterSupplyName: data.waterSupplyName,
      supplyPopulation: data.supplyPopulation,
      sourceTypes: data.sourceTypes,
      treatmentProcesses: data.treatmentProcesses,
      hazards: data.hazards,
      riskAssessments: data.riskAssessments,
      preventiveMeasures: data.preventiveMeasures,
      operationalMonitoring: data.operationalMonitoring,
      verificationMonitoring: data.verificationMonitoring,
      correctiveActions: data.correctiveActions,
      managementProcedures: data.managementProcedures,
      communicationPlan: data.communicationPlan,
      updatedAt: new Date(),
    },
  });

  // Audit log
  await auditService.auditUpdate(user, 'CompliancePlan', id, existing, updated, request);

  return updated;
}

/**
 * Submit DWSP to Taumata Arowai
 * CRITICAL: Only Compliance Managers can submit (regulatory requirement)
 */
export async function submitDWSP(
  id: string,
  user: AuthenticatedUser,
  request: any
) {
  const dwsp = await getDWSP(id, user);
  if (!dwsp) {
    throw new Error('DWSP not found');
  }

  // Validate completeness
  const validation = validateDWSP(dwsp);
  if (!validation.isValid) {
    throw new Error(
      `DWSP is incomplete. Missing: ${validation.missingElements.join(', ')}`
    );
  }

  // Can only submit if APPROVED
  if (dwsp.status !== CompliancePlanStatus.APPROVED) {
    throw new Error('DWSP must be approved before submission');
  }

  const submitted = await prisma.compliancePlan.update({
    where: { id },
    data: {
      status: CompliancePlanStatus.SUBMITTED,
      submittedAt: new Date(),
      submittedBy: user.id,
    },
  });

  // Audit log (critical for regulatory compliance)
  await auditService.auditSubmit(
    user,
    'CompliancePlan',
    id,
    request,
    'Submitted to Taumata Arowai via Hinekōrako platform'
  );

  // TODO: Integration with Hinekōrako platform (Taumata Arowai's submission system)
  // This would involve API call to submit the DWSP

  return submitted;
}

/**
 * Approve DWSP
 * Only Compliance Managers and Org Admins can approve
 */
export async function approveDWSP(
  id: string,
  user: AuthenticatedUser,
  notes: string | undefined,
  request: any
) {
  const dwsp = await getDWSP(id, user);
  if (!dwsp) {
    throw new Error('DWSP not found');
  }

  if (dwsp.status !== CompliancePlanStatus.IN_REVIEW) {
    throw new Error('DWSP must be in review status to approve');
  }

  const approved = await prisma.compliancePlan.update({
    where: { id },
    data: {
      status: CompliancePlanStatus.APPROVED,
      approvedBy: user.id,
      approvedAt: new Date(),
      approvalNotes: notes,
    },
  });

  // Audit log
  await auditService.auditApprove(user, 'CompliancePlan', id, request, notes);

  return approved;
}

/**
 * Delete DWSP (soft delete)
 */
export async function deleteDWSP(
  id: string,
  user: AuthenticatedUser,
  request: any
) {
  const dwsp = await getDWSP(id, user);
  if (!dwsp) {
    throw new Error('DWSP not found');
  }

  // Can't delete submitted plans
  if (dwsp.status === CompliancePlanStatus.SUBMITTED ||
      dwsp.status === CompliancePlanStatus.ACCEPTED) {
    throw new Error('Cannot delete submitted or accepted DWSP');
  }

  const deleted = await prisma.compliancePlan.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  // Audit log
  await auditService.auditDelete(user, 'CompliancePlan', id, dwsp, request, 'DWSP soft deleted');

  return deleted;
}
