# Phase 7 Week 2: Application Deployment - Quick Start Guide

**Week:** October 14-20, 2025
**Status:** 🚀 **READY TO START**
**Duration:** 5-7 days

---

## Overview

Week 2 focuses on deploying the FlowComply application to the AWS infrastructure created in Week 1.

### Goals
- ✅ Docker images built and optimized
- ✅ Images pushed to ECR
- ✅ Database migrations executed
- ✅ Backend deployed to ECS
- ✅ Frontend deployed to ECS
- ✅ CI/CD pipeline operational
- ✅ Application fully functional

---

## Prerequisites (from Week 1)

### ✅ Infrastructure Ready
- [ ] AWS account configured
- [ ] Terraform infrastructure deployed
- [ ] RDS database running
- [ ] Redis cluster running
- [ ] ECS cluster created
- [ ] ALB configured
- [ ] ECR repositories created

### ✅ Environment Setup
- [ ] AWS CLI configured
- [ ] Docker installed and running
- [ ] Node.js 20+ installed
- [ ] GitHub secrets configured

---

## Day 1: Docker Image Preparation (Monday)

### Task 1: Test Local Docker Builds (30 minutes)

#### Backend Build Test
```bash
cd backend

# Build Docker image locally
docker build -t flowcomply-backend:test .

# Expected: Build succeeds without errors
# Image size: ~200-300MB

# Test the image
docker run --rm -p 3001:3001 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://test:test@localhost:5432/test \
  flowcomply-backend:test

# Stop with Ctrl+C after verifying it starts
```

#### Frontend Build Test
```bash
cd frontend

# Build Docker image locally
docker build -t flowcomply-frontend:test .

# Expected: Build succeeds
# Image size: ~150-200MB

# Test the image
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:3001 \
  flowcomply-frontend:test

# Verify it starts successfully
```

### Task 2: Optimize Docker Builds (1 hour)

#### Backend Optimization
```bash
cd backend

# Check current size
docker images flowcomply-backend:test

# Review Dockerfile for optimization opportunities
# Multi-stage build already implemented ✅
# Using Alpine base image ✅
# Production dependencies only ✅

# Build with BuildKit for better caching
DOCKER_BUILDKIT=1 docker build \
  --target production \
  -t flowcomply-backend:optimized .

# Compare sizes
docker images | grep flowcomply-backend
```

#### Frontend Optimization
```bash
cd frontend

# Check Next.js config for standalone output
cat next.config.ts
# Should have: output: 'standalone' ✅

# Build with optimizations
DOCKER_BUILDKIT=1 docker build \
  -t flowcomply-frontend:optimized .

# Test standalone output
docker run --rm flowcomply-frontend:optimized \
  ls -la .next/standalone
```

### Task 3: Create Build Script (30 minutes)

```bash
# Script already created: scripts/deployment/deploy.sh
# Review and test locally

cd scripts/deployment
./deploy.sh --help

# Test build-only mode (if available)
# Or run through the build steps manually
```

---

## Day 2: Push to ECR (Tuesday)

### Task 1: Configure ECR Access (15 minutes)

```bash
# Load environment variables from Week 1
source ~/.flowcomply-env

# Verify ECR repositories exist
aws ecr describe-repositories \
  --repository-names flowcomply-backend flowcomply-frontend \
  --region ap-southeast-2

# Expected: Both repositories listed ✅
```

### Task 2: Login to ECR (5 minutes)

```bash
# Get login command
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=ap-southeast-2

# Login to ECR
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Expected: "Login Succeeded"
```

### Task 3: Tag and Push Backend (20 minutes)

```bash
cd backend

# Get ECR repository URI
BACKEND_REPO=$(aws ecr describe-repositories \
  --repository-names flowcomply-backend \
  --region ap-southeast-2 \
  --query 'repositories[0].repositoryUri' \
  --output text)

echo "Backend repo: ${BACKEND_REPO}"

# Build for production
docker build -t flowcomply-backend:latest .

# Tag for ECR
docker tag flowcomply-backend:latest ${BACKEND_REPO}:latest
docker tag flowcomply-backend:latest ${BACKEND_REPO}:v1.0.0
docker tag flowcomply-backend:latest ${BACKEND_REPO}:$(git rev-parse --short HEAD)

# Push to ECR
docker push ${BACKEND_REPO}:latest
docker push ${BACKEND_REPO}:v1.0.0
docker push ${BACKEND_REPO}:$(git rev-parse --short HEAD)

# Verify
aws ecr list-images \
  --repository-name flowcomply-backend \
  --region ap-southeast-2

# Expected: 3 image tags ✅
```

