import { z } from 'zod';

export const compliancePlanSchema = z.object({
  title: z.string().min(1, 'Plan title is required'),
  description: z.string().optional(),
  planType: z.enum(['DWSP', 'WATER_SUPPLY_SAFETY_PLAN', 'RISK_MANAGEMENT_PLAN']),
  version: z.string().min(1, 'Version is required'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  waterSupplyDescription: z.string().min(1, 'Water supply description is required'),
  hazardIdentification: z.string().min(1, 'Hazard identification is required'),
  riskAssessment: z.string().min(1, 'Risk assessment is required'),
  preventiveMeasures: z.string().min(1, 'Preventive measures are required'),
  operationalMonitoring: z.string().min(1, 'Operational monitoring is required'),
  verificationMonitoring: z.string().min(1, 'Verification monitoring is required'),
  correctiveActions: z.string().min(1, 'Corrective actions are required'),
  multiBarrierApproach: z.string().min(1, 'Multi-barrier approach is required'),
  emergencyResponse: z.string().min(1, 'Emergency response is required'),
  residualDisinfection: z.string().min(1, 'Residual disinfection is required'),
  waterQuantityManagement: z.string().min(1, 'Water quantity management is required'),
  reviewProcedures: z.string().min(1, 'Review procedures are required'),
});

export const reportSchema = z.object({
  title: z.string().min(1, 'Report title is required'),
  reportType: z.enum([
    'MONTHLY_COMPLIANCE',
    'QUARTERLY_COMPLIANCE',
    'ANNUAL_COMPLIANCE',
    'INCIDENT_REPORT',
    'AUDIT_REPORT',
    'CUSTOM',
  ]),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  summary: z.string().optional(),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  dwspId: z.string().optional(),
});

export type CompliancePlanFormData = z.infer<typeof compliancePlanSchema>;
export type ReportFormData = z.infer<typeof reportSchema>;
