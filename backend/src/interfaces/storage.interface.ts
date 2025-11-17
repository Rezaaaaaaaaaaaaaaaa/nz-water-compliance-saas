/**
 * Storage Provider Interface
 *
 * Infrastructure-agnostic storage abstraction for file/object storage.
 * Supports AWS S3, Azure Blob, GCS, MinIO, and local filesystem.
 */

export interface IStorageMetadata {
  contentType?: string;
  contentLength?: number;
  lastModified?: Date;
  etag?: string;
  [key: string]: any;
}

export interface IUploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: 'private' | 'public-read' | 'public-read-write';
  cacheControl?: string;
}

export interface IListResult {
  key: string;
  size: number;
  lastModified: Date;
  etag?: string;
}

export interface IStorageProvider {
  /**
   * Upload a file to storage
   *
   * @param key - The storage key/path
   * @param data - File data as Buffer
   * @param options - Upload options (content type, metadata, etc.)
   * @returns URL or key of uploaded file
   */
  uploadFile(key: string, data: Buffer, options?: IUploadOptions): Promise<string>;

  /**
   * Download a file from storage
   *
   * @param key - The storage key/path
   * @returns File data as Buffer
   */
  downloadFile(key: string): Promise<Buffer>;

  /**
   * Delete a file from storage
   *
   * @param key - The storage key/path
   */
  deleteFile(key: string): Promise<void>;

  /**
   * Generate a presigned URL for temporary access
   *
   * @param key - The storage key/path
   * @param expiresIn - Expiration time in seconds (default: 3600)
   * @param operation - Operation type ('getObject' | 'putObject')
   * @returns Presigned URL
   */
  getPresignedUrl(
    key: string,
    expiresIn?: number,
    operation?: 'getObject' | 'putObject'
  ): Promise<string>;

  /**
   * List files in a directory/prefix
   *
   * @param prefix - Directory prefix to list
   * @param maxResults - Maximum number of results (default: 1000)
   * @returns List of file information
   */
  listFiles(prefix: string, maxResults?: number): Promise<IListResult[]>;

  /**
   * Check if a file exists
   *
   * @param key - The storage key/path
   * @returns True if file exists
   */
  fileExists(key: string): Promise<boolean>;

  /**
   * Get file metadata
   *
   * @param key - The storage key/path
   * @returns File metadata
   */
  getMetadata(key: string): Promise<IStorageMetadata>;

  /**
   * Copy a file within storage
   *
   * @param sourceKey - Source file key
   * @param destinationKey - Destination file key
   */
  copyFile(sourceKey: string, destinationKey: string): Promise<void>;
}
