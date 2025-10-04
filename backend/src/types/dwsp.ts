/**
 * Drinking Water Safety Plan (DWSP) Types
 *
 * Based on Taumata Arowai regulatory requirements
 * 12 mandatory DWSP elements as per Water Services Act 2021
 */

/**
 * DWSP Element 1: Hazard Identification
 */
export interface Hazard {
  id: number;
  hazard: string; // Type of hazard
  source: string; // Where it comes from
  likelihood: 'Rare' | 'Unlikely' | 'Possible' | 'Likely' | 'Almost Certain';
  consequence: 'Insignificant' | 'Minor' | 'Moderate' | 'Major' | 'Catastrophic';
  riskRating: 'Low' | 'Medium' | 'High' | 'Extreme';
  notes?: string;
}

/**
 * DWSP Element 2: Risk Assessment
 */
export interface RiskAssessment {
  methodology: string; // e.g., "Taumata Arowai Risk Matrix"
  assessmentDate: string;
  nextAssessmentDate: string;
  assessor: string;
  notes?: string;
}

/**
 * DWSP Element 3: Preventive Measures / Control Measures
 */
export interface PreventiveMeasure {
  hazardId?: number; // Link to hazard
  hazard: string;
  controlMeasure: string;
  responsibility: string; // Who is responsible
  criticalLimit?: string; // What defines failure
  targetValue?: string;
  notes?: string;
}

/**
 * DWSP Element 4 & 5: Monitoring Procedures
 */
export interface MonitoringProcedure {
  parameter: string; // What to monitor
  location: string; // Where to monitor
  frequency: string; // How often
  method: string; // How to monitor
  responsibility: string; // Who monitors
  criticalLimit?: string;
  correctiveAction?: string;
}

/**
 * Operational Monitoring
 */
export interface OperationalMonitoring {
  parameters: string[];
  frequency: string;
  location: string;
  procedures: MonitoringProcedure[];
  notes?: string;
}

/**
 * Verification Monitoring
 */
export interface VerificationMonitoring {
  parameters: string[];
  frequency: string;
  laboratory?: string;
  procedures: MonitoringProcedure[];
  notes?: string;
}

/**
 * DWSP Element 6: Corrective Actions
 */
export interface CorrectiveAction {
  situation: string; // When does this apply
  action: string; // What to do
  responsibility: string; // Who does it
  timeline: string; // How quickly
  notification?: string; // Who to notify
  documentation?: string;
}

/**
 * DWSP Element 7: Multi-Barrier Approach
 */
export interface MultiBarrier {
  barrierType: 'Source Protection' | 'Treatment' | 'Distribution' | 'Monitoring';
  description: string;
  effectiveness: 'High' | 'Medium' | 'Low';
  validation?: string;
}

/**
 * DWSP Element 8: Emergency Response
 */
export interface EmergencyResponse {
  scenarioType: string;
  triggerConditions: string[];
  immediateActions: string[];
  notificationProcedure: string;
  responsiblePerson: string;
  contactDetails: string;
  communicationPlan?: string;
}

/**
 * DWSP Element 9: Residual Disinfection
 */
export interface ResidualDisinfection {
  method: 'Chlorination' | 'Chloramination' | 'UV' | 'Ozone' | 'Other';
  targetLevel: string;
  minimumLevel: string;
  monitoringFrequency: string;
  monitoringLocations: string[];
  exemptionReason?: string; // If exempted
}

/**
 * DWSP Element 10: Water Quantity
 */
export interface WaterQuantity {
  supplyCapacity: string; // e.g., "50,000 m³/day"
  peakDemand: string;
  storageCapacity: string;
  sufficientSupply: boolean;
  demandManagementPlan?: string;
  contingencyMeasures?: string[];
}

/**
 * DWSP Element 11: Source Water Risk Management
 */
export interface SourceWaterRiskManagement {
  sourceType: 'Surface Water' | 'Groundwater' | 'Mixed';
  sourceLocation: string;
  catchmentArea?: string;
  identifiedRisks: string[];
  protectionMeasures: string[];
  monitoringPlan: string;
  contingencyPlan?: string;
}

/**
 * DWSP Element 12: Review and Amendment Procedures
 */
export interface ReviewProcedures {
  reviewFrequency: string; // e.g., "Annual"
  reviewTriggers: string[]; // What triggers a review
  reviewProcess: string;
  amendmentProcess: string;
  versionControl: string;
  documentDistribution?: string;
}

/**
 * Complete DWSP Structure
 */
export interface DWSPContent {
  // Required Elements (12 total)
  waterSupplyDescription?: {
    supplyName: string;
    supplyPopulation: number;
    sourceTypes: string[];
    treatmentProcesses: string[];
    distributionSystem?: string;
  };

  // 1. Hazard Identification
  hazards?: Hazard[];

  // 2. Risk Assessment
  riskAssessment?: RiskAssessment;

  // 3. Preventive Measures
  preventiveMeasures?: PreventiveMeasure[];

  // 4. Operational Monitoring
  operationalMonitoring?: OperationalMonitoring;

  // 5. Verification Monitoring
  verificationMonitoring?: VerificationMonitoring;

  // 6. Corrective Actions
  correctiveActions?: CorrectiveAction[];

  // 7. Multi-Barrier Approach
  multiBarriers?: MultiBarrier[];

  // 8. Emergency Response
  emergencyResponses?: EmergencyResponse[];

  // 9. Residual Disinfection
  residualDisinfection?: ResidualDisinfection;

  // 10. Water Quantity
  waterQuantity?: WaterQuantity;

  // 11. Source Water Risk Management (if applicable)
  sourceWaterRiskManagement?: SourceWaterRiskManagement;

  // 12. Review and Amendment
  reviewProcedures?: ReviewProcedures;

  // Management and Communication
  managementProcedures?: {
    documentControl: string;
    training: string;
    incidents: string;
    stakeholderEngagement?: string;
  };

  // Additional metadata
  communicationPlan?: {
    internalCommunication: string;
    externalCommunication: string;
    emergencyCommunication: string;
  };
}

/**
 * DWSP Create/Update Request
 */
export interface CreateDWSPRequest {
  title: string;
  description?: string;
  waterSupplyName: string;
  supplyPopulation: number;
  sourceTypes: string[];
  treatmentProcesses: string[];

  // DWSP content (12 required elements)
  hazards?: Hazard[];
  riskAssessments?: RiskAssessment;
  preventiveMeasures?: PreventiveMeasure[];
  operationalMonitoring?: OperationalMonitoring;
  verificationMonitoring?: VerificationMonitoring;
  correctiveActions?: CorrectiveAction[];
  multiBarriers?: MultiBarrier[];
  emergencyResponses?: EmergencyResponse[];
  residualDisinfection?: ResidualDisinfection;
  waterQuantity?: WaterQuantity;
  sourceWaterRiskManagement?: SourceWaterRiskManagement;
  reviewProcedures?: ReviewProcedures;
  managementProcedures?: any;
  communicationPlan?: any;

  // Related resources
  assetIds?: string[]; // Link to assets
  documentIds?: string[]; // Link to documents
}

/**
 * DWSP Submission to Taumata Arowai
 */
export interface SubmitDWSPRequest {
  submittedBy: string;
  reason?: string;
  notifyContacts?: string[]; // Email addresses to notify
}

/**
 * DWSP Approval
 */
export interface ApproveDWSPRequest {
  approvedBy: string;
  approvalNotes?: string;
}

/**
 * DWSP Validation Result
 */
export interface DWSPValidation {
  isValid: boolean;
  missingElements: string[];
  warnings: string[];
  errors: string[];
}
