# NZ Water Compliance SaaS - Backend

Backend API for the NZ Water Utility Compliance Management System, built to help water utilities meet Taumata Arowai regulatory requirements.

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Fastify
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Cache/Queue:** Redis with BullMQ
- **File Storage:** AWS S3
- **Authentication:** JWT (with optional Auth0 integration)
- **Testing:** Jest
- **Logging:** Pino

## Prerequisites

- Node.js 18 or higher
- Docker and Docker Compose (for local development)
- AWS account (for S3 storage)
- PostgreSQL 14+ (or use Docker)
- Redis 7+ (or use Docker)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and set the following critical values:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Strong secret key (min 32 characters)
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `S3_BUCKET_NAME` - Your S3 bucket name

### 3. Start Local Infrastructure

Start PostgreSQL and Redis using Docker Compose:

```bash
npm run docker:up
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- Adminer (DB admin UI) on port 8080

To stop:

```bash
npm run docker:down
```

### 4. Database Setup

Generate Prisma client:

```bash
npm run prisma:generate
```

Run migrations:

```bash
npm run prisma:migrate
```

Seed database with sample data:

```bash
npm run prisma:seed
```

Open Prisma Studio to view data:

```bash
npm run prisma:studio
```

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration and environment variables
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── routes/           # API route definitions
│   ├── middleware/       # Custom middleware (auth, validation, etc.)
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── jobs/             # Background job processors
│   ├── tests/            # Test files
│   │   ├── unit/         # Unit tests
│   │   └── integration/  # Integration tests
│   └── server.ts         # Main entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Database migrations
│   └── seed.ts           # Seed data script
├── docker-compose.yml    # Local infrastructure
└── package.json
```

## Available Scripts

### Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server

### Testing

- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:integration` - Run integration tests only

### Code Quality

- `npm run lint` - Lint code with ESLint
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Prettier

### Database

- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:seed` - Seed database with sample data

### Docker

- `npm run docker:up` - Start local infrastructure
- `npm run docker:down` - Stop local infrastructure

## API Endpoints

### Health Checks

- `GET /health` - Basic health check
- `GET /health/db` - Database connectivity check
- `GET /health/redis` - Redis connectivity check

### Authentication (Coming Soon)

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh access token

### Assets (Coming Soon)

- `GET /api/v1/assets` - List assets
- `GET /api/v1/assets/:id` - Get asset details
- `POST /api/v1/assets` - Create asset
- `PATCH /api/v1/assets/:id` - Update asset
- `DELETE /api/v1/assets/:id` - Delete asset

### Compliance Plans (Coming Soon)

- `GET /api/v1/compliance/plans` - List compliance plans
- `GET /api/v1/compliance/plans/:id` - Get plan details
- `POST /api/v1/compliance/plans` - Create plan
- `PATCH /api/v1/compliance/plans/:id` - Update plan
- `POST /api/v1/compliance/plans/:id/submit` - Submit to regulator

### Documents (Coming Soon)

- `GET /api/v1/documents` - List documents
- `POST /api/v1/documents/upload-url` - Get presigned upload URL
- `POST /api/v1/documents` - Create document record
- `GET /api/v1/documents/:id/download` - Get download URL

### Reports (Coming Soon)

- `POST /api/v1/reports/generate` - Generate report
- `GET /api/v1/reports/:id/status` - Check report generation status
- `GET /api/v1/reports/:id/download` - Download generated report

## Regulatory Compliance Features

This backend implements specific features required for NZ water utility compliance:

### Audit Logging
- All data modifications are logged with user, timestamp, and changes
- Audit logs are immutable and retained for 7 years (regulatory requirement)
- Logs include IP address and session information

### Data Retention
- Compliance records retained for minimum 7 years
- Soft deletes maintain historical data
- Automated archival of old records

### Role-Based Access Control (RBAC)
- System Admin, Organization Admin, Compliance Manager, Inspector, Auditor roles
- Permission checks on all endpoints
- Cross-tenant data isolation
- Auditor read-only access across organizations

### Drinking Water Safety Plans (DWSP)
- Structured according to Taumata Arowai template
- Version control and approval workflows
- Digital signatures for submissions
- Annual review reminders

## Security Considerations

### Authentication
- JWT-based authentication with short-lived tokens (15 min)
- Refresh tokens for session management (7 days)
- Rate limiting on all endpoints
- Brute force protection on login

### Authorization
- Permission checks on every endpoint
- Organization-based data isolation
- Resource-level permissions
- Audit trail of all access attempts

### Data Protection
- All sensitive data encrypted at rest
- TLS 1.3 for data in transit
- Secrets managed via environment variables
- Input validation with Zod schemas

### Compliance
- GDPR-compliant data handling
- Audit logs for regulatory requirements
- Data retention policies
- Secure file storage

## Environment Variables

See `.env.example` for full list of configuration options.

### Critical Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/db

# JWT (MUST be strong and unique)
JWT_SECRET=your-super-secret-key-change-in-production

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (32+ characters)
- [ ] Configure production database with SSL
- [ ] Set up Redis with authentication
- [ ] Configure S3 bucket with proper IAM policies
- [ ] Enable CORS for production frontend URL
- [ ] Set up monitoring (Datadog, Sentry, etc.)
- [ ] Configure log aggregation
- [ ] Set up automated backups
- [ ] Review and test all security settings
- [ ] Run security audit
- [ ] Test disaster recovery procedures

### Docker Deployment

Build Docker image:

```bash
docker build -t compliance-saas-backend .
```

Run container:

```bash
docker run -p 3000:3000 --env-file .env compliance-saas-backend
```

## Troubleshooting

### Database Connection Issues

```bash
# Test database connectivity
npm run prisma:studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Redis Connection Issues

```bash
# Test Redis connectivity
docker exec -it compliance-saas-redis redis-cli ping
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

## Contributing

1. Create feature branch from `main`
2. Write tests for new features
3. Ensure all tests pass: `npm test`
4. Lint code: `npm run lint:fix`
5. Submit pull request

## License

MIT

## Support

For issues or questions:
- Create an issue in the repository
- Contact: dev@compliance-saas.co.nz
