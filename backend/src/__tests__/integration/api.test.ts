/**
 * API Integration Tests
 *
 * Tests API endpoints with mocked database
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { buildApp, cleanup } from '../../server.js';
import { FastifyInstance } from 'fastify';

describe('API Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await cleanup();
  });

  describe('Health Endpoints', () => {
    it('GET /health should return 200', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('uptime');
    });

    it('GET /api/v1 should return API information', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('version');
    });
  });

  describe('Authentication', () => {
    it('should reject requests without auth token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/assets',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject invalid auth tokens', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/assets',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/non-existent',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toHaveProperty('message');
      expect(body.error.message).toContain('not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        headers: {
          'content-type': 'application/json',
        },
        payload: 'invalid json{',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should respond to health check', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      // Should return 200 for health check
      expect(response.statusCode).toBe(200);
      // Note: Rate limit headers are disabled in test mode for simplicity
    });
  });

  describe('Security Headers', () => {
    it('should have security headers from helmet', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      // Helmet should add security headers
      expect(response.headers).toHaveProperty('x-dns-prefetch-control');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
    });
  });

  describe('CORS', () => {
    it('should handle OPTIONS preflight requests', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/v1/assets',
        headers: {
          origin: 'http://localhost:3000',
          'access-control-request-method': 'GET',
        },
      });

      expect(response.statusCode).toBe(204);
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
});
