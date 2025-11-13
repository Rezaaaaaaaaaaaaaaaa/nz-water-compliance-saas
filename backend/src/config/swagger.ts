/**
 * OpenAPI/Swagger Configuration
 *
 * Auto-generates interactive API documentation
 */

import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './index.js';

/**
 * Swagger/OpenAPI specification
 */
const swaggerOptions = {
  openapi: {
    openapi: '3.0.3',
    info: {
      title: 'NZ Water Compliance SaaS API',
      description: 'API for managing water utility compliance with Taumata Arowai regulations',
      version: '1.0.0',
      contact: {
        name: 'FlowComply Support',
        email: 'support@flowcomply.nz',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.flowcomply.nz',
        description: 'Production server',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Assets', description: 'Water infrastructure asset management' },
      { name: 'Compliance', description: 'DWSP and compliance plan management' },
      { name: 'Documents', description: 'Document storage and retrieval' },
      { name: 'Reports', description: 'Report generation and submission' },
      { name: 'Analytics', description: 'Analytics and dashboard data' },
      { name: 'DWQAR', description: 'Water quality annual return' },
      { name: 'AI', description: 'AI-powered features' },
      { name: 'Export', description: 'Data export capabilities' },
      { name: 'Monitoring', description: 'System monitoring and health checks' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authorization header using the Bearer scheme',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: { type: 'string' },
                statusCode: { type: 'number' },
                correlationId: { type: 'string', format: 'uuid' },
                timestamp: { type: 'string', format: 'date-time' },
                details: { type: 'object', additionalProperties: true },
              },
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: {} },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' },
                hasNext: { type: 'boolean' },
                hasPrevious: { type: 'boolean' },
                correlationId: { type: 'string', format: 'uuid' },
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        Asset: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            type: {
              type: 'string',
              enum: [
                'TREATMENT_PLANT',
                'RESERVOIR',
                'PUMP_STATION',
                'PIPELINE',
                'BORE',
                'OTHER',
              ],
            },
            condition: {
              type: 'string',
              enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'VERY_POOR', 'UNKNOWN'],
            },
            riskLevel: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            },
            location: { type: 'string' },
            capacity: { type: 'number' },
            isCritical: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CompliancePlan: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            type: {
              type: 'string',
              enum: ['DWSP', 'WASTEWATER', 'ASSET_MANAGEMENT'],
            },
            status: {
              type: 'string',
              enum: ['DRAFT', 'IN_REVIEW', 'APPROVED', 'SUBMITTED'],
            },
            targetCompletionDate: { type: 'string', format: 'date' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
};

/**
 * Swagger UI configuration
 */
const swaggerUiOptions = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
    displayOperationId: false,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    defaultModelRendering: 'example',
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  },
  staticCSP: true,
  transformStaticCSP: (header: string) => header,
};

/**
 * Register Swagger plugins
 */
export async function registerSwagger(fastify: FastifyInstance): Promise<void> {
  // Skip in test environment
  if (config.nodeEnv === 'test') {
    return;
  }

  // Register Swagger
  await fastify.register(swagger, swaggerOptions);

  // Register Swagger UI
  await fastify.register(swaggerUi, swaggerUiOptions);

  console.log(`📚 API Documentation available at http://localhost:${config.port || 3000}/docs`);
}
