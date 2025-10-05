import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { PrismaClient } from '@prisma/client';
import {
  DWQARReport,
  WaterQualityTestData,
  RuleComplianceData,
} from './dwqar-aggregation.service';

const prisma = new PrismaClient();

/**
 * DWQAR Excel Export Service
 * Generates Excel files matching the official Taumata Arowai DWQAR template exactly
 */
export class DWQARExcelExportService {
  /**
   * Generate Excel file matching official DWQAR template
   * @param report - DWQAR report data
   * @returns Excel file buffer
   */
  async generateExcel(report: DWQARReport): Promise<Buffer> {
    console.log(
      `[DWQAR Excel] Generating Excel for ${report.reportingPeriod}`
    );

    const workbook = new ExcelJS.Workbook();

    // Set workbook properties
    workbook.creator = 'FlowComply';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();

    // Sheet 1: Reports (Rule compliance summary)
    const reportsSheet = workbook.addWorksheet('Reports');
    await this.formatReportsSheet(reportsSheet, report.reportsData);

    // Sheet 2: Samples (Individual test results)
    const samplesSheet = workbook.addWorksheet('Samples');
    await this.formatSamplesSheet(samplesSheet, report.samplesData);

    // Sheet 3: RuleIDs (Reference data - read-only)
    const rulesSheet = workbook.addWorksheet('RuleIDs');
    await this.addRuleIDsReference(rulesSheet);

    // Apply official formatting
    this.applyOfficialFormatting(workbook);

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    console.log(
      `[DWQAR Excel] Generated ${buffer.byteLength} bytes for ${report.samplesData.length} samples, ${report.reportsData.length} rules`
    );

    return Buffer.from(buffer);
  }

