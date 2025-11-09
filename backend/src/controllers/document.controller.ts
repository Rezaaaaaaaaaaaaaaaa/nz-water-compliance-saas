/**
 * Document Controller
 *
 * API endpoints for document management with S3 presigned URLs
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { DocumentType } from '@prisma/client';
import * as documentService from '../services/document.service.js';
import { requireUser } from '../middleware/auth.js';

/**
 * POST /api/v1/documents/upload-url
 * Request presigned URL for uploading document
 */
export async function requestUploadUrl(
  request: FastifyRequest<{
    Body: {
      fileName: string;
      fileSize: number;
      fileType: string;
      documentType: DocumentType;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    const result = await documentService.requestUploadUrl(user, request.body);

    return reply.code(200).send({
      ...result,
      message: 'Upload URL generated successfully',
    });
  } catch (error) {
    request.log.error({ err: error }, 'Request upload URL error');
    return reply.code(500).send({
      success: false,
      error: 'Failed to generate upload URL',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/v1/documents
 * Create document record after successful upload to S3
 */
export async function createDocument(
  request: FastifyRequest<{ Body: documentService.CreateDocumentRequest }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    const document = await documentService.createDocument(user, request.body, request);

    return reply.code(201).send({
      document,
      message: 'Document created successfully',
    });
  } catch (error) {
    request.log.error({ err: error }, 'Create document error');
    return reply.code(500).send({
      success: false,
      error: 'Failed to create document',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/v1/documents
 * List documents with filtering
 */
export async function listDocuments(
  request: FastifyRequest<{
    Querystring: {
      documentType?: DocumentType;
      search?: string;
      tags?: string;
      isPublic?: string;
      limit?: string;
      offset?: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);

    const result = await documentService.listDocuments(user, {
      documentType: request.query.documentType,
      search: request.query.search,
      tags: request.query.tags ? request.query.tags.split(',') : undefined,
      isPublic:
        request.query.isPublic !== undefined ? request.query.isPublic === 'true' : undefined,
      limit: request.query.limit ? parseInt(request.query.limit) : undefined,
      offset: request.query.offset ? parseInt(request.query.offset) : undefined,
    });

    return reply.code(200).send({
      success: true,
      data: result,
    });
  } catch (error) {
    request.log.error({ err: error }, 'List documents error');
    return reply.code(500).send({
      success: false,
      error: 'Failed to list documents',
    });
  }
}

/**
 * GET /api/v1/documents/:id
 * Get document by ID
 */
export async function getDocument(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    const document = await documentService.getDocument(request.params.id, user);

    if (!document) {
      return reply.code(404).send({
        success: false,
        error: 'Document not found',
      });
    }

    return reply.code(200).send({ document });
  } catch (error) {
    request.log.error({ err: error }, 'Get document error');
    return reply.code(500).send({
      success: false,
      error: 'Failed to get document',
    });
  }
}

/**
 * GET /api/v1/documents/:id/download
 * Get presigned download URL for document
 */
export async function getDownloadUrl(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    const result = await documentService.getDownloadUrl(request.params.id, user, request);

    return reply.code(200).send({
      ...result,
      message: 'Download URL generated successfully',
    });
  } catch (error) {
    request.log.error({ err: error }, 'Get download URL error');
    return reply.code(500).send({
      success: false,
      error: 'Failed to generate download URL',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * DELETE /api/v1/documents/:id
 * Delete document (soft delete - file retained in S3 for 7 years)
 */
export async function deleteDocument(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    await documentService.deleteDocument(request.params.id, user, request);

    return reply.code(200).send({
      message: 'Document deleted successfully (file retained in S3 for 7 years)',
    });
  } catch (error) {
    request.log.error({ err: error }, 'Delete document error');
    return reply.code(500).send({
      success: false,
      error: 'Failed to delete document',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/v1/documents/:id/link-asset
 * Link document to asset
 */
export async function linkToAsset(
  request: FastifyRequest<{
    Params: { id: string };
    Body: { assetId: string };
  }>,
  reply: FastifyReply
) {
  try {
    const result = await documentService.linkToAsset(request.params.id, request.body.assetId);

    return reply.code(200).send({
      link: result,
      message: 'Document linked to asset successfully',
    });
  } catch (error) {
    request.log.error({ err: error }, 'Link document to asset error');
    return reply.code(500).send({
      success: false,
      error: 'Failed to link document to asset',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/v1/documents/:id/link-compliance-plan
 * Link document to compliance plan
 */
export async function linkToCompliancePlan(
  request: FastifyRequest<{
    Params: { id: string };
    Body: { compliancePlanId: string };
  }>,
  reply: FastifyReply
) {
  try {
    const result = await documentService.linkToCompliancePlan(
      request.params.id,
      request.body.compliancePlanId
    );

    return reply.code(200).send({
      link: result,
      message: 'Document linked to compliance plan successfully',
    });
  } catch (error) {
    request.log.error({ err: error }, 'Link document to compliance plan error');
    return reply.code(500).send({
      success: false,
      error: 'Failed to link document to compliance plan',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