### Task 4: Tag and Push Frontend (20 minutes)

```bash
cd frontend

# Get ECR repository URI
FRONTEND_REPO=$(aws ecr describe-repositories \
  --repository-names flowcomply-frontend \
  --region ap-southeast-2 \
  --query 'repositories[0].repositoryUri' \
  --output text)

echo "Frontend repo: ${FRONTEND_REPO}"

# Build for production
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.flowcomply.com \
  -t flowcomply-frontend:latest .

# Tag for ECR
docker tag flowcomply-frontend:latest ${FRONTEND_REPO}:latest
docker tag flowcomply-frontend:latest ${FRONTEND_REPO}:v1.0.0
docker tag flowcomply-frontend:latest ${FRONTEND_REPO}:$(git rev-parse --short HEAD)

# Push to ECR
docker push ${FRONTEND_REPO}:latest
docker push ${FRONTEND_REPO}:v1.0.0
docker push ${FRONTEND_REPO}:$(git rev-parse --short HEAD)

# Verify
aws ecr list-images \
  --repository-name flowcomply-frontend \
  --region ap-southeast-2

# Expected: 3 image tags ✅
```

---

## Day 3: Database Setup (Wednesday)

### Task 1: Verify Database Access (15 minutes)

```bash
# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier flowcomply-production \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "RDS Endpoint: ${RDS_ENDPOINT}"

# Get database password from Secrets Manager
DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id flowcomply/production/database \
  --query 'SecretString' --output text | jq -r '.password')

# Test connection (requires PostgreSQL client)
PGPASSWORD=$DB_PASSWORD psql \
  -h $RDS_ENDPOINT \
  -U flowcomply_admin \
  -d flowcomply_production \
  -c "SELECT version();"

# Expected: PostgreSQL version info ✅
```

### Task 2: Run Database Migrations (30 minutes)

```bash
cd backend

# Set DATABASE_URL
export DATABASE_URL="postgresql://flowcomply_admin:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/flowcomply_production"

# Check migration status
npx prisma migrate status

# Expected: Shows pending migrations

# Run migrations using script
cd ../scripts/deployment
./run-migrations.sh

# Or manually:
cd ../../backend
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Verify migrations
npx prisma migrate status

# Expected: "Database schema is up to date" ✅
```

### Task 3: Seed Initial Data (Optional - 15 minutes)

```bash
cd backend

# If you have a seed script
npx prisma db seed

# Or manually create admin user
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@flowcomply.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'SYSTEM_ADMIN',
      emailVerified: true,
    },
  });

  console.log('Admin user created:', admin.email);
}

createAdmin().finally(() => prisma.\$disconnect());
"

# Save admin credentials securely!
```

---

## Day 4: Deploy Backend (Thursday)

### Task 1: Update ECS Task Definition (20 minutes)

```bash
# Update task definition with correct values
cd infrastructure/ecs-tasks

# Replace placeholders in backend-task-definition.json
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Use sed or text editor to replace:
# - ACCOUNT_ID with your AWS account ID
# - Update secret ARNs
# - Verify environment variables

# Or use this script:
cat backend-task-definition.json | \
  sed "s/ACCOUNT_ID/${ACCOUNT_ID}/g" > backend-task-def-updated.json
```

### Task 2: Register Task Definition (10 minutes)

```bash
# Register backend task definition
aws ecs register-task-definition \
  --cli-input-json file://backend-task-def-updated.json \
  --region ap-southeast-2

# Get task definition ARN
BACKEND_TASK_DEF=$(aws ecs describe-task-definition \
  --task-definition flowcomply-backend \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)

echo "Backend task definition: ${BACKEND_TASK_DEF}"
```

### Task 3: Create/Update ECS Service (30 minutes)

```bash
# Create ECS service for backend
aws ecs create-service \
  --cluster flowcomply-production \
  --service-name backend-service \
  --task-definition flowcomply-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[subnet-xxx,subnet-yyy],
    securityGroups=[sg-xxx],
    assignPublicIp=DISABLED
  }" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=3001" \
  --health-check-grace-period-seconds 60 \
  --region ap-southeast-2

# Wait for service to stabilize (5-10 minutes)
aws ecs wait services-stable \
  --cluster flowcomply-production \
  --services backend-service \
  --region ap-southeast-2

# Check service status
aws ecs describe-services \
  --cluster flowcomply-production \
  --services backend-service \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}' \
  --output table
```

