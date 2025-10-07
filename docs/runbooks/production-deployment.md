# Production Deployment Runbook

**Last Updated:** October 7, 2025
**Version:** 1.0
**Status:** Active

---

## Overview

This runbook provides step-by-step instructions for deploying FlowComply to production AWS environment.

**Audience:** DevOps Engineers, Site Reliability Engineers
**Prerequisites:** AWS account, AWS CLI, Docker, Node.js 20+

---

## Pre-Deployment Checklist

### 1. Code Readiness
- [ ] All tests passing (`npm test`)
- [ ] Zero TypeScript errors (`npm run build`)
- [ ] Security audit completed
- [ ] Code reviewed and approved
- [ ] Version tagged in Git

### 2. Infrastructure Readiness
- [ ] AWS account configured
- [ ] Terraform state initialized
- [ ] VPC and networking configured
- [ ] RDS PostgreSQL instance running
- [ ] ElastiCache Redis running
- [ ] S3 buckets created
- [ ] ECR repositories created

### 3. Configuration Readiness
- [ ] Environment variables documented
- [ ] Secrets stored in AWS Secrets Manager
- [ ] SSL certificate obtained
- [ ] Domain DNS configured
- [ ] Email service verified (AWS SES)

### 4. Team Readiness
- [ ] Deployment team available
- [ ] On-call engineer identified
- [ ] Stakeholders notified
- [ ] Rollback plan reviewed
- [ ] Communication channels open

---

## Deployment Steps

### Phase 1: Pre-Deployment (T-2 hours)

#### Step 1.1: Verify Staging Environment
```bash
# Check staging health
curl https://staging-api.flowcomply.com/api/monitoring/health

# Run smoke tests
cd frontend
npx playwright test --config=playwright.staging.config.ts
```

**Expected:** All tests pass, health check returns 200 OK

#### Step 1.2: Tag Release
```bash
# Create release tag
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0

# Verify tag
git tag -l
```

#### Step 1.3: Backup Production Database
```bash
# Create manual RDS snapshot
aws rds create-db-snapshot \
  --db-instance-identifier flowcomply-production \
  --db-snapshot-identifier flowcomply-pre-deploy-$(date +%Y%m%d-%H%M%S)

# Wait for snapshot to complete
aws rds wait db-snapshot-available \
  --db-snapshot-identifier flowcomply-pre-deploy-$(date +%Y%m%d-%H%M%S)
```

#### Step 1.4: Review Deployment Plan
- [ ] Review changes since last deployment
- [ ] Check for breaking changes
- [ ] Review database migrations
- [ ] Confirm rollback procedures

---

### Phase 2: Build & Push (T-1 hour)

#### Step 2.1: Build Backend
```bash
cd backend

# Install dependencies
npm ci --production

# Run Prisma generate
npx prisma generate

# Build TypeScript
npm run build

# Verify build
ls -la dist/

# Build Docker image
docker build -t flowcomply-backend:v1.0.0 .

# Tag for ECR
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=ap-southeast-2

docker tag flowcomply-backend:v1.0.0 \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/flowcomply-backend:v1.0.0

docker tag flowcomply-backend:v1.0.0 \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/flowcomply-backend:latest
```

#### Step 2.2: Build Frontend
```bash
cd frontend

# Install dependencies
npm ci --production

# Build Next.js
npm run build

# Verify build
ls -la .next/

# Build Docker image
docker build -t flowcomply-frontend:v1.0.0 .

# Tag for ECR
docker tag flowcomply-frontend:v1.0.0 \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/flowcomply-frontend:v1.0.0

docker tag flowcomply-frontend:v1.0.0 \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/flowcomply-frontend:latest
```

#### Step 2.3: Push to ECR
```bash
# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Push backend
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/flowcomply-backend:v1.0.0
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/flowcomply-backend:latest

# Push frontend
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/flowcomply-frontend:v1.0.0
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/flowcomply-frontend:latest
```

**Expected:** Images pushed successfully to ECR

---

### Phase 3: Database Migration (T-30 minutes)

#### Step 3.1: Connect to Production Database
```bash
# Option 1: Via bastion host
ssh -i ~/.ssh/bastion-key.pem ec2-user@bastion-ip

# Option 2: Via ECS Exec (if configured)
aws ecs execute-command \
  --cluster flowcomply-production \
  --task <TASK_ID> \
  --container backend \
  --interactive \
  --command "/bin/bash"
```

#### Step 3.2: Run Migrations
```bash
cd backend

# Set production database URL
export DATABASE_URL="postgresql://username:password@rds-endpoint:5432/flowcomply"

# Review pending migrations
npx prisma migrate status

# Deploy migrations
npx prisma migrate deploy

# Verify migrations applied
npx prisma migrate status
```

**Expected:** All migrations applied successfully

#### Step 3.3: Verify Database Schema
```bash
# Connect to database
psql $DATABASE_URL

# List tables
\dt

# Verify key tables exist
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Organization";
SELECT COUNT(*) FROM "Asset";

# Exit
\q
```

---

### Phase 4: Deploy Application (T-0, Go-Live)

