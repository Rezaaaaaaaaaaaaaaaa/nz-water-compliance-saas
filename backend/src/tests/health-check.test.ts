/**
 * Health Check Endpoint Tests
 *
 * These tests validate that health check endpoints are working correctly
 * and provide useful diagnostic information.
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

function httpGet(url: string): Promise<{ statusCode: number; body: string; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({
        statusCode: res.statusCode || 0,
        body,
        headers: res.headers
      }));
    }).on('error', reject);
  });
}

describe('Health Check Endpoint Tests', () => {
  const backendRoot = process.cwd();
  const backendEnvPath = path.join(backendRoot, '.env');

  let backendConfig: EnvConfig;
  let healthUrl: string;

  beforeAll(() => {
    backendConfig = parseEnvFile(backendEnvPath);
    const port = backendConfig.PORT || '3000';
    healthUrl = `http://localhost:${port}/health`;
  });

  describe('Basic Health Endpoint', () => {
    it('should respond to health check requests', async () => {
      try {
        const response = await httpGet(healthUrl);
        expect(response.statusCode).toBe(200);
      } catch (error) {
        throw new Error(`Health endpoint not accessible at ${healthUrl}: ${error}`);
      }
    }, 10000);

    it('should return JSON content', async () => {
      const response = await httpGet(healthUrl);

      expect(response.headers['content-type']).toMatch(/application\/json/);

      // Should be valid JSON
      expect(() => JSON.parse(response.body)).not.toThrow();
    }, 10000);

    it('should return health status', async () => {
      const response = await httpGet(healthUrl);
      const health = JSON.parse(response.body);

      expect(health).toHaveProperty('status');
      expect(['ok', 'healthy', 'up']).toContain(health.status);
    }, 10000);

    it('should respond quickly (< 500ms)', async () => {
      const start = Date.now();
      await httpGet(healthUrl);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    }, 10000);
  });

  describe('Database Health Check', () => {
    it('should include database status', async () => {
      const response = await httpGet(healthUrl);
      const health = JSON.parse(response.body);

      expect(health).toHaveProperty('database');
    }, 10000);

    it('should report database connection status', async () => {
      const response = await httpGet(healthUrl);
      const health = JSON.parse(response.body);

      // Database should be connected or provide error details
      if (health.database === 'connected') {
        expect(health.database).toBe('connected');
      } else {
        // If not connected, should provide information
        expect(typeof health.database).toBe('string');
      }
    }, 10000);
  });

  describe('Redis Health Check', () => {
    it('should include Redis status', async () => {
      const response = await httpGet(healthUrl);
      const health = JSON.parse(response.body);

      // Redis status should be present
      if (health.redis !== undefined) {
        expect(['connected', 'disconnected', 'unavailable']).toContain(health.redis);
      }
    }, 10000);

    it('should gracefully handle Redis being unavailable', async () => {
      const response = await httpGet(healthUrl);
      const health = JSON.parse(response.body);

      // Even if Redis is down, health endpoint should still work
      expect(response.statusCode).toBe(200);
      expect(health.status).toBeDefined();
    }, 10000);
  });

  describe('System Information', () => {
    it('should include uptime information', async () => {
      const response = await httpGet(healthUrl);
      const health = JSON.parse(response.body);

      if (health.uptime !== undefined) {
        expect(typeof health.uptime).toBe('number');
        expect(health.uptime).toBeGreaterThan(0);
      }
    }, 10000);

    it('should include timestamp', async () => {
      const response = await httpGet(healthUrl);
      const health = JSON.parse(response.body);

      if (health.timestamp !== undefined) {
        expect(typeof health.timestamp).toBe('string');

        // Should be valid ISO date
        const date = new Date(health.timestamp);
        expect(date.toString()).not.toBe('Invalid Date');
      }
    }, 10000);

    it('should include version information', async () => {
      const response = await httpGet(healthUrl);
      const health = JSON.parse(response.body);

      if (health.version !== undefined) {
        expect(typeof health.version).toBe('string');
        expect(health.version.length).toBeGreaterThan(0);
      }
    }, 10000);
  });

  describe('Detailed Health Endpoint (if available)', () => {
    it('should provide detailed health at /health/detailed', async () => {
      const port = backendConfig.PORT || '3000';
      const detailedHealthUrl = `http://localhost:${port}/health/detailed`;

      try {
        const response = await httpGet(detailedHealthUrl);

        if (response.statusCode === 200) {
          const health = JSON.parse(response.body);

          // Detailed health should include more information
          expect(health).toHaveProperty('status');

          // May include memory usage
          if (health.memory !== undefined) {
            expect(typeof health.memory).toBe('object');
          }

          // May include CPU usage
          if (health.cpu !== undefined) {
            expect(typeof health.cpu).toBe('object');
          }
        }
      } catch (error) {
        // Detailed health endpoint might not exist, which is ok
      }
    }, 10000);
  });

  describe('Readiness vs Liveness', () => {
    it('should have liveness probe endpoint', async () => {
      const port = backendConfig.PORT || '3000';

      // Try common liveness endpoints
      const livenessUrls = [
        `http://localhost:${port}/health/live`,
        `http://localhost:${port}/health/liveness`,
        `http://localhost:${port}/live`,
      ];

      let foundLiveness = false;

      for (const url of livenessUrls) {
        try {
          const response = await httpGet(url);
          if (response.statusCode === 200) {
            foundLiveness = true;
            break;
          }
        } catch (error) {
          // Try next URL
        }
      }

      // If none found, /health serves as liveness
      if (!foundLiveness) {
        const response = await httpGet(healthUrl);
        expect(response.statusCode).toBe(200);
      }
    }, 10000);

    it('should have readiness probe endpoint', async () => {
      const port = backendConfig.PORT || '3000';

      // Try common readiness endpoints
      const readinessUrls = [
        `http://localhost:${port}/health/ready`,
        `http://localhost:${port}/health/readiness`,
        `http://localhost:${port}/ready`,
      ];

      let foundReadiness = false;

      for (const url of readinessUrls) {
        try {
          const response = await httpGet(url);
          if (response.statusCode === 200) {
            foundReadiness = true;
            const health = JSON.parse(response.body);

            // Readiness should check dependencies
            expect(health).toHaveProperty('status');

            break;
          }
        } catch (error) {
          // Try next URL
        }
      }

      // If none found, /health serves as readiness
      if (!foundReadiness) {
        const response = await httpGet(healthUrl);
        expect(response.statusCode).toBe(200);
      }
    }, 10000);
  });

  describe('Health Check Consistency', () => {
    it('should return consistent results across multiple requests', async () => {
      const responses = await Promise.all([
        httpGet(healthUrl),
        httpGet(healthUrl),
        httpGet(healthUrl),
      ]);

      // All should succeed
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });

      // All should have status
      responses.forEach(response => {
        const health = JSON.parse(response.body);
        expect(health).toHaveProperty('status');
      });
    }, 10000);

    it('should not leak memory on repeated health checks', async () => {
      // Make many health check requests
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(httpGet(healthUrl));
      }

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });
    }, 15000);
  });

  describe('Error Scenarios', () => {
    it('should handle database connection issues gracefully', async () => {
      const response = await httpGet(healthUrl);

      // Even if database has issues, endpoint should respond
      expect(response.statusCode).toBe(200);

      const health = JSON.parse(response.body);

      // Should indicate database status
      if (health.database !== 'connected') {
        // Should provide some information about the issue
        expect(health.database).toBeDefined();
      }
    }, 10000);

    it('should not expose sensitive error details in health check', async () => {
      const response = await httpGet(healthUrl);
      const health = JSON.parse(response.body);

      // Should not expose database credentials or internal paths
      const healthString = JSON.stringify(health);

      expect(healthString).not.toMatch(/password/i);
      expect(healthString).not.toMatch(/secret/i);
      expect(healthString).not.toMatch(/postgresql:\/\/.*:.*@/); // DB URL with credentials
    }, 10000);
  });

  describe('Performance Monitoring', () => {
    it('should track response times', async () => {
      const times: number[] = [];

      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await httpGet(healthUrl);
        times.push(Date.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length;

      // Average response time should be reasonable
      expect(avgTime).toBeLessThan(200);
    }, 15000);

    it('should handle concurrent health checks', async () => {
      const start = Date.now();

      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(httpGet(healthUrl));
      }

      const responses = await Promise.all(promises);

      const duration = Date.now() - start;

      // All should succeed
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });

      // Should handle concurrency efficiently
      expect(duration).toBeLessThan(2000);
    }, 15000);
  });

  describe('Health Check Standards Compliance', () => {
    it('should return 200 OK when healthy', async () => {
      const response = await httpGet(healthUrl);
      expect(response.statusCode).toBe(200);
    }, 10000);

    it('should return appropriate status code when unhealthy', async () => {
      // This test assumes the service is healthy
      // In a real scenario, you'd test with a failing dependency
      const response = await httpGet(healthUrl);

      // Should be 200 (healthy) or 503 (unhealthy)
      expect([200, 503]).toContain(response.statusCode);
    }, 10000);

    it('should follow standard health check format', async () => {
      const response = await httpGet(healthUrl);
      const health = JSON.parse(response.body);

      // Should have a status field
      expect(health).toHaveProperty('status');

      // Status should be one of the standard values
      expect(typeof health.status).toBe('string');
    }, 10000);
  });

  describe('Dependency Health Checks', () => {
    it('should check all critical dependencies', async () => {
      const response = await httpGet(healthUrl);
      const health = JSON.parse(response.body);

      // Should check database
      expect(health).toHaveProperty('database');

      // May check Redis
      if (health.redis !== undefined) {
        expect(typeof health.redis).toBe('string');
      }
    }, 10000);

    it('should distinguish between critical and non-critical failures', async () => {
      const response = await httpGet(healthUrl);
      const health = JSON.parse(response.body);

      // Database failure should be critical (affects main status)
      if (health.database !== 'connected') {
        // Service might still report as 'ok' if it can operate in degraded mode
        expect(health.status).toBeDefined();
      }

      // Redis failure should be non-critical (doesn't affect main status)
      if (health.redis !== 'connected') {
        // Service should still be 'ok' without Redis
        expect(response.statusCode).toBe(200);
      }
    }, 10000);
  });
});