### Task 4: Verify Backend Deployment (15 minutes)

```bash
# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names flowcomply-production-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

echo "ALB DNS: ${ALB_DNS}"

# Test health endpoint
curl http://${ALB_DNS}/api/monitoring/health

# Expected: {"status":"healthy",...} ✅

# Test API
curl http://${ALB_DNS}/api/monitoring/metrics

# Check logs
aws logs tail /ecs/flowcomply-backend --follow
```

---

## Day 5: Deploy Frontend (Friday)

### Task 1: Update Frontend Task Definition (20 minutes)

```bash
cd infrastructure/ecs-tasks

# Update frontend-task-definition.json
# Replace ACCOUNT_ID and verify settings

cat frontend-task-definition.json | \
  sed "s/ACCOUNT_ID/${ACCOUNT_ID}/g" > frontend-task-def-updated.json
```

### Task 2: Register and Deploy (30 minutes)

```bash
# Register frontend task definition
aws ecs register-task-definition \
  --cli-input-json file://frontend-task-def-updated.json \
  --region ap-southeast-2

# Create frontend service
aws ecs create-service \
  --cluster flowcomply-production \
  --service-name frontend-service \
  --task-definition flowcomply-frontend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[subnet-xxx,subnet-yyy],
    securityGroups=[sg-xxx],
    assignPublicIp=DISABLED
  }" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=frontend,containerPort=3000" \
  --health-check-grace-period-seconds 60 \
  --region ap-southeast-2

# Wait for service
aws ecs wait services-stable \
  --cluster flowcomply-production \
  --services frontend-service \
  --region ap-southeast-2
```

### Task 3: Verify Frontend (15 minutes)

```bash
# Test frontend
curl http://${ALB_DNS}

# Expected: HTML response ✅

# Check logs
aws logs tail /ecs/flowcomply-frontend --follow

# Test in browser
# Open: http://${ALB_DNS}
```

---

## Day 6-7: CI/CD & Testing (Weekend)

### Task 1: Configure GitHub Actions (1 hour)

The pipeline is already created in `.github/workflows/production-deploy.yml`.

**Configure GitHub Secrets:**
```bash
# Use GitHub CLI
gh secret set AWS_ACCESS_KEY_ID --body "<your-key>"
gh secret set AWS_SECRET_ACCESS_KEY --body "<your-secret>"
gh secret set DATABASE_URL --body "${DATABASE_URL}"
gh secret set TEST_USER_EMAIL --body "admin@flowcomply.com"
gh secret set TEST_USER_PASSWORD --body "<test-password>"
gh secret set SLACK_WEBHOOK --body "<webhook-url>"
```

### Task 2: Test CI/CD Pipeline (30 minutes)

```bash
# Make a small change to test pipeline
echo "# Test deployment" >> README.md

# Commit and push
git add README.md
git commit -m "Test: Trigger CI/CD pipeline"
git push origin main

# Watch GitHub Actions
# Go to: https://github.com/your-repo/actions

# Expected workflow:
# 1. Run tests ✅
# 2. Security scan ✅
# 3. Build images ✅
# 4. Push to ECR ✅
# 5. Deploy to ECS ✅
# 6. Run smoke tests ✅
```

### Task 3: Comprehensive Testing (2 hours)

#### Smoke Tests
```bash
# Health checks
curl https://api.flowcomply.com/api/monitoring/health
curl https://flowcomply.com

# Authentication
curl -X POST https://api.flowcomply.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@flowcomply.com","password":"<password>"}'

# Save token
TOKEN="<jwt-token>"

# Test API endpoints
curl https://api.flowcomply.com/api/users/me \
  -H "Authorization: Bearer ${TOKEN}"

curl https://api.flowcomply.com/api/analytics/dashboard \
  -H "Authorization: Bearer ${TOKEN}"
```

#### Load Testing (Optional)
```bash
# Install k6
# Mac: brew install k6
# Linux: snap install k6

# Create simple load test
cat > load-test.js <<'EOF'
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const res = http.get('https://api.flowcomply.com/api/monitoring/health');
  check(res, { 'status is 200': (r) => r.status === 200 });
}
EOF

# Run load test
k6 run load-test.js

# Expected: >90% success rate
```

### Task 4: Monitor Deployment (30 minutes)

