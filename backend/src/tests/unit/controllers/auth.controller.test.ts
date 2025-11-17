/**
 * Auth Controller Tests
 *
 * Unit tests for authentication controller endpoints.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { build } from '../../../app.js';
import { FastifyInstance } from 'fastify';
import { prisma } from '../../../config/database.js';
import bcrypt from 'bcrypt';

describe('Auth Controller', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test',
        },
      },
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('user');
      expect(body.user.email).toBe('test@example.com');
    });

    it('should reject duplicate email', async () => {
      // Create user first
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: await bcrypt.hash('Test123!@#', 10),
          firstName: 'Test',
          lastName: 'User',
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'Test123!@#',
          firstName: 'Test2',
          lastName: 'User2',
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error');
    });

    it('should reject weak passwords', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'weak',
          firstName: 'Test',
          lastName: 'User',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject invalid email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'invalid-email',
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: await bcrypt.hash('Test123!@#', 10),
          firstName: 'Test',
          lastName: 'User',
        },
      });
    });

    it('should login with correct credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'Test123!@#',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('refreshToken');
      expect(body).toHaveProperty('user');
    });

    it('should reject incorrect password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'WrongPassword123!',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'Test123!@#',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Create user and get refresh token
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: await bcrypt.hash('Test123!@#', 10),
          firstName: 'Test',
          lastName: 'User',
        },
      });

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'Test123!@#',
        },
      });

      refreshToken = JSON.parse(loginResponse.body).refreshToken;
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: {
          refreshToken,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: {
          refreshToken: 'invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let token: string;

    beforeEach(async () => {
      // Create user and login
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: await bcrypt.hash('Test123!@#', 10),
          firstName: 'Test',
          lastName: 'User',
        },
      });

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'Test123!@#',
        },
      });

      token = JSON.parse(loginResponse.body).token;
    });

    it('should logout successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should reject unauthenticated logout', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
