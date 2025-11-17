/**
 * Configuration Validation Tests
 *
 * These tests validate that all environment configurations are correct
 * and consistent across the application.
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect } from '@jest/globals';

interface EnvConfig {
  [key: string]: string | undefined;
}

function parseEnvFile(filePath: string): EnvConfig {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Environment file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const config: EnvConfig = {};

  content.split('\n').forEach(line => {
    // Skip comments and empty lines
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    // Parse KEY=VALUE
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      config[key] = value;
    }
  });

  return config;
}

describe('Configuration Validation Tests', () => {
  // When tests run, cwd() is the backend directory
  const backendRoot = process.cwd();
  const projectRoot = path.join(backendRoot, '..');
  const backendEnvPath = path.join(backendRoot, '.env');
  const frontendEnvPath = path.join(projectRoot, 'frontend', '.env.local');

  describe('Backend Configuration (.env)', () => {
    let backendConfig: EnvConfig;

    beforeAll(() => {
      backendConfig = parseEnvFile(backendEnvPath);
    });

    it('should have correct PORT configuration', () => {
      expect(backendConfig.PORT).toBe('3000');
    });

    it('should have correct FRONTEND_URL pointing to port 3001', () => {
      expect(backendConfig.FRONTEND_URL).toBe('http://localhost:3001');
    });

    it('should have API_BASE_URL pointing to backend port 3000', () => {
      expect(backendConfig.API_BASE_URL).toBe('http://localhost:3000');
    });

    it('should have DATABASE_URL configured', () => {
      expect(backendConfig.DATABASE_URL).toBeDefined();
      expect(backendConfig.DATABASE_URL).toContain('postgresql://');
    });

    it('should have JWT_SECRET configured', () => {
      expect(backendConfig.JWT_SECRET).toBeDefined();
      expect(backendConfig.JWT_SECRET!.length).toBeGreaterThan(32);
    });

    it('should have REDIS_URL configured', () => {
      expect(backendConfig.REDIS_URL).toBeDefined();
    });

    it('should have NODE_ENV set to valid value', () => {
      expect(['development', 'test', 'production']).toContain(backendConfig.NODE_ENV);
    });

    it('should have CORS_ORIGIN matching FRONTEND_URL', () => {
      expect(backendConfig.CORS_ORIGIN).toBe(backendConfig.FRONTEND_URL);
    });
  });

  describe('Frontend Configuration (.env.local)', () => {
    let frontendConfig: EnvConfig;

    beforeAll(() => {
      frontendConfig = parseEnvFile(frontendEnvPath);
    });

    it('should have NEXT_PUBLIC_API_URL pointing to backend port 3000', () => {
      expect(frontendConfig.NEXT_PUBLIC_API_URL).toBe('http://localhost:3000/api/v1');
    });

    it('should NOT point to frontend port 3001 (common mistake)', () => {
      expect(frontendConfig.NEXT_PUBLIC_API_URL).not.toContain(':3001');
    });

    it('should have NODE_ENV configured', () => {
      expect(frontendConfig.NODE_ENV).toBeDefined();
      expect(['development', 'test', 'production']).toContain(frontendConfig.NODE_ENV);
    });
  });

  describe('Frontend-Backend Configuration Consistency', () => {
    let backendConfig: EnvConfig;
    let frontendConfig: EnvConfig;

    beforeAll(() => {
      backendConfig = parseEnvFile(backendEnvPath);
      frontendConfig = parseEnvFile(frontendEnvPath);
    });

    it('should have frontend API URL pointing to backend port', () => {
      const backendPort = backendConfig.PORT || '3000';
      expect(frontendConfig.NEXT_PUBLIC_API_URL).toContain(`:${backendPort}`);
    });

    it('should have backend FRONTEND_URL NOT pointing to backend port', () => {
      const backendPort = backendConfig.PORT || '3000';
      expect(backendConfig.FRONTEND_URL).not.toContain(`:${backendPort}`);
    });

    it('should have matching NODE_ENV or compatible environments', () => {
      // Both should be in valid states
      expect(['development', 'test', 'production']).toContain(backendConfig.NODE_ENV);
      expect(['development', 'test', 'production']).toContain(frontendConfig.NODE_ENV);
    });
  });

  describe('Port Configuration Validation', () => {
    let backendConfig: EnvConfig;

    beforeAll(() => {
      backendConfig = parseEnvFile(backendEnvPath);
    });

    it('should use different ports for frontend and backend', () => {
      const backendPort = backendConfig.PORT;
      const frontendUrl = backendConfig.FRONTEND_URL || '';
      const frontendPortMatch = frontendUrl.match(/:(\d+)/);

      if (frontendPortMatch) {
        const frontendPort = frontendPortMatch[1];
        expect(backendPort).not.toBe(frontendPort);
      }
    });

    it('should have standard backend port (3000)', () => {
      expect(backendConfig.PORT).toBe('3000');
    });

    it('should have standard frontend port (3001) in FRONTEND_URL', () => {
      expect(backendConfig.FRONTEND_URL).toContain(':3001');
    });
  });

  describe('Docker Configuration Validation', () => {
    it('should have docker-compose.test.yml file', () => {
      const dockerComposePath = path.join(projectRoot, 'docker-compose.test.yml');
      expect(fs.existsSync(dockerComposePath)).toBe(true);
    });

    it('should have docker-compose.test.yml with correct frontend API URL', () => {
      const dockerComposePath = path.join(projectRoot, 'docker-compose.test.yml');
      const content = fs.readFileSync(dockerComposePath, 'utf-8');

      // Check that NEXT_PUBLIC_API_URL in docker-compose points to localhost:3000
      // (not backend:3000, which won't work in browser)
      expect(content).toContain('NEXT_PUBLIC_API_URL');
      expect(content).toContain('http://localhost:3000/api/v1');
    });
  });

  describe('Security Configuration Validation', () => {
    let backendConfig: EnvConfig;

    beforeAll(() => {
      backendConfig = parseEnvFile(backendEnvPath);
    });

    it('should have JWT_SECRET with sufficient length', () => {
      expect(backendConfig.JWT_SECRET).toBeDefined();
      expect(backendConfig.JWT_SECRET!.length).toBeGreaterThanOrEqual(32);
    });

    it('should have JWT_REFRESH_SECRET configured', () => {
      expect(backendConfig.JWT_REFRESH_SECRET).toBeDefined();
      expect(backendConfig.JWT_REFRESH_SECRET!.length).toBeGreaterThanOrEqual(32);
    });

    it('should have different JWT secrets for access and refresh tokens', () => {
      expect(backendConfig.JWT_SECRET).not.toBe(backendConfig.JWT_REFRESH_SECRET);
    });

    it('should have ENCRYPTION_KEY configured', () => {
      expect(backendConfig.ENCRYPTION_KEY).toBeDefined();
    });
  });

  describe('Database Configuration Validation', () => {
    let backendConfig: EnvConfig;

    beforeAll(() => {
      backendConfig = parseEnvFile(backendEnvPath);
    });

    it('should have DATABASE_URL with postgresql protocol', () => {
      expect(backendConfig.DATABASE_URL).toBeDefined();
      expect(backendConfig.DATABASE_URL).toMatch(/^postgresql:\/\//);
    });

    it('should have DATABASE_REPLICA_URL configured for read replicas', () => {
      // This might be optional in development
      if (backendConfig.DATABASE_REPLICA_URL) {
        expect(backendConfig.DATABASE_REPLICA_URL).toMatch(/^postgresql:\/\//);
      }
    });
  });
});
