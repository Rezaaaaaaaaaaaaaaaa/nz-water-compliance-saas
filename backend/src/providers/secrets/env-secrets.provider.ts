/**
 * Environment Variables Secrets Provider
 *
 * Simple provider that reads secrets from environment variables (.env files).
 * Suitable for development and simple deployments.
 */

import { ISecretsProvider } from '../../interfaces/secrets.interface.js';
import { logger } from '../../config/logger.js';

export class EnvSecretsProvider implements ISecretsProvider {
  private cache: Map<string, string> = new Map();

  async getSecret(key: string): Promise<string | null> {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key) || null;
    }

    // Get from process.env
    const value = process.env[key] || null;

    // Cache the value
    if (value) {
      this.cache.set(key, value);
    }

    return value;
  }

  async getSecrets(keys: string[]): Promise<Map<string, string | null>> {
    const result = new Map<string, string | null>();

    for (const key of keys) {
      const value = await this.getSecret(key);
      result.set(key, value);
    }

    return result;
  }

  async setSecret(key: string, value: string, _metadata?: Record<string, any>): Promise<void> {
    // Set in process.env (runtime only, not persisted)
    process.env[key] = value;

    // Update cache
    this.cache.set(key, value);

    logger.warn(
      { key },
      'Secret set in environment (not persisted). Consider using a proper secrets manager.'
    );
  }

  async deleteSecret(key: string): Promise<void> {
    delete process.env[key];
    this.cache.delete(key);
  }

  async listSecrets(prefix?: string): Promise<string[]> {
    const keys = Object.keys(process.env);

    if (prefix) {
      return keys.filter((key) => key.startsWith(prefix));
    }

    return keys;
  }

  async secretExists(key: string): Promise<boolean> {
    return key in process.env;
  }

  async rotateSecret(key: string, newValue: string): Promise<string> {
    await this.setSecret(key, newValue);
    return 'env-v' + Date.now(); // Simple versioning
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
