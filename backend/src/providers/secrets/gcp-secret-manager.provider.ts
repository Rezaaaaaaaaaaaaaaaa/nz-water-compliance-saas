/**
 * Google Cloud Secret Manager Provider
 *
 * Production-grade secrets management for Google Cloud Platform deployments.
 * Supports automatic replication, versioning, and IAM integration.
 */

import { ISecretsProvider } from '../../interfaces/secrets.interface.js';
import { logger } from '../../config/logger.js';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

export interface GCPSecretManagerConfig {
  projectId: string;
  keyFilename?: string; // Path to service account JSON key file
  credentials?: {
    client_email: string;
    private_key: string;
  };
}

export class GCPSecretManagerProvider implements ISecretsProvider {
  private client: SecretManagerServiceClient;
  private projectId: string;

  constructor(config: GCPSecretManagerConfig) {
    this.projectId = config.projectId;

    this.client = new SecretManagerServiceClient({
      projectId: config.projectId,
      keyFilename: config.keyFilename,
      credentials: config.credentials,
    });

    logger.info({ projectId: config.projectId }, 'GCP Secret Manager provider initialized');
  }

  private getSecretPath(key: string): string {
    return `projects/${this.projectId}/secrets/${key}`;
  }

  private getSecretVersionPath(key: string, version: string = 'latest'): string {
    return `${this.getSecretPath(key)}/versions/${version}`;
  }

  async getSecret(key: string): Promise<string | null> {
    try {
      const [version] = await this.client.accessSecretVersion({
        name: this.getSecretVersionPath(key),
      });

      const payload = version.payload?.data;

      if (!payload) {
        return null;
      }

      // Convert Buffer/Uint8Array to string
      return payload.toString();
    } catch (error: any) {
      if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
        return null;
      }

      logger.error({ err: error, key }, 'Failed to get secret from GCP Secret Manager');
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
      // Add a new version to existing secret
      const [version] = await this.client.addSecretVersion({
        parent: this.getSecretPath(key),
        payload: {
          data: Buffer.from(value, 'utf8'),
        },
      });

      logger.info({ key, version: version.name }, 'Secret version added in GCP Secret Manager');
    } catch (error: any) {
      // If secret doesn't exist, we'd need to create it first
      if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
        logger.warn({ key }, 'Secret does not exist - create it first using createSecret');
        throw new Error(`Secret ${key} does not exist. Create it first.`);
      }

      logger.error({ err: error, key }, 'Failed to set secret in GCP Secret Manager');
      throw error;
    }
  }

  async deleteSecret(key: string): Promise<void> {
    try {
      await this.client.deleteSecret({
        name: this.getSecretPath(key),
      });

      logger.info({ key }, 'Secret deleted from GCP Secret Manager');
    } catch (error: any) {
      if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
        logger.warn({ key }, 'Secret not found, already deleted');
        return;
      }

      logger.error({ err: error, key }, 'Failed to delete secret from GCP Secret Manager');
      throw error;
    }
  }

  async listSecrets(prefix?: string): Promise<string[]> {
    try {
      const [secrets] = await this.client.listSecrets({
        parent: `projects/${this.projectId}`,
      });

      let secretNames = secrets.map((secret) => {
        // Extract secret name from full path: projects/{project}/secrets/{name}
        const match = secret.name?.match(/secrets\/([^/]+)$/);
        return match ? match[1] : '';
      });

      // Filter by prefix if provided
      if (prefix) {
        secretNames = secretNames.filter((name) => name.startsWith(prefix));
      }

      return secretNames.filter((name) => name !== '');
    } catch (error) {
      logger.error({ err: error }, 'Failed to list secrets from GCP Secret Manager');
      throw error;
    }
  }

  async secretExists(key: string): Promise<boolean> {
    try {
      await this.client.getSecret({
        name: this.getSecretPath(key),
      });
      return true;
    } catch (error: any) {
      if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
        return false;
      }

      logger.error({ err: error, key }, 'Failed to check secret existence in GCP Secret Manager');
      throw error;
    }
  }

  async rotateSecret(key: string, newValue: string): Promise<string> {
    try {
      const [version] = await this.client.addSecretVersion({
        parent: this.getSecretPath(key),
        payload: {
          data: Buffer.from(newValue, 'utf8'),
        },
      });

      const versionName = version.name || 'unknown';

      logger.info({ key, version: versionName }, 'Secret rotated in GCP Secret Manager');

      return versionName;
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to rotate secret in GCP Secret Manager');
      throw error;
    }
  }
}
