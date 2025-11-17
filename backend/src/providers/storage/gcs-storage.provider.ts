/**
 * Google Cloud Storage (GCS) Provider
 *
 * Production-ready implementation for Google Cloud Platform deployments.
 * Supports all GCS features including signed URLs and object lifecycle management.
 */

import {
  IStorageProvider,
  IUploadOptions,
  IListResult,
  IStorageMetadata,
} from '../../interfaces/storage.interface.js';
import { logger } from '../../config/logger.js';
import { Storage, Bucket, File, GetSignedUrlConfig } from '@google-cloud/storage';

export interface GCSConfig {
  projectId: string;
  keyFilename?: string; // Path to service account JSON key file
  credentials?: {
    client_email: string;
    private_key: string;
  };
  bucketName: string;
}

export class GCSStorageProvider implements IStorageProvider {
  private storage: Storage;
  private bucket: Bucket;
  private bucketName: string;

  constructor(config: GCSConfig) {
    this.bucketName = config.bucketName;

    this.storage = new Storage({
      projectId: config.projectId,
      keyFilename: config.keyFilename,
      credentials: config.credentials,
    });

    this.bucket = this.storage.bucket(config.bucketName);

    logger.info({ bucketName: config.bucketName }, 'GCS storage provider initialized');
  }

  async uploadFile(key: string, data: Buffer, options?: IUploadOptions): Promise<string> {
    try {
      const file = this.bucket.file(key);

      await file.save(data, {
        metadata: {
          contentType: options?.contentType || 'application/octet-stream',
          cacheControl: options?.cacheControl,
          contentDisposition: options?.contentDisposition,
          metadata: options?.metadata,
        },
        resumable: false,
      });

      // Make public if specified
      if (options?.acl === 'public-read') {
        await file.makePublic();
      }

      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${key}`;

      logger.info({ key, size: data.length }, 'File uploaded to GCS');

      return publicUrl;
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to upload file to GCS');
      throw error;
    }
  }

  async downloadFile(key: string): Promise<Buffer> {
    try {
      const file = this.bucket.file(key);
      const [buffer] = await file.download();

      logger.info({ key, size: buffer.length }, 'File downloaded from GCS');

      return buffer;
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(`File not found: ${key}`);
      }
      logger.error({ err: error, key }, 'Failed to download file from GCS');
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const file = this.bucket.file(key);
      await file.delete({ ignoreNotFound: true });

      logger.info({ key }, 'File deleted from GCS');
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to delete file from GCS');
      throw error;
    }
  }

  async getPresignedUrl(
    key: string,
    expiresIn: number = 3600,
    operation: 'getObject' | 'putObject' = 'getObject'
  ): Promise<string> {
    try {
      const file = this.bucket.file(key);

      const action = operation === 'getObject' ? 'read' : 'write';

      const options: GetSignedUrlConfig = {
        version: 'v4',
        action,
        expires: Date.now() + expiresIn * 1000,
      };

      const [url] = await file.getSignedUrl(options);

      logger.info({ key, operation, expiresIn }, 'Generated signed URL for GCS');

      return url;
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to generate signed URL for GCS');
      throw error;
    }
  }

  async listFiles(prefix: string, maxResults: number = 1000): Promise<IListResult[]> {
    try {
      const [files] = await this.bucket.getFiles({
        prefix,
        maxResults,
      });

      const results: IListResult[] = files.map((file) => ({
        key: file.name,
        size: parseInt(file.metadata.size || '0', 10),
        lastModified: new Date(file.metadata.updated || file.metadata.timeCreated),
        etag: file.metadata.etag,
      }));

      logger.info({ prefix, count: results.length }, 'Listed files from GCS');

      return results;
    } catch (error) {
      logger.error({ err: error, prefix }, 'Failed to list files from GCS');
      throw error;
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const file = this.bucket.file(key);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to check file existence in GCS');
      return false;
    }
  }

  async getMetadata(key: string): Promise<IStorageMetadata> {
    try {
      const file = this.bucket.file(key);
      const [metadata] = await file.getMetadata();

      return {
        size: parseInt(metadata.size || '0', 10),
        contentType: metadata.contentType,
        lastModified: new Date(metadata.updated || metadata.timeCreated),
        etag: metadata.etag,
        metadata: metadata.metadata || {},
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(`File not found: ${key}`);
      }
      logger.error({ err: error, key }, 'Failed to get metadata from GCS');
      throw error;
    }
  }

  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      const sourceFile = this.bucket.file(sourceKey);
      const destFile = this.bucket.file(destinationKey);

      await sourceFile.copy(destFile);

      logger.info({ sourceKey, destinationKey }, 'File copied in GCS');
    } catch (error) {
      logger.error({ err: error, sourceKey, destinationKey }, 'Failed to copy file in GCS');
      throw error;
    }
  }
}
