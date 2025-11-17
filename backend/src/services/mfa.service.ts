/**
 * Multi-Factor Authentication (MFA) Service
 *
 * TOTP-based MFA using Google Authenticator compatible tokens.
 */

import * as crypto from 'crypto';
import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';

/**
 * TOTP Configuration
 */
const TOTP_CONFIG = {
  algorithm: 'sha1',
  digits: 6,
  period: 30, // 30 seconds
  window: 1, // Allow 1 period before/after
};

/**
 * Generate a secret key for TOTP
 */
export function generateMFASecret(): string {
  return crypto.randomBytes(20).toString('base64').replace(/=/g, '');
}

/**
 * Generate TOTP URI for QR code
 *
 * @param secret - MFA secret
 * @param email - User email
 * @param issuer - App name
 */
export function generateTOTPUri(secret: string, email: string, issuer: string = 'FlowComply'): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: TOTP_CONFIG.algorithm.toUpperCase(),
    digits: TOTP_CONFIG.digits.toString(),
    period: TOTP_CONFIG.period.toString(),
  });

  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?${params}`;
}

/**
 * Generate TOTP code from secret
 *
 * @param secret - MFA secret
 * @param time - Timestamp (default: now)
 */
function generateTOTP(secret: string, time: number = Date.now()): string {
  const counter = Math.floor(time / 1000 / TOTP_CONFIG.period);

  // Convert counter to 8-byte buffer
  const buffer = Buffer.alloc(8);
  let tmpCounter = counter;
  for (let i = 7; i >= 0; i--) {
    buffer[i] = tmpCounter & 0xff;
    tmpCounter >>= 8;
  }

  // HMAC
  const hmac = crypto.createHmac(TOTP_CONFIG.algorithm, Buffer.from(secret, 'base64'));
  hmac.update(buffer);
  const hash = hmac.digest();

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  // Generate OTP
  const otp = binary % Math.pow(10, TOTP_CONFIG.digits);

  return otp.toString().padStart(TOTP_CONFIG.digits, '0');
}

/**
 * Verify TOTP code
 *
 * @param secret - MFA secret
 * @param code - User-provided code
 * @param window - Time window (periods to check before/after)
 */
export function verifyTOTP(secret: string, code: string, window: number = TOTP_CONFIG.window): boolean {
  const now = Date.now();

  // Check current and adjacent time windows
  for (let i = -window; i <= window; i++) {
    const time = now + i * TOTP_CONFIG.period * 1000;
    const expectedCode = generateTOTP(secret, time);

    if (expectedCode === code) {
      return true;
    }
  }

  return false;
}

/**
 * Enable MFA for a user
 *
 * @param userId - User ID
 * @param code - TOTP code for verification
 * @returns Success status
 */
export async function enableMFA(userId: string, code: string): Promise<{ success: boolean; backupCodes?: string[] }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, mfaSecret: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.mfaSecret) {
      throw new Error('MFA secret not generated');
    }

    // Verify the code
    if (!verifyTOTP(user.mfaSecret, code)) {
      return { success: false };
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Hash backup codes
    const hashedBackupCodes = backupCodes.map((code) =>
      crypto.createHash('sha256').update(code).digest('hex')
    );

    // Enable MFA
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaBackupCodes: hashedBackupCodes,
      },
    });

    logger.info({ userId }, 'MFA enabled for user');

    return {
      success: true,
      backupCodes, // Return plain codes (user should save these)
    };
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to enable MFA');
    throw error;
  }
}

/**
 * Disable MFA for a user
 *
 * @param userId - User ID
 * @param code - TOTP code or backup code for verification
 */
export async function disableMFA(userId: string, code: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, mfaSecret: true, mfaBackupCodes: true },
    });

    if (!user || !user.mfaSecret) {
      return false;
    }

    // Verify TOTP or backup code
    const totpValid = verifyTOTP(user.mfaSecret, code);
    const backupValid = user.mfaBackupCodes?.includes(
      crypto.createHash('sha256').update(code).digest('hex')
    );

    if (!totpValid && !backupValid) {
      return false;
    }

    // Disable MFA
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
      },
    });

    logger.info({ userId }, 'MFA disabled for user');

    return true;
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to disable MFA');
    throw error;
  }
}

/**
 * Verify MFA code during login
 *
 * @param userId - User ID
 * @param code - TOTP code or backup code
 */
export async function verifyMFACode(userId: string, code: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, mfaSecret: true, mfaBackupCodes: true, mfaEnabled: true },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return false;
    }

    // Try TOTP first
    if (verifyTOTP(user.mfaSecret, code)) {
      return true;
    }

    // Try backup codes
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    const backupCodeIndex = user.mfaBackupCodes?.indexOf(hashedCode) ?? -1;

    if (backupCodeIndex !== -1) {
      // Remove used backup code
      const updatedBackupCodes = [...(user.mfaBackupCodes || [])];
      updatedBackupCodes.splice(backupCodeIndex, 1);

      await prisma.user.update({
        where: { id: userId },
        data: { mfaBackupCodes: updatedBackupCodes },
      });

      logger.info({ userId }, 'Backup code used for MFA');

      return true;
    }

    return false;
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to verify MFA code');
    return false;
  }
}

/**
 * Generate MFA setup data for a user
 *
 * @param userId - User ID
 */
export async function setupMFA(userId: string): Promise<{ secret: string; qrCodeUri: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate secret
    const secret = generateMFASecret();

    // Save secret (not yet enabled)
    await prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    // Generate QR code URI
    const qrCodeUri = generateTOTPUri(secret, user.email);

    logger.info({ userId }, 'MFA setup initiated');

    return {
      secret,
      qrCodeUri,
    };
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to setup MFA');
    throw error;
  }
}
