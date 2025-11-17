/**
 * MFA Service Tests
 *
 * Unit tests for multi-factor authentication service.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  generateMFASecret,
  generateTOTPUri,
  verifyTOTP,
  enableMFA,
  disableMFA,
  verifyBackupCode,
} from '../../../services/mfa.service.js';
import { prisma } from '../../../config/database.js';
import bcrypt from 'bcrypt';

describe('MFA Service', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'mfa-test@example.com',
        passwordHash: await bcrypt.hash('Test123!@#', 10),
        firstName: 'MFA',
        lastName: 'Test',
      },
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    // Clean up
    await prisma.user.deleteMany({
      where: {
        email: 'mfa-test@example.com',
      },
    });
  });

  describe('generateMFASecret', () => {
    it('should generate a 32-character base32 secret', () => {
      const secret = generateMFASecret();
      expect(secret).toHaveLength(32);
      expect(secret).toMatch(/^[A-Z2-7]+$/); // Base32 alphabet
    });

    it('should generate unique secrets', () => {
      const secret1 = generateMFASecret();
      const secret2 = generateMFASecret();
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('generateTOTPUri', () => {
    it('should generate valid otpauth URI', () => {
      const secret = generateMFASecret();
      const uri = generateTOTPUri(secret, 'test@example.com', 'FlowComply');

      expect(uri).toMatch(/^otpauth:\/\/totp\//);
      expect(uri).toContain('FlowComply');
      expect(uri).toContain('test@example.com');
      expect(uri).toContain(`secret=${secret}`);
    });

    it('should encode email in URI', () => {
      const secret = generateMFASecret();
      const uri = generateTOTPUri(secret, 'test+tag@example.com', 'FlowComply');

      expect(uri).toContain('test%2Btag@example.com');
    });
  });

  describe('verifyTOTP', () => {
    it('should verify correct TOTP code', () => {
      const secret = generateMFASecret();

      // Generate current code
      const totp = require('otplib').authenticator;
      totp.options = { step: 30 };
      const code = totp.generate(secret);

      const isValid = verifyTOTP(secret, code);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect TOTP code', () => {
      const secret = generateMFASecret();
      const isValid = verifyTOTP(secret, '000000');
      expect(isValid).toBe(false);
    });

    it('should reject malformed codes', () => {
      const secret = generateMFASecret();
      expect(verifyTOTP(secret, '12345')).toBe(false); // Too short
      expect(verifyTOTP(secret, '1234567')).toBe(false); // Too long
      expect(verifyTOTP(secret, 'abcdef')).toBe(false); // Non-numeric
    });
  });

  describe('enableMFA', () => {
    it('should enable MFA with valid code', async () => {
      // Set up secret first
      const secret = generateMFASecret();
      await prisma.user.update({
        where: { id: testUserId },
        data: { mfaSecret: secret },
      });

      // Generate valid code
      const totp = require('otplib').authenticator;
      totp.options = { step: 30 };
      const code = totp.generate(secret);

      const result = await enableMFA(testUserId, code);

      expect(result.success).toBe(true);
      expect(result.backupCodes).toHaveLength(10);

      // Verify MFA is enabled in database
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
      });
      expect(user?.mfaEnabled).toBe(true);
    });

    it('should reject invalid code', async () => {
      const secret = generateMFASecret();
      await prisma.user.update({
        where: { id: testUserId },
        data: { mfaSecret: secret },
      });

      const result = await enableMFA(testUserId, '000000');
      expect(result.success).toBe(false);
    });
  });

  describe('disableMFA', () => {
    it('should disable MFA', async () => {
      // Enable MFA first
      const secret = generateMFASecret();
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          mfaEnabled: true,
          mfaSecret: secret,
        },
      });

      await disableMFA(testUserId);

      // Verify MFA is disabled
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
      });
      expect(user?.mfaEnabled).toBe(false);
      expect(user?.mfaSecret).toBeNull();
      expect(user?.mfaBackupCodes).toBeNull();
    });
  });

  describe('verifyBackupCode', () => {
    it('should verify valid backup code', async () => {
      // Enable MFA and get backup codes
      const secret = generateMFASecret();
      await prisma.user.update({
        where: { id: testUserId },
        data: { mfaSecret: secret },
      });

      const totp = require('otplib').authenticator;
      const code = totp.generate(secret);
      const enableResult = await enableMFA(testUserId, code);

      // Verify one of the backup codes
      const backupCode = enableResult.backupCodes![0];
      const result = await verifyBackupCode(testUserId, backupCode);

      expect(result.success).toBe(true);
      expect(result.remainingCodes).toBe(9);
    });

    it('should reject invalid backup code', async () => {
      const secret = generateMFASecret();
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          mfaEnabled: true,
          mfaSecret: secret,
        },
      });

      const result = await verifyBackupCode(testUserId, 'invalid-code-12345678');
      expect(result.success).toBe(false);
    });

    it('should not allow reusing backup codes', async () => {
      // Enable MFA
      const secret = generateMFASecret();
      await prisma.user.update({
        where: { id: testUserId },
        data: { mfaSecret: secret },
      });

      const totp = require('otplib').authenticator;
      const code = totp.generate(secret);
      const enableResult = await enableMFA(testUserId, code);

      const backupCode = enableResult.backupCodes![0];

      // Use backup code once
      await verifyBackupCode(testUserId, backupCode);

      // Try to use again
      const result = await verifyBackupCode(testUserId, backupCode);
      expect(result.success).toBe(false);
    });
  });
});
