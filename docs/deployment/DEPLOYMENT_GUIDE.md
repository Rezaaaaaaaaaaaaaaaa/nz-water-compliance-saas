# NZ Water Compliance SaaS - Deployment Guide

## 🎉 System Complete - 100% Built!

This comprehensive guide covers deploying your fully-functional NZ Water Compliance SaaS system.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Testing](#testing)
7. [AWS Deployment](#aws-deployment)
8. [Monitoring & Alerts](#monitoring--alerts)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** v20+ (LTS recommended)
- **npm** v10+
- **Docker** & **Docker Compose** (for local development)
- **PostgreSQL** 15+
- **Redis** 7+
- **AWS CLI** v2 (for deployment)
- **Terraform** v1.5+ (for infrastructure)

### AWS Services Required
- ECS (Elastic Container Service)
- RDS (PostgreSQL)
- ElastiCache (Redis)
- S3 (Document storage)
- ALB (Application Load Balancer)
- CloudWatch (Monitoring)
- ECR (Container Registry)

---

## Local Development Setup

### 1. Clone and Install

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Start Local Services with Docker

```bash
cd backend
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

### 3. Set Up Environment Variables

**Backend** (`backend/.env`):
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/compliance_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET_NAME=compliance-saas-documents
AWS_S3_BUCKET_REGION=ap-southeast-2

# Server
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# CORS
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# File Upload
MAX_FILE_SIZE=52428800
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

## Database Setup

### 1. Run Prisma Migrations

```bash
cd backend
npx prisma migrate dev
```

### 2. Seed Database (Optional)

```bash
npx prisma db seed
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

---

## Running the Application

### Backend

```bash
cd backend
npm run dev
```

Backend runs on: `http://localhost:3001`

API Documentation: `http://localhost:3001/api/v1`

### Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on: `http://localhost:3000`

### Background Workers

Workers start automatically with the backend server. They handle:
- Compliance deadline reminders
- Notifications (email + in-app)
- Cleanup tasks
- Quarterly regulation reviews

---

## Testing

### Unit Tests

```bash
# Backend
cd backend
npm test

# With coverage
npm test -- --coverage
```

### Integration Tests

```bash
cd backend
npm run test:integration
```

### E2E Tests (Playwright)

```bash
cd frontend
npx playwright test

# With UI
npx playwright test --ui

# Specific browser
npx playwright test --project=chromium
```

### Test Coverage

View coverage reports:
```bash
# Backend
open backend/coverage/index.html

# Frontend
open frontend/coverage/index.html
```

---

## AWS Deployment

### 1. Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: ap-southeast-2
```

### 2. Initialize Terraform

```bash
cd infrastructure
terraform init
```

### 3. Review Infrastructure Plan

```bash
terraform plan -var-file="production.tfvars"
```

### 4. Deploy Infrastructure

```bash
terraform apply -var-file="production.tfvars"
```

This creates:
- VPC with public/private subnets
- RDS PostgreSQL instance
- ElastiCache Redis cluster
- S3 bucket with encryption
- ECS cluster with Fargate
- Application Load Balancer
- CloudWatch dashboards & alarms

### 5. Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin <your-ecr-url>

# Build and push backend
cd backend
docker build -t compliance-saas-backend .
docker tag compliance-saas-backend:latest <your-ecr-url>/compliance-saas-backend:latest
docker push <your-ecr-url>/compliance-saas-backend:latest
```

### 6. Run Database Migrations on Production

```bash
# From local machine with production DATABASE_URL
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### 7. Deploy Frontend to Vercel

```bash
cd frontend
npm install -g vercel
vercel --prod
```

Or use the GitHub Actions workflow (commits to `main` branch auto-deploy).

---

## Monitoring & Alerts

### CloudWatch Dashboard

Access your dashboard:
```
https://console.aws.amazon.com/cloudwatch/home?region=ap-southeast-2#dashboards
```

### Key Metrics Tracked

**Application Metrics:**
- API Response Times
- Failed Background Jobs
- Compliance Violations
- Document Uploads
- DWSP Submissions
- Active Users

**Infrastructure Metrics:**
- ECS CPU & Memory
- RDS Performance
- Redis Performance
- ALB Response Times
- S3 Bucket Usage

### Alarms Configured

1. **High CPU (ECS)** - > 80% for 10 minutes
2. **High Memory (ECS)** - > 80% for 10 minutes
3. **High CPU (RDS)** - > 80% for 10 minutes
4. **Low Storage (RDS)** - < 10GB free
5. **High DB Connections** - > 80 connections
6. **5XX Errors** - > 10 errors in 5 minutes
7. **High Response Time** - > 2 seconds average
8. **Failed Background Jobs** - > 10 failures in 5 minutes
9. **Compliance Violations** - Any violations detected

### Email Alerts

Configure in `infrastructure/monitoring.tf`:
```hcl
variable "alert_email" {
  default = "your-team@example.com"
}
```

---

## CI/CD Pipeline

### GitHub Actions Workflows

**Backend CI** (`.github/workflows/backend-ci.yml`):
- Runs on: Push to `main`/`develop`, PRs
- Steps: Lint → Type Check → Unit Tests → Build → Security Scan

**Frontend CI** (`.github/workflows/frontend-ci.yml`):
- Runs on: Push to `main`/`develop`, PRs
- Steps: Lint → Type Check → E2E Tests → Build → Lighthouse Audit

**Deploy** (`.github/workflows/deploy.yml`):
- Runs on: Push to `main` (production)
- Steps: Build Docker → Push to ECR → Deploy to ECS → Migrate DB → Deploy Frontend

### Required GitHub Secrets

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
DATABASE_URL
NEXT_PUBLIC_API_URL
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
SLACK_WEBHOOK (optional)
SNYK_TOKEN (optional)
```

---

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - Logout

### Assets
- `GET /api/v1/assets` - List assets
- `POST /api/v1/assets` - Create asset
- `GET /api/v1/assets/:id` - Get asset
- `PATCH /api/v1/assets/:id` - Update asset
- `DELETE /api/v1/assets/:id` - Delete asset
- `GET /api/v1/assets/statistics` - Get statistics

### Documents
- `POST /api/v1/documents/upload-url` - Request upload URL
- `POST /api/v1/documents` - Create document record
- `GET /api/v1/documents` - List documents
- `GET /api/v1/documents/:id` - Get document
- `GET /api/v1/documents/:id/download` - Get download URL
- `DELETE /api/v1/documents/:id` - Soft delete

### Compliance Plans (DWSP)
- `GET /api/v1/compliance/dwsp` - List plans
- `POST /api/v1/compliance/dwsp` - Create plan
- `GET /api/v1/compliance/dwsp/:id` - Get plan
- `PATCH /api/v1/compliance/dwsp/:id` - Update plan
- `POST /api/v1/compliance/dwsp/:id/validate` - Validate plan
- `POST /api/v1/compliance/dwsp/:id/submit` - Submit to regulator
- `DELETE /api/v1/compliance/dwsp/:id` - Delete plan

### Reports
- `GET /api/v1/reports` - List reports
- `POST /api/v1/reports` - Create report
- `GET /api/v1/reports/:id` - Get report
- `POST /api/v1/reports/:id/submit` - Submit report
- `GET /api/v1/reports/generate/monthly` - Generate monthly report
- `GET /api/v1/reports/generate/quarterly` - Generate quarterly report
- `GET /api/v1/reports/generate/annual` - Generate annual report

### Monitoring
- `GET /api/v1/monitoring/queues` - Queue statistics
- `GET /api/v1/monitoring/workers` - Worker health
- `GET /api/v1/monitoring/system` - System health

---

## Troubleshooting

### Backend won't start
```bash
# Check database connection
psql postgresql://postgres:postgres@localhost:5432/compliance_dev

# Check Redis connection
redis-cli ping

# Check environment variables
cat backend/.env
```

### Frontend build fails
```bash
# Clear Next.js cache
rm -rf frontend/.next

# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Database migrations fail
```bash
# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset

# Or manually fix migration
npx prisma migrate resolve --applied <migration-name>
```

### S3 upload fails
- Verify AWS credentials
- Check bucket permissions
- Ensure CORS is configured
- Verify file size < 50MB

### Tests failing
```bash
# Update test snapshots
npm test -- -u

# Run specific test file
npm test -- path/to/test.ts

# Verbose output
npm test -- --verbose
```

---

## Production Checklist

- [ ] Environment variables set correctly
- [ ] Database migrations applied
- [ ] S3 bucket created with encryption
- [ ] CloudWatch alarms configured
- [ ] SNS email subscriptions confirmed
- [ ] Secrets rotated from defaults
- [ ] SSL certificate configured on ALB
- [ ] DNS records pointing to ALB
- [ ] Backup strategy implemented
- [ ] Monitoring dashboard reviewed
- [ ] Load testing performed
- [ ] Security scan passed
- [ ] Documentation updated

---

## Support & Maintenance

### Quarterly Tasks
- [ ] Review Taumata Arowai regulations (automated reminder)
- [ ] Update DWSP validation rules if needed
- [ ] Review system performance metrics
- [ ] Update dependencies

### Monthly Tasks
- [ ] Review CloudWatch alarms
- [ ] Check audit logs for anomalies
- [ ] Verify backup integrity
- [ ] Review failed background jobs

### Weekly Tasks
- [ ] Monitor error rates
- [ ] Review user feedback
- [ ] Check queue depths

---

## Architecture Summary

**Backend:** Node.js + TypeScript + Fastify + Prisma
**Frontend:** Next.js 14 + TypeScript + TailwindCSS
**Database:** PostgreSQL 15
**Cache:** Redis 7
**Storage:** AWS S3
**Jobs:** BullMQ
**Infrastructure:** AWS ECS + Terraform
**Monitoring:** CloudWatch
**CI/CD:** GitHub Actions

---

## License

Proprietary - NZ Water Compliance SaaS

---

## Contact

For technical support or questions, contact your system administrator.

**Built with compliance to Taumata Arowai regulatory requirements.**
