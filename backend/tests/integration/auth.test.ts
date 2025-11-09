/**
 * Authentication Integration Tests
 * Tests login, registration, token refresh, and logout functionality
 */

import request from 'supertest';
import { buildApp } from '../../src/server';
import * as testUtils from '../helpers/test-utils';
import { FastifyInstance } from 'fastify';

describe('Authentication API', () => {
  let app: FastifyInstance;
  let testUser: any;

  beforeAll(async () => {
    // Initialize app
    app = await buildApp();
    await app.ready(); // Wait for Fastify to fully initialize hooks

    // Clean database
    await testUtils.cleanupTestData();

    // Create test user
    testUser = await testUtils.createTestUser(
      'auth-test@example.com',
      'TestPassword@123'
    );
  });

  afterAll(async () => {
    // Cleanup
    await testUtils.cleanupTestData();
    await testUtils.disconnectDB();
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/register')
        .send({
          email: testUtils.generateTestEmail(),
          password: testUtils.generateTestPassword(),
          firstName: 'New',
          lastName: 'User',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email');
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: testUtils.generateTestPassword(),
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/register')
        .send({
          email: testUtils.generateTestEmail(),
          password: '123', // Too weak
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with duplicate email', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/register')
        .send({
          email: testUser.user.email, // Already exists
          password: testUtils.generateTestPassword(),
          firstName: 'Duplicate',
          lastName: 'User',
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/register')
        .send({
          email: testUtils.generateTestEmail(),
          // Missing password, firstName, lastName
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.user.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(testUser.user.email);
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.user.email,
          password: 'WrongPassword@123',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUtils.generateTestPassword(),
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.user.email,
          // Missing password
        });

      expect(response.status).toBe(400);
    });

    it('should return user data in response', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.user.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('email');
      expect(response.body.data.user).toHaveProperty('organizationId');
      expect(response.body.data.user).toHaveProperty('role');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh token with valid token', async () => {
      // First, get a token
      const loginResponse = await request(app.server)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.user.email,
          password: testUser.password,
        });

      const { token } = loginResponse.body.data;

      // Then refresh it
      const refreshResponse = await request(app.server)
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body).toHaveProperty('success');
      expect(refreshResponse.body).toHaveProperty('data');
      expect(refreshResponse.body.data).toHaveProperty('token');
      expect(refreshResponse.body.data.token).not.toBe(token); // Should be different
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/refresh')
        .set('Authorization', 'Bearer invalid.token.here')
        .send();

      expect(response.status).toBe(401);
    });

    it('should reject refresh without token', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/refresh')
        .send();

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout with valid token', async () => {
      // Get a token first
      const loginResponse = await request(app.server)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.user.email,
          password: testUser.password,
        });

      const { token } = loginResponse.body.data;

      // Logout
      const logoutResponse = await request(app.server)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body).toHaveProperty('success');
    });

    it('should reject logout without token', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/logout')
        .send();

      expect(response.status).toBe(401);
    });
  });

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      const email = testUtils.generateTestEmail();
      const password = testUtils.generateTestPassword();

      // 1. Register
      const registerRes = await request(app.server)
        .post('/api/v1/auth/register')
        .send({
          email,
          password,
          firstName: 'Flow',
          lastName: 'Test',
        });

      expect(registerRes.status).toBe(201);
      const { token: registerToken } = registerRes.body.data;

      // 2. Verify token works (use in protected endpoint)
      const healthRes = await request(app.server)
        .get('/api/v1')
        .set('Authorization', `Bearer ${registerToken}`)
        .send();

      expect(healthRes.status).toBe(200);

      // 3. Logout
      const logoutRes = await request(app.server)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${registerToken}`)
        .send();

      expect(logoutRes.status).toBe(200);

      // 4. Verify token no longer works
      const afterLogoutRes = await request(app.server)
        .get('/api/v1')
        .set('Authorization', `Bearer ${registerToken}`)
        .send();

      expect(afterLogoutRes.status).toBe(401);
    });
  });

  describe('Token Validation', () => {
    it('should validate token format', async () => {
      const response = await request(app.server)
        .get('/api/v1')
        .set('Authorization', 'Bearer malformed-token')
        .send();

      expect(response.status).toBe(401);
    });

    it('should include user info in protected endpoints', async () => {
      const loginResponse = await request(app.server)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.user.email,
          password: testUser.password,
        });

      const { token } = loginResponse.body.data;

      // Test with a protected endpoint (e.g., get own profile)
      const profileRes = await request(app.server)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(profileRes.status).toBe(200);
      expect(profileRes.body).toHaveProperty('success');
      expect(profileRes.body).toHaveProperty('data');
      expect(profileRes.body.data).toHaveProperty('id');
      expect(profileRes.body.data.email).toBe(testUser.user.email);
    });
  });
});
