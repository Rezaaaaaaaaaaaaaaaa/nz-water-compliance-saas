/**
 * Document Service
 *
 * Manages regulatory documents with version control and S3 storage
 * Required for compliance record keeping (7-year retention)
 */

import { PrismaClient, DocumentType } from '@prisma/client';
import { AuthenticatedUser } from '../types/auth.js';
import * as s3Service from './s3.service.js';
import * as auditService from './audit.service.js';

const prisma = new PrismaClient();

export interface CreateDocumentRequest {
  title: string;
  description?: string;
  documentType: DocumentType;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileKey: string;
  version?: string;
  parentDocumentId?: string;
  tags?: string[];
  isPublic?: boolean;
  effectiveDate?: string;
  expiryDate?: string;
  reviewDate?: string;
}

export interface DocumentFilters {
  documentType?: DocumentType;
  search?: string;
  tags?: string[];
  isPublic?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Request upload URL for new document
 * Returns presigned URL for direct browser upload to S3
 */
export async function requestUploadUrl(
  user: AuthenticatedUser,
  params: {
    fileName: string;
    fileSize: number;
    fileType: string;
    documentType: DocumentType;
  }
) {
  // Generate unique file key
  const fileKey = s3Service.generateFileKey(
    user.organizationId,
    params.documentType,
    params.fileName
  );

  // Generate presigned upload URL
  const { uploadUrl } = await s3Service.generateUploadUrl({
    fileKey,
    contentType: params.fileType,
    fileSize: params.fileSize,
  });

  return {
    uploadUrl,
    fileKey,
    expiresIn: 900, // 15 minutes
  };
}

/**
 * Create document record after successful upload
 * Called after browser uploads file to S3
 */
export async function createDocument(
  user: AuthenticatedUser,
  data: CreateDocumentRequest,
  request: any
) {
  const document = await prisma.document.create({
    data: {
      organizationId: user.organizationId,
      createdById: user.id,
      title: data.title,
      description: data.description,
      documentType: data.documentType,
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileType: data.fileType,
      fileKey: data.fileKey,
      version: data.version || '1.0',
      parentDocumentId: data.parentDocumentId,
      tags: data.tags || [],
      isPublic: data.isPublic || false,
      effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      reviewDate: data.reviewDate ? new Date(data.reviewDate) : null,
    },
  });

  // Audit log
  await auditService.auditCreate(user, 'Document', document.id, document, request);

  return document;
}

/**
 * Get document by ID
 */
export async function getDocument(id: string, user: AuthenticatedUser) {
  const document = await prisma.document.findFirst({
    where: {
      id,
      deletedAt: null,
      // User can only access their org's documents (unless Auditor/Admin) or public docs
      OR: [
        user.role === 'AUDITOR' || user.role === 'SYSTEM_ADMIN'
          ? {}
          : { organizationId: user.organizationId },
        { isPublic: true },
      ],
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      parentDocument: {
        select: {
          id: true,
          title: true,
          version: true,
        },
      },
      childVersions: {
        where: { deletedAt: null },
        select: {
          id: true,
          title: true,
          version: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  // Audit VIEW action for sensitive documents
  if (document && !document.isPublic) {
    // Fire and forget - don't wait
    auditService
      .auditView(user, 'Document', id, { ip: 'N/A' })
      .catch((err) => console.error('Failed to audit view:', err));
  }

  return document;
}

/**
 * List documents
 */
export async function listDocuments(user: AuthenticatedUser, filters: DocumentFilters) {
  const where: any = {
    deletedAt: null,
  };

  // Filter by organization (unless Auditor/Admin) or public
  if (user.role !== 'AUDITOR' && user.role !== 'SYSTEM_ADMIN') {
    where.OR = [{ organizationId: user.organizationId }, { isPublic: true }];
  }

  if (filters.documentType) {
    where.documentType = filters.documentType;
  }

  if (filters.isPublic !== undefined) {
    where.isPublic = filters.isPublic;
  }

  if (filters.tags && filters.tags.length > 0) {
    where.tags = {
      hasSome: filters.tags,
    };
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { fileName: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      take: filters.limit || 50,
      skip: filters.offset || 0,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.document.count({ where }),
  ]);

  return {
    documents,
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  };
}

/**
 * Get download URL for document
 */
export async function getDownloadUrl(id: string, user: AuthenticatedUser, request: any) {
  const document = await getDocument(id, user);

  if (!document) {
    throw new Error('Document not found');
  }

  // Generate presigned download URL
  const downloadUrl = await s3Service.generateDownloadUrl(document.fileKey);

  // Audit export action
  await auditService.auditExport(user, 'Document', id, request);

  return {
    downloadUrl,
    expiresIn: 3600, // 1 hour
    fileName: document.fileName,
  };
}

/**
 * Delete document (soft delete)
 * File remains in S3 for regulatory compliance (7-year retention)
 */
export async function deleteDocument(
  id: string,
  user: AuthenticatedUser,
  request: any
) {
  const document = await getDocument(id, user);
  if (!document) {
    throw new Error('Document not found');
  }

  const deleted = await prisma.document.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  // Audit log
  await auditService.auditDelete(
    user,
    'Document',
    id,
    document,
    request,
    'Document soft deleted (file retained in S3 for 7 years)'
  );

  // NOTE: We do NOT delete from S3 - regulatory requirement to keep for 7 years
  // Use a lifecycle policy in S3 to automatically delete after retention period

  return deleted;
}

/**
 * Link document to asset
 */
export async function linkToAsset(documentId: string, assetId: string) {
  return await prisma.assetDocument.create({
    data: {
      documentId,
      assetId,
    },
  });
}

/**
 * Link document to compliance plan
 */
export async function linkToCompliancePlan(documentId: string, compliancePlanId: string) {
  return await prisma.compliancePlanDocument.create({
    data: {
      documentId,
      compliancePlanId,
    },
  });
}
