/**
 * Secrets Provider Interface
 *
 * Infrastructure-agnostic secrets management abstraction.
 * Supports .env files, HashiCorp Vault, AWS Secrets Manager,
 * Azure Key Vault, and GCP Secret Manager.
 */

export interface ISecret {
  key: string;
  value: string;
  version?: string;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: Record<string, any>;
}

export interface ISecretsProvider {
  /**
   * Get a secret value by key
   *
   * @param key - Secret key/name
   * @returns Secret value or null if not found
   */
  getSecret(key: string): Promise<string | null>;

  /**
   * Get multiple secrets at once
   *
   * @param keys - Array of secret keys
   * @returns Map of key -> value (null if not found)
   */
  getSecrets(keys: string[]): Promise<Map<string, string | null>>;

  /**
   * Set/update a secret value
   *
   * @param key - Secret key/name
   * @param value - Secret value
   * @param metadata - Optional metadata
   */
  setSecret(key: string, value: string, metadata?: Record<string, any>): Promise<void>;

  /**
   * Delete a secret
   *
   * @param key - Secret key/name
   */
  deleteSecret(key: string): Promise<void>;

  /**
   * List all secret keys (not values)
   *
   * @param prefix - Optional prefix to filter
   * @returns Array of secret keys
   */
  listSecrets(prefix?: string): Promise<string[]>;

  /**
   * Check if a secret exists
   *
   * @param key - Secret key/name
   * @returns True if secret exists
   */
  secretExists(key: string): Promise<boolean>;

  /**
   * Rotate a secret (create new version)
   *
   * @param key - Secret key/name
   * @param newValue - New secret value
   * @returns New version ID
   */
  rotateSecret(key: string, newValue: string): Promise<string>;
}