  /**
   * Format the Reports sheet (Rule compliance summary)
   */
  private async formatReportsSheet(
    sheet: ExcelJS.Worksheet,
    data: RuleComplianceData[]
  ): Promise<void> {
    // Add title rows (matching official template)
    sheet.addRow(['Drinking Water Quality Assurance Rules - Annual Report']);
    sheet.addRow(['Reports Sheet']);
    sheet.addRow([]); // Empty row

    // Organization info (rows 4-12)
    sheet.addRow(['Water Supplier Name:', '']);
    sheet.addRow(['Reporting Period:', '']);
    sheet.addRow(['Submission Date:', format(new Date(), 'yyyy-MM-dd')]);
    sheet.addRow([]);
    sheet.addRow([]);
    sheet.addRow([]);
    sheet.addRow([]);
    sheet.addRow(['Instructions:', 'Complete all fields below']);
    sheet.addRow([]); // Row 12

    // Headers (row 13)
    const headerRow = sheet.addRow([
      'Rule ID',
      'Supply Component ID',
      'Complies With Rule',
      'Non Compliant Periods',
      'Notes',
    ]);

    // Style headers
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }, // Light blue
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Add data rows
    for (const item of data) {
      const row = sheet.addRow([
        item.ruleId,
        item.componentId,
        item.complies ? 'True' : 'False',
        item.nonCompliantPeriods,
        item.notes || '',
      ]);

      // Conditional formatting for non-compliance
      if (!item.complies) {
        row.getCell(3).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC7CE' }, // Light red
        };
        row.getCell(3).font = { color: { argb: 'FF9C0006' }, bold: true };
      }
    }

    // Set column widths
    sheet.getColumn(1).width = 15; // Rule ID
    sheet.getColumn(2).width = 20; // Component ID
    sheet.getColumn(3).width = 20; // Complies
    sheet.getColumn(4).width = 25; // Non Compliant Periods
    sheet.getColumn(5).width = 50; // Notes

    // Freeze header row
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 13 }];
  }

  /**
   * Format the Samples sheet (Individual test results)
   */
  private async formatSamplesSheet(
    sheet: ExcelJS.Worksheet,
    data: WaterQualityTestData[]
  ): Promise<void> {
    // Add headers (row 1 in official template)
    const headerRow = sheet.addRow([
      'Rule ID',
      'Supply Component ID',
      'External Sample ID',
      'Sample Date',
      'Parameter/Determinand',
      'Value Prefix',
      'Value',
      'Unit',
      'Complies With Rule',
      'Source Class',
      'Notes',
    ]);

    // Style headers
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Add data rows
    for (const test of data) {
      const row = sheet.addRow([
        test.ruleId,
        test.componentId,
        test.externalSampleId || '',
        this.formatDate(test.sampleDate), // "YYYY-MM-DD HH:MM:SS"
        test.parameter,
        test.valuePrefix || '',
        test.value,
        test.unit,
        test.compliesWithRule ? 'True' : 'False',
        test.sourceClass || '',
        test.notes || '',
      ]);

      // Conditional formatting for non-compliance
      if (!test.compliesWithRule) {
        row.getCell(9).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC7CE' },
        };
        row.getCell(9).font = { color: { argb: 'FF9C0006' }, bold: true };
      }
    }

    // Set column widths
    sheet.getColumn(1).width = 12; // Rule ID
    sheet.getColumn(2).width = 20; // Component ID
    sheet.getColumn(3).width = 20; // External Sample ID
    sheet.getColumn(4).width = 20; // Sample Date
    sheet.getColumn(5).width = 25; // Parameter
    sheet.getColumn(6).width = 12; // Value Prefix
    sheet.getColumn(7).width = 12; // Value
    sheet.getColumn(8).width = 10; // Unit
    sheet.getColumn(9).width = 18; // Complies
    sheet.getColumn(10).width = 15; // Source Class
    sheet.getColumn(11).width = 40; // Notes

    // Freeze header row
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  }

  /**
   * Add RuleIDs reference sheet (read-only)
   */
  private async addRuleIDsReference(
    sheet: ExcelJS.Worksheet
  ): Promise<void> {
    // Headers
    const headerRow = sheet.addRow([
      'Rule ID',
      'Category',
      'Parameter',
      'Description',
      'Max Value',
      'Min Value',
      'Unit',
      'Frequency',
    ]);

    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' },
      };
    });

    // Get all active compliance rules
    const rules = await prisma.complianceRule.findMany({
      where: { isActive: true },
      orderBy: { ruleId: 'asc' },
    });

    // Add rule data
    for (const rule of rules) {
      sheet.addRow([
        rule.ruleId,
        rule.category || '',
        rule.parameter || '',
        rule.description || '',
        rule.maxValue ? Number(rule.maxValue) : '',
        rule.minValue ? Number(rule.minValue) : '',
        rule.unit || '',
        rule.frequency || '',
      ]);
    }

    // Set column widths
    sheet.getColumn(1).width = 12;
    sheet.getColumn(2).width = 20;
    sheet.getColumn(3).width = 25;
    sheet.getColumn(4).width = 50;
    sheet.getColumn(5).width = 12;
    sheet.getColumn(6).width = 12;
    sheet.getColumn(7).width = 10;
    sheet.getColumn(8).width = 15;

    // Protect sheet (read-only)
    sheet.protect('', {
      selectLockedCells: true,
      selectUnlockedCells: true,
    });
  }

  /**
   * Apply official formatting to workbook
   */
  private applyOfficialFormatting(workbook: ExcelJS.Workbook): void {
    workbook.eachSheet((sheet) => {
      // Set default font
      sheet.eachRow((row) => {
        row.eachCell((cell) => {
          if (!cell.font) {
            cell.font = { name: 'Calibri', size: 11 };
          }
        });
      });

      // Auto-filter on header rows (if applicable)
      if (sheet.name === 'Reports' && sheet.rowCount > 13) {
        sheet.autoFilter = {
          from: { row: 13, column: 1 },
          to: { row: 13, column: 5 },
        };
      } else if (sheet.name === 'Samples' && sheet.rowCount > 1) {
        sheet.autoFilter = {
          from: { row: 1, column: 1 },
          to: { row: 1, column: 11 },
        };
      }
    });
  }

  /**
   * Format date to official DWQAR format
   */
  private formatDate(date: Date): string {
    // Official format: "YYYY-MM-DD HH:MM:SS"
    return format(date, 'yyyy-MM-dd HH:mm:ss');
  }

  /**
   * Validate exported Excel against official template
   */
  async validateExport(buffer: Buffer): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      // Check required sheets exist
      const requiredSheets = ['Reports', 'Samples', 'RuleIDs'];
      for (const sheetName of requiredSheets) {
        if (!workbook.getWorksheet(sheetName)) {
          errors.push(`Missing required sheet: ${sheetName}`);
        }
      }

      // Check Reports sheet structure
      const reportsSheet = workbook.getWorksheet('Reports');
      if (reportsSheet) {
        const headerRow = reportsSheet.getRow(13);
        const expectedHeaders = [
          'Rule ID',
          'Supply Component ID',
          'Complies With Rule',
          'Non Compliant Periods',
          'Notes',
        ];

        for (let i = 0; i < expectedHeaders.length; i++) {
          const cell = headerRow.getCell(i + 1);
          if (cell.value !== expectedHeaders[i]) {
            errors.push(
              `Reports sheet header mismatch at column ${i + 1}: expected "${expectedHeaders[i]}", got "${cell.value}"`
            );
          }
        }
      }

      // Check Samples sheet structure
      const samplesSheet = workbook.getWorksheet('Samples');
      if (samplesSheet) {
        const headerRow = samplesSheet.getRow(1);
        const expectedHeaders = [
          'Rule ID',
          'Supply Component ID',
          'External Sample ID',
          'Sample Date',
          'Parameter/Determinand',
          'Value Prefix',
          'Value',
          'Unit',
          'Complies With Rule',
          'Source Class',
          'Notes',
        ];

        for (let i = 0; i < expectedHeaders.length; i++) {
          const cell = headerRow.getCell(i + 1);
          if (cell.value !== expectedHeaders[i]) {
            errors.push(
              `Samples sheet header mismatch at column ${i + 1}: expected "${expectedHeaders[i]}", got "${cell.value}"`
            );
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push(`Excel validation error: ${error}`);
      return { valid: false, errors };
    }
  }
}

export const dwqarExcelExportService = new DWQARExcelExportService();
