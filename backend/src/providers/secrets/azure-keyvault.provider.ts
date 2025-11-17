/**
 * Azure Key Vault Secrets Provider
 *
 * Production-grade secrets management for Microsoft Azure cloud deployments.
 * Supports managed identities, RBAC, and secret versioning.
 */

import { ISecretsProvider } from '../../interfaces/secrets.interface.js';
import { logger } from '../../config/logger.js';
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential, ClientSecretCredential } from '@azure/identity';

export interface AzureKeyVaultConfig {
  vaultUrl: string; // e.g., https://my-vault.vault.azure.net/
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  useManagedIdentity?: boolean; // Use DefaultAzureCredential for managed identities
}

export class AzureKeyVaultProvider implements ISecretsProvider {
  private client: SecretClient;

  constructor(config: AzureKeyVaultConfig) {
    // Use managed identity or service principal
    const credential = config.useManagedIdentity
      ? new DefaultAzureCredential()
      : new ClientSecretCredential(config.tenantId!, config.clientId!, config.clientSecret!);

    this.client = new SecretClient(config.vaultUrl, credential);

    logger.info({ vaultUrl: config.vaultUrl }, 'Azure Key Vault provider initialized');
  }

  async getSecret(key: string): Promise<string | null> {
    try {
      const secret = await this.client.getSecret(key);
      return secret.value || null;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }

      logger.error({ err: error, key }, 'Failed to get secret from Azure Key Vault');
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
      await this.client.setSecret(key, value, {
        tags: metadata,
      });

      logger.info({ key }, 'Secret set in Azure Key Vault');
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to set secret in Azure Key Vault');
      throw error;
    }
  }

  async deleteSecret(key: string): Promise<void> {
    try {
      // Azure Key Vault uses soft-delete by default
      const poller = await this.client.beginDeleteSecret(key);
      await poller.pollUntilDone();

      logger.info({ key }, 'Secret deleted from Azure Key Vault');
    } catch (error: any) {
      if (error.statusCode === 404) {
        logger.warn({ key }, 'Secret not found, already deleted');
        return;
      }

      logger.error({ err: error, key }, 'Failed to delete secret from Azure Key Vault');
      throw error;
    }
  }

  async listSecrets(prefix?: string): Promise<string[]> {
    try {
      const secretNames: string[] = [];

      for await (const properties of this.client.listPropertiesOfSecrets()) {
        if (properties.name) {
          // Filter by prefix if provided
          if (!prefix || properties.name.startsWith(prefix)) {
            secretNames.push(properties.name);
          }
        }
      }

      return secretNames;
    } catch (error) {
      logger.error({ err: error }, 'Failed to list secrets from Azure Key Vault');
      throw error;
    }
  }

  async secretExists(key: string): Promise<boolean> {
    try {
      await this.client.getSecret(key);
      return true;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return false;
      }

      logger.error({ err: error, key }, 'Failed to check secret existence in Azure Key Vault');
      throw error;
    }
  }

  async rotateSecret(key: string, newValue: string): Promise<string> {
    try {
      const secret = await this.client.setSecret(key, newValue);

      const version = secret.properties.version || 'unknown';

      logger.info({ key, version }, 'Secret rotated in Azure Key Vault');

      return version;
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to rotate secret in Azure Key Vault');
      throw error;
    }
  }
}
