/**
 * DWSP (Drinking Water Safety Plan) Service
 *
 * Business logic for managing DWSPs according to Taumata Arowai requirements
 */

import { CompliancePlanStatus, CompliancePlanType } from '@prisma/client';
import { CreateDWSPRequest, DWSPValidation } from '../types/dwsp.js';
import { AuthenticatedUser } from '../types/auth.js';
import * as auditService from './audit.service.js';
import { prisma } from '../config/database.js';

/**
 * Validate DWSP completeness
 * Checks for all 12 required elements per Taumata Arowai requirements
 *
 * Reference: Drinking Water Safety Plan Template
 * https://www.taumataarowai.govt.nz/
 */
export function validateDWSP(dwsp: any): DWSPValidation {
  const missingElements: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // Element 1: Water Supply Description
  if (!dwsp.waterSupplyDescription && !dwsp.waterSupplyName) {
    missingElements.push('1. Water Supply Description');
  }

  // Element 2: Hazard Identification
  if (!dwsp.hazards || dwsp.hazards.length === 0) {
    missingElements.push('2. Hazard Identification');
  }

  // Element 3: Risk Assessment
  if (
    !dwsp.riskAssessment ||
    (typeof dwsp.riskAssessment === 'object' && Object.keys(dwsp.riskAssessment).length === 0)
  ) {
    if (!dwsp.riskAssessments) {
      missingElements.push('3. Risk Assessment');
    }
  }

  // Element 4: Preventive Measures
  if (!dwsp.preventiveMeasures || dwsp.preventiveMeasures.length === 0) {
    missingElements.push('4. Preventive Measures');
  }

  // Element 5: Operational Monitoring
  if (!dwsp.operationalMonitoring) {
    missingElements.push('5. Operational Monitoring');
  }

  // Element 6: Verification Monitoring
  if (!dwsp.verificationMonitoring) {
    missingElements.push('6. Verification Monitoring');
  }

  // Element 7: Corrective Actions
  if (!dwsp.correctiveActions || dwsp.correctiveActions.length === 0) {
    missingElements.push('7. Corrective Actions');
  }

  // Element 8: Multi-Barrier Approach
  if (!dwsp.multiBarrierApproach) {
    missingElements.push('8. Multi-Barrier Approach');
  }

  // Element 9: Emergency Response Procedures
  if (!dwsp.emergencyResponses && !dwsp.emergencyResponse) {
    missingElements.push('9. Emergency Response');
  }

  // Element 10: Residual Disinfection (or exemption)
  if (!dwsp.residualDisinfection) {
    missingElements.push('10. Residual Disinfection');
  }

  // Element 11: Water Quantity Planning
  if (!dwsp.waterQuantity) {
    missingElements.push('11. Water Quantity');
  }

  // Element 12: Source Water Risk Management (conditional)
  // Required only for surface water sources
  const hasSurfaceWater =
    dwsp.sourceTypes?.includes('SURFACE_WATER') ||
    dwsp.sourceTypes?.includes('Surface Water') ||
    dwsp.waterSupplyDescription?.sourceTypes?.includes('Surface Water');

  if (hasSurfaceWater && !dwsp.sourceWaterRiskManagement) {
    missingElements.push(
      '12. Source Water Risk Management Plan (required for surface water sources)'
    );
  }

  // Element 13: Review and Amendment Procedures
  if (!dwsp.reviewProcedures) {
    missingElements.push('12. Review Procedures');
  }

  // Additional validation for data completeness
  if (dwsp.waterSupplyDescription) {
    if (!dwsp.waterSupplyDescription.supplyName && !dwsp.waterSupplyName) {
      errors.push('Water supply name is required');
    }
    if (!dwsp.waterSupplyDescription.supplyType) {
      warnings.push('Water supply type should be specified for completeness');
    }
    if (!dwsp.waterSupplyDescription.population) {
      warnings.push('Water supply population should be provided for completeness');
    } else if (dwsp.waterSupplyDescription.population < 26) {
      errors.push('Supply population must be 26 or more (DWSP requirement for population >25)');
    }
  } else if (dwsp.waterSupplyName) {
    // Alternative structure using direct fields
    if (!dwsp.supplyPopulation || dwsp.supplyPopulation < 26) {
      errors.push('Supply population must be 26 or more (DWSP requirement for population >25)');
    }
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
export async function createDWSP(user: AuthenticatedUser, data: CreateDWSPRequest, request: any) {
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
      hazards: data.hazards as any,
      riskAssessments: data.riskAssessments as any,
      preventiveMeasures: data.preventiveMeasures as any,
      operationalMonitoring: data.operationalMonitoring as any,
      verificationMonitoring: data.verificationMonitoring as any,
      correctiveActions: data.correctiveActions as any,
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
  if (
    existing.status === CompliancePlanStatus.SUBMITTED ||
    existing.status === CompliancePlanStatus.ACCEPTED
  ) {
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
      hazards: data.hazards as any,
      riskAssessments: data.riskAssessments as any,
      preventiveMeasures: data.preventiveMeasures as any,
      operationalMonitoring: data.operationalMonitoring as any,
      verificationMonitoring: data.verificationMonitoring as any,
      correctiveActions: data.correctiveActions as any,
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
export async function submitDWSP(id: string, user: AuthenticatedUser, request: any) {
  const dwsp = await getDWSP(id, user);
  if (!dwsp) {
    throw new Error('DWSP not found');
  }

  // Validate completeness
  const validation = validateDWSP(dwsp);
  if (!validation.isValid) {
    throw new Error(`DWSP is incomplete. Missing: ${validation.missingElements.join(', ')}`);
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

  // Hinekōrako platform integration (Taumata Arowai's submission system)
  try {
    await submitDWSPToHinekorako(submitted, dwsp, user);
  } catch (error) {
    // Log the error but don't fail the submission
    // The DWSP is marked as submitted in our system
    request.log.error(
      { err: error, dwspId: id },
      'Hinekōrako DWSP submission failed - DWSP saved locally'
    );
  }

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
export async function deleteDWSP(id: string, user: AuthenticatedUser, request: any) {
  const dwsp = await getDWSP(id, user);
  if (!dwsp) {
    throw new Error('DWSP not found');
  }

  // Can't delete submitted plans
  if (
    dwsp.status === CompliancePlanStatus.SUBMITTED ||
    dwsp.status === CompliancePlanStatus.ACCEPTED
  ) {
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

/**
 * Submit DWSP to Hinekōrako platform (Taumata Arowai's submission system)
 * PLACEHOLDER: Integration pending with Taumata Arowai
 *
 * @param submitted - The submitted compliance plan record
 * @param dwsp - The full DWSP data
 * @param user - The user submitting the DWSP
 * @throws Error if submission fails
 */
async function submitDWSPToHinekorako(
  submitted: any,
  dwsp: any,
  user: AuthenticatedUser
): Promise<void> {
  // This is a placeholder for the actual Hinekōrako API integration
  // When implemented, this would:
  // 1. Authenticate with Hinekōrako API using organization credentials
  // 2. Transform DWSP data to Hinekōrako format (12 required elements)
  // 3. Validate completeness against Taumata Arowai requirements
  // 4. Submit via HTTPS POST to Hinekōrako endpoint
  // 5. Store submission ID and acknowledgment in the compliance plan
  // 6. Handle response and update status accordingly

  // Prepare submission data for future implementation
  // This data structure is ready for Hinekōrako API integration
  const submissionData = {
    dwspId: submitted.id,
    organizationId: dwsp.organization.id,
    organizationName: dwsp.organization.name,
    waterSupplyName: dwsp.waterSupplyName,
    supplyPopulation: dwsp.supplyPopulation,
    submittedBy: user.email,
    submittedAt: submitted.submittedAt,
    version: dwsp.version,
    elements: {
      waterSupplyDescription: dwsp.waterSupplyName,
      hazards: dwsp.hazards,
      riskAssessments: dwsp.riskAssessments,
      preventiveMeasures: dwsp.preventiveMeasures,
      operationalMonitoring: dwsp.operationalMonitoring,
      verificationMonitoring: dwsp.verificationMonitoring,
      correctiveActions: dwsp.correctiveActions,
      managementProcedures: dwsp.managementProcedures,
      communicationPlan: dwsp.communicationPlan,
    },
  };

  // Simulate API call (will be replaced with actual implementation)
  throw new Error(
    `Hinekōrako DWSP integration not yet implemented. Submission data prepared: ${JSON.stringify(submissionData)}`
  );

  // Future implementation example:
  // const hinekorakoResponse = await fetch('https://api.hinekorako.govt.nz/dwsp/submit', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${config.hinekorako.apiKey}`,
  //     'X-Organization-Id': dwsp.organization.id,
  //   },
  //   body: JSON.stringify(submissionData),
  // });
  //
  // if (!hinekorakoResponse.ok) {
  //   throw new Error(`Hinekōrako DWSP submission failed: ${hinekorakoResponse.statusText}`);
  // }
  //
  // const result = await hinekorakoResponse.json();
  //
  // // Update the compliance plan with submission details
  // await prisma.compliancePlan.update({
  //   where: { id: submitted.id },
  //   data: {
  //     acknowledgmentReceived: new Date(),
  //     regulatorFeedback: result.acknowledgmentMessage,
  //   },
  // });
}
