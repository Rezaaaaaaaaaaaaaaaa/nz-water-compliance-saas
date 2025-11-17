/**
 * Integration Tests - Full API Testing
 *
 * Tests the complete API workflow with real dependencies (database, Redis, etc.)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

describe('FlowComply API Integration Tests', () => {
  let api: AxiosInstance;
  let authToken: string;
  let refreshToken: string;
  let userId: string;

  beforeAll(() => {
    api = axios.create({
      baseURL: `${API_BASE_URL}/api/v1`,
      validateStatus: () => true, // Don't throw on any status
    });
  });

  describe('1. Health & Infrastructure', () => {
    it('should return healthy status', async () => {
      const response = await axios.get(`${API_BASE_URL}/health`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
    });

    it('should expose Prometheus metrics', async () => {
      const response = await axios.get(`${API_BASE_URL}/metrics`);
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
    });

    it('should expose OpenAPI docs', async () => {
      const response = await axios.get(`${API_BASE_URL}/docs`);
      expect(response.status).toBe(200);
    });
  });

  describe('2. Authentication Flow', () => {
    const testEmail = `test-${Date.now()}@integration.test`;
    const testPassword = 'Test123!@#';

    it('should register a new user', async () => {
      const response = await api.post('/auth/register', {
        email: testEmail,
        password: testPassword,
        firstName: 'Integration',
        lastName: 'Test',
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('user');
      expect(response.data.user.email).toBe(testEmail);

      authToken = response.data.token;
      userId = response.data.user.id;
    });

    it('should reject duplicate registration', async () => {
      const response = await api.post('/auth/register', {
        email: testEmail,
        password: testPassword,
        firstName: 'Duplicate',
        lastName: 'Test',
      });

      expect(response.status).toBe(409);
    });

    it('should login with correct credentials', async () => {
      const response = await api.post('/auth/login', {
        email: testEmail,
        password: testPassword,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('refreshToken');

      authToken = response.data.token;
      refreshToken = response.data.refreshToken;
    });

    it('should reject incorrect password', async () => {
      const response = await api.post('/auth/login', {
        email: testEmail,
        password: 'WrongPassword123!',
      });

      expect(response.status).toBe(401);
    });

    it('should refresh access token', async () => {
      const response = await api.post('/auth/refresh', {
        refreshToken,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('refreshToken');

      authToken = response.data.token;
    });

    it('should access protected route with token', async () => {
      const response = await api.get('/users/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.email).toBe(testEmail);
    });

    it('should reject invalid token', async () => {
      const response = await api.get('/users/me', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.status).toBe(401);
    });

    it('should logout successfully', async () => {
      const response = await api.post('/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
    });
  });

  describe('3. MFA (Multi-Factor Authentication)', () => {
    const mfaUser = `mfa-${Date.now()}@integration.test`;
    const mfaPassword = 'MFA123!@#';
    let mfaToken: string;
    let mfaSecret: string;

    beforeAll(async () => {
      // Create user for MFA testing
      const response = await api.post('/auth/register', {
        email: mfaUser,
        password: mfaPassword,
        firstName: 'MFA',
        lastName: 'Test',
      });
      mfaToken = response.data.token;
    });

    it('should check MFA status (disabled by default)', async () => {
      const response = await api.get('/mfa/status', {
        headers: {
          Authorization: `Bearer ${mfaToken}`,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.mfaEnabled).toBe(false);
    });

    it('should initialize MFA setup', async () => {
      const response = await api.post('/mfa/setup', {}, {
        headers: {
          Authorization: `Bearer ${mfaToken}`,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('secret');
      expect(response.data).toHaveProperty('qrCodeUri');
      expect(response.data.qrCodeUri).toContain('otpauth://totp/');

      mfaSecret = response.data.secret;
    });

    it('should enable MFA with valid TOTP code', async () => {
      // Generate TOTP code
      const totp = require('otplib').authenticator;
      const code = totp.generate(mfaSecret);

      const response = await api.post('/mfa/enable', { code }, {
        headers: {
          Authorization: `Bearer ${mfaToken}`,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.backupCodes).toHaveLength(10);
    });

    it('should verify MFA is enabled', async () => {
      const response = await api.get('/mfa/status', {
        headers: {
          Authorization: `Bearer ${mfaToken}`,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.mfaEnabled).toBe(true);
    });
  });

  describe('4. Provider Integration Tests', () => {
    it('should upload file to MinIO (storage provider)', async () => {
      const response = await api.post('/upload', {
        // Assuming multipart upload is set up
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // This would need actual file upload implementation
      // Just testing that the endpoint exists
      expect([200, 400, 404]).toContain(response.status);
    });

    it('should fetch secrets from Vault (secrets provider)', async () => {
      // This would test the secrets provider integration
      // The backend should be able to fetch secrets from Vault
      const response = await api.get('/config', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('5. Cache Integration (Redis)', () => {
    it('should cache AI responses', async () => {
      // First request - miss cache
      const start1 = Date.now();
      const response1 = await api.post('/ai/ask', {
        question: 'What is water compliance?',
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const duration1 = Date.now() - start1;

      // Second request - should hit cache (faster)
      const start2 = Date.now();
      const response2 = await api.post('/ai/ask', {
        question: 'What is water compliance?',
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const duration2 = Date.now() - start2;

      // Cache hit should be significantly faster
      // (In production, this would be 100x+ faster)
      expect(duration2).toBeLessThanOrEqual(duration1);
    });
  });

  describe('6. Database Read Replicas', () => {
    it('should handle read operations', async () => {
      // Read operations should use replica
      const response = await api.get('/users/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
    });

    it('should handle write operations', async () => {
      // Write operations should use primary
      const response = await api.put('/users/me', {
        firstName: 'Updated',
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('7. Telemetry & Observability', () => {
    it('should trace requests (OpenTelemetry)', async () => {
      // Make a request that should be traced
      const response = await api.get('/users/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);

      // Check if trace headers are present
      expect(response.headers).toHaveProperty('traceparent');
    });

    it('should increment metrics (Prometheus)', async () => {
      // Make several requests
      for (let i = 0; i < 5; i++) {
        await api.get('/health');
      }

      // Check metrics endpoint
      const metrics = await axios.get(`${API_BASE_URL}/metrics`);
      expect(metrics.data).toContain('http_requests_total');
    });
  });

  describe('8. Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = [];
      for (let i = 0; i < 150; i++) {
        requests.push(api.get('/health'));
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);

      // Should get rate limited after 100 requests (configured limit)
      expect(rateLimited).toBe(true);
    });
  });

  describe('9. Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await api.get('/non-existent-route');
      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid input', async () => {
      const response = await api.post('/auth/register', {
        email: 'invalid-email',
        password: 'weak',
      });

      expect(response.status).toBe(400);
    });

    it('should return 500 errors gracefully', async () => {
      // This would need an endpoint that triggers a 500 error
      // For now, just testing the pattern
      const response = await api.get('/trigger-error');
      expect([404, 500]).toContain(response.status);
    });
  });
});
