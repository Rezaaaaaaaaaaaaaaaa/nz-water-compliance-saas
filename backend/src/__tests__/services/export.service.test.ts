/**
 * Export Service Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Prisma
const mockPrisma = {
  asset: {
    findMany: jest.fn() as any,
  },
  document: {
    findMany: jest.fn() as any,
    count: jest.fn() as any,
  },
  compliancePlan: {
    findMany: jest.fn() as any,
  },
  auditLog: {
    findMany: jest.fn() as any,
  },
  organization: {
    findUnique: jest.fn() as any,
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

const organizationId = 'test-org-123';

describe('Export Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportAssetsToCSV', () => {
    it('should export assets to CSV format with headers', async () => {
      mockPrisma.asset.findMany.mockResolvedValue([
        {
          id: 'asset-1',
          name: 'Main Pump',
          type: 'PUMP',
          description: 'Primary water pump',
          location: 'Pump Station A',
          latitude: -41.2865,
          longitude: 174.7762,
          installationDate: new Date('2020-01-15'),
          condition: 'GOOD',
          riskLevel: 'LOW',
          isCritical: false,
          lastInspectionDate: new Date('2024-01-01'),
          nextInspectionDate: new Date('2024-07-01'),
          maintenanceSchedule: 'Quarterly',
          capacity: '500L/min',
          material: 'Stainless Steel',
          manufacturer: 'Pump Co',
          modelNumber: 'PC-500',
          serialNumber: 'SN-12345',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'asset-2',
          name: 'Storage Tank',
          type: 'TANK',
          description: null,
          location: null,
          latitude: null,
          longitude: null,
          installationDate: new Date('2019-05-20'),
          condition: 'FAIR',
          riskLevel: 'MEDIUM',
          isCritical: true,
          lastInspectionDate: null,
          nextInspectionDate: null,
          maintenanceSchedule: null,
          capacity: null,
          material: null,
          manufacturer: null,
          modelNumber: null,
          serialNumber: null,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ]);

      const { exportAssetsToCSV } = await import('../../services/export.service.js');

      const csv = await exportAssetsToCSV(organizationId);

      // Check headers
      expect(csv).toContain('ID,Name,Type,Description');
      expect(csv).toContain('Location,Latitude,Longitude');
      expect(csv).toContain('Condition,Risk Level,Is Critical');

      // Check data rows
      expect(csv).toContain('asset-1,Main Pump,PUMP');
      expect(csv).toContain('asset-2,Storage Tank,TANK');

      // Check null handling
      const lines = csv.split('\n');
      expect(lines.length).toBe(3); // Header + 2 data rows + empty line
    });

    it('should escape CSV special characters', async () => {
      mockPrisma.asset.findMany.mockResolvedValue([
        {
          id: 'asset-1',
          name: 'Pump, High Flow',
          description: 'Contains "quotes" and, commas',
          location: 'Line1\nLine2',
          type: 'PUMP',
          latitude: null,
          longitude: null,
          installationDate: null,
          condition: 'GOOD',
          riskLevel: 'LOW',
          isCritical: false,
          lastInspectionDate: null,
          nextInspectionDate: null,
          maintenanceSchedule: null,
          capacity: null,
          material: null,
          manufacturer: null,
          modelNumber: null,
          serialNumber: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const { exportAssetsToCSV } = await import('../../services/export.service.js');

      const csv = await exportAssetsToCSV(organizationId);

      // Should escape fields with special characters
      expect(csv).toContain('"Pump, High Flow"');
      expect(csv).toContain('"Contains ""quotes"" and, commas"');
    });

    it('should handle empty asset list', async () => {
      mockPrisma.asset.findMany.mockResolvedValue([]);

      const { exportAssetsToCSV } = await import('../../services/export.service.js');

      const csv = await exportAssetsToCSV(organizationId);

      const lines = csv.split('\n').filter((l) => l.trim());
      expect(lines.length).toBe(1); // Only header row
    });
  });

  describe('exportDocumentsToCSV', () => {
    it('should export documents with uploader information', async () => {
      mockPrisma.document.findMany.mockResolvedValue([
        {
          id: 'doc-1',
          title: 'DWSP 2024',
          type: 'DWSP',
          description: 'Annual safety plan',
          fileName: 'dwsp_2024.pdf',
          fileSize: 1048576, // 1MB
          mimeType: 'application/pdf',
          version: 1,
          tags: ['safety', 'annual'],
          uploadedAt: new Date('2024-01-15'),
          retentionUntil: new Date('2031-01-15'),
          uploadedBy: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
          },
        },
      ]);

      const { exportDocumentsToCSV } = await import('../../services/export.service.js');

      const csv = await exportDocumentsToCSV(organizationId);

      expect(csv).toContain('ID,Title,Type,Description');
      expect(csv).toContain('doc-1,DWSP 2024,DWSP');
      expect(csv).toContain('John Doe');
      expect(csv).toContain('1.00'); // File size in MB
    });

    it('should handle tags array', async () => {
      mockPrisma.document.findMany.mockResolvedValue([
        {
          id: 'doc-1',
          title: 'Test',
          type: 'REPORT',
          description: '',
          fileName: 'test.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          version: 1,
          tags: ['tag1', 'tag2', 'tag3'],
          uploadedAt: new Date(),
          retentionUntil: null,
          uploadedBy: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@test.com',
          },
        },
      ]);

      const { exportDocumentsToCSV } = await import('../../services/export.service.js');

      const csv = await exportDocumentsToCSV(organizationId);

      expect(csv).toContain('tag1; tag2; tag3');
    });
  });

  describe('exportAuditLogsToCSV', () => {
    it('should export audit logs with date filtering', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          userId: 'user-1',
          action: 'ASSET_CREATED',
          resourceType: 'ASSET',
          resourceId: 'asset-1',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date('2024-01-15T10:30:00Z'),
          user: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
          },
        },
        {
          id: 'log-2',
          userId: 'SYSTEM',
          action: 'CLEANUP_RAN',
          resourceType: 'SYSTEM',
          resourceId: null,
          ipAddress: 'SYSTEM',
          userAgent: null,
          timestamp: new Date('2024-01-16T00:00:00Z'),
          user: null,
        },
      ]);

      const { exportAuditLogsToCSV } = await import('../../services/export.service.js');

      const csv = await exportAuditLogsToCSV(
        organizationId,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(csv).toContain('ID,User,User Email,Action');
      expect(csv).toContain('log-1,John Doe,john@test.com');
      expect(csv).toContain('log-2,SYSTEM');
      expect(csv).toContain('ASSET_CREATED');
      expect(csv).toContain('CLEANUP_RAN');
    });

    it('should limit export to 10,000 records', async () => {
      const { exportAuditLogsToCSV } = await import('../../services/export.service.js');

      mockPrisma.auditLog.findMany.mockResolvedValue([]);

      await exportAuditLogsToCSV(organizationId);

      const findManyCall = (mockPrisma.auditLog.findMany as any).mock.calls[0][0];
      expect(findManyCall.take).toBe(10000);
    });
  });

  describe('exportComplianceOverviewReport', () => {
    it('should generate formatted text report', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: organizationId,
        name: 'Wellington Water Ltd',
      });

      mockPrisma.asset.findMany.mockResolvedValue([
        {
          id: '1',
          name: 'Pump 1',
          type: 'PUMP',
          condition: 'GOOD',
          riskLevel: 'LOW',
          isCritical: false,
        },
        {
          id: '2',
          name: 'Critical Tank',
          type: 'TANK',
          condition: 'FAIR',
          riskLevel: 'CRITICAL',
          isCritical: true,
        },
      ]);

      mockPrisma.document.count.mockResolvedValue(50);

      mockPrisma.compliancePlan.findMany.mockResolvedValue([
        {
          id: '1',
          planType: 'DWSP',
          status: 'APPROVED',
          title: 'Wellington DWSP 2024',
          approvedAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          planType: 'REPORT',
          status: 'SUBMITTED',
        },
      ]);

      mockPrisma.auditLog.findMany.mockResolvedValue([
        {
          action: 'ASSET_CREATED',
          timestamp: new Date(),
        },
        {
          action: 'DOCUMENT_UPLOADED',
          timestamp: new Date(),
        },
      ]);

      const { exportComplianceOverviewReport } = await import('../../services/export.service.js');

      const report = await exportComplianceOverviewReport(organizationId);

      // Check report sections
      expect(report).toContain('COMPLIANCE OVERVIEW REPORT');
      expect(report).toContain('Wellington Water Ltd');
      expect(report).toContain('EXECUTIVE SUMMARY');
      expect(report).toContain('DWSP (DRINKING WATER SAFETY PLAN)');
      expect(report).toContain('ASSET MANAGEMENT');
      expect(report).toContain('RECENT ACTIVITY');
      expect(report).toContain('COMPLIANCE STATUS');
      expect(report).toContain('RECOMMENDATIONS');

      // Check data
      expect(report).toContain('Total Assets:             2');
      expect(report).toContain('Critical Assets:          1');
      expect(report).toContain('Total Documents:          50');
      expect(report).toContain('Wellington DWSP 2024');
    });

    it('should provide recommendations for missing DWSP', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: organizationId,
        name: 'Test Org',
      });

      mockPrisma.asset.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.compliancePlan.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);

      const { exportComplianceOverviewReport } = await import('../../services/export.service.js');

      const report = await exportComplianceOverviewReport(organizationId);

      expect(report).toContain('CRITICAL');
      expect(report).toContain('Drinking Water Safety Plan');
    });
  });

  describe('Helper Functions', () => {
    it('should get correct MIME type for each format', async () => {
      const { getMimeType } = await import('../../services/export.service.js');

      expect(getMimeType('csv')).toBe('text/csv');
      expect(getMimeType('excel')).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(getMimeType('pdf')).toBe('application/pdf');
      expect(getMimeType('text')).toBe('text/plain');
    });

    it('should get correct file extension for each format', async () => {
      const { getFileExtension } = await import('../../services/export.service.js');

      expect(getFileExtension('csv')).toBe('csv');
      expect(getFileExtension('excel')).toBe('xlsx');
      expect(getFileExtension('pdf')).toBe('pdf');
      expect(getFileExtension('text')).toBe('txt');
    });

    it('should parse export format from query parameter', async () => {
      const { getExportFormat } = await import('../../services/export.service.js');

      expect(getExportFormat('csv')).toBe('csv');
      expect(getExportFormat('CSV')).toBe('csv');
      expect(getExportFormat('excel')).toBe('excel');
      expect(getExportFormat('pdf')).toBe('pdf');
      expect(getExportFormat('text')).toBe('text');
      expect(getExportFormat('invalid')).toBe('csv'); // Default
      expect(getExportFormat(undefined)).toBe('csv'); // Default
    });
  });
});
