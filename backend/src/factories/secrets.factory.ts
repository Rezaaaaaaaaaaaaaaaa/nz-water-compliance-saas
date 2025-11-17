/**
 * Secrets Provider Factory
 *
 * Creates secrets provider instances based on environment configuration.
 */

import { ISecretsProvider } from '../interfaces/secrets.interface.js';
import { EnvSecretsProvider } from '../providers/secrets/env-secrets.provider.js';
import { VaultSecretsProvider } from '../providers/secrets/vault-secrets.provider.js';
import { AWSSecretsManagerProvider } from '../providers/secrets/aws-secrets-manager.provider.js';
// Azure and GCP providers commented out - packages not installed
// import { AzureKeyVaultProvider } from '../providers/secrets/azure-keyvault.provider.js';
// import { GCPSecretManagerProvider } from '../providers/secrets/gcp-secret-manager.provider.js';
import { logger } from '../config/logger.js';

export type SecretsProviderType = 'env' | 'vault' | 'aws' | 'azure' | 'gcp';

/**
 * Create secrets provider instance
 *
 * @param type - Provider type
 * @returns Secrets provider instance
 */
export function createSecretsProvider(type?: SecretsProviderType): ISecretsProvider {
  const providerType = type || (process.env.SECRETS_PROVIDER as SecretsProviderType) || 'env';

  logger.info({ provider: providerType }, 'Creating secrets provider');

  switch (providerType) {
    case 'env':
      return new EnvSecretsProvider();

    case 'vault':
      return new VaultSecretsProvider({
        address: process.env.VAULT_ADDR || 'http://localhost:8200',
        token: process.env.VAULT_TOKEN || '',
        namespace: process.env.VAULT_NAMESPACE,
        mountPath: process.env.VAULT_MOUNT_PATH || 'secret',
        version: (process.env.VAULT_KV_VERSION as 'v1' | 'v2') || 'v2',
      });

    case 'aws':
      return new AWSSecretsManagerProvider({
        region: process.env.AWS_REGION || 'ap-southeast-2',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });

    case 'azure':
      throw new Error('Azure Key Vault provider not available - install @azure/keyvault-secrets package');

    case 'gcp':
      throw new Error('GCP Secret Manager provider not available - install @google-cloud/secret-manager package');

    default:
      throw new Error(`Unknown secrets provider: ${providerType}`);
  }
}

/**
 * Global secrets provider instance
 */
let secretsProvider: ISecretsProvider | null = null;

/**
 * Get secrets provider singleton
 */
export function getSecretsProvider(): ISecretsProvider {
  if (!secretsProvider) {
    secretsProvider = createSecretsProvider();
  }
  return secretsProvider;
}
