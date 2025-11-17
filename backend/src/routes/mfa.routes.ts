/**
 * Multi-Factor Authentication (MFA) Routes
 *
 * Endpoints for managing MFA (TOTP) for user accounts.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
  generateMFASecret,
  generateTOTPUri,
  verifyTOTP,
  enableMFA,
  disableMFA,
  verifyBackupCode,
  generateBackupCodes,
} from '../services/mfa.service.js';
import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';

// Request schemas
const enableMFASchema = z.object({
  code: z.string().length(6).regex(/^\d+$/),
});

const verifyMFASchema = z.object({
  code: z.string().length(6).regex(/^\d+$/),
});

const verifyBackupCodeSchema = z.object({
  code: z.string().min(8),
});

/**
 * Register MFA routes
 */
export async function mfaRoutes(fastify: FastifyInstance) {
  /**
   * GET /mfa/status
   * Get MFA status for current user
   */
  fastify.get(
    '/status',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).id;

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            mfaEnabled: true,
          },
        });

        if (!user) {
          return reply.status(404).send({
            error: 'User not found',
          });
        }

        return reply.send({
          mfaEnabled: user.mfaEnabled || false,
        });
      } catch (error) {
        logger.error({ err: error }, 'Failed to get MFA status');
        return reply.status(500).send({
          error: 'Failed to get MFA status',
        });
      }
    }
  );

  /**
   * POST /mfa/setup
   * Initialize MFA setup - generates secret and QR code URI
   */
  fastify.post(
    '/setup',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).id;

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            mfaEnabled: true,
          },
        });

        if (!user) {
          return reply.status(404).send({
            error: 'User not found',
          });
        }

        if (user.mfaEnabled) {
          return reply.status(400).send({
            error: 'MFA is already enabled',
          });
        }

        // Generate new secret
        const secret = generateMFASecret();

        // Store secret temporarily (user must verify to enable)
        await prisma.user.update({
          where: { id: userId },
          data: {
            mfaSecret: secret,
          },
        });

        // Generate QR code URI
        const qrCodeUri = generateTOTPUri(secret, user.email, 'FlowComply');

        logger.info({ userId }, 'MFA setup initiated');

        return reply.send({
          secret,
          qrCodeUri,
          message: 'Scan the QR code with your authenticator app, then verify with a code',
        });
      } catch (error) {
        logger.error({ err: error }, 'Failed to setup MFA');
        return reply.status(500).send({
          error: 'Failed to setup MFA',
        });
      }
    }
  );

  /**
   * POST /mfa/enable
   * Enable MFA after verifying TOTP code
   */
  fastify.post(
    '/enable',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: enableMFASchema,
      },
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof enableMFASchema> }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).id;
        const { code } = request.body;

        const result = await enableMFA(userId, code);

        if (!result.success) {
          return reply.status(400).send({
            error: 'Invalid verification code',
          });
        }

        logger.info({ userId }, 'MFA enabled successfully');

        return reply.send({
          success: true,
          backupCodes: result.backupCodes,
          message: 'MFA enabled successfully. Save your backup codes in a secure location.',
        });
      } catch (error: any) {
        logger.error({ err: error }, 'Failed to enable MFA');
        return reply.status(500).send({
          error: error.message || 'Failed to enable MFA',
        });
      }
    }
  );

  /**
   * POST /mfa/verify
   * Verify MFA code during login
   */
  fastify.post(
    '/verify',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: verifyMFASchema,
      },
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof verifyMFASchema> }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).id;
        const { code } = request.body;

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            mfaSecret: true,
            mfaEnabled: true,
          },
        });

        if (!user) {
          return reply.status(404).send({
            error: 'User not found',
          });
        }

        if (!user.mfaEnabled || !user.mfaSecret) {
          return reply.status(400).send({
            error: 'MFA is not enabled',
          });
        }

        const isValid = verifyTOTP(user.mfaSecret, code);

        if (!isValid) {
          logger.warn({ userId }, 'Invalid MFA code attempt');
          return reply.status(400).send({
            error: 'Invalid verification code',
          });
        }

        logger.info({ userId }, 'MFA verified successfully');

        return reply.send({
          success: true,
          message: 'MFA verified successfully',
        });
      } catch (error) {
        logger.error({ err: error }, 'Failed to verify MFA');
        return reply.status(500).send({
          error: 'Failed to verify MFA',
        });
      }
    }
  );

  /**
   * POST /mfa/verify-backup
   * Verify backup code for account recovery
   */
  fastify.post(
    '/verify-backup',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: verifyBackupCodeSchema,
      },
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof verifyBackupCodeSchema> }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).id;
        const { code } = request.body;

        const result = await verifyBackupCode(userId, code);

        if (!result.success) {
          logger.warn({ userId }, 'Invalid backup code attempt');
          return reply.status(400).send({
            error: 'Invalid backup code',
          });
        }

        logger.info({ userId }, 'Backup code verified and consumed');

        return reply.send({
          success: true,
          remainingCodes: result.remainingCodes,
          message: 'Backup code verified. This code has been consumed.',
        });
      } catch (error: any) {
        logger.error({ err: error }, 'Failed to verify backup code');
        return reply.status(500).send({
          error: error.message || 'Failed to verify backup code',
        });
      }
    }
  );

  /**
   * POST /mfa/regenerate-backup-codes
   * Generate new backup codes (invalidates old ones)
   */
  fastify.post(
    '/regenerate-backup-codes',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).id;

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            mfaEnabled: true,
          },
        });

        if (!user) {
          return reply.status(404).send({
            error: 'User not found',
          });
        }

        if (!user.mfaEnabled) {
          return reply.status(400).send({
            error: 'MFA is not enabled',
          });
        }

        const backupCodes = await generateBackupCodes(userId);

        logger.info({ userId }, 'Backup codes regenerated');

        return reply.send({
          backupCodes,
          message: 'New backup codes generated. Save them in a secure location.',
        });
      } catch (error) {
        logger.error({ err: error }, 'Failed to regenerate backup codes');
        return reply.status(500).send({
          error: 'Failed to regenerate backup codes',
        });
      }
    }
  );

  /**
   * POST /mfa/disable
   * Disable MFA for current user
   */
  fastify.post(
    '/disable',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: verifyMFASchema,
      },
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof verifyMFASchema> }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).id;
        const { code } = request.body;

        // Verify code before disabling
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            mfaSecret: true,
            mfaEnabled: true,
          },
        });

        if (!user || !user.mfaEnabled || !user.mfaSecret) {
          return reply.status(400).send({
            error: 'MFA is not enabled',
          });
        }

        const isValid = verifyTOTP(user.mfaSecret, code);

        if (!isValid) {
          return reply.status(400).send({
            error: 'Invalid verification code',
          });
        }

        await disableMFA(userId);

        logger.info({ userId }, 'MFA disabled');

        return reply.send({
          success: true,
          message: 'MFA disabled successfully',
        });
      } catch (error: any) {
        logger.error({ err: error }, 'Failed to disable MFA');
        return reply.status(500).send({
          error: error.message || 'Failed to disable MFA',
        });
      }
    }
  );
}
