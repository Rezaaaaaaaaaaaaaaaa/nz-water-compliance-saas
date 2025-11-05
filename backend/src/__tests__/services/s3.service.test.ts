/**
 * S3 Service Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import * as s3Service from '../../services/s3.service.js';

describe('S3 Service', () => {
  describe('validateFileType', () => {
    it('should accept PDF files', () => {
      const result = s3Service.validateFileType('application/pdf');
      expect(result.valid).toBe(true);
      expect(result.extension).toBe('pdf');
    });

    it('should accept DOCX files', () => {
      const result = s3Service.validateFileType(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      expect(result.valid).toBe(true);
      expect(result.extension).toBe('docx');
    });

    it('should accept XLSX files', () => {
      const result = s3Service.validateFileType(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(result.valid).toBe(true);
      expect(result.extension).toBe('xlsx');
    });

    it('should accept CSV files', () => {
      const result = s3Service.validateFileType('text/csv');
      expect(result.valid).toBe(true);
      expect(result.extension).toBe('csv');
    });

    it('should accept JPEG images', () => {
      const result = s3Service.validateFileType('image/jpeg');
      expect(result.valid).toBe(true);
      expect(result.extension).toBe('jpg');
    });

    it('should accept PNG images', () => {
      const result = s3Service.validateFileType('image/png');
      expect(result.valid).toBe(true);
      expect(result.extension).toBe('png');
    });

    it('should reject executable files', () => {
      const result = s3Service.validateFileType('application/x-msdownload');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject unknown file types', () => {
      const result = s3Service.validateFileType('application/unknown');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File type not allowed');
    });
  });

  describe('validateFileSize', () => {
    it('should accept files under 50MB', () => {
      const result = s3Service.validateFileSize(10 * 1024 * 1024); // 10MB
      expect(result.valid).toBe(true);
    });

    it('should accept files exactly 50MB', () => {
      const result = s3Service.validateFileSize(50 * 1024 * 1024); // 50MB
      expect(result.valid).toBe(true);
    });

    it('should reject files over 50MB', () => {
      const result = s3Service.validateFileSize(51 * 1024 * 1024); // 51MB
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File too large');
    });

    it('should accept very small files', () => {
      const result = s3Service.validateFileSize(1024); // 1KB
      expect(result.valid).toBe(true);
    });

    it('should accept 1 byte files', () => {
      const result = s3Service.validateFileSize(1);
      expect(result.valid).toBe(true);
    });
  });

  describe('generateFileKey', () => {
    it('should generate unique file keys for same filename', () => {
      const key1 = s3Service.generateFileKey('org1', 'DWSP', 'test.pdf');
      const key2 = s3Service.generateFileKey('org1', 'DWSP', 'test.pdf');

      expect(key1).not.toBe(key2);
    });

    it('should include organization ID in path', () => {
      const key = s3Service.generateFileKey('org123', 'DWSP', 'test.pdf');
      expect(key).toContain('organizations/org123');
    });

    it('should include document type in path', () => {
      const key = s3Service.generateFileKey('org1', 'REPORT', 'test.pdf');
      expect(key).toContain('REPORT');
    });

    it('should sanitize special characters in filename', () => {
      const key = s3Service.generateFileKey('org1', 'DWSP', 'test file!@#$%.pdf');
      expect(key).toMatch(/test_file_+\.pdf$/);
    });

    it('should preserve file extension', () => {
      const key = s3Service.generateFileKey('org1', 'DWSP', 'document.pdf');
      expect(key).toMatch(/\.pdf$/);
    });

    it('should handle files with multiple dots', () => {
      const key = s3Service.generateFileKey('org1', 'DWSP', 'my.test.file.pdf');
      expect(key).toMatch(/\.pdf$/);
    });
  });

  describe('File Security', () => {
    it('should prevent directory traversal in filenames', () => {
      const key = s3Service.generateFileKey('org1', 'DWSP', '../../../etc/passwd');
      expect(key).not.toContain('../');
      expect(key).toContain('organizations/org1');
    });

    it('should sanitize null bytes in filenames', () => {
      const key = s3Service.generateFileKey('org1', 'DWSP', 'test\0.pdf');
      expect(key).not.toContain('\0');
    });

    it('should handle very long filenames', () => {
      const longName = 'a'.repeat(300) + '.pdf';
      const key = s3Service.generateFileKey('org1', 'DWSP', longName);
      expect(key).toBeDefined();
      expect(key.length).toBeGreaterThan(0);
    });
  });
});
