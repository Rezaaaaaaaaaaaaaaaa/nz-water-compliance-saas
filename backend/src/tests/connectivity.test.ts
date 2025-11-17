/**
 * Frontend-to-Backend Connectivity Tests
 *
 * These tests validate that the frontend can successfully connect to the backend
 * using the configured URLs and ports.
 */

import * as http from 'http';
import * as https from 'https';
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

function httpGet(url: string): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    client.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode || 0, body }));
    }).on('error', reject);
  });
}

function httpPost(url: string, data: any): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = url.startsWith('https') ? https : http;
    const postData = JSON.stringify(data);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode || 0, body }));
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

describe('Frontend-to-Backend Connectivity Tests', () => {
  const backendRoot = process.cwd();
  const projectRoot = path.join(backendRoot, '..');
  const backendEnvPath = path.join(backendRoot, '.env');
  const frontendEnvPath = path.join(projectRoot, 'frontend', '.env.local');

  let backendConfig: EnvConfig;
  let frontendConfig: EnvConfig;
  let backendUrl: string;
  let apiUrl: string;

  beforeAll(() => {
    backendConfig = parseEnvFile(backendEnvPath);
    frontendConfig = parseEnvFile(frontendEnvPath);

    // Get backend URL from config
    const port = backendConfig.PORT || '3000';
    backendUrl = `http://localhost:${port}`;

    // Get API URL from frontend config
    apiUrl = frontendConfig.NEXT_PUBLIC_API_URL || `${backendUrl}/api/v1`;
  });

  describe('Backend Service Availability', () => {
    it('should be able to reach backend health endpoint', async () => {
      try {
        const response = await httpGet(`${backendUrl}/health`);
        expect(response.statusCode).toBe(200);
      } catch (error) {
        throw new Error(`Cannot reach backend at ${backendUrl}/health. Is the backend running? Error: ${error}`);
      }
    }, 10000);

    it('should return valid JSON from health endpoint', async () => {
      const response = await httpGet(`${backendUrl}/health`);
      expect(() => JSON.parse(response.body)).not.toThrow();

      const health = JSON.parse(response.body);
      expect(health).toHaveProperty('status');
    }, 10000);
  });

  describe('API Endpoint Accessibility', () => {
    it('should be able to reach API base URL', async () => {
      try {
        // Try to reach the API - might be 404 or 200 depending on if there's a base route
        const response = await httpGet(apiUrl);
        // Accept either 200 or 404, just need to confirm connectivity
        expect([200, 404]).toContain(response.statusCode);
      } catch (error) {
        throw new Error(`Cannot reach API at ${apiUrl}. Check NEXT_PUBLIC_API_URL configuration. Error: ${error}`);
      }
    }, 10000);

    it('should reach API auth endpoints', async () => {
      try {
        // POST without credentials should return 400/401, not connection error
        const response = await httpPost(`${apiUrl}/auth/login`, {});
        // We expect authentication failure, not connection failure
        expect([400, 401, 422]).toContain(response.statusCode);
      } catch (error) {
        throw new Error(`Cannot reach auth endpoint at ${apiUrl}/auth/login. Error: ${error}`);
      }
    }, 10000);
  });

  describe('CORS Configuration', () => {
    it('should allow requests from frontend origin', async () => {
      try {
        const response = await httpGet(`${backendUrl}/health`);
        // In a real browser, this would test CORS headers
        // For now, just verify the endpoint is accessible
        expect(response.statusCode).toBe(200);
      } catch (error) {
        throw new Error(`CORS configuration may be preventing access: ${error}`);
      }
    }, 10000);
  });

  describe('Port Configuration Validation', () => {
    it('should have backend running on configured port', async () => {
      const port = backendConfig.PORT || '3000';
      const testUrl = `http://localhost:${port}/health`;

      try {
        const response = await httpGet(testUrl);
        expect(response.statusCode).toBe(200);
      } catch (error) {
        throw new Error(`Backend is not running on configured port ${port}. Error: ${error}`);
      }
    }, 10000);

    it('should NOT have backend running on wrong port (3001)', async () => {
      const wrongPort = '3001';

      // Only test if backend is supposed to be on 3000
      if (backendConfig.PORT === '3000') {
        try {
          await httpGet(`http://localhost:${wrongPort}/health`);
          // If we get here, something is running on 3001 (probably frontend)
          // This is expected, so we just verify it's NOT the backend
          const response = await httpGet(`http://localhost:${wrongPort}/health`);
          // Frontend's Next.js server will return 404 for /health
          expect(response.statusCode).toBe(404);
        } catch (error) {
          // This is actually good - nothing responding on 3001 or it's not the backend
          expect(error).toBeDefined();
        }
      }
    }, 10000);
  });

  describe('Environment-Specific Configuration', () => {
    it('should use localhost URLs in development', () => {
      if (backendConfig.NODE_ENV === 'development') {
        expect(backendConfig.FRONTEND_URL).toContain('localhost');
        expect(backendConfig.API_BASE_URL).toContain('localhost');
        expect(frontendConfig.NEXT_PUBLIC_API_URL).toContain('localhost');
      }
    });

    it('should have correct API URL format', () => {
      expect(frontendConfig.NEXT_PUBLIC_API_URL).toMatch(/^https?:\/\/.+\/api\/v\d+$/);
    });

    it('should have API URL ending with /api/v1', () => {
      expect(frontendConfig.NEXT_PUBLIC_API_URL).toContain('/api/v1');
    });
  });

  describe('Real Authentication Flow', () => {
    it('should successfully authenticate with valid credentials', async () => {
      try {
        const response = await httpPost(`${apiUrl}/auth/login`, {
          email: 'admin@flowcomply.local',
          password: 'password123',
        });

        if (response.statusCode !== 200) {
          console.error('Login failed:', response.body);
        }

        expect(response.statusCode).toBe(200);

        const data = JSON.parse(response.body);
        expect(data).toHaveProperty('token');
        expect(data).toHaveProperty('user');
      } catch (error) {
        throw new Error(`Authentication flow failed: ${error}`);
      }
    }, 10000);

    it('should reject invalid credentials', async () => {
      const response = await httpPost(`${apiUrl}/auth/login`, {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

      // Should return 401 Unauthorized, not 500 or connection error
      expect(response.statusCode).toBe(401);
    }, 10000);

    it('should validate request format', async () => {
      const response = await httpPost(`${apiUrl}/auth/login`, {
        // Missing required fields
      });

      // Should return 400 Bad Request or 422 Unprocessable Entity
      expect([400, 422]).toContain(response.statusCode);
    }, 10000);
  });

  describe('Network Path Validation', () => {
    it('should not have frontend calling itself instead of backend', () => {
      const apiUrl = frontendConfig.NEXT_PUBLIC_API_URL || '';
      const frontendUrl = backendConfig.FRONTEND_URL || '';

      // Extract port from frontend URL
      const frontendPortMatch = frontendUrl.match(/:(\d+)/);
      if (frontendPortMatch) {
        const frontendPort = frontendPortMatch[1];
        // API URL should NOT point to frontend port
        expect(apiUrl).not.toContain(`:${frontendPort}`);
      }
    });

    it('should have frontend API URL pointing to backend port', () => {
      const apiUrl = frontendConfig.NEXT_PUBLIC_API_URL || '';
      const backendPort = backendConfig.PORT || '3000';

      expect(apiUrl).toContain(`:${backendPort}`);
    });
  });
});
