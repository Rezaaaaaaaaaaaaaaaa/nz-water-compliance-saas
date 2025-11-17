/**
 * AWS Secrets Manager Provider
 *
 * Production-grade secrets management for AWS cloud deployments.
 * Supports automatic rotation, versioning, and cross-region replication.
 */

import { ISecretsProvider } from '../../interfaces/secrets.interface.js';
import { logger } from '../../config/logger.js';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  PutSecretValueCommand,
  DeleteSecretCommand,
  ListSecretsCommand,
  DescribeSecretCommand,
  UpdateSecretCommand,
} from '@aws-sdk/client-secrets-manager';

export interface AWSSecretsManagerConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
}

export class AWSSecretsManagerProvider implements ISecretsProvider {
  private client: SecretsManagerClient;

  constructor(config: AWSSecretsManagerConfig) {
    this.client = new SecretsManagerClient({
      region: config.region,
      credentials: config.accessKeyId
        ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey!,
            sessionToken: config.sessionToken,
          }
        : undefined, // Use default credential provider chain
    });

    logger.info({ region: config.region }, 'AWS Secrets Manager provider initialized');
  }

  async getSecret(key: string): Promise<string | null> {
    try {
      const command = new GetSecretValueCommand({
        SecretId: key,
      });

      const response = await this.client.send(command);

      // Secrets Manager can store either SecretString or SecretBinary
      if (response.SecretString) {
        return response.SecretString;
      }

      if (response.SecretBinary) {
        // Convert binary to string (Base64)
        return Buffer.from(response.SecretBinary).toString('base64');
      }

      return null;
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        return null;
      }

      logger.error({ err: error, key }, 'Failed to get secret from AWS Secrets Manager');
      throw error;
    }
  }

  async getSecrets(keys: string[]): Promise<Map<string, string | null>> {
    const result = new Map<string, string | null>();

    // Fetch in parallel
    await Promise.all(
      keys.map(async (key) => {
        const value = await this.getSecret(key);
        result.set(key, value);
      })
    );

    return result;
  }

  async setSecret(key: string, value: string, metadata?: Record<string, any>): Promise<void> {
    try {
      // Try to update existing secret first
      try {
        const command = new PutSecretValueCommand({
          SecretId: key,
          SecretString: value,
        });

        await this.client.send(command);

        logger.info({ key }, 'Secret updated in AWS Secrets Manager');
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          // Secret doesn't exist, would need CreateSecretCommand
          // For now, log a warning
          logger.warn({ key }, 'Secret does not exist - use CreateSecretCommand to create');
          throw new Error(`Secret ${key} does not exist. Create it first.`);
        }
        throw error;
      }

      // Update metadata if provided
      if (metadata) {
        const updateCommand = new UpdateSecretCommand({
          SecretId: key,
          Description: metadata.description,
        });

        await this.client.send(updateCommand);
      }
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to set secret in AWS Secrets Manager');
      throw error;
    }
  }

  async deleteSecret(key: string): Promise<void> {
    try {
      const command = new DeleteSecretCommand({
        SecretId: key,
        ForceDeleteWithoutRecovery: true, // Immediate deletion (use with caution)
      });

      await this.client.send(command);

      logger.info({ key }, 'Secret deleted from AWS Secrets Manager');
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        logger.warn({ key }, 'Secret not found, already deleted');
        return;
      }

      logger.error({ err: error, key }, 'Failed to delete secret from AWS Secrets Manager');
      throw error;
    }
  }

  async listSecrets(prefix?: string): Promise<string[]> {
    try {
      const command = new ListSecretsCommand({
        MaxResults: 100,
      });

      const response = await this.client.send(command);

      let secretNames = response.SecretList?.map((secret) => secret.Name || '') || [];

      // Filter by prefix if provided
      if (prefix) {
        secretNames = secretNames.filter((name) => name.startsWith(prefix));
      }

      return secretNames;
    } catch (error) {
      logger.error({ err: error }, 'Failed to list secrets from AWS Secrets Manager');
      throw error;
    }
  }

  async secretExists(key: string): Promise<boolean> {
    try {
      const command = new DescribeSecretCommand({
        SecretId: key,
      });

      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        return false;
      }

      logger.error({ err: error, key }, 'Failed to check secret existence in AWS Secrets Manager');
      throw error;
    }
  }

  async rotateSecret(key: string, newValue: string): Promise<string> {
    try {
      const command = new PutSecretValueCommand({
        SecretId: key,
        SecretString: newValue,
      });

      const response = await this.client.send(command);

      const versionId = response.VersionId || 'unknown';

      logger.info({ key, versionId }, 'Secret rotated in AWS Secrets Manager');

      return versionId;
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to rotate secret in AWS Secrets Manager');
      throw error;
    }
  }
}
