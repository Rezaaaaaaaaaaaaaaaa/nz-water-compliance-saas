/**
 * AWS S3 Storage Provider
 *
 * Production-ready storage using Amazon S3.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  IStorageProvider,
  IUploadOptions,
  IListResult,
  IStorageMetadata,
} from '../../interfaces/storage.interface.js';
import { logger } from '../../config/logger.js';

export interface S3Config {
  region: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string; // For S3-compatible services
}

export class S3StorageProvider implements IStorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor(config: S3Config) {
    this.bucket = config.bucket;

    this.client = new S3Client({
      region: config.region,
      ...(config.accessKeyId &&
        config.secretAccessKey && {
          credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          },
        }),
      ...(config.endpoint && { endpoint: config.endpoint }),
    });

    logger.info({ bucket: config.bucket, region: config.region }, 'S3 storage provider initialized');
  }

  async uploadFile(key: string, data: Buffer, options?: IUploadOptions): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: options?.contentType || 'application/octet-stream',
        Metadata: options?.metadata,
        ACL: options?.acl || 'private',
        CacheControl: options?.cacheControl,
      });

      await this.client.send(command);

      logger.info({ key, size: data.length }, 'File uploaded to S3');

      return `s3://${this.bucket}/${key}`;
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to upload file to S3');
      throw error;
    }
  }

  async downloadFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        throw new Error('Empty response body');
      }

      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to download file from S3');
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);

      logger.info({ key }, 'File deleted from S3');
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to delete file from S3');
      throw error;
    }
  }

  async getPresignedUrl(
    key: string,
    expiresIn: number = 3600,
    operation: 'getObject' | 'putObject' = 'getObject'
  ): Promise<string> {
    try {
      const command =
        operation === 'getObject'
          ? new GetObjectCommand({ Bucket: this.bucket, Key: key })
          : new PutObjectCommand({ Bucket: this.bucket, Key: key });

      const url = await getSignedUrl(this.client, command, { expiresIn });

      return url;
    } catch (error) {
      logger.error({ err: error, key, operation }, 'Failed to generate presigned URL');
      throw error;
    }
  }

  async listFiles(prefix: string, maxResults: number = 1000): Promise<IListResult[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxResults,
      });

      const response = await this.client.send(command);

      return (
        response.Contents?.map((obj) => ({
          key: obj.Key || '',
          size: obj.Size || 0,
          lastModified: obj.LastModified || new Date(),
          etag: obj.ETag,
        })) || []
      );
    } catch (error) {
      logger.error({ err: error, prefix }, 'Failed to list files from S3');
      throw error;
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  async getMetadata(key: string): Promise<IStorageMetadata> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);

      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        etag: response.ETag,
        metadata: response.Metadata,
      };
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to get metadata from S3');
      throw error;
    }
  }

  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      const command = new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destinationKey,
      });

      await this.client.send(command);

      logger.info({ sourceKey, destinationKey }, 'File copied in S3');
    } catch (error) {
      logger.error({ err: error, sourceKey, destinationKey }, 'Failed to copy file in S3');
      throw error;
    }
  }
}
