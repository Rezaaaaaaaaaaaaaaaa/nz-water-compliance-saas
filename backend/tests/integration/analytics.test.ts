/**
 * Analytics API Integration Tests
 * Tests dashboard data, compliance scores, trends, and export functionality
 */

import request from 'supertest';
import { buildApp } from '../../src/server';
import * as testUtils from '../helpers/test-utils';
import { FastifyInstance } from 'fastify';
import { CompliancePlanStatus } from '@prisma/client';

describe('Analytics API', () => {
  let app: FastifyInstance;
  let testUser: any;
  let token: string;
  let organizationId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready(); // Wait for Fastify to fully initialize hooks
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

    // Create test data for analytics
    await testUtils.createTestAssets(organizationId, 5);
    await testUtils.createTestDWSP(organizationId, { status: CompliancePlanStatus.APPROVED });
    await testUtils.createTestDWSP(organizationId, { status: CompliancePlanStatus.DRAFT });
  });

  afterAll(async () => {
    await testUtils.cleanupTestData();
    await testUtils.disconnectDB();
    await app.close();
  });

  describe('GET /api/v1/analytics/dashboard', () => {
    it('should return dashboard data for authenticated user', async () => {
      const response = await request(app.server)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('overview');
      expect(response.body.data).toHaveProperty('activity');
    });

    it('should reject without authentication', async () => {
      const response = await request(app.server)
        .get('/api/v1/analytics/dashboard')
        .send();

      expect(response.status).toBe(401);
    });

    it('should include asset count in dashboard', async () => {
      const response = await request(app.server)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.data.overview).toHaveProperty('totalAssets');
      expect(response.body.data.overview.totalAssets).toBeGreaterThan(0);
    });

    it('should include DWSP count in dashboard', async () => {
      const response = await request(app.server)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.data.overview).toHaveProperty('activeDWSPs');
      expect(response.body.data.overview.activeDWSPs).toBeGreaterThan(0);
    });

    it('should include recent activity', async () => {
      const response = await request(app.server)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('activity');
      expect(Array.isArray(response.body.data.activity.timeline)).toBe(true);
    });

    it('should include compliance score', async () => {
      const response = await request(app.server)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.data.overview).toHaveProperty('complianceScore');
      expect(response.body.data.overview.complianceScore).toBeGreaterThanOrEqual(0);
      expect(response.body.data.overview.complianceScore).toBeLessThanOrEqual(100);
    });
  });

  describe('GET /api/v1/analytics/compliance/overview', () => {
    it('should return compliance overview', async () => {
      const response = await request(app.server)
        .get('/api/v1/analytics/compliance/overview')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('overallScore');
      expect(response.body.data).toHaveProperty('scoreByArea');
      expect(response.body.data).toHaveProperty('riskLevel');
    });

    it('should return compliance score between 0-100', async () => {
      const response = await request(app.server)
        .get('/api/v1/analytics/compliance/overview')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.data.overallScore).toBeGreaterThanOrEqual(0);
      expect(response.body.data.overallScore).toBeLessThanOrEqual(100);
    });

    it('should return valid risk level', async () => {
      const response = await request(app.server)
        .get('/api/v1/analytics/compliance/overview')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(
        response.body.data.riskLevel
      );
    });

    it('should reject without authentication', async () => {
      const response = await request(app.server)
        .get('/api/v1/analytics/compliance/overview')
        .send();

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/analytics/dwsp-trends', () => {
    it('should return DWSP trends data', async () => {
      const response = await request(app.server)
        .get('/api/v1/analytics/dwsp-trends')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data.trends)).toBe(true);
    });

    it('should include time-series data', async () => {
      const response = await request(app.server)
        .get('/api/v1/analytics/dwsp-trends?period=monthly')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('trends');
      expect(Array.isArray(response.body.data.trends)).toBe(true);
    });

    it('should support different time periods', async () => {
      const periods = ['weekly', 'monthly', 'yearly'];

      for (const period of periods) {
        const response = await request(app.server)
          .get(`/api/v1/analytics/dwsp-trends?period=${period}`)
          .set('Authorization', `Bearer ${token}`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success');
        expect(Array.isArray(response.body.data.trends)).toBe(true);
      }
    });

    it('should reject without authentication', async () => {
      const response = await request(app.server)
        .get('/api/v1/analytics/dwsp-trends')
        .send();

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/analytics/asset-analytics', () => {
    it('should return asset analytics', async () => {
      const response = await request(app.server)
        .get('/api/v1/analytics/asset-analytics')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('byType');
      expect(response.body).toHaveProperty('byStatus');
    });

    it('should breakdown assets by type', async () => {
      const response = await request(app.server)
        .get('/api/v1/analytics/asset-analytics')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(typeof response.body.byType).toBe('object');
    });

    it('should breakdown assets by status', async () => {
      const response = await request(app.server)
        .get('/api/v1/analytics/asset-analytics')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(typeof response.body.byStatus).toBe('object');
      expect(response.body.byStatus).toHaveProperty('ACTIVE');
    });
  });

  describe('GET /api/v1/analytics/user-activity', () => {
    it('should return user activity summary', async () => {
      const response = await request(app.server)
        .get('/api/v1/analytics/user-activity')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('activeUsers');
      expect(response.body).toHaveProperty('recentLogins');
    });

    it('should return valid user counts', async () => {
      const response = await request(app.server)
        .get('/api/v1/analytics/user-activity')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.totalUsers).toBeGreaterThanOrEqual(0);
      expect(response.body.activeUsers).toBeGreaterThanOrEqual(0);
    });
  });

  describe('POST /api/v1/export/compliance-overview', () => {
    it('should export compliance overview as CSV', async () => {
      const response = await request(app.server)
        .post('/api/v1/export/compliance-overview')
        .set('Authorization', `Bearer ${token}`)
        .send({
          format: 'csv',
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('csv');
    });

    it('should export compliance overview as PDF', async () => {
      const response = await request(app.server)
        .post('/api/v1/export/compliance-overview')
        .set('Authorization', `Bearer ${token}`)
        .send({
          format: 'pdf',
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('pdf');
    });

    it('should export compliance overview as JSON', async () => {
      const response = await request(app.server)
        .post('/api/v1/export/compliance-overview')
        .set('Authorization', `Bearer ${token}`)
        .send({
          format: 'json',
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('json');
    });

    it('should reject invalid format', async () => {
      const response = await request(app.server)
        .post('/api/v1/export/compliance-overview')
        .set('Authorization', `Bearer ${token}`)
        .send({
          format: 'invalid',
        });

      expect(response.status).toBe(400);
    });

    it('should reject without authentication', async () => {
      const response = await request(app.server)
        .post('/api/v1/export/compliance-overview')
        .send({
          format: 'csv',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/export/assets', () => {
    it('should export assets in requested format', async () => {
      const response = await request(app.server)
        .post('/api/v1/export/assets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          format: 'csv',
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('csv');
    });

    it('should include all asset fields in export', async () => {
      const response = await request(app.server)
        .post('/api/v1/export/assets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          format: 'json',
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('type');
      }
    });
  });

  describe('Analytics Data Integrity', () => {
    it('should provide consistent data across endpoints', async () => {
      const dashboardRes = await request(app.server)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .send();

      const assetsRes = await request(app.server)
        .get('/api/v1/analytics/asset-analytics')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(dashboardRes.status).toBe(200);
      expect(assetsRes.status).toBe(200);

      // Both should include asset information
      expect(dashboardRes.body.data.overview).toHaveProperty('totalAssets');
      expect(assetsRes.body).toHaveProperty('byType');
    });

    it('should show data only for user organization', async () => {
      const otherUserData = await testUtils.createTestUser();
      const otherLoginRes = await request(app.server)
        .post('/api/v1/auth/login')
        .send({
          email: otherUserData.user.email,
          password: otherUserData.password,
        });

      const otherToken = otherLoginRes.body.token;

      const myDashboard = await request(app.server)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .send();

      const otherDashboard = await request(app.server)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${otherToken}`)
        .send();

      // They should have different asset counts
      expect(myDashboard.body.data.overview.totalAssets).toBeGreaterThan(0);
      expect(otherDashboard.body.data.overview.totalAssets).toBe(0);
    });
  });
});