```bash
# Check CloudWatch metrics
aws cloudwatch get-dashboard \
  --dashboard-name FlowComply-Production

# Check for alarms
aws cloudwatch describe-alarms \
  --state-value ALARM

# Expected: No alarms ✅

# Review logs for errors
aws logs filter-log-events \
  --log-group-name /ecs/flowcomply-backend \
  --filter-pattern "ERROR"

# Check ECS task health
aws ecs describe-services \
  --cluster flowcomply-production \
  --services backend-service frontend-service
```

---

## Week 2 Completion Checklist

### Docker Images ✅
- [ ] Backend Dockerfile optimized
- [ ] Frontend Dockerfile created
- [ ] Local builds successful
- [ ] Images pushed to ECR
- [ ] Multiple tags created (latest, version, commit)

### Database ✅
- [ ] RDS accessible
- [ ] Migrations executed successfully
- [ ] Prisma Client generated
- [ ] Admin user created
- [ ] Database schema verified

### Backend Deployment ✅
- [ ] Task definition registered
- [ ] ECS service created
- [ ] 2 tasks running
- [ ] Health checks passing
- [ ] ALB routing correctly
- [ ] API endpoints responding

### Frontend Deployment ✅
- [ ] Task definition registered
- [ ] ECS service created
- [ ] 2 tasks running
- [ ] Health checks passing
- [ ] Application accessible
- [ ] Assets loading correctly

### CI/CD ✅
- [ ] GitHub secrets configured
- [ ] Pipeline tested
- [ ] Automated deployment working
- [ ] Smoke tests passing
- [ ] Notifications working

### Monitoring ✅
- [ ] CloudWatch logs streaming
- [ ] No critical alarms
- [ ] Health checks green
- [ ] Performance acceptable
- [ ] Error rate < 1%

---

## Troubleshooting

### Issue: ECS Tasks Won't Start

**Symptoms:** Tasks keep failing to start

**Check:**
```bash
# View task failures
aws ecs describe-tasks \
  --cluster flowcomply-production \
  --tasks <task-arn>

# Common causes:
# 1. Cannot pull ECR image (check IAM role)
# 2. Secrets not accessible (check Secrets Manager permissions)
# 3. Health check failing (check application logs)
# 4. Insufficient resources (check CPU/memory)
```

### Issue: Database Connection Fails

**Check:**
```bash
# Security group allows ECS → RDS
aws ec2 describe-security-groups --group-ids sg-xxx

# DATABASE_URL is correct
# RDS is in AVAILABLE state
aws rds describe-db-instances \
  --db-instance-identifier flowcomply-production
```

### Issue: High Response Times

**Check:**
```bash
# ECS auto-scaling configured
# Database connections not exhausted
# Redis is responding
# Check CloudWatch metrics for bottlenecks
```

---

## Cost Tracking

### Week 2 Estimated Costs

| Service | Duration | Cost |
|---------|----------|------|
| RDS | 7 days | ~$8 |
| Redis | 7 days | ~$3.50 |
| ECS (2 backend, 2 frontend) | 7 days | ~$30 |
| ALB | 7 days | ~$5 |
| NAT Gateway | 7 days | ~$8 |
| Data Transfer | Minimal | ~$2 |
| **Total Week 2** | | **~$56.50** |

**Month-to-date:** ~$81.50

---

## Success Criteria

Week 2 complete when:
- ✅ Both backend and frontend deployed
- ✅ All health checks passing
- ✅ API responding correctly
- ✅ Frontend loading without errors
- ✅ Database migrations applied
- ✅ CI/CD pipeline operational
- ✅ No critical alarms
- ✅ Smoke tests passing
- ✅ Documentation updated

---

## Next Steps

**Week 3 (Oct 21-27): Monitoring & Security**
- Set up CloudWatch dashboard
- Configure all alarms
- Enable X-Ray tracing
- Set up Sentry
- Enable AWS WAF
- Conduct security audit
- Load testing
- Disaster recovery test

---

## Resources

**Documentation:**
- [Production Deployment Runbook](docs/runbooks/production-deployment.md)
- [Monitoring Setup](docs/runbooks/monitoring-setup.md)
- [Phase 7 Plan](docs/phases/PHASE7_PLAN.md)

**Scripts:**
- `scripts/deployment/deploy.sh` - Full deployment
- `scripts/deployment/run-migrations.sh` - Database migrations
- `scripts/deployment/setup-aws.sh` - AWS setup

**Task Definitions:**
- `infrastructure/ecs-tasks/backend-task-definition.json`
- `infrastructure/ecs-tasks/frontend-task-definition.json`

---

**Week 2 Status:** 🚀 **READY TO DEPLOY**

**Let's ship it! 🎉**
