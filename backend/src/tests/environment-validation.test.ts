/**
 * Environment-Specific Configuration Tests
 *
 * These tests validate that configuration is appropriate for each environment
 * (development, test, production) and that environment-specific settings are correct.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
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

describe('Environment-Specific Configuration Tests', () => {
  const backendRoot = process.cwd();
  const projectRoot = path.join(backendRoot, '..');
  const backendEnvPath = path.join(backendRoot, '.env');
  const frontendEnvPath = path.join(projectRoot, 'frontend', '.env.local');
  const dockerComposePath = path.join(projectRoot, 'docker-compose.test.yml');

  describe('Development Environment', () => {
    let backendConfig: EnvConfig;
    let frontendConfig: EnvConfig;

    beforeAll(() => {
      backendConfig = parseEnvFile(backendEnvPath);
      frontendConfig = parseEnvFile(frontendEnvPath);
    });

    it('should use development-appropriate URLs', () => {
      if (backendConfig.NODE_ENV === 'development') {
        expect(backendConfig.FRONTEND_URL).toContain('localhost');
        expect(backendConfig.API_BASE_URL).toContain('localhost');
        expect(frontendConfig.NEXT_PUBLIC_API_URL).toContain('localhost');
      }
    });

    it('should use standard development ports', () => {
      if (backendConfig.NODE_ENV === 'development') {
        expect(backendConfig.PORT).toBe('3000');
        expect(backendConfig.FRONTEND_URL).toContain(':3001');
      }
    });

    it('should have localhost database connection', () => {
      if (backendConfig.NODE_ENV === 'development') {
        const dbUrl = backendConfig.DATABASE_URL || '';
        expect(dbUrl).toMatch(/localhost|127\.0\.0\.1/);
      }
    });

    it('should have localhost Redis connection', () => {
      if (backendConfig.NODE_ENV === 'development') {
        const redisUrl = backendConfig.REDIS_URL || '';
        expect(redisUrl).toMatch(/localhost|127\.0\.0\.1/);
      }
    });

    it('should NOT use production URLs in development', () => {
      if (backendConfig.NODE_ENV === 'development') {
        expect(backendConfig.FRONTEND_URL).not.toContain('flowcomply.com');
        expect(backendConfig.API_BASE_URL).not.toContain('flowcomply.com');
        expect(frontendConfig.NEXT_PUBLIC_API_URL).not.toContain('flowcomply.com');
      }
    });

    it('should have detailed logging enabled', () => {
      if (backendConfig.NODE_ENV === 'development') {
        const logLevel = backendConfig.LOG_LEVEL || 'debug';
        expect(['debug', 'info']).toContain(logLevel);
      }
    });
  });

  describe('Test Environment (Docker)', () => {
    let dockerConfig: any;

    beforeAll(() => {
      if (fs.existsSync(dockerComposePath)) {
        const content = fs.readFileSync(dockerComposePath, 'utf-8');
        dockerConfig = yaml.load(content);
      }
    });

    it('should have docker-compose.test.yml file', () => {
      expect(fs.existsSync(dockerComposePath)).toBe(true);
    });

    it('should define all required services', () => {
      expect(dockerConfig).toHaveProperty('services');
      expect(dockerConfig.services).toHaveProperty('backend');
      expect(dockerConfig.services).toHaveProperty('frontend');
      expect(dockerConfig.services).toHaveProperty('postgres-primary');
    });

    it('should use localhost URLs for browser-side calls in test environment', () => {
      const frontendService = dockerConfig?.services?.frontend;
      if (frontendService?.environment) {
        const apiUrl = frontendService.environment.NEXT_PUBLIC_API_URL;
        // Browser calls must use localhost, not container names
        expect(apiUrl).toContain('localhost');
        expect(apiUrl).not.toContain('backend:');
      }
    });

    it('should use container names for server-side calls in test environment', () => {
      const backendService = dockerConfig?.services?.backend;
      if (backendService?.environment) {
        const dbUrl = backendService.environment.DATABASE_URL;
        // Server-side calls can use container names
        if (dbUrl) {
          expect(dbUrl).toMatch(/postgres-primary|localhost/);
        }
      }
    });

    it('should have health checks configured for critical services', () => {
      const backendService = dockerConfig?.services?.backend;
      const postgresService = dockerConfig?.services?.['postgres-primary'];

      // Backend should have health check
      expect(backendService).toHaveProperty('healthcheck');

      // Postgres should have health check
      expect(postgresService).toHaveProperty('healthcheck');
    });

    it('should have service dependencies configured correctly', () => {
      const backendService = dockerConfig?.services?.backend;
      const frontendService = dockerConfig?.services?.frontend;

      // Backend should depend on postgres
      if (backendService?.depends_on) {
        expect(backendService.depends_on).toContain('postgres-primary');
      }

      // Frontend should depend on backend
      if (frontendService?.depends_on) {
        expect(frontendService.depends_on).toContain('backend');
      }
    });

    it('should expose correct ports', () => {
      const backendService = dockerConfig?.services?.backend;
      const frontendService = dockerConfig?.services?.frontend;

      if (backendService?.ports) {
        // Backend should expose port 3000
        const hasBackendPort = backendService.ports.some((p: string) =>
          p.includes('3000:3000') || p.includes('3000')
        );
        expect(hasBackendPort).toBe(true);
      }

      if (frontendService?.ports) {
        // Frontend should expose port 3001
        const hasFrontendPort = frontendService.ports.some((p: string) =>
          p.includes('3001:3001') || p.includes('3001')
        );
        expect(hasFrontendPort).toBe(true);
      }
    });
  });

  describe('Production-Ready Configuration Checks', () => {
    let backendConfig: EnvConfig;

    beforeAll(() => {
      backendConfig = parseEnvFile(backendEnvPath);
    });

    it('should have strong JWT secrets (production requirement)', () => {
      expect(backendConfig.JWT_SECRET).toBeDefined();
      expect(backendConfig.JWT_SECRET!.length).toBeGreaterThanOrEqual(32);

      expect(backendConfig.JWT_REFRESH_SECRET).toBeDefined();
      expect(backendConfig.JWT_REFRESH_SECRET!.length).toBeGreaterThanOrEqual(32);
    });

    it('should have encryption key configured', () => {
      expect(backendConfig.ENCRYPTION_KEY).toBeDefined();
      expect(backendConfig.ENCRYPTION_KEY!.length).toBeGreaterThan(0);
    });

    it('should have database connection configured', () => {
      expect(backendConfig.DATABASE_URL).toBeDefined();
      expect(backendConfig.DATABASE_URL).toMatch(/^postgresql:\/\//);
    });

    it('should have appropriate session timeout', () => {
      const sessionTimeout = parseInt(backendConfig.SESSION_TIMEOUT || '3600');
      // Session should be reasonable (between 15 minutes and 24 hours)
      expect(sessionTimeout).toBeGreaterThanOrEqual(900); // 15 minutes
      expect(sessionTimeout).toBeLessThanOrEqual(86400); // 24 hours
    });

    it('should have rate limiting configured', () => {
      // Rate limiting should be enabled in production
      const rateLimitEnabled = backendConfig.RATE_LIMIT_ENABLED !== 'false';
      const rateLimitMax = parseInt(backendConfig.RATE_LIMIT_MAX || '100');

      expect(rateLimitMax).toBeGreaterThan(0);
      expect(rateLimitMax).toBeLessThanOrEqual(1000);
    });
  });

  describe('Security Configuration', () => {
    let backendConfig: EnvConfig;

    beforeAll(() => {
      backendConfig = parseEnvFile(backendEnvPath);
    });

    it('should have CORS properly configured', () => {
      expect(backendConfig.CORS_ORIGIN).toBeDefined();
      // CORS origin should match frontend URL
      expect(backendConfig.CORS_ORIGIN).toBe(backendConfig.FRONTEND_URL);
    });

    it('should NOT have default/example secrets', () => {
      const secrets = [
        backendConfig.JWT_SECRET,
        backendConfig.JWT_REFRESH_SECRET,
        backendConfig.ENCRYPTION_KEY,
      ];

      secrets.forEach(secret => {
        expect(secret).toBeDefined();
        expect(secret).not.toBe('change-me');
        expect(secret).not.toBe('your-secret-here');
        expect(secret).not.toBe('example');
        expect(secret).not.toBe('test');
        expect(secret).not.toBe('secret');
      });
    });

    it('should have different secrets for different purposes', () => {
      const jwtSecret = backendConfig.JWT_SECRET;
      const jwtRefreshSecret = backendConfig.JWT_REFRESH_SECRET;
      const encryptionKey = backendConfig.ENCRYPTION_KEY;

      expect(jwtSecret).not.toBe(jwtRefreshSecret);
      expect(jwtSecret).not.toBe(encryptionKey);
      expect(jwtRefreshSecret).not.toBe(encryptionKey);
    });
  });

  describe('URL Consistency Validation', () => {
    let backendConfig: EnvConfig;
    let frontendConfig: EnvConfig;

    beforeAll(() => {
      backendConfig = parseEnvFile(backendEnvPath);
      frontendConfig = parseEnvFile(frontendEnvPath);
    });

    it('should have consistent protocol (http/https) across all URLs', () => {
      const urls = [
        backendConfig.FRONTEND_URL,
        backendConfig.API_BASE_URL,
        frontendConfig.NEXT_PUBLIC_API_URL,
      ];

      const protocols = urls
        .filter(url => url)
        .map(url => url!.split('://')[0]);

      // All should be http in development
      if (backendConfig.NODE_ENV === 'development') {
        protocols.forEach(protocol => {
          expect(protocol).toBe('http');
        });
      }
    });

    it('should have consistent domain across all URLs', () => {
      const frontendDomain = backendConfig.FRONTEND_URL?.split('://')[1]?.split(':')[0];
      const apiDomain = backendConfig.API_BASE_URL?.split('://')[1]?.split(':')[0];
      const clientApiDomain = frontendConfig.NEXT_PUBLIC_API_URL?.split('://')[1]?.split(':')[0];

      // In development, all should use localhost
      if (backendConfig.NODE_ENV === 'development') {
        expect(frontendDomain).toBe('localhost');
        expect(apiDomain).toBe('localhost');
        expect(clientApiDomain).toBe('localhost');
      }
    });
  });

  describe('Performance and Scaling Configuration', () => {
    let backendConfig: EnvConfig;

    beforeAll(() => {
      backendConfig = parseEnvFile(backendEnvPath);
    });

    it('should have database connection pool configured', () => {
      const poolMin = parseInt(backendConfig.DB_POOL_MIN || '2');
      const poolMax = parseInt(backendConfig.DB_POOL_MAX || '10');

      expect(poolMin).toBeGreaterThanOrEqual(1);
      expect(poolMax).toBeGreaterThan(poolMin);
      expect(poolMax).toBeLessThanOrEqual(100);
    });

    it('should have Redis configured for caching', () => {
      expect(backendConfig.REDIS_URL).toBeDefined();
    });
  });

  describe('Monitoring and Observability', () => {
    let backendConfig: EnvConfig;

    beforeAll(() => {
      backendConfig = parseEnvFile(backendEnvPath);
    });

    it('should have logging level configured', () => {
      const logLevel = backendConfig.LOG_LEVEL || 'info';
      expect(['error', 'warn', 'info', 'debug']).toContain(logLevel);
    });

    it('should have Sentry DSN configured for error tracking', () => {
      // Sentry is optional but recommended
      if (backendConfig.SENTRY_DSN) {
        expect(backendConfig.SENTRY_DSN).toMatch(/^https:\/\//);
      }
    });
  });

  describe('Feature Flags and Optional Features', () => {
    let backendConfig: EnvConfig;

    beforeAll(() => {
      backendConfig = parseEnvFile(backendEnvPath);
    });

    it('should have MFA configuration if enabled', () => {
      const mfaEnabled = backendConfig.MFA_ENABLED === 'true';

      if (mfaEnabled) {
        expect(backendConfig.MFA_ISSUER).toBeDefined();
      }
    });

    it('should have email configuration if email features enabled', () => {
      const emailEnabled = backendConfig.EMAIL_ENABLED === 'true';

      if (emailEnabled) {
        expect(backendConfig.SMTP_HOST).toBeDefined();
        expect(backendConfig.SMTP_PORT).toBeDefined();
        expect(backendConfig.SMTP_USER).toBeDefined();
      }
    });
  });
});
