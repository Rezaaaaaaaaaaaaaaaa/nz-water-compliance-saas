/**
 * Assets API Integration Tests
 * Tests CRUD operations, filtering, pagination, and authorization
 */

import request from 'supertest';
import { buildApp } from '../../src/server';
import * as testUtils from '../helpers/test-utils';
import { FastifyInstance } from 'fastify';

describe('Assets API', () => {
  let app: FastifyInstance;
  let testUser: any;
  let token: string;
  let organizationId: string;
  let testAsset: any;

  beforeAll(async () => {
    app = await buildApp();
    await testUtils.cleanupTestData();

    testUser = await testUtils.createTestUser();
    organizationId = testUser.organization.id;

    // Get authentication token
    const loginResponse = await request(app.server)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.user.email,
        password: testUser.password,
      });

    token = loginResponse.body.token;

    // Create test asset
    testAsset = await testUtils.createTestAsset(organizationId);
  });

  afterAll(async () => {
    await testUtils.cleanupTestData();
    await testUtils.disconnectDB();
    await app.close();
  });

  describe('GET /api/v1/assets', () => {
    it('should list assets with valid token', async () => {
      const response = await request(app.server)
        .get('/api/v1/assets')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should reject request without token', async () => {
      const response = await request(app.server)
        .get('/api/v1/assets')
        .send();

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app.server)
        .get('/api/v1/assets')
        .set('Authorization', 'Bearer invalid-token')
        .send();

      expect(response.status).toBe(401);
    });

    it('should filter assets by type', async () => {
      // Create multiple assets with different types
      await testUtils.createTestAsset(organizationId, {
        assetType: 'TREATMENT_PLANT',
      });
      await testUtils.createTestAsset(organizationId, {
        assetType: 'RESERVOIR',
      });

      const response = await request(app.server)
        .get('/api/v1/assets?type=TREATMENT_PLANT')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((asset: any) => {
        expect(asset.assetType).toBe('TREATMENT_PLANT');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app.server)
        .get('/api/v1/assets?skip=0&take=10')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter assets by status', async () => {
      const response = await request(app.server)
        .get('/api/v1/assets?status=ACTIVE')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      response.body.forEach((asset: any) => {
        expect(asset.status).toBe('ACTIVE');
      });
    });
  });

  describe('GET /api/v1/assets/:id', () => {
    it('should get asset by id', async () => {
      const response = await request(app.server)
        .get(`/api/v1/assets/${testAsset.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testAsset.id);
      expect(response.body.name).toBe(testAsset.name);
    });

    it('should return 404 for non-existent asset', async () => {
      const fakeId = 'invalid-id-123';
      const response = await request(app.server)
        .get(`/api/v1/assets/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(404);
    });

    it('should reject request without token', async () => {
      const response = await request(app.server)
        .get(`/api/v1/assets/${testAsset.id}`)
        .send();

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/assets', () => {
    it('should create asset with valid data', async () => {
      const response = await request(app.server)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Water Treatment Plant',
          assetType: 'TREATMENT_PLANT',
          location: 'Wellington, NZ',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('New Water Treatment Plant');
      expect(response.body.assetType).toBe('TREATMENT_PLANT');
    });

    it('should reject creation without required fields', async () => {
      const response = await request(app.server)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Incomplete Asset',
          // Missing assetType, location
        });

      expect(response.status).toBe(400);
    });

    it('should reject creation with invalid assetType', async () => {
      const response = await request(app.server)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Invalid Asset',
          assetType: 'INVALID_TYPE',
          location: 'Wellington, NZ',
        });

      expect(response.status).toBe(400);
    });

    it('should reject creation without token', async () => {
      const response = await request(app.server)
        .post('/api/v1/assets')
        .send({
          name: 'Unauthorized Asset',
          assetType: 'TREATMENT_PLANT',
          location: 'Wellington, NZ',
        });

      expect(response.status).toBe(401);
    });

    it('should set createdBy to current user', async () => {
      const response = await request(app.server)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Created Asset',
          assetType: 'RESERVOIR',
          location: 'Hamilton, NZ',
        });

      expect(response.status).toBe(201);
      expect(response.body.createdBy).toBe(testUser.user.id);
    });
  });

  describe('PATCH /api/v1/assets/:id', () => {
    let assetToUpdate: any;

    beforeEach(async () => {
      assetToUpdate = await testUtils.createTestAsset(organizationId);
    });

    it('should update asset with valid data', async () => {
      const response = await request(app.server)
        .patch(`/api/v1/assets/${assetToUpdate.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Asset Name',
          location: 'Updated Location',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Asset Name');
      expect(response.body.location).toBe('Updated Location');
    });

    it('should allow partial updates', async () => {
      const response = await request(app.server)
        .patch(`/api/v1/assets/${assetToUpdate.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Partially Updated Asset',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Partially Updated Asset');
      expect(response.body.location).toBe(assetToUpdate.location); // Unchanged
    });

    it('should update asset status', async () => {
      const response = await request(app.server)
        .patch(`/api/v1/assets/${assetToUpdate.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'INACTIVE',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('INACTIVE');
    });

    it('should return 404 for non-existent asset', async () => {
      const response = await request(app.server)
        .patch('/api/v1/assets/invalid-id')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(404);
    });

    it('should reject update without token', async () => {
      const response = await request(app.server)
        .patch(`/api/v1/assets/${assetToUpdate.id}`)
        .send({
          name: 'Unauthorized Update',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/assets/:id', () => {
    let assetToDelete: any;

    beforeEach(async () => {
      assetToDelete = await testUtils.createTestAsset(organizationId);
    });

    it('should delete asset', async () => {
      const response = await request(app.server)
        .delete(`/api/v1/assets/${assetToDelete.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);

      // Verify asset is deleted
      const getResponse = await request(app.server)
        .get(`/api/v1/assets/${assetToDelete.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent asset', async () => {
      const response = await request(app.server)
        .delete('/api/v1/assets/invalid-id')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(404);
    });

    it('should reject deletion without token', async () => {
      const response = await request(app.server)
        .delete(`/api/v1/assets/${assetToDelete.id}`)
        .send();

      expect(response.status).toBe(401);
    });
  });

  describe('Assets Business Logic', () => {
    it('should not allow access to other org assets', async () => {
      // Create another organization with another user
      const otherUserData = await testUtils.createTestUser(
        'other@example.com',
        testUtils.generateTestPassword()
      );

      const otherLoginResponse = await request(app.server)
        .post('/api/v1/auth/login')
        .send({
          email: otherUserData.user.email,
          password: otherUserData.password,
        });

      const otherToken = otherLoginResponse.body.token;

      // Try to access asset from different organization
      const response = await request(app.server)
        .get(`/api/v1/assets/${testAsset.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send();

      expect(response.status).toBe(403); // Forbidden
    });

    it('should maintain asset audit trail', async () => {
      const createResponse = await request(app.server)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Audit Trail Asset',
          assetType: 'PUMP_STATION',
          location: 'Christchurch, NZ',
        });

      const assetId = createResponse.body.id;

      const getResponse = await request(app.server)
        .get(`/api/v1/assets/${assetId}`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(getResponse.body).toHaveProperty('createdAt');
      expect(getResponse.body).toHaveProperty('createdBy');
      expect(getResponse.body.createdBy).toBe(testUser.user.id);
    });
  });
});
