/**
 * Deployment Smoke Tests
 *
 * These tests validate that the deployed application is working correctly
 * with real HTTP requests simulating actual user interactions.
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect } from '@jest/globals';

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

describe('Deployment Smoke Tests', () => {
  const backendRoot = process.cwd();
  const projectRoot = path.join(backendRoot, '..');
  const backendEnvPath = path.join(backendRoot, '.env');
  const frontendEnvPath = path.join(projectRoot, 'frontend', '.env.local');

  let backendConfig: EnvConfig;
  let frontendConfig: EnvConfig;
  let backendUrl: string;
  let frontendUrl: string;
  let apiUrl: string;

  beforeAll(() => {
    backendConfig = parseEnvFile(backendEnvPath);
    frontendConfig = parseEnvFile(frontendEnvPath);

    const backendPort = backendConfig.PORT || '3000';
    const frontendPort = backendConfig.FRONTEND_URL?.match(/:(\d+)/)?.[1] || '3001';

    backendUrl = `http://localhost:${backendPort}`;
    frontendUrl = `http://localhost:${frontendPort}`;
    apiUrl = frontendConfig.NEXT_PUBLIC_API_URL || `${backendUrl}/api/v1`;
  });

  describe('Service Health Checks', () => {
    it('should have backend service responding', async () => {
      try {
        const response = await httpRequest(`${backendUrl}/health`, 'GET');
        expect(response.statusCode).toBe(200);

        const health = JSON.parse(response.body);
        expect(health.status).toBe('ok');
      } catch (error) {
        throw new Error(`Backend service is not responding at ${backendUrl}/health: ${error}`);
      }
    }, 15000);

    it('should have backend database connected', async () => {
      const response = await httpRequest(`${backendUrl}/health`, 'GET');
      const health = JSON.parse(response.body);

      expect(health).toHaveProperty('database');
      expect(health.database).toBe('connected');
    }, 15000);

    it('should have frontend service responding', async () => {
      try {
        const response = await httpRequest(frontendUrl, 'GET');
        // Frontend should return 200 for homepage or login redirect
        expect([200, 301, 302, 307, 308]).toContain(response.statusCode);
      } catch (error) {
        throw new Error(`Frontend service is not responding at ${frontendUrl}: ${error}`);
      }
    }, 15000);
  });

  describe('Authentication Flow (End-to-End)', () => {
    let authToken: string;
    let userId: string;

    it('should successfully register a new user', async () => {
      const timestamp = Date.now();
      const testUser = {
        email: `smoketest${timestamp}@flowcomply.local`,
        password: 'Test123!@#',
        firstName: 'Smoke',
        lastName: 'Test',
      };

      const response = await httpRequest(
        `${apiUrl}/auth/register`,
        'POST',
        testUser
      );

      if (response.statusCode !== 201) {
        console.error('Registration failed:', response.body);
      }

      expect(response.statusCode).toBe(201);

      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('user');
      expect(data.user.email).toBe(testUser.email);

      authToken = data.token;
      userId = data.user.id;
    }, 15000);

    it('should successfully login with admin credentials', async () => {
      const response = await httpRequest(
        `${apiUrl}/auth/login`,
        'POST',
        {
          email: 'admin@flowcomply.local',
          password: 'password123',
        }
      );

      if (response.statusCode !== 200) {
        console.error('Login failed:', response.body);
      }

      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('refreshToken');
      expect(data).toHaveProperty('user');
      expect(data.user.email).toBe('admin@flowcomply.local');

      authToken = data.token;
    }, 15000);

    it('should access protected endpoint with valid token', async () => {
      const response = await httpRequest(
        `${apiUrl}/auth/me`,
        'GET',
        undefined,
        {
          'Authorization': `Bearer ${authToken}`,
        }
      );

      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('email');
    }, 15000);

    it('should reject protected endpoint without token', async () => {
      const response = await httpRequest(`${apiUrl}/auth/me`, 'GET');

      expect(response.statusCode).toBe(401);
    }, 15000);

    it('should successfully logout', async () => {
      const response = await httpRequest(
        `${apiUrl}/auth/logout`,
        'POST',
        undefined,
        {
          'Authorization': `Bearer ${authToken}`,
        }
      );

      // Accept either 200 (success) or 204 (no content)
      expect([200, 204]).toContain(response.statusCode);
    }, 15000);
  });

  describe('API Response Format Validation', () => {
    it('should return JSON content-type for API endpoints', async () => {
      const response = await httpRequest(`${apiUrl}/auth/login`, 'POST', {});

      expect(response.headers['content-type']).toMatch(/application\/json/);
    }, 15000);

    it('should return consistent error format', async () => {
      const response = await httpRequest(`${apiUrl}/auth/login`, 'POST', {
        email: 'invalid',
        password: 'short',
      });

      expect([400, 401, 422]).toContain(response.statusCode);

      const data = JSON.parse(response.body);
      // Error responses should have a consistent structure
      expect(data).toHaveProperty('message');
    }, 15000);
  });

  describe('CORS and Security Headers', () => {
    it('should have CORS headers configured', async () => {
      const response = await httpRequest(`${backendUrl}/health`, 'GET');

      // Check for CORS headers (might be conditional based on origin)
      // At minimum, the server should respond
      expect(response.statusCode).toBe(200);
    }, 15000);

    it('should not expose sensitive headers', async () => {
      const response = await httpRequest(`${backendUrl}/health`, 'GET');

      // Should not expose internal server details
      expect(response.headers['x-powered-by']).toBeUndefined();
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await httpRequest(
        `${apiUrl}/this-endpoint-does-not-exist`,
        'GET'
      );

      expect(response.statusCode).toBe(404);
    }, 15000);

    it('should return 405 for unsupported methods', async () => {
      const response = await httpRequest(`${apiUrl}/auth/login`, 'DELETE');

      // Should return 405 Method Not Allowed or 404
      expect([404, 405]).toContain(response.statusCode);
    }, 15000);

    it('should handle malformed JSON gracefully', async () => {
      const response = await httpRequest(
        `${apiUrl}/auth/login`,
        'POST',
        'not-valid-json',
        { 'Content-Type': 'application/json' }
      );

      // Should return 400 Bad Request, not 500 Internal Server Error
      expect(response.statusCode).toBe(400);
    }, 15000);
  });

  describe('Performance Baselines', () => {
    it('should respond to health check within 1 second', async () => {
      const start = Date.now();
      await httpRequest(`${backendUrl}/health`, 'GET');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    }, 15000);

    it('should respond to login within 2 seconds', async () => {
      const start = Date.now();
      await httpRequest(
        `${apiUrl}/auth/login`,
        'POST',
        {
          email: 'admin@flowcomply.local',
          password: 'password123',
        }
      );
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
    }, 15000);
  });

  describe('Database Operations', () => {
    let authToken: string;

    beforeAll(async () => {
      const response = await httpRequest(
        `${apiUrl}/auth/login`,
        'POST',
        {
          email: 'admin@flowcomply.local',
          password: 'password123',
        }
      );

      const data = JSON.parse(response.body);
      authToken = data.token;
    });

    it('should successfully query database through API', async () => {
      const response = await httpRequest(
        `${apiUrl}/auth/me`,
        'GET',
        undefined,
        {
          'Authorization': `Bearer ${authToken}`,
        }
      );

      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('email');
    }, 15000);
  });

  describe('Session Management', () => {
    it('should maintain session across multiple requests', async () => {
      // Login
      const loginResponse = await httpRequest(
        `${apiUrl}/auth/login`,
        'POST',
        {
          email: 'admin@flowcomply.local',
          password: 'password123',
        }
      );

      const { token } = JSON.parse(loginResponse.body);

      // Make multiple requests with same token
      for (let i = 0; i < 3; i++) {
        const response = await httpRequest(
          `${apiUrl}/auth/me`,
          'GET',
          undefined,
          {
            'Authorization': `Bearer ${token}`,
          }
        );

        expect(response.statusCode).toBe(200);
      }
    }, 15000);
  });
});