#### Step 4.1: Update Backend Service
```bash
# Update ECS task definition with new image
aws ecs register-task-definition \
  --cli-input-json file://task-definitions/backend-production.json

# Get latest task definition revision
TASK_DEF_ARN=$(aws ecs describe-task-definition \
  --task-definition flowcomply-backend \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)

# Update service
aws ecs update-service \
  --cluster flowcomply-production \
  --service backend-service \
  --task-definition $TASK_DEF_ARN \
  --force-new-deployment

# Wait for deployment to complete
aws ecs wait services-stable \
  --cluster flowcomply-production \
  --services backend-service
```

#### Step 4.2: Update Frontend Service
```bash
# Update ECS task definition with new image
aws ecs register-task-definition \
  --cli-input-json file://task-definitions/frontend-production.json

# Get latest task definition revision
TASK_DEF_ARN=$(aws ecs describe-task-definition \
  --task-definition flowcomply-frontend \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)

# Update service
aws ecs update-service \
  --cluster flowcomply-production \
  --service frontend-service \
  --task-definition $TASK_DEF_ARN \
  --force-new-deployment

# Wait for deployment to complete
aws ecs wait services-stable \
  --cluster flowcomply-production \
  --services frontend-service
```

#### Step 4.3: Verify Services Running
```bash
# Check backend tasks
aws ecs list-tasks \
  --cluster flowcomply-production \
  --service-name backend-service

# Check frontend tasks
aws ecs list-tasks \
  --cluster flowcomply-production \
  --service-name frontend-service

# Get task details
aws ecs describe-tasks \
  --cluster flowcomply-production \
  --tasks <TASK_ARN>
```

**Expected:** All tasks in RUNNING state, health checks passing

---

### Phase 5: Verification (T+15 minutes)

#### Step 5.1: Health Checks
```bash
# Backend health check
curl https://api.flowcomply.com/api/monitoring/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-10-07T...",
#   "services": {
#     "database": "connected",
#     "redis": "connected",
#     "s3": "connected"
#   }
# }

# Frontend health check
curl https://flowcomply.com

# Expected: 200 OK, HTML page returned
```

#### Step 5.2: Smoke Tests
```bash
# Test authentication
curl -X POST https://api.flowcomply.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@flowcomply.com",
    "password": "secure-password"
  }'

# Save token
TOKEN="<JWT_TOKEN_FROM_RESPONSE>"

# Test API endpoints
curl https://api.flowcomply.com/api/users/me \
  -H "Authorization: Bearer $TOKEN"

curl https://api.flowcomply.com/api/analytics/dashboard \
  -H "Authorization: Bearer $TOKEN"

curl https://api.flowcomply.com/api/assets \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** All endpoints return successful responses

#### Step 5.3: Database Connectivity
```bash
# Check database connections
curl https://api.flowcomply.com/api/monitoring/metrics \
  -H "Authorization: Bearer $TOKEN" | jq '.database'

# Expected: Active connections, no errors
```

#### Step 5.4: Background Jobs
```bash
# Check job queue status
curl https://api.flowcomply.com/api/monitoring/queues \
  -H "Authorization: Bearer $TOKEN"

# Expected: Queues running, no stuck jobs
```

---

### Phase 6: Monitoring (T+1 hour)

#### Step 6.1: Check CloudWatch Metrics
```bash
# Open CloudWatch dashboard
aws cloudwatch get-dashboard \
  --dashboard-name FlowComply-Production

# Check for alarms
aws cloudwatch describe-alarms \
  --state-value ALARM
```

**Expected:** No alarms in ALARM state

#### Step 6.2: Review Logs
```bash
# Backend logs
aws logs tail /ecs/flowcomply-backend --follow

# Frontend logs
aws logs tail /ecs/flowcomply-frontend --follow

# Look for errors or warnings
aws logs filter-log-events \
  --log-group-name /ecs/flowcomply-backend \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '1 hour ago' +%s)000
```

**Expected:** No critical errors, normal application logs

#### Step 6.3: Performance Metrics
- Check ALB response times (target: <200ms p95)
- Check ECS CPU/Memory usage (target: <80%)
- Check RDS connections (target: <50% max)
- Check Redis cache hit rate (target: >70%)

---

## Post-Deployment Tasks

### Immediate (T+4 hours)
- [ ] Monitor error rates
- [ ] Check user feedback
- [ ] Review performance metrics
- [ ] Document any issues
- [ ] Send deployment success notification

### Next Day
- [ ] Review CloudWatch alarms
- [ ] Analyze user traffic patterns
- [ ] Check cost metrics
- [ ] Update deployment log
- [ ] Schedule post-deployment review

### First Week
- [ ] Monitor for anomalies
- [ ] Collect user feedback
- [ ] Review performance trends
- [ ] Plan optimization improvements
- [ ] Update documentation

---

## Rollback Procedures

### When to Rollback
- Critical production errors (5xx > 5%)
- Data corruption detected
- Security vulnerability discovered
- Complete service outage
- Unresolved database migration issues

### Rollback Steps

#### Option 1: Rollback Application (Fast, 5 minutes)
```bash
# Revert to previous task definition
PREVIOUS_TASK_DEF="flowcomply-backend:42"  # Use previous revision

