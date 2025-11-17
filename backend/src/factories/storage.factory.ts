/**
 * Storage Provider Factory
 *
 * Creates storage provider instances based on environment configuration.
 * Enables easy switching between cloud providers.
 */

import { IStorageProvider } from '../interfaces/storage.interface.js';
import { S3StorageProvider } from '../providers/storage/s3-storage.provider.js';
import { LocalStorageProvider } from '../providers/storage/local-storage.provider.js';
// Azure and GCP providers commented out - packages not installed
// import { AzureBlobStorageProvider } from '../providers/storage/azure-blob-storage.provider.js';
// import { GCSStorageProvider } from '../providers/storage/gcs-storage.provider.js';
import { MinIOStorageProvider } from '../providers/storage/minio-storage.provider.js';
import { logger } from '../config/logger.js';

export type StorageProviderType = 's3' | 'local' | 'azure' | 'gcs' | 'minio';

/**
 * Create storage provider instance
 *
 * @param type - Provider type
 * @returns Storage provider instance
 */
export function createStorageProvider(type?: StorageProviderType): IStorageProvider {
  const providerType = type || (process.env.STORAGE_PROVIDER as StorageProviderType) || 's3';

  logger.info({ provider: providerType }, 'Creating storage provider');

  switch (providerType) {
    case 's3':
      return new S3StorageProvider({
        region: process.env.AWS_REGION || 'ap-southeast-2',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        bucketName: process.env.S3_BUCKET_NAME || '',
      });

    case 'local':
      return new LocalStorageProvider({
        basePath: process.env.LOCAL_STORAGE_PATH || './storage',
        baseUrl: process.env.LOCAL_STORAGE_BASE_URL,
      });

    case 'azure':
      throw new Error('Azure Blob Storage provider not available - install @azure/storage-blob package');

    case 'gcs':
      throw new Error('Google Cloud Storage provider not available - install @google-cloud/storage package');

    case 'minio':
      return new MinIOStorageProvider({
        endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
        accessKey: process.env.MINIO_ACCESS_KEY || '',
        secretKey: process.env.MINIO_SECRET_KEY || '',
        bucketName: process.env.MINIO_BUCKET_NAME || '',
        region: process.env.MINIO_REGION,
      });

    default:
      throw new Error(`Unknown storage provider: ${providerType}`);
  }
}

/**
 * Global storage provider instance
 */
let storageProvider: IStorageProvider | null = null;

/**
 * Get storage provider singleton
 */
export function getStorageProvider(): IStorageProvider {
  if (!storageProvider) {
    storageProvider = createStorageProvider();
  }
  return storageProvider;
}
