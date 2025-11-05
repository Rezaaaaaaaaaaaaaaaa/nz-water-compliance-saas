/**
 * Application Configuration
 *
 * Centralized configuration management for the NZ Water Compliance SaaS backend.
 * All environment variables are loaded and validated here.
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Configuration schema with validation
const configSchema = z.object({
  // Server
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  port: z.number().int().positive().default(3000),
  host: z.string().default('0.0.0.0'),

  // Database
  databaseUrl: z.string().url(),

  // Redis
  redis: z.object({
    host: z.string().default('localhost'),
    port: z.number().int().positive().default(6379),
    password: z.string().optional(),
  }),

  // JWT
  jwtSecret: z.string().min(32),
  jwtExpiresIn: z.string().default('15m'),
  refreshTokenExpiresIn: z.string().default('7d'),

  // Auth0 (Optional)
  auth0: z
    .object({
      domain: z.string().optional(),
      audience: z.string().optional(),
    })
    .optional(),

  // AWS S3
  aws: z.object({
    region: z.string().default('ap-southeast-2'),
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
    s3BucketName: z.string(),
    s3BucketRegion: z.string().default('ap-southeast-2'),
  }),

  // Email
  email: z.object({
    sendgridApiKey: z.string().optional(),
    fromEmail: z.string().email(),
  }),

  // Application URLs
  frontendUrl: z.string().url().default('http://localhost:3001'),
  apiBaseUrl: z.string().url().default('http://localhost:3000'),

  // Rate Limiting
  rateLimit: z.object({
    max: z.number().int().positive().default(100),
    window: z.string().default('15m'),
  }),

  // Compliance Configuration
  compliance: z.object({
    auditLogRetentionDays: z.number().int().positive().default(2555), // 7 years
    dataRetentionYears: z.number().int().positive().default(7),
  }),

  // File Upload
  maxFileSize: z
    .number()
    .int()
    .positive()
    .default(50 * 1024 * 1024), // 50MB
  allowedFileTypes: z
    .array(z.string())
    .default(['pdf', 'docx', 'doc', 'xlsx', 'xls', 'jpg', 'jpeg', 'png']),

  // Logging
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Feature Flags
  features: z.object({
    backgroundJobs: z.boolean().default(true),
    emailNotifications: z.boolean().default(true),
    auditLogging: z.boolean().default(true),
  }),

  // AI Configuration
  ai: z.object({
    anthropicApiKey: z.string().optional(),
    model: z.string().default('claude-3-5-sonnet-20241022'),
  }),
});

// Parse and validate configuration
function loadConfig() {
  try {
    const rawConfig = {
      // Server
      nodeEnv: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || '0.0.0.0',

      // Database
      databaseUrl: process.env.DATABASE_URL || '',

      // Redis
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
      },

      // JWT
      jwtSecret: process.env.JWT_SECRET || '',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
      refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',

      // Auth0
      auth0: {
        domain: process.env.AUTH0_DOMAIN,
        audience: process.env.AUTH0_AUDIENCE,
      },

      // AWS
      aws: {
        region: process.env.AWS_REGION || 'ap-southeast-2',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        s3BucketName: process.env.S3_BUCKET_NAME || '',
        s3BucketRegion: process.env.S3_BUCKET_REGION || 'ap-southeast-2',
      },

      // Email
      email: {
        sendgridApiKey: process.env.SENDGRID_API_KEY,
        fromEmail: process.env.FROM_EMAIL || 'noreply@compliance-saas.co.nz',
      },

      // URLs
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',

      // Rate Limiting
      rateLimit: {
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
        window: process.env.RATE_LIMIT_WINDOW || '15m',
      },

      // Compliance
      compliance: {
        auditLogRetentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '2555', 10),
        dataRetentionYears: 7,
      },

      // File Upload
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10) * 1024 * 1024,
      allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
        'pdf',
        'docx',
        'doc',
        'xlsx',
        'xls',
        'jpg',
        'jpeg',
        'png',
      ],

      // Logging
      logLevel: process.env.LOG_LEVEL || 'info',

      // Feature Flags
      features: {
        backgroundJobs: process.env.ENABLE_BACKGROUND_JOBS !== 'false',
        emailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false',
        auditLogging: process.env.ENABLE_AUDIT_LOGGING !== 'false',
      },

      // AI Configuration
      ai: {
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022',
      },
    };

    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('Failed to load configuration:', error);
    }
    process.exit(1);
  }
}

export const config = loadConfig();

// Type export for TypeScript
export type Config = z.infer<typeof configSchema>;
