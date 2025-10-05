/**
 * Compliance Scoring Service Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Prisma
const mockPrisma = {
  compliancePlan: {
    count: jest.fn() as any,
    findFirst: jest.fn() as any,
  },
  asset: {
    count: jest.fn() as any,
  },
  document: {
    count: jest.fn() as any,
    findMany: jest.fn() as any,
    findFirst: jest.fn() as any,
  },
  complianceScore: {
    create: jest.fn() as any,
    findMany: jest.fn() as any,
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  AssetCondition: {
    VERY_POOR: 'VERY_POOR',
    POOR: 'POOR',
    FAIR: 'FAIR',
    GOOD: 'GOOD',
    EXCELLENT: 'EXCELLENT',
  },
  RiskLevel: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  },
}));

const organizationId = 'test-org-123';

describe('Compliance Scoring Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateComplianceScore', () => {
    it('should calculate perfect score (100) for ideal compliance', async () => {
      // Mock perfect compliance data
      mockPrisma.compliancePlan.count
        .mockResolvedValueOnce(1) // Approved DWSP
        .mockResolvedValueOnce(0) // No overdue
        .mockResolvedValueOnce(0); // No items due soon

      mockPrisma.compliancePlan.findFirst.mockResolvedValue({
        reviewDate: new Date(),
        status: 'APPROVED',
      });

      // Perfect asset management
      mockPrisma.asset.count
        .mockResolvedValueOnce(100) // Total assets
        .mockResolvedValueOnce(0) // No critical
        .mockResolvedValueOnce(0) // No very poor
        .mockResolvedValueOnce(80); // 80% inspected

      // Good documentation
      mockPrisma.document.count
        .mockResolvedValueOnce(100); // Total docs

      mockPrisma.document.findMany.mockResolvedValue([
        { type: 'DWSP', uploadedAt: new Date() },
        { type: 'REPORT', uploadedAt: new Date() },
        { type: 'PROCEDURE', uploadedAt: new Date() },
        { type: 'CERTIFICATE', uploadedAt: new Date() },
      ]);

      // Recent reports
      mockPrisma.compliancePlan.count
        .mockResolvedValueOnce(1) // Annual this year
        .mockResolvedValueOnce(1) // Annual last year
        .mockResolvedValueOnce(4) // All quarterly reports
        .mockResolvedValueOnce(3); // Monthly reports

      // Risk data
      mockPrisma.document.count
        .mockResolvedValueOnce(5); // Risk assessments

      mockPrisma.document.findFirst.mockResolvedValue({
        uploadedAt: new Date(),
      });

      mockPrisma.compliancePlan.count
        .mockResolvedValueOnce(0); // No incidents

      // Historical scores
      mockPrisma.complianceScore.findMany.mockResolvedValue([]);

      mockPrisma.complianceScore.create.mockResolvedValue({
        id: '1',
        organizationId,
        overallScore: 100,
      });

      const { calculateComplianceScore } = await import(
        '../../services/compliance-scoring.service.js'
      );

      const result = await calculateComplianceScore(organizationId);

      expect(result.overall).toBeGreaterThanOrEqual(95);
      expect(result.overall).toBeLessThanOrEqual(100);
      expect(result.trend).toBe('unknown'); // No historical data
    });

    it('should return score of 0 for no DWSP', async () => {
      // No approved DWSP
      mockPrisma.compliancePlan.count.mockResolvedValue(0);
      mockPrisma.compliancePlan.findFirst.mockResolvedValue(null);
      mockPrisma.asset.count.mockResolvedValue(0);
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.document.findFirst.mockResolvedValue(null);
      mockPrisma.complianceScore.findMany.mockResolvedValue([]);
      mockPrisma.complianceScore.create.mockResolvedValue({
        id: '1',
        organizationId,
        overallScore: 0,
      });

      const { calculateComplianceScore } = await import(
        '../../services/compliance-scoring.service.js'
      );

      const result = await calculateComplianceScore(organizationId);

      expect(result.overall).toBeLessThan(50); // Severe penalty for no DWSP
      expect(result.breakdown.dwspCompliance.score).toBe(0);
    });

    it('should penalize for overdue items', async () => {
      // Setup minimal compliance
      mockPrisma.compliancePlan.count
        .mockResolvedValueOnce(1) // Approved DWSP
        .mockResolvedValueOnce(10) // 10 overdue items
        .mockResolvedValueOnce(0);

      mockPrisma.compliancePlan.findFirst.mockResolvedValue({
        reviewDate: new Date(),
        status: 'APPROVED',
      });

      mockPrisma.asset.count.mockResolvedValue(100);
      mockPrisma.document.count.mockResolvedValue(100);
      mockPrisma.document.findMany.mockResolvedValue([
        { type: 'DWSP', uploadedAt: new Date() },
      ]);
      mockPrisma.document.findFirst.mockResolvedValue({
        uploadedAt: new Date(),
      });
      mockPrisma.complianceScore.findMany.mockResolvedValue([]);
      mockPrisma.complianceScore.create.mockResolvedValue({
        id: '1',
        organizationId,
        overallScore: 50,
      });

      const { calculateComplianceScore } = await import(
        '../../services/compliance-scoring.service.js'
      );

      const result = await calculateComplianceScore(organizationId);

      expect(result.breakdown.timeliness.score).toBeLessThan(100);
    });

    it('should generate critical recommendations for missing DWSP', async () => {
      mockPrisma.compliancePlan.count.mockResolvedValue(0);
      mockPrisma.compliancePlan.findFirst.mockResolvedValue(null);
      mockPrisma.asset.count.mockResolvedValue(0);
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.document.findFirst.mockResolvedValue(null);
      mockPrisma.complianceScore.findMany.mockResolvedValue([]);
      mockPrisma.complianceScore.create.mockResolvedValue({
        id: '1',
        organizationId,
        overallScore: 0,
      });

      const { calculateComplianceScore } = await import(
        '../../services/compliance-scoring.service.js'
      );

      const result = await calculateComplianceScore(organizationId);

      const criticalRecs = result.recommendations.filter((r) => r.severity === 'critical');
      expect(criticalRecs.length).toBeGreaterThan(0);
      expect(criticalRecs[0].category).toBe('DWSP Compliance');
    });

    it('should calculate trend as improving when score increases', async () => {
      // Mock basic compliance
      mockPrisma.compliancePlan.count.mockResolvedValue(1);
      mockPrisma.compliancePlan.findFirst.mockResolvedValue({
        reviewDate: new Date(),
        status: 'APPROVED',
      });
      mockPrisma.asset.count.mockResolvedValue(100);
      mockPrisma.document.count.mockResolvedValue(100);
      mockPrisma.document.findMany.mockResolvedValue([
        { type: 'DWSP', uploadedAt: new Date() },
      ]);
      mockPrisma.document.findFirst.mockResolvedValue({
        uploadedAt: new Date(),
      });

      // Mock historical score lower than current
      mockPrisma.complianceScore.findMany.mockResolvedValue([
        { overallScore: 70 }, // Previous score was 70
      ]);

      mockPrisma.complianceScore.create.mockResolvedValue({
        id: '1',
        organizationId,
        overallScore: 80,
      });

      const { calculateComplianceScore } = await import(
        '../../services/compliance-scoring.service.js'
      );

      const result = await calculateComplianceScore(organizationId);

      expect(result.trend).toBe('improving');
    });

    it('should calculate trend as declining when score decreases', async () => {
      mockPrisma.compliancePlan.count.mockResolvedValue(1);
      mockPrisma.compliancePlan.findFirst.mockResolvedValue({
        reviewDate: new Date(),
        status: 'APPROVED',
      });
      mockPrisma.asset.count.mockResolvedValue(100);
      mockPrisma.document.count.mockResolvedValue(100);
      mockPrisma.document.findMany.mockResolvedValue([
        { type: 'DWSP', uploadedAt: new Date() },
      ]);
      mockPrisma.document.findFirst.mockResolvedValue({
        uploadedAt: new Date(),
      });

      // Mock historical score higher than current
      mockPrisma.complianceScore.findMany.mockResolvedValue([
        { overallScore: 90 }, // Previous score was 90
      ]);

      mockPrisma.complianceScore.create.mockResolvedValue({
        id: '1',
        organizationId,
        overallScore: 75,
      });

      const { calculateComplianceScore } = await import(
        '../../services/compliance-scoring.service.js'
      );

      const result = await calculateComplianceScore(organizationId);

      expect(result.trend).toBe('declining');
    });

    it('should have correct weighted scoring components', async () => {
      mockPrisma.compliancePlan.count.mockResolvedValue(1);
      mockPrisma.compliancePlan.findFirst.mockResolvedValue({
        reviewDate: new Date(),
        status: 'APPROVED',
      });
      mockPrisma.asset.count.mockResolvedValue(100);
      mockPrisma.document.count.mockResolvedValue(100);
      mockPrisma.document.findMany.mockResolvedValue([
        { type: 'DWSP', uploadedAt: new Date() },
      ]);
      mockPrisma.document.findFirst.mockResolvedValue({
        uploadedAt: new Date(),
      });
      mockPrisma.complianceScore.findMany.mockResolvedValue([]);
      mockPrisma.complianceScore.create.mockResolvedValue({
        id: '1',
        organizationId,
        overallScore: 80,
      });

      const { calculateComplianceScore } = await import(
        '../../services/compliance-scoring.service.js'
      );

      const result = await calculateComplianceScore(organizationId);

      const { breakdown } = result;

      // Verify weights
      expect(breakdown.dwspCompliance.weight).toBe(0.35);
      expect(breakdown.assetManagement.weight).toBe(0.2);
      expect(breakdown.documentationCompliance.weight).toBe(0.15);
      expect(breakdown.reportingCompliance.weight).toBe(0.15);
      expect(breakdown.riskManagement.weight).toBe(0.1);
      expect(breakdown.timeliness.weight).toBe(0.05);

      // Verify total weight = 1.0
      const totalWeight =
        breakdown.dwspCompliance.weight +
        breakdown.assetManagement.weight +
        breakdown.documentationCompliance.weight +
        breakdown.reportingCompliance.weight +
        breakdown.riskManagement.weight +
        breakdown.timeliness.weight;

      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    it('should save score to database', async () => {
      mockPrisma.compliancePlan.count.mockResolvedValue(1);
      mockPrisma.compliancePlan.findFirst.mockResolvedValue({
        reviewDate: new Date(),
        status: 'APPROVED',
      });
      mockPrisma.asset.count.mockResolvedValue(100);
      mockPrisma.document.count.mockResolvedValue(100);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.document.findFirst.mockResolvedValue(null);
      mockPrisma.complianceScore.findMany.mockResolvedValue([]);
      mockPrisma.complianceScore.create.mockResolvedValue({
        id: '1',
        organizationId,
        overallScore: 75,
      });

      const { calculateComplianceScore } = await import(
        '../../services/compliance-scoring.service.js'
      );

      await calculateComplianceScore(organizationId);

      expect(mockPrisma.complianceScore.create).toHaveBeenCalled();
      const createCall = (mockPrisma.complianceScore.create as any).mock.calls[0][0];
      expect(createCall.data.organizationId).toBe(organizationId);
      expect(createCall.data.overallScore).toBeGreaterThanOrEqual(0);
      expect(createCall.data.overallScore).toBeLessThanOrEqual(100);
    });
  });
});
