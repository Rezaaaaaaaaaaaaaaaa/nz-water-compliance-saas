/**
 * HashiCorp Vault Secrets Provider
 *
 * Production-grade secrets management for infrastructure-agnostic deployments.
 * Supports KV v2 secrets engine.
 */

import { ISecretsProvider } from '../../interfaces/secrets.interface.js';
import { logger } from '../../config/logger.js';
import axios, { AxiosInstance } from 'axios';

export interface VaultConfig {
  address: string; // e.g., https://vault.example.com:8200
  token: string; // Vault token
  namespace?: string; // Enterprise namespace
  mountPath?: string; // KV mount path (default: 'secret')
  version?: 'v1' | 'v2'; // KV version (default: 'v2')
}

export class VaultSecretsProvider implements ISecretsProvider {
  private client: AxiosInstance;
  private mountPath: string;
  private version: string;

  constructor(config: VaultConfig) {
    this.mountPath = config.mountPath || 'secret';
    this.version = config.version || 'v2';

    this.client = axios.create({
      baseURL: config.address,
      headers: {
        'X-Vault-Token': config.token,
        ...(config.namespace && { 'X-Vault-Namespace': config.namespace }),
      },
    });

    logger.info({ address: config.address }, 'Vault secrets provider initialized');
  }

  async getSecret(key: string): Promise<string | null> {
    try {
      const path =
        this.version === 'v2'
          ? `/v1/${this.mountPath}/data/${key}`
          : `/v1/${this.mountPath}/${key}`;

      const response = await this.client.get(path);

      if (this.version === 'v2') {
        return response.data?.data?.data?.value || null;
      }

      return response.data?.data?.value || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }

      logger.error({ err: error, key }, 'Failed to get secret from Vault');
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
      const path =
        this.version === 'v2'
          ? `/v1/${this.mountPath}/data/${key}`
          : `/v1/${this.mountPath}/${key}`;

      const data =
        this.version === 'v2'
          ? { data: { value, ...metadata } }
          : { value, ...metadata };

      await this.client.post(path, data);

      logger.info({ key }, 'Secret set in Vault');
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to set secret in Vault');
      throw error;
    }
  }

  async deleteSecret(key: string): Promise<void> {
    try {
      const path =
        this.version === 'v2'
          ? `/v1/${this.mountPath}/metadata/${key}`
          : `/v1/${this.mountPath}/${key}`;

      await this.client.delete(path);

      logger.info({ key }, 'Secret deleted from Vault');
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to delete secret from Vault');
      throw error;
    }
  }

  async listSecrets(prefix?: string): Promise<string[]> {
    try {
      const path =
        this.version === 'v2'
          ? `/v1/${this.mountPath}/metadata`
          : `/v1/${this.mountPath}`;

      const listPath = prefix ? `${path}/${prefix}` : path;

      const response = await this.client.request({
        method: 'LIST',
        url: listPath,
      });

      const keys = response.data?.data?.keys || [];

      return keys;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }

      logger.error({ err: error }, 'Failed to list secrets from Vault');
      throw error;
    }
  }

  async secretExists(key: string): Promise<boolean> {
    const value = await this.getSecret(key);
    return value !== null;
  }

  async rotateSecret(key: string, newValue: string): Promise<string> {
    await this.setSecret(key, newValue);

    // Vault automatically versions in KV v2
    if (this.version === 'v2') {
      try {
        const path = `/v1/${this.mountPath}/metadata/${key}`;
        const response = await this.client.get(path);
        const version = response.data?.data?.current_version || 'unknown';
        return version.toString();
      } catch (error) {
        logger.warn({ err: error }, 'Could not get version after rotation');
        return 'unknown';
      }
    }

    return 'v1-' + Date.now();
  }
}
