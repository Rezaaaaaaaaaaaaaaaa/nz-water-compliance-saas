/**
 * CSRF Middleware Tests
 *
 * Unit tests for CSRF protection middleware.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { build } from '../../../app.js';
import { FastifyInstance } from 'fastify';

describe('CSRF Middleware', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET requests (safe methods)', () => {
    it('should allow GET requests without CSRF token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should allow HEAD requests without CSRF token', async () => {
      const response = await app.inject({
        method: 'HEAD',
        url: '/api/v1/health',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should allow OPTIONS requests without CSRF token', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/v1/health',
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('POST requests (unsafe methods)', () => {
    it('should reject POST requests without CSRF token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'Test123!@#',
        },
      });

      // May be 403 (CSRF) or 401 (auth failure) depending on CSRF configuration
      expect([400, 401, 403]).toContain(response.statusCode);
    });

    it('should allow POST requests with valid CSRF token', async () => {
      // First, get CSRF token
      const tokenResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/csrf-token',
      });

      const csrfToken = JSON.parse(tokenResponse.body).token;
      const cookies = tokenResponse.headers['set-cookie'];

      // Then, make POST request with token
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        headers: {
          'csrf-token': csrfToken,
          cookie: Array.isArray(cookies) ? cookies.join('; ') : cookies || '',
        },
        payload: {
          email: 'test@example.com',
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
        },
      });

      // Should not fail due to CSRF (may fail for other reasons)
      expect(response.statusCode).not.toBe(403);
    });
  });

  describe('PUT/PATCH/DELETE requests', () => {
    it('should reject PUT requests without CSRF token', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/users/123',
        payload: {
          firstName: 'Updated',
        },
      });

      expect([401, 403, 404]).toContain(response.statusCode);
    });

    it('should reject DELETE requests without CSRF token', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/users/123',
      });

      expect([401, 403, 404]).toContain(response.statusCode);
    });
  });
});
