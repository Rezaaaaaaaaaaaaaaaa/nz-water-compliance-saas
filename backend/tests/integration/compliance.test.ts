/**
 * Compliance API Integration Tests
 * Tests DWSP creation, updates, status changes, and validation
 */

import request from 'supertest';
import { buildApp } from '../../src/server';
import * as testUtils from '../helpers/test-utils';
import { FastifyInstance } from 'fastify';
import { CompliancePlanStatus } from '@prisma/client';

describe('Compliance API (DWSP)', () => {
  let app: FastifyInstance;
  let testUser: any;
  let token: string;
  let organizationId: string;
  let testDWSP: any;

  beforeAll(async () => {
    app = await buildApp();
    await testUtils.cleanupTestData();

    testUser = await testUtils.createTestUser();
    organizationId = testUser.organization.id;

    const loginResponse = await request(app.server)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.user.email,
        password: testUser.password,
      });

    token = loginResponse.body.token;
    testDWSP = await testUtils.createTestDWSP(organizationId);
  });

  afterAll(async () => {
    await testUtils.cleanupTestData();
    await testUtils.disconnectDB();
    await app.close();
  });

  describe('GET /api/v1/compliance/dwsp', () => {
    it('should list DWSPs for authenticated user', async () => {
      const response = await request(app.server)
        .get('/api/v1/compliance/dwsp')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject without authentication', async () => {
      const response = await request(app.server)
        .get('/api/v1/compliance/dwsp')
        .send();

      expect(response.status).toBe(401);
    });

    it('should filter by status', async () => {
      const response = await request(app.server)
        .get('/api/v1/compliance/dwsp?status=DRAFT')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      response.body.forEach((dwsp: any) => {
        expect(dwsp.status).toBe('DRAFT');
      });
    });
  });

  describe('POST /api/v1/compliance/dwsp', () => {
    it('should create DWSP with valid data', async () => {
      const response = await request(app.server)
        .post('/api/v1/compliance/dwsp')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New DWSP Plan',
          description: 'A comprehensive drinking water safety plan',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('New DWSP Plan');
      expect(response.body.status).toBe('DRAFT');
      expect(response.body.version).toBe(1);
    });

    it('should reject creation without required fields', async () => {
      const response = await request(app.server)
        .post('/api/v1/compliance/dwsp')
        .set('Authorization', `Bearer ${token}`)
        .send({
          // Missing name
          description: 'Incomplete DWSP',
        });

      expect(response.status).toBe(400);
    });

    it('should reject creation without authentication', async () => {
      const response = await request(app.server)
        .post('/api/v1/compliance/dwsp')
        .send({
          name: 'Unauthorized DWSP',
          description: 'Should fail',
        });

      expect(response.status).toBe(401);
    });

    it('should set initial status as DRAFT', async () => {
      const response = await request(app.server)
        .post('/api/v1/compliance/dwsp')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Draft DWSP',
          description: 'Should be draft',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('DRAFT');
    });
  });

  describe('GET /api/v1/compliance/dwsp/:id', () => {
    it('should get DWSP by id', async () => {
      const response = await request(app.server)
        .get(`/api/v1/compliance/dwsp/${testDWSP.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testDWSP.id);
      expect(response.body.name).toBe(testDWSP.name);
    });

    it('should return 404 for non-existent DWSP', async () => {
      const response = await request(app.server)
        .get('/api/v1/compliance/dwsp/invalid-id')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(404);
    });

    it('should reject without authentication', async () => {
      const response = await request(app.server)
        .get(`/api/v1/compliance/dwsp/${testDWSP.id}`)
        .send();

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/compliance/dwsp/:id', () => {
    let dwspToUpdate: any;

    beforeEach(async () => {
      dwspToUpdate = await testUtils.createTestDWSP(organizationId);
    });

    it('should update DWSP with valid data', async () => {
      const response = await request(app.server)
        .patch(`/api/v1/compliance/dwsp/${dwspToUpdate.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated DWSP Plan',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated DWSP Plan');
      expect(response.body.description).toBe('Updated description');
    });

    it('should update DWSP status', async () => {
      const response = await request(app.server)
        .patch(`/api/v1/compliance/dwsp/${dwspToUpdate.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'SUBMITTED',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('SUBMITTED');
    });

    it('should increment version on update', async () => {
      const updateResponse = await request(app.server)
        .patch(`/api/v1/compliance/dwsp/${dwspToUpdate.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Version Increment Test',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.version).toBeGreaterThan(dwspToUpdate.version);
    });

    it('should allow partial updates', async () => {
      const originalName = dwspToUpdate.name;
      const response = await request(app.server)
        .patch(`/api/v1/compliance/dwsp/${dwspToUpdate.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Only updating description',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(originalName);
      expect(response.body.description).toBe('Only updating description');
    });

    it('should reject update without authentication', async () => {
      const response = await request(app.server)
        .patch(`/api/v1/compliance/dwsp/${dwspToUpdate.id}`)
        .send({
          name: 'Unauthorized Update',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/compliance/dwsp/:id', () => {
    let dwspToDelete: any;

    beforeEach(async () => {
      dwspToDelete = await testUtils.createTestDWSP(organizationId);
    });

    it('should delete DWSP', async () => {
      const response = await request(app.server)
        .delete(`/api/v1/compliance/dwsp/${dwspToDelete.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);

      // Verify deletion
      const getResponse = await request(app.server)
        .get(`/api/v1/compliance/dwsp/${dwspToDelete.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(getResponse.status).toBe(404);
    });

    it('should reject deletion without authentication', async () => {
      const response = await request(app.server)
        .delete(`/api/v1/compliance/dwsp/${dwspToDelete.id}`)
        .send();

      expect(response.status).toBe(401);
    });
  });

  describe('DWSP Compliance Validation', () => {
    it('should validate DWSP completeness', async () => {
      const response = await request(app.server)
        .get(`/api/v1/compliance/dwsp/${testDWSP.id}/completeness`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('completenessScore');
      expect(response.body.completenessScore).toBeGreaterThanOrEqual(0);
      expect(response.body.completenessScore).toBeLessThanOrEqual(100);
    });

    it('should get DWSP audit history', async () => {
      const response = await request(app.server)
        .get(`/api/v1/compliance/dwsp/${testDWSP.id}/history`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('DWSP Status Transitions', () => {
    let dwspForTransition: any;

    beforeEach(async () => {
      dwspForTransition = await testUtils.createTestDWSP(organizationId, {
        status: CompliancePlanStatus.DRAFT,
      });
    });

    it('should transition from DRAFT to SUBMITTED', async () => {
      const response = await request(app.server)
        .patch(`/api/v1/compliance/dwsp/${dwspForTransition.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'SUBMITTED',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('SUBMITTED');
    });

    it('should transition from SUBMITTED to APPROVED', async () => {
      // First, move to SUBMITTED
      await request(app.server)
        .patch(`/api/v1/compliance/dwsp/${dwspForTransition.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'SUBMITTED',
        });

      // Then to APPROVED
      const response = await request(app.server)
        .patch(`/api/v1/compliance/dwsp/${dwspForTransition.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: CompliancePlanStatus.APPROVED,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('APPROVED');
    });
  });
});
