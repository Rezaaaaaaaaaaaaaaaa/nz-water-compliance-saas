/**
 * Analytics Service Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Prisma
const mockPrisma = {
  asset: {
    count: jest.fn() as any,
    groupBy: jest.fn() as any,
    findMany: jest.fn() as any,
  },
  compliancePlan: {
    count: jest.fn() as any,
    findMany: jest.fn() as any,
  },
  document: {
    count: jest.fn() as any,
    groupBy: jest.fn() as any,
    findMany: jest.fn() as any,
    aggregate: jest.fn() as any,
  },
  auditLog: {
    findMany: jest.fn() as any,
    groupBy: jest.fn() as any,
  },
  user: {
    findMany: jest.fn() as any,
    count: jest.fn() as any,
  },
  organization: {
    count: jest.fn() as any,
    findMany: jest.fn() as any,
  },
  complianceScore: {
    findMany: jest.fn() as any,
  },
};

// Mock the analytics service with mocked Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  RiskLevel: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  },
  AssetCondition: {
    EXCELLENT: 'EXCELLENT',
    GOOD: 'GOOD',
    FAIR: 'FAIR',
    POOR: 'POOR',
    VERY_POOR: 'VERY_POOR',
  },
}));

const organizationId = 'test-org-123';

describe('Analytics Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getComplianceOverview', () => {
    it('should calculate compliance overview with all metrics', async () => {
      // Mock data
      mockPrisma.asset.count
        .mockResolvedValueOnce(100) // totalAssets
        .mockResolvedValueOnce(15); // criticalAssets

      mockPrisma.compliancePlan.count
        .mockResolvedValueOnce(3) // activeDWSPs
        .mockResolvedValueOnce(5) // pendingReports
        .mockResolvedValueOnce(2) // overdueItems
        .mockResolvedValueOnce(1); // recentIncidents

      const { getComplianceOverview } = await import('../../services/analytics.service.js');

      const result = await getComplianceOverview(organizationId);

      expect(result).toHaveProperty('totalAssets', 100);
      expect(result).toHaveProperty('criticalAssets', 15);
      expect(result).toHaveProperty('activeDWSPs', 3);
      expect(result).toHaveProperty('pendingReports', 5);
      expect(result).toHaveProperty('overdueItems', 2);
      expect(result).toHaveProperty('recentIncidents', 1);
      expect(result).toHaveProperty('complianceScore');
      expect(result.complianceScore).toBeGreaterThanOrEqual(0);
      expect(result.complianceScore).toBeLessThanOrEqual(100);
    });

    it('should calculate compliance score of 100 for perfect compliance', async () => {
      mockPrisma.asset.count.mockResolvedValueOnce(100).mockResolvedValueOnce(0); // No critical assets

      mockPrisma.compliancePlan.count
        .mockResolvedValueOnce(2) // activeDWSPs
        .mockResolvedValueOnce(0) // No pending reports
        .mockResolvedValueOnce(0) // No overdue items
        .mockResolvedValueOnce(0); // No incidents

      const { getComplianceOverview } = await import('../../services/analytics.service.js');

      const result = await getComplianceOverview(organizationId);

      expect(result.complianceScore).toBe(100);
    });

    it('should penalize score for missing DWSP', async () => {
      mockPrisma.asset.count.mockResolvedValue(100);
      mockPrisma.compliancePlan.count.mockResolvedValue(0); // No DWSPs

      const { getComplianceOverview } = await import('../../services/analytics.service.js');

      const result = await getComplianceOverview(organizationId);

      expect(result.complianceScore).toBeLessThanOrEqual(60); // Major penalty
    });

    it('should penalize score for overdue items', async () => {
      mockPrisma.asset.count.mockResolvedValue(100);
      mockPrisma.compliancePlan.count
        .mockResolvedValueOnce(2) // activeDWSPs
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(10) // 10 overdue items
        .mockResolvedValueOnce(0);

      const { getComplianceOverview } = await import('../../services/analytics.service.js');

      const result = await getComplianceOverview(organizationId);

      expect(result.complianceScore).toBeLessThanOrEqual(70); // Penalty for overdue
    });
  });

  describe('getAssetAnalytics', () => {
    it('should return asset analytics with all breakdowns', async () => {
      mockPrisma.asset.groupBy
        .mockResolvedValueOnce([
          { riskLevel: 'LOW', _count: 50 },
          { riskLevel: 'MEDIUM', _count: 30 },
          { riskLevel: 'HIGH', _count: 15 },
          { riskLevel: 'CRITICAL', _count: 5 },
        ])
        .mockResolvedValueOnce([
          { condition: 'EXCELLENT', _count: 40 },
          { condition: 'GOOD', _count: 35 },
          { condition: 'FAIR', _count: 20 },
          { condition: 'POOR', _count: 5 },
        ])
        .mockResolvedValueOnce([
          { type: 'PUMP', _count: 25 },
          { type: 'PIPE', _count: 50 },
          { type: 'TANK', _count: 25 },
        ]);

      mockPrisma.asset.findMany.mockResolvedValue([
        {
          id: '1',
          name: 'Critical Pump',
          type: 'PUMP',
          condition: 'POOR',
          riskLevel: 'CRITICAL',
          lastInspectionDate: new Date(),
        },
      ]);

      const { getAssetAnalytics } = await import('../../services/analytics.service.js');

      const result = await getAssetAnalytics(organizationId);

      expect(result).toHaveProperty('byRiskLevel');
      expect(result.byRiskLevel).toHaveLength(4);
      expect(result).toHaveProperty('byCondition');
      expect(result.byCondition).toHaveLength(4);
      expect(result).toHaveProperty('byType');
      expect(result.byType).toHaveLength(3);
      expect(result).toHaveProperty('criticalAssets');
      expect(Array.isArray(result.criticalAssets)).toBe(true);
    });
  });

  describe('getDocumentAnalytics', () => {
    it('should return document analytics with storage metrics', async () => {
      mockPrisma.document.count
        .mockResolvedValueOnce(250) // totalDocuments
        .mockResolvedValueOnce(45); // recentUploads

      mockPrisma.document.groupBy.mockResolvedValue([
        { type: 'DWSP', _count: 50 },
        { type: 'REPORT', _count: 100 },
        { type: 'PROCEDURE', _count: 75 },
        { type: 'CERTIFICATE', _count: 25 },
      ]);

      mockPrisma.document.aggregate.mockResolvedValue({
        _sum: { fileSize: 1073741824 }, // 1GB in bytes
      });

      const { getDocumentAnalytics } = await import('../../services/analytics.service.js');

      const result = await getDocumentAnalytics(organizationId);

      expect(result.totalDocuments).toBe(250);
      expect(result.recentUploads).toBe(45);
      expect(result.byType).toHaveLength(4);
      expect(result.storageUsedBytes).toBe(1073741824);
      expect(result.storageUsedMB).toBe(1024);
    });

    it('should handle zero storage gracefully', async () => {
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.groupBy.mockResolvedValue([]);
      mockPrisma.document.aggregate.mockResolvedValue({
        _sum: { fileSize: null },
      });

      const { getDocumentAnalytics } = await import('../../services/analytics.service.js');

      const result = await getDocumentAnalytics(organizationId);

      expect(result.totalDocuments).toBe(0);
      expect(result.storageUsedBytes).toBe(0);
      expect(result.storageUsedMB).toBe(0);
    });
  });

  describe('getDWSPTrends', () => {
    it('should return monthly DWSP trends', async () => {
      const now = new Date();
      mockPrisma.compliancePlan.findMany.mockResolvedValue([
        {
          submittedAt: new Date(now.getFullYear(), now.getMonth() - 1, 15),
          status: 'APPROVED',
        },
        {
          submittedAt: new Date(now.getFullYear(), now.getMonth() - 1, 20),
          status: 'APPROVED',
        },
        {
          submittedAt: new Date(now.getFullYear(), now.getMonth(), 5),
          status: 'IN_REVIEW',
        },
      ]);

      const { getDWSPTrends } = await import('../../services/analytics.service.js');

      const result = await getDWSPTrends(organizationId);

      expect(result).toHaveProperty('trends');
      expect(Array.isArray(result.trends)).toBe(true);
      expect(result.trends.length).toBeGreaterThan(0);
    });
  });

  describe('getUserActivitySummary', () => {
    it('should return user activity metrics', async () => {
      mockPrisma.auditLog.groupBy
        .mockResolvedValueOnce([
          { userId: 'user1', _count: 100 },
          { userId: 'user2', _count: 50 },
          { userId: 'user3', _count: 25 },
        ])
        .mockResolvedValueOnce([
          { userId: 'user1', _count: 100 },
          { userId: 'user2', _count: 50 },
          { userId: 'user3', _count: 25 },
          { userId: 'user4', _count: 10 },
          { userId: 'user5', _count: 5 },
        ]);

      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
        { id: 'user2', firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com' },
        { id: 'user3', firstName: 'Bob', lastName: 'Wilson', email: 'bob@test.com' },
        { id: 'user4', firstName: 'Alice', lastName: 'Brown', email: 'alice@test.com' },
        { id: 'user5', firstName: 'Charlie', lastName: 'Davis', email: 'charlie@test.com' },
      ]);

      const { getUserActivitySummary } = await import('../../services/analytics.service.js');

      const result = await getUserActivitySummary(organizationId);

      expect(result.activeUsersLast30Days).toBe(3);
      expect(result.topContributors).toHaveLength(5);
      expect(result.topContributors[0].activityCount).toBeGreaterThanOrEqual(
        result.topContributors[1].activityCount
      );
    });
  });

  describe('getSystemAnalytics', () => {
    it('should return system-wide analytics for admin', async () => {
      mockPrisma.organization.count.mockResolvedValue(50);
      mockPrisma.user.count.mockResolvedValue(250);
      mockPrisma.asset.count.mockResolvedValue(5000);
      mockPrisma.document.count.mockResolvedValue(10000);
      mockPrisma.compliancePlan.count.mockResolvedValue(75);
      mockPrisma.document.aggregate.mockResolvedValue({
        _sum: { fileSize: 10737418240 }, // 10GB
      });

      mockPrisma.organization.findMany.mockResolvedValue([
        { id: '1', name: 'Org 1', _count: { compliancePlans: 2 } },
        { id: '2', name: 'Org 2', _count: { compliancePlans: 0 } },
        { id: '3', name: 'Org 3', _count: { compliancePlans: 1 } },
      ]);

      const { getSystemAnalytics } = await import('../../services/analytics.service.js');

      const result = await getSystemAnalytics();

      expect(result.totalOrganizations).toBe(50);
      expect(result.totalUsers).toBe(250);
      expect(result.totalAssets).toBe(5000);
      expect(result.totalDocuments).toBe(10000);
      expect(result.activeDWSPs).toBe(75);
      expect(result.systemStorageGB).toBe(10);
      expect(result).toHaveProperty('complianceRate');
    });
  });

  describe('getDashboardData', () => {
    it('should return comprehensive dashboard data', async () => {
      // Mock all the individual functions
      mockPrisma.asset.count.mockResolvedValue(100);
      mockPrisma.asset.groupBy.mockResolvedValue([]);
      mockPrisma.asset.findMany.mockResolvedValue([]);
      mockPrisma.compliancePlan.count.mockResolvedValue(5);
      mockPrisma.compliancePlan.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(200);
      mockPrisma.document.groupBy.mockResolvedValue([]);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.document.aggregate.mockResolvedValue({ _sum: { fileSize: 0 } });
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.groupBy.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const { getDashboardData } = await import('../../services/analytics.service.js');

      const result = await getDashboardData(organizationId);

      expect(result).toHaveProperty('overview');
      expect(result).toHaveProperty('assets');
      expect(result).toHaveProperty('documents');
      expect(result).toHaveProperty('activity');
      expect(result).toHaveProperty('dwspTrends');
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('generatedAt');
      expect(result.generatedAt).toBeInstanceOf(Date);
    });
  });
});
