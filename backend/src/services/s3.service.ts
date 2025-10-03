/**
 * S3 Service
 *
 * Handles file upload/download using AWS S3 presigned URLs
 * Secure method - files go directly from browser to S3
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/index.js';
import crypto from 'crypto';

// Initialize S3 client
const s3Client = new S3Client({
  region: config.aws.s3BucketRegion,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

/**
 * Allowed file types based on regulatory requirements
 */
const ALLOWED_MIME_TYPES = {
  // Documents
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',

  // Spreadsheets
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/csv': 'csv',

  // Images
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',

  // Other
  'text/plain': 'txt',
};

/**
 * Generate unique file key for S3
 */
export function generateFileKey(
  organizationId: string,
  documentType: string,
  filename: string
): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');

  return `organizations/${organizationId}/${documentType}/${timestamp}-${randomString}-${sanitizedFilename}`;
}

/**
 * Validate file type
 */
export function validateFileType(mimeType: string): { valid: boolean; extension?: string; error?: string } {
  const extension = ALLOWED_MIME_TYPES[mimeType as keyof typeof ALLOWED_MIME_TYPES];

  if (!extension) {
    return {
      valid: false,
      error: `File type not allowed: ${mimeType}. Allowed types: ${Object.keys(ALLOWED_MIME_TYPES).join(', ')}`,
    };
  }

  return { valid: true, extension };
}

/**
 * Validate file size
 */
export function validateFileSize(size: number): { valid: boolean; error?: string } {
  if (size > config.maxFileSize) {
    return {
      valid: false,
      error: `File too large: ${size} bytes. Maximum: ${config.maxFileSize} bytes (${config.maxFileSize / 1024 / 1024}MB)`,
    };
  }

  return { valid: true };
}

/**
 * Generate presigned URL for uploading file to S3
 * Browser uploads directly to S3 using this URL
 */
export async function generateUploadUrl(params: {
  fileKey: string;
  contentType: string;
  fileSize: number;
}): Promise<{ uploadUrl: string; fileKey: string }> {
  // Validate
  const typeValidation = validateFileType(params.contentType);
  if (!typeValidation.valid) {
    throw new Error(typeValidation.error);
  }

  const sizeValidation = validateFileSize(params.fileSize);
  if (!sizeValidation.valid) {
    throw new Error(sizeValidation.error);
  }

  // Generate presigned URL (expires in 15 minutes)
  const command = new PutObjectCommand({
    Bucket: config.aws.s3BucketName,
    Key: params.fileKey,
    ContentType: params.contentType,
    ContentLength: params.fileSize,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 900, // 15 minutes
  });

  return {
    uploadUrl,
    fileKey: params.fileKey,
  };
}

/**
 * Generate presigned URL for downloading file from S3
 */
export async function generateDownloadUrl(fileKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: config.aws.s3BucketName,
    Key: fileKey,
  });

  // Presigned URL expires in 1 hour
  const downloadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600, // 1 hour
  });

  return downloadUrl;
}

/**
 * Delete file from S3
 * Used when document is permanently deleted
 */
export async function deleteFile(fileKey: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: config.aws.s3BucketName,
    Key: fileKey,
  });

  await s3Client.send(command);
}

/**
 * Get file metadata from S3
 */
export async function getFileMetadata(fileKey: string) {
  // For now, we'll just return the key
  // In production, you might want to HEAD the object to get size, etc.
  return {
    fileKey,
    bucket: config.aws.s3BucketName,
    region: config.aws.s3BucketRegion,
  };
}