# Update backend service
aws ecs update-service \
  --cluster flowcomply-production \
  --service backend-service \
  --task-definition $PREVIOUS_TASK_DEF

# Update frontend service
aws ecs update-service \
  --cluster flowcomply-production \
  --service frontend-service \
  --task-definition flowcomply-frontend:42  # Previous revision

# Wait for rollback
aws ecs wait services-stable \
  --cluster flowcomply-production \
  --services backend-service frontend-service
```

#### Option 2: Rollback Database (Slow, 30-60 minutes)
```bash
# Stop application
aws ecs update-service \
  --cluster flowcomply-production \
  --service backend-service \
  --desired-count 0

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier flowcomply-production-restored \
  --db-snapshot-identifier flowcomply-pre-deploy-20251007-100000

# Wait for restore (15-30 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier flowcomply-production-restored

# Update DNS or swap database endpoints
# Restart application with old version
```

#### Option 3: Complete Rollback (Nuclear, 1-2 hours)
```bash
# Use Terraform to revert infrastructure
cd infrastructure/terraform
terraform workspace select production
git checkout <PREVIOUS_COMMIT>
terraform apply -var-file="production.tfvars"
```

---

## Troubleshooting

### Issue: Service won't start
**Symptoms:** ECS tasks stuck in PENDING or failing health checks

**Diagnosis:**
```bash
# Check task status
aws ecs describe-tasks --cluster flowcomply-production --tasks <TASK_ARN>

# Check container logs
aws logs tail /ecs/flowcomply-backend --since 10m
```

**Common Causes:**
1. Missing environment variables
2. Database connection failure
3. Redis connection failure
4. Insufficient resources

**Resolution:**
- Verify all environment variables in task definition
- Check security group rules for database/Redis access
- Increase task CPU/memory if needed

---

### Issue: High error rate (5xx errors)
**Symptoms:** CloudWatch alarm, 5xx errors > 5%

**Diagnosis:**
```bash
# Check ALB target health
aws elbv2 describe-target-health \
  --target-group-arn <TG_ARN>

# Check application logs
aws logs filter-log-events \
  --log-group-name /ecs/flowcomply-backend \
  --filter-pattern "500" \
  --start-time $(date -u -d '30 minutes ago' +%s)000
```

**Resolution:**
- Check for database connection pool exhaustion
- Verify Redis connectivity
- Check for unhandled exceptions in code
- Consider rollback if issue persists

---

### Issue: Slow response times
**Symptoms:** API response time > 2s

**Diagnosis:**
```bash
# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=backend-service \
  --start-time $(date -u -d '1 hour ago' --iso-8601=seconds) \
  --end-time $(date -u --iso-8601=seconds) \
  --period 300 \
  --statistics Average
```

**Resolution:**
- Check if auto-scaling triggered
- Verify database query performance
- Check Redis cache hit rate
- Increase task count if needed

---

## Contact Information

### Deployment Team
- **Primary:** DevOps Engineer (phone: +64-XXX-XXXX)
- **Secondary:** Senior Developer (phone: +64-XXX-XXXX)
- **Manager:** Engineering Manager (phone: +64-XXX-XXXX)

### Emergency Contacts
- **AWS Support:** 1-877-234-4788
- **On-Call Engineer:** Use PagerDuty
- **Security Incident:** security@flowcomply.com

---

## Deployment Log Template

```markdown
## Deployment: v1.0.0
**Date:** 2025-10-07
**Time:** 10:00 AM NZDT
**Duration:** 45 minutes
**Status:** Success ✅

### Deployed Components:
- Backend: v1.0.0
- Frontend: v1.0.0
- Database: No migrations

### Issues Encountered:
- None

### Rollback: No

### Post-Deployment:
- Health checks: Passing
- Error rate: 0.1%
- Response time p95: 120ms
- No alarms triggered

### Sign-off:
- Deployed by: [Name]
- Verified by: [Name]
- Approved by: [Name]
```

---

## Appendix

### A. Environment Variables (Backend)
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=<from-secrets-manager>
REDIS_URL=<from-secrets-manager>
JWT_SECRET=<from-secrets-manager>
AWS_REGION=ap-southeast-2
AWS_S3_BUCKET_NAME=flowcomply-documents-production
AWS_SES_FROM_EMAIL=noreply@flowcomply.com
ANTHROPIC_API_KEY=<from-secrets-manager>
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
LOG_LEVEL=info
```

### B. Environment Variables (Frontend)
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.flowcomply.com
NEXT_PUBLIC_APP_NAME=FlowComply
```

### C. Useful AWS Commands
```bash
# List ECS clusters
aws ecs list-clusters

# Describe ECS service
aws ecs describe-services \
  --cluster flowcomply-production \
  --services backend-service

# View recent deployments
aws ecs list-tasks \
  --cluster flowcomply-production \
  --service-name backend-service

# Scale service
aws ecs update-service \
  --cluster flowcomply-production \
  --service backend-service \
  --desired-count 4
```

---

**Document Version:** 1.0
**Last Updated:** October 7, 2025
**Next Review:** November 7, 2025
