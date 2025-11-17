/**
 * MinIO Storage Provider
 *
 * S3-compatible object storage for self-hosted or hybrid cloud deployments.
 * Provides full S3 API compatibility with additional features.
 */

import {
  IStorageProvider,
  IUploadOptions,
  IListResult,
  IStorageMetadata,
} from '../../interfaces/storage.interface.js';
import { logger } from '../../config/logger.js';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface MinIOConfig {
  endpoint: string; // e.g., http://localhost:9000 or https://minio.example.com
  port?: number;
  useSSL?: boolean;
  accessKey: string;
  secretKey: string;
  bucketName: string;
  region?: string; // Default: us-east-1
}

export class MinIOStorageProvider implements IStorageProvider {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(config: MinIOConfig) {
    this.bucketName = config.bucketName;

    // Parse endpoint to extract protocol and hostname
    const endpointUrl = new URL(config.endpoint);
    const useSSL = config.useSSL ?? endpointUrl.protocol === 'https:';

    this.s3Client = new S3Client({
      endpoint: config.endpoint,
      region: config.region || 'us-east-1',
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: true, // Required for MinIO
      tls: useSSL,
    });

    logger.info({ endpoint: config.endpoint, bucketName: config.bucketName }, 'MinIO storage provider initialized');
  }

  async uploadFile(key: string, data: Buffer, options?: IUploadOptions): Promise<string> {
    try {
      const params: PutObjectCommandInput = {
        Bucket: this.bucketName,
        Key: key,
        Body: data,
        ContentType: options?.contentType || 'application/octet-stream',
        CacheControl: options?.cacheControl,
        ContentDisposition: options?.contentDisposition,
        Metadata: options?.metadata,
        ACL: options?.acl as any,
      };

      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);

      // Construct public URL (MinIO)
      const url = `${this.s3Client.config.endpoint}/${this.bucketName}/${key}`;

      logger.info({ key, size: data.length }, 'File uploaded to MinIO');

      return url;
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to upload file to MinIO');
      throw error;
    }
  }

  async downloadFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error('No body in response');
      }

      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      logger.info({ key, size: buffer.length }, 'File downloaded from MinIO');

      return buffer;
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        throw new Error(`File not found: ${key}`);
      }
      logger.error({ err: error, key }, 'Failed to download file from MinIO');
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);

      logger.info({ key }, 'File deleted from MinIO');
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to delete file from MinIO');
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
          ? new GetObjectCommand({ Bucket: this.bucketName, Key: key })
          : new PutObjectCommand({ Bucket: this.bucketName, Key: key });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });

      logger.info({ key, operation, expiresIn }, 'Generated presigned URL for MinIO');

      return url;
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to generate presigned URL for MinIO');
      throw error;
    }
  }

  async listFiles(prefix: string, maxResults: number = 1000): Promise<IListResult[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxResults,
      });

      const response = await this.s3Client.send(command);

      const results: IListResult[] =
        response.Contents?.map((item) => ({
          key: item.Key || '',
          size: item.Size || 0,
          lastModified: item.LastModified || new Date(),
          etag: item.ETag,
        })) || [];

      logger.info({ prefix, count: results.length }, 'Listed files from MinIO');

      return results;
    } catch (error) {
      logger.error({ err: error, prefix }, 'Failed to list files from MinIO');
      throw error;
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.name === 'NoSuchKey') {
        return false;
      }
      logger.error({ err: error, key }, 'Failed to check file existence in MinIO');
      throw error;
    }
  }

  async getMetadata(key: string): Promise<IStorageMetadata> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType,
        lastModified: response.LastModified || new Date(),
        etag: response.ETag,
        metadata: response.Metadata || {},
      };
    } catch (error: any) {
      if (error.name === 'NotFound' || error.name === 'NoSuchKey') {
        throw new Error(`File not found: ${key}`);
      }
      logger.error({ err: error, key }, 'Failed to get metadata from MinIO');
      throw error;
    }
  }

  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      const command = new CopyObjectCommand({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey,
      });

      await this.s3Client.send(command);

      logger.info({ sourceKey, destinationKey }, 'File copied in MinIO');
    } catch (error) {
      logger.error({ err: error, sourceKey, destinationKey }, 'Failed to copy file in MinIO');
      throw error;
    }
  }
}
