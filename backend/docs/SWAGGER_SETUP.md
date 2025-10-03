# Swagger/OpenAPI Documentation Setup

This guide explains how to set up Swagger/OpenAPI documentation for the NZ Water Compliance SaaS API.

## Installation

Install the required Swagger packages:

```bash
npm install @fastify/swagger @fastify/swagger-ui
```

## Configuration

### 1. Update `server.ts`

Add Swagger configuration to your Fastify server:

```typescript
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';

// ... existing imports

async function buildServer() {
  const server = fastify({
    logger: {
      level: config.logLevel,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // Register Swagger plugin
  await server.register(fastifySwagger, {
    swagger: {
      info: {
        title: 'NZ Water Compliance SaaS API',
        description: 'Comprehensive API for managing water utility compliance with Taumata Arowai regulations',
        version: '1.0.0',
        contact: {
          name: 'API Support',
          email: 'support@compliance-saas.nz',
        },
      },
      host: process.env.API_HOST || 'localhost:5000',
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'Authentication', description: 'User authentication endpoints' },
        { name: 'Organizations', description: 'Organization management' },
        { name: 'Users', description: 'User management' },
        { name: 'Assets', description: 'Water infrastructure asset management' },
        { name: 'Documents', description: 'Document management and uploads' },
        { name: 'Compliance', description: 'Compliance plans and tracking' },
        { name: 'Analytics', description: 'Analytics and dashboard data' },
        { name: 'Export', description: 'Data export in multiple formats' },
        { name: 'Monitoring', description: 'System monitoring and health checks' },
      ],
      securityDefinitions: {
        Bearer: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          description: 'JWT token in format: Bearer <token>',
        },
      },
    },
  });

  // Register Swagger UI
  await server.register(fastifySwaggerUI, {
    routePrefix: '/api/v1/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });

  // ... rest of server configuration
}
```

### 2. Add Schema Definitions to Routes

Update your route files to include OpenAPI schemas. Example for analytics routes:

```typescript
// analytics.routes.ts
export async function analyticsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // Get comprehensive dashboard data
  app.get('/dashboard', {
    schema: {
      description: 'Get comprehensive dashboard data for organization',
      tags: ['Analytics'],
      security: [{ Bearer: [] }],
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                complianceScore: { type: 'number' },
                totalAssets: { type: 'number' },
                criticalAssets: { type: 'number' },
                activeDWSPs: { type: 'number' },
                overdueItems: { type: 'number' },
                recentActivity: { type: 'array' },
              },
            },
            cached: { type: 'boolean' },
          },
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
          },
        },
      },
    },
    handler: analyticsController.getDashboard,
  });

  // Export assets with query parameters
  app.get('/assets', {
    schema: {
      description: 'Export asset data',
      tags: ['Export'],
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['csv', 'excel', 'pdf', 'text'],
            default: 'csv',
            description: 'Export format',
          },
        },
      },
      response: {
        200: {
          description: 'Export file',
          type: 'string',
        },
      },
    },
    preHandler: [validateQuery(exportQuerySchema)],
    config: { rateLimit: exportRateLimit },
    handler: exportController.exportAssets,
  });
}
```

### 3. Common Response Schemas

Create reusable schemas for common responses:

```typescript
// schemas/common.schemas.ts
export const SuccessResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
  },
};

export const ErrorResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    error: { type: 'string' },
    details: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },
};

export const PaginatedResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: { type: 'array' },
    pagination: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        pages: { type: 'number' },
      },
    },
  },
};
```

## Accessing the Documentation

Once configured, the Swagger UI will be available at:

```
http://localhost:5000/api/v1/docs
```

Features available:
- **Interactive API testing** - Test endpoints directly from the browser
- **Schema validation** - View request/response schemas
- **Authentication** - Test with JWT tokens
- **Try it out** - Execute real API calls
- **Download OpenAPI spec** - Export as JSON/YAML

## Security Considerations

### Production Deployment

In production, you may want to restrict access to the documentation:

```typescript
await server.register(fastifySwaggerUI, {
  routePrefix: '/api/v1/docs',
  uiConfig: {
    docExpansion: 'list',
  },
  // Restrict access in production
  transformStaticCSP: (header) => header,
});

// Add authentication to documentation route
server.addHook('onRequest', async (request, reply) => {
  if (request.url.startsWith('/api/v1/docs') && process.env.NODE_ENV === 'production') {
    // Verify admin access or API key
    // ... authentication logic
  }
});
```

## Example: Complete Route with Swagger Schema

```typescript
app.post('/compliance-plans', {
  schema: {
    description: 'Create a new compliance plan',
    tags: ['Compliance'],
    security: [{ Bearer: [] }],
    body: {
      type: 'object',
      required: ['title', 'type', 'targetDate'],
      properties: {
        title: { type: 'string', minLength: 1, maxLength: 200 },
        type: { type: 'string', enum: ['DWSP', 'REPORT', 'AUDIT', 'OTHER'] },
        description: { type: 'string' },
        targetDate: { type: 'string', format: 'date-time' },
        assignedToId: { type: 'string', pattern: '^c[a-z0-9]{24}$' },
      },
    },
    response: {
      201: {
        description: 'Plan created successfully',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              type: { type: 'string' },
              status: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      400: {
        description: 'Validation error',
        ...ErrorResponse,
      },
      401: {
        description: 'Unauthorized',
        ...ErrorResponse,
      },
    },
  },
  preHandler: [validateBody(createCompliancePlanSchema)],
  handler: complianceController.createPlan,
});
```

## Benefits

1. **Self-documenting API** - Schemas in code serve as documentation
2. **Type safety** - Fastify validates requests/responses against schemas
3. **Developer experience** - Interactive testing reduces development time
4. **Client generation** - OpenAPI spec can generate client SDKs
5. **Standards compliance** - OpenAPI 3.0 compatible

## Next Steps

1. Install dependencies: `npm install @fastify/swagger @fastify/swagger-ui`
2. Update `server.ts` with Swagger configuration
3. Add schemas to all route definitions
4. Test the documentation at `/api/v1/docs`
5. Export OpenAPI spec for client generation if needed

## Resources

- [Fastify Swagger Documentation](https://github.com/fastify/fastify-swagger)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Configuration](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/)
