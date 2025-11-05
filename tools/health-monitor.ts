/**
 * Service Health Monitor
 * Continuously monitors backend, database, Redis, frontend, and S3
 * Logs results and alerts on critical failures
 */

import axios, { AxiosError } from 'axios';
import pino from 'pino';
import { createClient } from 'redis';
import pg from 'pg';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

interface HealthCheckResult {
  name: string;
  status: 'UP' | 'DOWN';
  latency: number;
  statusCode?: number;
  error?: string;
  critical: boolean;
  timestamp: Date;
}

class HealthMonitor {
  private checks: HealthCheckResult[] = [];
  private runOnce: boolean = process.argv.includes('--once');
  private interval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupGracefulShutdown();
  }

  private setupGracefulShutdown() {
    process.on('SIGINT', () => {
      logger.info('Shutting down health monitor...');
      if (this.interval) {
        clearInterval(this.interval);
      }
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down...');
      if (this.interval) {
        clearInterval(this.interval);
      }
      process.exit(0);
    });
  }

  async checkBackendAPI(): Promise<HealthCheckResult> {
    const name = 'Backend API';
    const url = process.env.BACKEND_URL || 'http://localhost:3000';
    const critical = true;

    try {
      const startTime = Date.now();
      const response = await axios.get(`${url}/health`, {
        timeout: 5000,
        validateStatus: (status) => status === 200,
      });
      const latency = Date.now() - startTime;

      return {
        name,
        status: 'UP',
        latency,
        statusCode: response.status,
        critical,
        timestamp: new Date(),
      };
    } catch (error: any) {
      const latency = Date.now() - error.timestamp || 0;
      return {
        name,
        status: 'DOWN',
        latency: 5000,
        error: error.message || 'Connection failed',
        critical,
        timestamp: new Date(),
      };
    }
  }

  async checkDatabase(): Promise<HealthCheckResult> {
    const name = 'PostgreSQL Database';
    const critical = true;

    try {
      const startTime = Date.now();
      const client = new pg.Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'compliance',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        statement_timeout: 5000,
        query_timeout: 5000,
      });

      await client.connect();
      await client.query('SELECT NOW()');
      await client.end();

      const latency = Date.now() - startTime;

      return {
        name,
        status: 'UP',
        latency,
        statusCode: 200,
        critical,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        name,
        status: 'DOWN',
        latency: 5000,
        error: error.message || 'Database connection failed',
        critical,
        timestamp: new Date(),
      };
    }
  }

  async checkRedis(): Promise<HealthCheckResult> {
    const name = 'Redis Cache';
    const critical = true;

    try {
      const startTime = Date.now();
      const client = createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        socket: {
          reconnectStrategy: () => 5000,
        },
      });

      await client.connect();
      await client.ping();
      await client.disconnect();

      const latency = Date.now() - startTime;

      return {
        name,
        status: 'UP',
        latency,
        statusCode: 200,
        critical,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        name,
        status: 'DOWN',
        latency: 5000,
        error: error.message || 'Redis connection failed',
        critical,
        timestamp: new Date(),
      };
    }
  }

  async checkFrontend(): Promise<HealthCheckResult> {
    const name = 'Frontend Application';
    const url = process.env.FRONTEND_URL || 'http://localhost:3002';
    const critical = true;

    try {
      const startTime = Date.now();
      const response = await axios.get(url, {
        timeout: 5000,
        validateStatus: (status) => status === 200,
      });
      const latency = Date.now() - startTime;

      return {
        name,
        status: 'UP',
        latency,
        statusCode: response.status,
        critical,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        name,
        status: 'DOWN',
        latency: 5000,
        error: error.message || 'Frontend unreachable',
        critical,
        timestamp: new Date(),
      };
    }
  }

  async checkS3(): Promise<HealthCheckResult> {
    const name = 'AWS S3 Storage';
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const critical = false; // Not immediately critical but should be monitored

    try {
      const startTime = Date.now();
      const response = await axios.get(`${backendUrl}/health/s3`, {
        timeout: 5000,
      });
      const latency = Date.now() - startTime;

      return {
        name,
        status: response.data.status === 'ok' ? 'UP' : 'DOWN',
        latency,
        statusCode: response.status,
        critical,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        name,
        status: 'DOWN',
        latency: 5000,
        error: error.message || 'S3 health check failed',
        critical,
        timestamp: new Date(),
      };
    }
  }

  async runHealthChecks(): Promise<HealthCheckResult[]> {
    logger.info('🏥 Starting health checks...');

    try {
      const results = await Promise.all([
        this.checkBackendAPI(),
        this.checkDatabase(),
        this.checkRedis(),
        this.checkFrontend(),
        this.checkS3(),
      ]);

      this.checks = results;
      this.displayResults(results);
      this.logResults(results);
      this.checkForAlerts(results);

      return results;
    } catch (error) {
      logger.error({ error }, '❌ Health check error');
      return [];
    }
  }

  private displayResults(results: HealthCheckResult[]): void {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║  SERVICE HEALTH MONITOR                            ║');
    console.log('╠════════════════════════════════════════════════════╣');

    results.forEach((result) => {
      const statusIcon = result.status === 'UP' ? '✓' : '✗';
      const statusColor = result.status === 'UP' ? '\x1b[32m' : '\x1b[31m';
      const resetColor = '\x1b[0m';

      const statusStr = `${statusColor}${statusIcon} ${result.name}${resetColor}`;
      const latencyStr = result.latency ? `(${result.latency}ms)` : '';
      const errorStr = result.error ? ` - ${result.error}` : '';

      console.log(
        `║  ${statusStr.padEnd(40)} ${latencyStr}${errorStr}`.padEnd(50) + '║'
      );
    });

    const upCount = results.filter((r) => r.status === 'UP').length;
    const downCount = results.filter((r) => r.status === 'DOWN').length;

    console.log('╠════════════════════════════════════════════════════╣');
    console.log(
      `║  Status: ${upCount} UP, ${downCount} DOWN`.padEnd(50) + '║'
    );
    console.log(
      `║  Last Check: ${new Date().toLocaleString()}`.padEnd(50) + '║'
    );
    console.log('╚════════════════════════════════════════════════════╝\n');
  }

  private logResults(results: HealthCheckResult[]): void {
    results.forEach((result) => {
      if (result.status === 'UP') {
        logger.info(
          {
            service: result.name,
            status: 'UP',
            latency: result.latency,
          },
          `${result.name} is healthy`
        );
      } else {
        logger.warn(
          {
            service: result.name,
            status: 'DOWN',
            error: result.error,
          },
          `${result.name} is DOWN`
        );
      }
    });
  }

  private checkForAlerts(results: HealthCheckResult[]): void {
    const criticalDown = results.filter(
      (r) => r.critical && r.status === 'DOWN'
    );

    if (criticalDown.length > 0) {
      logger.error(
        {
          services: criticalDown.map((s) => ({
            name: s.name,
            error: s.error,
          })),
        },
        `🚨 CRITICAL SERVICES DOWN: ${criticalDown.map((s) => s.name).join(', ')}`
      );

      // Exit with error code if running in CI
      if (process.env.CI === 'true') {
        process.exit(1);
      }
    }

    const slowServices = results.filter((r) => r.latency > 3000);
    if (slowServices.length > 0) {
      logger.warn(
        {
          services: slowServices.map((s) => ({
            name: s.name,
            latency: s.latency,
          })),
        },
        `⚠️ SLOW SERVICES: ${slowServices.map((s) => s.name).join(', ')}`
      );
    }
  }

  async start(): Promise<void> {
    if (this.runOnce) {
      // Run once and exit
      await this.runHealthChecks();
      process.exit(0);
    } else {
      // Run continuously
      logger.info(
        { interval: '30 seconds' },
        '🔄 Health monitoring started...'
      );

      // Initial check
      await this.runHealthChecks();

      // Set up interval
      this.interval = setInterval(async () => {
        await this.runHealthChecks();
      }, 30000); // Every 30 seconds

      // Keep process alive
      await new Promise(() => {});
    }
  }
}

// Main execution
const monitor = new HealthMonitor();
monitor
  .start()
  .catch((error) => {
    logger.error({ error }, 'Fatal error in health monitor');
    process.exit(1);
  });
