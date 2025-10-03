/**
 * DWSP (Drinking Water Safety Plan) Controller
 *
 * API endpoints for DWSP management
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { CompliancePlanStatus } from '@prisma/client';
import { CreateDWSPRequest, SubmitDWSPRequest, ApproveDWSPRequest } from '../types/dwsp.js';
import * as dwspService from '../services/dwsp.service.js';
import { requireUser } from '../middleware/auth.js';

/**
 * POST /api/v1/compliance/dwsp
 * Create new DWSP
 */
export async function createDWSP(
  request: FastifyRequest<{ Body: CreateDWSPRequest }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    const result = await dwspService.createDWSP(user, request.body, request);

    return reply.code(201).send({
      dwsp: result.dwsp,
      validation: result.validation,
      message: result.validation.isValid
        ? 'DWSP created successfully'
        : 'DWSP created with validation warnings',
    });
  } catch (error) {
    request.log.error({ err: error }, 'Create DWSP error');
    return reply.code(500).send({
      error: 'Failed to create DWSP',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/v1/compliance/dwsp
 * List DWSPs for organization
 */
export async function listDWSPs(
  request: FastifyRequest<{
    Querystring: {
      status?: CompliancePlanStatus;
      limit?: string;
      offset?: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);

    const result = await dwspService.listDWSPs(user, {
      status: request.query.status,
      limit: request.query.limit ? parseInt(request.query.limit) : undefined,
      offset: request.query.offset ? parseInt(request.query.offset) : undefined,
    });

    return reply.code(200).send(result);
  } catch (error) {
    request.log.error({ err: error }, 'List DWSPs error');
    return reply.code(500).send({
      error: 'Failed to list DWSPs',
    });
  }
}

/**
 * GET /api/v1/compliance/dwsp/:id
 * Get DWSP by ID
 */
export async function getDWSP(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    const dwsp = await dwspService.getDWSP(request.params.id, user);

    if (!dwsp) {
      return reply.code(404).send({
        error: 'DWSP not found',
      });
    }

    // Validate DWSP
    const validation = dwspService.validateDWSP(dwsp);

    return reply.code(200).send({
      dwsp,
      validation,
    });
  } catch (error) {
    request.log.error({ err: error }, 'Get DWSP error');
    return reply.code(500).send({
      error: 'Failed to get DWSP',
    });
  }
}

/**
 * PATCH /api/v1/compliance/dwsp/:id
 * Update DWSP
 */
export async function updateDWSP(
  request: FastifyRequest<{
    Params: { id: string };
    Body: Partial<CreateDWSPRequest>;
  }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    const dwsp = await dwspService.updateDWSP(
      request.params.id,
      user,
      request.body,
      request
    );

    return reply.code(200).send({
      dwsp,
      message: 'DWSP updated successfully',
    });
  } catch (error) {
    request.log.error({ err: error }, 'Update DWSP error');
    return reply.code(500).send({
      error: 'Failed to update DWSP',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/v1/compliance/dwsp/:id/submit
 * Submit DWSP to Taumata Arowai
 *
 * CRITICAL: Regulatory submission - only Compliance Managers
 */
export async function submitDWSP(
  request: FastifyRequest<{
    Params: { id: string };
    Body: SubmitDWSPRequest;
  }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    const dwsp = await dwspService.submitDWSP(request.params.id, user, request);

    return reply.code(200).send({
      dwsp,
      message: 'DWSP submitted to Taumata Arowai successfully',
    });
  } catch (error) {
    request.log.error({ err: error }, 'Submit DWSP error');
    return reply.code(500).send({
      error: 'Failed to submit DWSP',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/v1/compliance/dwsp/:id/approve
 * Approve DWSP
 */
export async function approveDWSP(
  request: FastifyRequest<{
    Params: { id: string };
    Body: ApproveDWSPRequest;
  }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    const dwsp = await dwspService.approveDWSP(
      request.params.id,
      user,
      request.body.approvalNotes,
      request
    );

    return reply.code(200).send({
      dwsp,
      message: 'DWSP approved successfully',
    });
  } catch (error) {
    request.log.error({ err: error }, 'Approve DWSP error');
    return reply.code(500).send({
      error: 'Failed to approve DWSP',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * DELETE /api/v1/compliance/dwsp/:id
 * Delete DWSP (soft delete)
 */
export async function deleteDWSP(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    await dwspService.deleteDWSP(request.params.id, user, request);

    return reply.code(200).send({
      message: 'DWSP deleted successfully',
    });
  } catch (error) {
    request.log.error({ err: error }, 'Delete DWSP error');
    return reply.code(500).send({
      error: 'Failed to delete DWSP',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/v1/compliance/dwsp/:id/validate
 * Validate DWSP completeness
 */
export async function validateDWSP(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const user = requireUser(request);
    const dwsp = await dwspService.getDWSP(request.params.id, user);

    if (!dwsp) {
      return reply.code(404).send({
        error: 'DWSP not found',
      });
    }

    const validation = dwspService.validateDWSP(dwsp);

    return reply.code(200).send(validation);
  } catch (error) {
    request.log.error({ err: error }, 'Validate DWSP error');
    return reply.code(500).send({
      error: 'Failed to validate DWSP',
    });
  }
}
