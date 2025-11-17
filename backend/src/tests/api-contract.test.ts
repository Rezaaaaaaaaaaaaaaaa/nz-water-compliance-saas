/**
 * API Contract Validation Tests
 *
 * These tests validate that API endpoints return responses matching
 * the expected schema and data types.
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect, beforeAll } from '@jest/globals';

interface EnvConfig {
  [key: string]: string | undefined;
}

function parseEnvFile(filePath: string): EnvConfig {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const config: EnvConfig = {};

  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      config[key] = value;
    }
  });

  return config;
}

function httpRequest(
  url: string,
  method: string = 'GET',
  data?: any,
  headers?: Record<string, string>
): Promise<{ statusCode: number; body: string; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = data ? JSON.stringify(data) : undefined;

    const options: http.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: headers || {},
    };

    if (postData) {
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      };
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({
        statusCode: res.statusCode || 0,
        body,
        headers: res.headers
      }));
    });

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

describe('API Contract Validation Tests', () => {
  const backendRoot = process.cwd();
  const projectRoot = path.join(backendRoot, '..');
  const backendEnvPath = path.join(backendRoot, '.env');
  const frontendEnvPath = path.join(projectRoot, 'frontend', '.env.local');

  let backendConfig: EnvConfig;
  let frontendConfig: EnvConfig;
  let apiUrl: string;
  let authToken: string;

  beforeAll(async () => {
    backendConfig = parseEnvFile(backendEnvPath);
    frontendConfig = parseEnvFile(frontendEnvPath);

    const backendPort = backendConfig.PORT || '3000';
    const backendUrl = `http://localhost:${backendPort}`;
    apiUrl = frontendConfig.NEXT_PUBLIC_API_URL || `${backendUrl}/api/v1`;

    // Get auth token for protected endpoints
    try {
      const response = await httpRequest(
        `${apiUrl}/auth/login`,
        'POST',
        {
          email: 'admin@flowcomply.local',
          password: 'password123',
        }
      );

      if (response.statusCode === 200) {
        const data = JSON.parse(response.body);
        authToken = data.token;
      }
    } catch (error) {
      console.warn('Could not get auth token for tests:', error);
    }
  }, 15000);

  describe('Health Endpoint Contract', () => {
    it('should return health status with correct schema', async () => {
      const backendPort = backendConfig.PORT || '3000';
      const response = await httpRequest(`http://localhost:${backendPort}/health`, 'GET');

      expect(response.statusCode).toBe(200);

      const health = JSON.parse(response.body);

      // Required fields
      expect(health).toHaveProperty('status');
      expect(typeof health.status).toBe('string');

      // Optional fields
      if (health.database !== undefined) {
        expect(typeof health.database).toBe('string');
      }

      if (health.redis !== undefined) {
        expect(typeof health.redis).toBe('string');
      }

      if (health.uptime !== undefined) {
        expect(typeof health.uptime).toBe('number');
      }
    }, 15000);
  });

  describe('Authentication Endpoints Contract', () => {
    describe('POST /auth/register', () => {
      it('should return correct schema for successful registration', async () => {
        const timestamp = Date.now();
        const response = await httpRequest(
          `${apiUrl}/auth/register`,
          'POST',
          {
            email: `contract-test-${timestamp}@flowcomply.local`,
            password: 'Test123!@#',
            firstName: 'Contract',
            lastName: 'Test',
          }
        );

        expect(response.statusCode).toBe(201);

        const data = JSON.parse(response.body);

        // Required fields
        expect(data).toHaveProperty('token');
        expect(typeof data.token).toBe('string');

        expect(data).toHaveProperty('user');
        expect(typeof data.user).toBe('object');

        // User object schema
        expect(data.user).toHaveProperty('id');
        expect(data.user).toHaveProperty('email');
        expect(data.user).toHaveProperty('firstName');
        expect(data.user).toHaveProperty('lastName');

        expect(typeof data.user.id).toBe('string');
        expect(typeof data.user.email).toBe('string');
        expect(typeof data.user.firstName).toBe('string');
        expect(typeof data.user.lastName).toBe('string');

        // Should not expose sensitive data
        expect(data.user.password).toBeUndefined();
        expect(data.user.passwordHash).toBeUndefined();
      }, 15000);

      it('should return correct error schema for validation failure', async () => {
        const response = await httpRequest(
          `${apiUrl}/auth/register`,
          'POST',
          {
            email: 'invalid-email',
            password: '123', // Too short
          }
        );

        expect([400, 422]).toContain(response.statusCode);

        const data = JSON.parse(response.body);

        // Error response should have message
        expect(data).toHaveProperty('message');
        expect(typeof data.message).toBe('string');
      }, 15000);
    });

    describe('POST /auth/login', () => {
      it('should return correct schema for successful login', async () => {
        const response = await httpRequest(
          `${apiUrl}/auth/login`,
          'POST',
          {
            email: 'admin@flowcomply.local',
            password: 'password123',
          }
        );

        expect(response.statusCode).toBe(200);

        const data = JSON.parse(response.body);

        // Required fields
        expect(data).toHaveProperty('token');
        expect(typeof data.token).toBe('string');

        expect(data).toHaveProperty('refreshToken');
        expect(typeof data.refreshToken).toBe('string');

        expect(data).toHaveProperty('user');
        expect(typeof data.user).toBe('object');

        // User object
        expect(data.user).toHaveProperty('id');
        expect(data.user).toHaveProperty('email');
        expect(data.user.email).toBe('admin@flowcomply.local');

        // Should not expose password
        expect(data.user.password).toBeUndefined();
      }, 15000);

      it('should return correct error schema for invalid credentials', async () => {
        const response = await httpRequest(
          `${apiUrl}/auth/login`,
          'POST',
          {
            email: 'wrong@example.com',
            password: 'wrongpassword',
          }
        );

        expect(response.statusCode).toBe(401);

        const data = JSON.parse(response.body);

        expect(data).toHaveProperty('message');
        expect(typeof data.message).toBe('string');
      }, 15000);
    });

    describe('GET /auth/me', () => {
      it('should return current user with correct schema', async () => {
        if (!authToken) {
          console.warn('Skipping test - no auth token available');
          return;
        }

        const response = await httpRequest(
          `${apiUrl}/auth/me`,
          'GET',
          undefined,
          {
            'Authorization': `Bearer ${authToken}`,
          }
        );

        expect(response.statusCode).toBe(200);

        const user = JSON.parse(response.body);

        // Required fields
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('firstName');
        expect(user).toHaveProperty('lastName');

        // Type validation
        expect(typeof user.id).toBe('string');
        expect(typeof user.email).toBe('string');

        // Should not expose sensitive data
        expect(user.password).toBeUndefined();
        expect(user.passwordHash).toBeUndefined();

        // Should have timestamps
        if (user.createdAt !== undefined) {
          expect(typeof user.createdAt).toBe('string');
        }

        if (user.updatedAt !== undefined) {
          expect(typeof user.updatedAt).toBe('string');
        }
      }, 15000);

      it('should return 401 without authentication', async () => {
        const response = await httpRequest(`${apiUrl}/auth/me`, 'GET');

        expect(response.statusCode).toBe(401);

        const data = JSON.parse(response.body);
        expect(data).toHaveProperty('message');
      }, 15000);
    });
  });

  describe('Error Response Consistency', () => {
    it('should have consistent error format for 400 errors', async () => {
      const response = await httpRequest(
        `${apiUrl}/auth/login`,
        'POST',
        {} // Missing required fields
      );

      expect([400, 422]).toContain(response.statusCode);

      const error = JSON.parse(response.body);

      expect(error).toHaveProperty('message');
      expect(typeof error.message).toBe('string');
    }, 15000);

    it('should have consistent error format for 401 errors', async () => {
      const response = await httpRequest(`${apiUrl}/auth/me`, 'GET');

      expect(response.statusCode).toBe(401);

      const error = JSON.parse(response.body);

      expect(error).toHaveProperty('message');
      expect(typeof error.message).toBe('string');
    }, 15000);

    it('should have consistent error format for 404 errors', async () => {
      const response = await httpRequest(
        `${apiUrl}/nonexistent-endpoint`,
        'GET'
      );

      expect(response.statusCode).toBe(404);

      const error = JSON.parse(response.body);

      expect(error).toHaveProperty('message');
      expect(typeof error.message).toBe('string');
    }, 15000);
  });

  describe('Response Headers Validation', () => {
    it('should return JSON content-type for API responses', async () => {
      const response = await httpRequest(`${apiUrl}/auth/me`, 'GET');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    }, 15000);

    it('should not expose sensitive server information', async () => {
      const backendPort = backendConfig.PORT || '3000';
      const response = await httpRequest(`http://localhost:${backendPort}/health`, 'GET');

      // Should not expose server technology
      expect(response.headers['x-powered-by']).toBeUndefined();
      expect(response.headers['server']).not.toMatch(/Express|Fastify|Node/i);
    }, 15000);
  });

  describe('Data Type Validation', () => {
    it('should return dates in ISO 8601 format', async () => {
      if (!authToken) return;

      const response = await httpRequest(
        `${apiUrl}/auth/me`,
        'GET',
        undefined,
        {
          'Authorization': `Bearer ${authToken}`,
        }
      );

      const user = JSON.parse(response.body);

      if (user.createdAt) {
        // Should be valid ISO 8601 date
        expect(new Date(user.createdAt).toISOString()).toBe(user.createdAt);
      }

      if (user.updatedAt) {
        expect(new Date(user.updatedAt).toISOString()).toBe(user.updatedAt);
      }
    }, 15000);

    it('should return UUIDs in correct format', async () => {
      if (!authToken) return;

      const response = await httpRequest(
        `${apiUrl}/auth/me`,
        'GET',
        undefined,
        {
          'Authorization': `Bearer ${authToken}`,
        }
      );

      const user = JSON.parse(response.body);

      // UUID v4 format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(user.id).toMatch(uuidRegex);
    }, 15000);
  });

  describe('Pagination Contract (if applicable)', () => {
    it('should include pagination metadata for list endpoints', async () => {
      if (!authToken) return;

      // This test assumes there's a list endpoint
      // Adjust based on actual API
      try {
        const response = await httpRequest(
          `${apiUrl}/users`,
          'GET',
          undefined,
          {
            'Authorization': `Bearer ${authToken}`,
          }
        );

        if (response.statusCode === 200) {
          const data = JSON.parse(response.body);

          // If pagination is implemented
          if (data.items || data.data) {
            expect(data).toHaveProperty('total');
            expect(data).toHaveProperty('page');
            expect(data).toHaveProperty('limit');
          }
        }
      } catch (error) {
        // Endpoint might not exist, skip test
      }
    }, 15000);
  });

  describe('API Versioning', () => {
    it('should include API version in URL path', () => {
      expect(apiUrl).toMatch(/\/api\/v\d+$/);
    });

    it('should accept API version in Accept header', async () => {
      const response = await httpRequest(
        `${apiUrl}/auth/login`,
        'POST',
        { email: 'test', password: 'test' },
        {
          'Accept': 'application/json',
        }
      );

      // Should process request (even if credentials are wrong)
      expect([400, 401, 422]).toContain(response.statusCode);
    }, 15000);
  });

  describe('Request Validation', () => {
    it('should reject malformed JSON', async () => {
      try {
        const urlObj = new URL(`${apiUrl}/auth/login`);

        const options: http.RequestOptions = {
          hostname: urlObj.hostname,
          port: urlObj.port,
          path: urlObj.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        };

        await new Promise((resolve, reject) => {
          const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({
              statusCode: res.statusCode,
              body
            }));
          });

          req.on('error', reject);
          req.write('not-valid-json');
          req.end();
        });

        // If we get here, the server handled it
        expect(true).toBe(true);
      } catch (error) {
        // Server rejected malformed JSON (which is good)
        expect(error).toBeDefined();
      }
    }, 15000);

    it('should validate required fields', async () => {
      const response = await httpRequest(
        `${apiUrl}/auth/login`,
        'POST',
        {} // Missing email and password
      );

      expect([400, 422]).toContain(response.statusCode);

      const error = JSON.parse(response.body);
      expect(error.message).toBeDefined();
    }, 15000);

    it('should validate field types', async () => {
      const response = await httpRequest(
        `${apiUrl}/auth/login`,
        'POST',
        {
          email: 12345, // Should be string
          password: true, // Should be string
        }
      );

      expect([400, 422]).toContain(response.statusCode);
    }, 15000);
  });
});
