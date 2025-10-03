/**
 * DWSP Service Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import * as dwspService from '../../services/dwsp.service.js';

describe('DWSP Service', () => {
  describe('validateDWSP', () => {
    it('should validate a complete DWSP with all 12 elements', () => {
      const completeDWSP = {
        waterSupplyDescription: {
          supplyName: 'Test Supply',
          supplyType: 'MUNICIPAL',
          population: 10000,
        },
        hazards: [
          {
            hazard: 'Microbial contamination',
            source: 'Surface water',
            likelihood: 'Possible',
            consequence: 'Major',
            riskRating: 'High',
          },
        ],
        riskAssessment: {
          summary: 'Comprehensive risk assessment completed',
        },
        preventiveMeasures: [
          {
            measure: 'UV disinfection',
            hazardAddressed: 'Microbial contamination',
          },
        ],
        operationalMonitoring: {
          summary: 'Daily monitoring procedures',
        },
        verificationMonitoring: {
          summary: 'Monthly testing program',
        },
        correctiveActions: [
          {
            trigger: 'High turbidity',
            action: 'Increase coagulation',
          },
        ],
        multiBarrierApproach: {
          description: 'Multiple barriers in place',
        },
        emergencyResponse: {
          procedures: 'Emergency contact list maintained',
        },
        residualDisinfection: {
          details: 'Chlorine residual maintained',
        },
        waterQuantity: {
          management: 'Flow monitoring in place',
        },
        reviewProcedures: {
          schedule: 'Annual review scheduled',
        },
      };

      const validation = dwspService.validateDWSP(completeDWSP);

      expect(validation.isValid).toBe(true);
      expect(validation.missingElements).toHaveLength(0);
      expect(validation.errors).toHaveLength(0);
    });

    it('should identify missing water supply description', () => {
      const incompleteDWSP = {
        hazards: [],
        riskAssessment: {},
      };

      const validation = dwspService.validateDWSP(incompleteDWSP);

      expect(validation.isValid).toBe(false);
      expect(validation.missingElements).toContain(
        '1. Water Supply Description'
      );
    });

    it('should identify missing hazard identification', () => {
      const incompleteDWSP = {
        waterSupplyDescription: {
          supplyName: 'Test',
        },
        hazards: [],
      };

      const validation = dwspService.validateDWSP(incompleteDWSP);

      expect(validation.isValid).toBe(false);
      expect(validation.missingElements).toContain('2. Hazard Identification');
    });

    it('should identify missing risk assessment', () => {
      const incompleteDWSP = {
        waterSupplyDescription: { supplyName: 'Test' },
        hazards: [{ hazard: 'Test' }],
        riskAssessment: {},
      };

      const validation = dwspService.validateDWSP(incompleteDWSP);

      expect(validation.isValid).toBe(false);
      expect(validation.missingElements).toContain('3. Risk Assessment');
    });

    it('should identify all missing elements in empty DWSP', () => {
      const emptyDWSP = {};

      const validation = dwspService.validateDWSP(emptyDWSP);

      expect(validation.isValid).toBe(false);
      expect(validation.missingElements.length).toBeGreaterThan(0);
      expect(validation.missingElements).toContain(
        '1. Water Supply Description'
      );
      expect(validation.missingElements).toContain('2. Hazard Identification');
      expect(validation.missingElements).toContain('3. Risk Assessment');
    });

    it('should warn about incomplete water supply description', () => {
      const dwsp = {
        waterSupplyDescription: {
          supplyName: 'Test',
          // Missing supplyType and population
        },
        hazards: [{ hazard: 'Test' }],
        riskAssessment: { summary: 'Test' },
        preventiveMeasures: [{ measure: 'Test' }],
        operationalMonitoring: { summary: 'Test' },
        verificationMonitoring: { summary: 'Test' },
        correctiveActions: [{ trigger: 'Test' }],
        multiBarrierApproach: { description: 'Test' },
        emergencyResponse: { procedures: 'Test' },
        residualDisinfection: { details: 'Test' },
        waterQuantity: { management: 'Test' },
        reviewProcedures: { schedule: 'Test' },
      };

      const validation = dwspService.validateDWSP(dwsp);

      expect(validation.warnings.length).toBeGreaterThan(0);
    });

    it('should validate all 12 mandatory elements are checked', () => {
      const validation = dwspService.validateDWSP({});

      // Should check all 12 elements
      const expectedElements = [
        'Water Supply Description',
        'Hazard Identification',
        'Risk Assessment',
        'Preventive Measures',
        'Operational Monitoring',
        'Verification Monitoring',
        'Corrective Actions',
        'Multi-Barrier Approach',
        'Emergency Response',
        'Residual Disinfection',
        'Water Quantity',
        'Review Procedures',
      ];

      expectedElements.forEach((element) => {
        const found = validation.missingElements.some((missing) =>
          missing.includes(element)
        );
        expect(found).toBe(true);
      });
    });
  });

  describe('DWSP Compliance Requirements', () => {
    it('should enforce minimum hazard count', () => {
      const dwsp = {
        waterSupplyDescription: { supplyName: 'Test' },
        hazards: [], // Empty hazards
        riskAssessment: { summary: 'Test' },
        preventiveMeasures: [{ measure: 'Test' }],
        operationalMonitoring: { summary: 'Test' },
        verificationMonitoring: { summary: 'Test' },
        correctiveActions: [{ trigger: 'Test' }],
        multiBarrierApproach: { description: 'Test' },
        emergencyResponse: { procedures: 'Test' },
        residualDisinfection: { details: 'Test' },
        waterQuantity: { management: 'Test' },
        reviewProcedures: { schedule: 'Test' },
      };

      const validation = dwspService.validateDWSP(dwsp);

      expect(validation.isValid).toBe(false);
      expect(validation.missingElements).toContain('2. Hazard Identification');
    });

    it('should require at least one preventive measure', () => {
      const dwsp = {
        waterSupplyDescription: { supplyName: 'Test' },
        hazards: [{ hazard: 'Test' }],
        riskAssessment: { summary: 'Test' },
        preventiveMeasures: [], // Empty
        operationalMonitoring: { summary: 'Test' },
        verificationMonitoring: { summary: 'Test' },
        correctiveActions: [{ trigger: 'Test' }],
        multiBarrierApproach: { description: 'Test' },
        emergencyResponse: { procedures: 'Test' },
        residualDisinfection: { details: 'Test' },
        waterQuantity: { management: 'Test' },
        reviewProcedures: { schedule: 'Test' },
      };

      const validation = dwspService.validateDWSP(dwsp);

      expect(validation.isValid).toBe(false);
      expect(validation.missingElements).toContain('4. Preventive Measures');
    });
  });
});
