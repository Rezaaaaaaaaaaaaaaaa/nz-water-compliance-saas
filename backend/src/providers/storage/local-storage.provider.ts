/**
 * Local Filesystem Storage Provider
 *
 * For development and testing. Stores files on local filesystem.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import {
  IStorageProvider,
  IUploadOptions,
  IListResult,
  IStorageMetadata,
} from '../../interfaces/storage.interface.js';
import { logger } from '../../config/logger.js';

export interface LocalStorageConfig {
  basePath: string; // Base directory for storage
  baseUrl?: string; // Base URL for generating URLs (optional)
}

export class LocalStorageProvider implements IStorageProvider {
  private basePath: string;
  private baseUrl?: string;

  constructor(config: LocalStorageConfig) {
    this.basePath = path.resolve(config.basePath);
    this.baseUrl = config.baseUrl;

    logger.info({ basePath: this.basePath }, 'Local storage provider initialized');

    // Ensure base directory exists
    fs.mkdir(this.basePath, { recursive: true }).catch((err) => {
      logger.error({ err }, 'Failed to create base storage directory');
    });
  }

  private getFullPath(key: string): string {
    return path.join(this.basePath, key);
  }

  async uploadFile(key: string, data: Buffer, options?: IUploadOptions): Promise<string> {
    try {
      const fullPath = this.getFullPath(key);

      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      // Write file
      await fs.writeFile(fullPath, data);

      // Store metadata as extended attributes or separate file
      if (options?.metadata) {
        const metadataPath = `${fullPath}.metadata.json`;
        await fs.writeFile(
          metadataPath,
          JSON.stringify({
            ...options.metadata,
            contentType: options.contentType,
          })
        );
      }

      logger.info({ key, size: data.length }, 'File uploaded to local storage');

      return this.baseUrl ? `${this.baseUrl}/${key}` : `file://${fullPath}`;
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to upload file to local storage');
      throw error;
    }
  }

  async downloadFile(key: string): Promise<Buffer> {
    try {
      const fullPath = this.getFullPath(key);
      return await fs.readFile(fullPath);
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to download file from local storage');
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const fullPath = this.getFullPath(key);
      await fs.unlink(fullPath);

      // Delete metadata file if exists
      const metadataPath = `${fullPath}.metadata.json`;
      try {
        await fs.unlink(metadataPath);
      } catch {
        // Ignore if metadata file doesn't exist
      }

      logger.info({ key }, 'File deleted from local storage');
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to delete file from local storage');
      throw error;
    }
  }

  async getPresignedUrl(
    key: string,
    expiresIn: number = 3600,
    _operation: 'getObject' | 'putObject' = 'getObject'
  ): Promise<string> {
    // For local storage, we can't generate true presigned URLs
    // Return a simple URL (in production, you'd use a temporary token system)
    const fullPath = this.getFullPath(key);

    if (this.baseUrl) {
      return `${this.baseUrl}/${key}?expires=${Date.now() + expiresIn * 1000}`;
    }

    return `file://${fullPath}`;
  }

  async listFiles(prefix: string, maxResults: number = 1000): Promise<IListResult[]> {
    try {
      const fullPath = this.getFullPath(prefix);
      const results: IListResult[] = [];

      const walk = async (dir: string, baseDir: string = '') => {
        if (results.length >= maxResults) return;

        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (results.length >= maxResults) break;

          const fullEntryPath = path.join(dir, entry.name);
          const relativePath = path.join(baseDir, entry.name);

          if (entry.isDirectory()) {
            await walk(fullEntryPath, relativePath);
          } else if (!entry.name.endsWith('.metadata.json')) {
            const stats = await fs.stat(fullEntryPath);
            results.push({
              key: path.join(prefix, relativePath),
              size: stats.size,
              lastModified: stats.mtime,
            });
          }
        }
      };

      try {
        await walk(fullPath);
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          return []; // Directory doesn't exist
        }
        throw error;
      }

      return results;
    } catch (error) {
      logger.error({ err: error, prefix }, 'Failed to list files from local storage');
      throw error;
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const fullPath = this.getFullPath(key);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(key: string): Promise<IStorageMetadata> {
    try {
      const fullPath = this.getFullPath(key);
      const stats = await fs.stat(fullPath);

      let metadata: any = {};

      // Try to read metadata file
      const metadataPath = `${fullPath}.metadata.json`;
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        metadata = JSON.parse(metadataContent);
      } catch {
        // No metadata file
      }

      return {
        contentType: metadata.contentType || 'application/octet-stream',
        contentLength: stats.size,
        lastModified: stats.mtime,
        ...metadata,
      };
    } catch (error) {
      logger.error({ err: error, key }, 'Failed to get metadata from local storage');
      throw error;
    }
  }

  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      const sourcePath = this.getFullPath(sourceKey);
      const destPath = this.getFullPath(destinationKey);

      // Ensure destination directory exists
      await fs.mkdir(path.dirname(destPath), { recursive: true });

      // Copy file
      await fs.copyFile(sourcePath, destPath);

      // Copy metadata if exists
      const sourceMetadataPath = `${sourcePath}.metadata.json`;
      const destMetadataPath = `${destPath}.metadata.json`;
      try {
        await fs.copyFile(sourceMetadataPath, destMetadataPath);
      } catch {
        // Ignore if metadata file doesn't exist
      }

      logger.info({ sourceKey, destinationKey }, 'File copied in local storage');
    } catch (error) {
      logger.error({ err: error, sourceKey, destinationKey }, 'Failed to copy file in local storage');
      throw error;
    }
  }
}
