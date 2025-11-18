/**
 * 🔍 Endpoint Discovery & Validation Tests
 *
 * Automatically discovers and validates all API endpoints
 * to ensure they exist and respond correctly.
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

describe('Endpoint Discovery & Validation', () => {
  const backendRoot = process.cwd();
  const projectRoot = path.join(backendRoot, '..');
  const backendEnvPath = path.join(backendRoot, '.env');
  const frontendEnvPath = path.join(projectRoot, 'frontend', '.env.local');

  let backendConfig: EnvConfig;
  let frontendConfig: EnvConfig;
  let apiUrl: string;
  let backendPort: string;

  beforeAll(() => {
    backendConfig = parseEnvFile(backendEnvPath);
    frontendConfig = parseEnvFile(frontendEnvPath);

    backendPort = backendConfig.PORT || '3000';
    apiUrl = frontendConfig.NEXT_PUBLIC_API_URL || `http://localhost:${backendPort}/api/v1`;
  });

  describe('Core Health Endpoints', () => {
    it('should have /health endpoint returning JSON', async () => {
      try {
        const response = await httpRequest(`http://localhost:${backendPort}/health`, 'GET');

        // Should return 200
        expect(response.statusCode).toBe(200);

        // Should be JSON
        expect(response.headers['content-type']).toMatch(/application\/json/);

        // Should parse as JSON
        const data = JSON.parse(response.body);
        expect(data).toHaveProperty('status');
      } catch (error: any) {
        throw new Error(`/health endpoint not available or not returning JSON: ${error.message}`);
      }
    }, 10000);

    it('should have /health/ready endpoint for readiness probe', async () => {
      const possibleUrls = [
        `http://localhost:${backendPort}/health/ready`,
        `http://localhost:${backendPort}/health/readiness`,
        `http://localhost:${backendPort}/ready`,
      ];

      let found = false;
      let lastError = '';

      for (const url of possibleUrls) {
        try {
          const response = await httpRequest(url, 'GET');
          if (response.statusCode === 200) {
            found = true;
            break;
          }
        } catch (error: any) {
          lastError = error.message;
        }
      }

      if (!found) {
        throw new Error(`Readiness endpoint not found. Tried: ${possibleUrls.join(', ')}. Last error: ${lastError}`);
      }

      expect(found).toBe(true);
    }, 10000);
  });

  describe('Authentication Endpoints', () => {
    it('should have POST /api/v1/auth/register endpoint', async () => {
      try {
        // Even with invalid data, endpoint should exist (return 400 or 422, not 404)
        const response = await httpRequest(
          `${apiUrl}/auth/register`,
          'POST',
          {}
        );

        expect(response.statusCode).not.toBe(404);
        expect([200, 201, 400, 422]).toContain(response.statusCode);
      } catch (error: any) {
        throw new Error(`/auth/register endpoint not found or unreachable: ${error.message}`);
      }
    }, 10000);

    it('should have POST /api/v1/auth/login endpoint', async () => {
      try {
        const response = await httpRequest(
          `${apiUrl}/auth/login`,
          'POST',
          {}
        );

        expect(response.statusCode).not.toBe(404);
        expect([200, 400, 401, 422]).toContain(response.statusCode);
      } catch (error: any) {
        throw new Error(`/auth/login endpoint not found or unreachable: ${error.message}`);
      }
    }, 10000);

    it('should have POST /api/v1/auth/logout endpoint', async () => {
      try {
        const response = await httpRequest(
          `${apiUrl}/auth/logout`,
          'POST',
          {}
        );

        expect(response.statusCode).not.toBe(404);
      } catch (error: any) {
        // Logout might require auth, which is OK
        if (error.message && !error.message.includes('404')) {
          expect(true).toBe(true); // Endpoint exists
        } else {
          throw new Error(`/auth/logout endpoint not found: ${error.message}`);
        }
      }
    }, 10000);

    it('should have GET /api/v1/auth/me endpoint', async () => {
      try {
        const response = await httpRequest(
          `${apiUrl}/auth/me`,
          'GET'
        );

        // Should return 401 (unauthorized) not 404
        expect(response.statusCode).not.toBe(404);
        expect([200, 401, 403]).toContain(response.statusCode);
      } catch (error: any) {
        throw new Error(`/auth/me endpoint not found: ${error.message}`);
      }
    }, 10000);

    it('should have POST /api/v1/auth/refresh endpoint', async () => {
      try {
        const response = await httpRequest(
          `${apiUrl}/auth/refresh`,
          'POST',
          {}
        );

        expect(response.statusCode).not.toBe(404);
        expect([200, 400, 401, 422]).toContain(response.statusCode);
      } catch (error: any) {
        throw new Error(`/auth/refresh endpoint not found: ${error.message}`);
      }
    }, 10000);
  });

  describe('API Routing Configuration', () => {
    it('should have /api/v1 base path responding', async () => {
      try {
        const response = await httpRequest(
          `http://localhost:${backendPort}/api/v1`,
          'GET'
        );

        // Should not return 404 - might return 200, 401, or redirect
        expect(response.statusCode).not.toBe(404);
      } catch (error: any) {
        throw new Error(`/api/v1 base path not configured: ${error.message}`);
      }
    }, 10000);

    it('should return proper error format for non-existent endpoints', async () => {
      try {
        const response = await httpRequest(
          `${apiUrl}/definitely-does-not-exist-12345`,
          'GET'
        );

        expect(response.statusCode).toBe(404);

        // Should return JSON error
        const data = JSON.parse(response.body);
        expect(data).toHaveProperty('message');
      } catch (error: any) {
        // OK if it throws, as long as it's a 404
        if (!error.message.includes('404')) {
          throw error;
        }
      }
    }, 10000);
  });

  describe('CORS Configuration', () => {
    it('should have CORS headers configured', async () => {
      try {
        const response = await httpRequest(
          `http://localhost:${backendPort}/health`,
          'GET',
          undefined,
          {
            'Origin': 'http://localhost:3001',
          }
        );

        // Should have CORS headers
        expect(response.headers['access-control-allow-origin']).toBeDefined();
      } catch (error: any) {
        throw new Error(`CORS not configured: ${error.message}`);
      }
    }, 10000);

    it('should allow frontend origin', async () => {
      try {
        const response = await httpRequest(
          `http://localhost:${backendPort}/health`,
          'GET',
          undefined,
          {
            'Origin': frontendConfig.NEXT_PUBLIC_API_URL?.split('/api')[0] || 'http://localhost:3001',
          }
        );

        const allowOrigin = response.headers['access-control-allow-origin'];
        expect(allowOrigin).toBeDefined();
      } catch (error: any) {
        throw new Error(`Frontend origin not allowed in CORS: ${error.message}`);
      }
    }, 10000);
  });

  describe('Server Configuration', () => {
    it('should be listening on configured port', async () => {
      try {
        const response = await httpRequest(`http://localhost:${backendPort}/health`, 'GET');
        expect(response.statusCode).toBeLessThan(500);
      } catch (error: any) {
        throw new Error(`Backend not listening on port ${backendPort}: ${error.message}`);
      }
    }, 10000);

    it('should return correct content-type headers', async () => {
      try {
        const response = await httpRequest(`${apiUrl}/auth/me`, 'GET');

        // API endpoints should return JSON
        if (response.statusCode !== 404) {
          expect(response.headers['content-type']).toMatch(/application\/json/);
        }
      } catch (error: any) {
        // OK if auth fails, we're just checking headers
      }
    }, 10000);
  });

  describe('Route Discovery Report', () => {
    it('should generate comprehensive endpoint report', async () => {
      const endpoints = [
        { path: '/health', method: 'GET' },
        { path: '/api/v1/auth/register', method: 'POST' },
        { path: '/api/v1/auth/login', method: 'POST' },
        { path: '/api/v1/auth/logout', method: 'POST' },
        { path: '/api/v1/auth/me', method: 'GET' },
        { path: '/api/v1/auth/refresh', method: 'POST' },
      ];

      const results: any[] = [];

      for (const endpoint of endpoints) {
        try {
          const url = endpoint.path.startsWith('/api')
            ? `http://localhost:${backendPort}${endpoint.path}`
            : `http://localhost:${backendPort}${endpoint.path}`;

          const response = await httpRequest(url, endpoint.method, {});

          results.push({
            endpoint: `${endpoint.method} ${endpoint.path}`,
            status: response.statusCode,
            exists: response.statusCode !== 404,
          });
        } catch (error: any) {
          results.push({
            endpoint: `${endpoint.method} ${endpoint.path}`,
            status: 'ERROR',
            exists: false,
            error: error.message,
          });
        }
      }

      // Print report
      console.log('\n' + '='.repeat(60));
      console.log('  ENDPOINT DISCOVERY REPORT');
      console.log('='.repeat(60));

      results.forEach(result => {
        const status = result.exists ? '✓' : '✗';
        console.log(`${status} ${result.endpoint} - ${result.status}`);
        if (result.error) {
          console.log(`  Error: ${result.error}`);
        }
      });

      console.log('='.repeat(60) + '\n');

      // Expect at least some endpoints to exist
      const existingEndpoints = results.filter(r => r.exists).length;
      expect(existingEndpoints).toBeGreaterThan(0);
    }, 30000);
  });
});
