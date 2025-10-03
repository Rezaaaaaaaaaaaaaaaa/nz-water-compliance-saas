# Production Deployment Guide

Complete guide for deploying the NZ Water Compliance SaaS to production.

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] AWS Account with billing enabled
- [ ] Domain name registered (e.g., `compliance-saas.nz`)
- [ ] GitHub repository access
- [ ] Production environment variables prepared
- [ ] SSL certificate (or use AWS Certificate Manager)
- [ ] Monitoring tools account (Sentry, etc.)

---

## 🏗️ Architecture Overview

### Production Stack
- **Backend API:** AWS ECS/Fargate or EC2
- **Frontend:** Vercel (recommended) or AWS Amplify
- **Database:** AWS RDS PostgreSQL 15
- **Cache:** AWS ElastiCache Redis 7
- **Storage:** AWS S3
- **Email:** AWS SES
- **Queue:** Redis + BullMQ
- **Monitoring:** CloudWatch + Sentry

### Estimated Monthly Costs
- **Small deployment** (<100 users): $150-200/month
- **Medium deployment** (<1000 users): $400-600/month
- **Large deployment** (>1000 users): $1000+/month

---

## 🚀 Deployment Option 1: AWS (Recommended)

### Step 1: Set Up AWS Infrastructure

#### 1.1 Create RDS PostgreSQL Database

```bash
# Using AWS CLI
aws rds create-db-instance \
  --db-instance-identifier compliance-saas-prod \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password 'YOUR_SECURE_PASSWORD' \
  --allocated-storage 50 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name your-subnet-group \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "Mon:04:00-Mon:05:00" \
  --enable-cloudwatch-logs-exports '["postgresql"]' \
  --storage-encrypted \
  --multi-az \
  --publicly-accessible false
```

**Via AWS Console:**
1. Navigate to RDS → Create database
2. Choose PostgreSQL 15.4
3. Template: Production
4. DB instance class: db.t3.medium (2 vCPU, 4GB RAM)
5. Storage: 50GB gp3 with autoscaling
6. Enable Multi-AZ for high availability
7. Set backup retention: 7 days
8. Enable encryption at rest

**Save these values:**
```env
DB_HOST=compliance-saas-prod.xxxxx.ap-southeast-2.rds.amazonaws.com
DB_PORT=5432
DB_NAME=compliance_saas
DB_USER=postgres
DB_PASSWORD=your_secure_password
```

#### 1.2 Create ElastiCache Redis Cluster

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id compliance-saas-redis \
  --cache-node-type cache.t3.medium \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxxxxxxxx \
  --cache-subnet-group-name your-subnet-group
```

**Via AWS Console:**
1. Navigate to ElastiCache → Redis → Create cluster
2. Cluster mode: Disabled (for simplicity)
3. Node type: cache.t3.medium
4. Number of replicas: 1 (for high availability)
5. Enable Multi-AZ
6. Enable encryption in-transit and at-rest

**Save these values:**
```env
REDIS_HOST=compliance-saas-redis.xxxxx.cache.amazonaws.com
REDIS_PORT=6379
```

#### 1.3 Create S3 Bucket for Documents

```bash
aws s3 mb s3://compliance-saas-documents-prod --region ap-southeast-2

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket compliance-saas-documents-prod \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket compliance-saas-documents-prod \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Set lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
  --bucket compliance-saas-documents-prod \
  --lifecycle-configuration file://s3-lifecycle.json
```

**s3-lifecycle.json:**
```json
{
  "Rules": [
    {
      "Id": "DeleteOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 90
      }
    }
  ]
}
```

**Save these values:**
```env
AWS_S3_BUCKET=compliance-saas-documents-prod
AWS_REGION=ap-southeast-2
```

#### 1.4 Configure AWS SES for Email

```bash
# Verify domain
aws ses verify-domain-identity --domain compliance-saas.nz

# Request production access (via AWS Console)
# SES Console → Account dashboard → Request production access
```

**Add DNS records for domain verification and DKIM:**
```
Type: TXT
Name: _amazonses.compliance-saas.nz
Value: [verification token from SES]

Type: CNAME
Name: xxx._domainkey.compliance-saas.nz
Value: xxx.dkim.amazonses.com
```

**Save these values:**
```env
EMAIL_PROVIDER=ses
FROM_EMAIL=noreply@compliance-saas.nz
FROM_NAME=NZ Water Compliance
AWS_SES_REGION=ap-southeast-2
```

#### 1.5 Create IAM User for Application

```bash
# Create IAM user
aws iam create-user --user-name compliance-saas-prod

# Attach policies
aws iam attach-user-policy \
  --user-name compliance-saas-prod \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-user-policy \
  --user-name compliance-saas-prod \
  --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess

# Create access keys
aws iam create-access-key --user-name compliance-saas-prod
```

**Save these values:**
```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

---

### Step 2: Deploy Backend API

#### Option A: AWS ECS/Fargate (Recommended)

**2.1 Create ECR Repository**

```bash
# Create repository
aws ecr create-repository --repository-name compliance-saas/backend

# Get login command
aws ecr get-login-password --region ap-southeast-2 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.ap-southeast-2.amazonaws.com
```

**2.2 Build and Push Docker Image**

```bash
cd backend

# Build image
docker build -t compliance-saas-backend .

# Tag image
docker tag compliance-saas-backend:latest \
  123456789012.dkr.ecr.ap-southeast-2.amazonaws.com/compliance-saas/backend:latest

# Push image
docker push 123456789012.dkr.ecr.ap-southeast-2.amazonaws.com/compliance-saas/backend:latest
```

**2.3 Create Dockerfile (if not exists)**

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install production dependencies only
RUN npm ci --production

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/server.js"]
```

**2.4 Create ECS Task Definition**

Save as `ecs-task-definition.json`:

```json
{
  "family": "compliance-saas-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/compliance-saas-task-role",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "123456789012.dkr.ecr.ap-southeast-2.amazonaws.com/compliance-saas/backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "5000"},
        {"name": "FRONTEND_URL", "value": "https://app.compliance-saas.nz"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:ap-southeast-2:123456789012:secret:prod/db-url"},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:ap-southeast-2:123456789012:secret:prod/jwt-secret"},
        {"name": "AWS_ACCESS_KEY_ID", "valueFrom": "arn:aws:secretsmanager:ap-southeast-2:123456789012:secret:prod/aws-access-key"},
        {"name": "AWS_SECRET_ACCESS_KEY", "valueFrom": "arn:aws:secretsmanager:ap-southeast-2:123456789012:secret:prod/aws-secret-key"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/compliance-saas-backend",
          "awslogs-region": "ap-southeast-2",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:5000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

**2.5 Store Secrets in AWS Secrets Manager**

```bash
# Database URL
aws secretsmanager create-secret \
  --name prod/db-url \
  --secret-string "postgresql://postgres:password@compliance-saas-prod.xxxxx.rds.amazonaws.com:5432/compliance_saas"

# JWT Secret
aws secretsmanager create-secret \
  --name prod/jwt-secret \
  --secret-string "$(openssl rand -base64 64)"

# AWS Credentials
aws secretsmanager create-secret \
  --name prod/aws-access-key \
  --secret-string "AKIAIOSFODNN7EXAMPLE"

aws secretsmanager create-secret \
  --name prod/aws-secret-key \
  --secret-string "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
```

**2.6 Create ECS Service**

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name compliance-saas-prod

# Register task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# Create Application Load Balancer (via console or CLI)
# Then create ECS service

aws ecs create-service \
  --cluster compliance-saas-prod \
  --service-name backend \
  --task-definition compliance-saas-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:ap-southeast-2:123456789012:targetgroup/backend/xxx,containerName=backend,containerPort=5000"
```

#### Option B: AWS EC2 (Alternative)

**2.1 Launch EC2 Instance**

```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=compliance-saas-backend}]' \
  --user-data file://ec2-user-data.sh
```

**ec2-user-data.sh:**
```bash
#!/bin/bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PostgreSQL client
apt-get install -y postgresql-client

# Install PM2
npm install -g pm2

# Clone repository
cd /opt
git clone https://github.com/Rezaaaaaaaaaaaaaaaa/nz-water-compliance-saas.git
cd nz-water-compliance-saas/backend

# Install dependencies
npm ci

# Create .env file
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:password@rds-endpoint:5432/compliance_saas
REDIS_HOST=redis-endpoint
REDIS_PORT=6379
JWT_SECRET=your-jwt-secret
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=ap-southeast-2
AWS_S3_BUCKET=compliance-saas-documents-prod
EMAIL_PROVIDER=ses
FROM_EMAIL=noreply@compliance-saas.nz
EOF

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build TypeScript
npm run build

# Start with PM2
pm2 start dist/server.js --name compliance-saas-backend
pm2 startup
pm2 save
```

---

### Step 3: Run Database Migrations

```bash
# SSH into EC2 or run via ECS exec
cd /app/backend

# Run migrations
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

---

### Step 4: Deploy Frontend

#### Option A: Vercel (Recommended - Easiest)

**4.1 Install Vercel CLI**

```bash
npm install -g vercel
```

**4.2 Deploy to Vercel**

```bash
cd frontend

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://api.compliance-saas.nz
```

**4.3 Configure Custom Domain**

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add domain: `app.compliance-saas.nz`
3. Add DNS records as shown by Vercel

**DNS Records:**
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

#### Option B: AWS Amplify

**4.1 Connect GitHub Repository**

1. AWS Console → Amplify → New app → Host web app
2. Connect GitHub repository
3. Select `main` branch
4. Build settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/.next
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

**4.2 Set Environment Variables**

In Amplify Console → Environment variables:
```
NEXT_PUBLIC_API_URL=https://api.compliance-saas.nz
```

---

### Step 5: Configure Domain & SSL

#### 5.1 Set Up Route 53 (if using AWS)

```bash
# Create hosted zone
aws route53 create-hosted-zone --name compliance-saas.nz --caller-reference $(date +%s)

# Create A record for API
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch file://route53-api-record.json
```

**route53-api-record.json:**
```json
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "api.compliance-saas.nz",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z1234567890ABC",
        "DNSName": "compliance-saas-alb-123456789.ap-southeast-2.elb.amazonaws.com",
        "EvaluateTargetHealth": true
      }
    }
  }]
}
```

#### 5.2 Request SSL Certificate (AWS Certificate Manager)

```bash
# Request certificate
aws acm request-certificate \
  --domain-name compliance-saas.nz \
  --subject-alternative-names '*.compliance-saas.nz' \
  --validation-method DNS
```

1. Add DNS validation records as provided by ACM
2. Wait for certificate validation (can take 5-30 minutes)
3. Attach certificate to Load Balancer

---

### Step 6: Set Up Monitoring

#### 6.1 CloudWatch Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name backend-high-cpu \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --period 300 \
  --statistic Average \
  --threshold 80 \
  --alarm-actions arn:aws:sns:ap-southeast-2:123456789012:compliance-alerts

# High memory alarm
aws cloudwatch put-metric-alarm \
  --alarm-name backend-high-memory \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --period 300 \
  --statistic Average \
  --threshold 80 \
  --alarm-actions arn:aws:sns:ap-southeast-2:123456789012:compliance-alerts
```

#### 6.2 Set Up Sentry for Error Tracking

```bash
cd backend
npm install @sentry/node
```

**backend/src/config/sentry.ts:**
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

export default Sentry;
```

**Get Sentry DSN:**
1. Sign up at sentry.io
2. Create new project
3. Copy DSN
4. Add to environment variables

---

### Step 7: Database Backup Strategy

#### 7.1 Automated RDS Backups

Already configured with:
- Daily automated backups (7-day retention)
- Backup window: 03:00-04:00 UTC
- Multi-AZ for high availability

#### 7.2 Manual Backup Script

```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="compliance_saas_backup_${DATE}.sql"

# Dump database
pg_dump postgresql://postgres:password@rds-endpoint:5432/compliance_saas > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp ${BACKUP_FILE}.gz s3://compliance-saas-backups/database/

# Delete local file
rm ${BACKUP_FILE}.gz

echo "Backup completed: ${BACKUP_FILE}.gz"
```

**Schedule with cron:**
```bash
# Run daily at 2 AM
0 2 * * * /opt/scripts/backup-db.sh
```

---

### Step 8: Production Smoke Tests

```bash
# Health check
curl https://api.compliance-saas.nz/health

# Expected: {"status":"ok","timestamp":"..."}

# Test authentication
curl -X POST https://api.compliance-saas.nz/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User",
    "organizationName": "Test Org"
  }'

# Test login
curl -X POST https://api.compliance-saas.nz/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Test frontend
curl -I https://app.compliance-saas.nz
# Expected: HTTP/2 200
```

---

## 📊 Post-Deployment Checklist

- [ ] All health checks passing
- [ ] SSL certificates active
- [ ] DNS propagated (check with `dig api.compliance-saas.nz`)
- [ ] CloudWatch alarms configured
- [ ] Sentry error tracking active
- [ ] Backup strategy implemented
- [ ] Load testing completed
- [ ] Security scan completed (AWS Inspector)
- [ ] Documentation updated
- [ ] Team trained on monitoring

---

## 🔄 Continuous Deployment (CI/CD)

### GitHub Actions Workflow (Already Created)

Your repository already has `.github/workflows/deploy.yml`. Update it with production secrets:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-southeast-2

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: compliance-saas/backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd backend
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster compliance-saas-prod \
            --service backend \
            --force-new-deployment

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
```

**Add secrets to GitHub:**
1. GitHub Repository → Settings → Secrets → New repository secret
2. Add: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, VERCEL_TOKEN, etc.

---

## 🆘 Troubleshooting

### Issue: Database connection timeout

**Solution:**
```bash
# Check security group allows traffic from backend
aws ec2 describe-security-groups --group-ids sg-xxx

# Test connection from backend container
docker exec -it <container-id> psql postgresql://postgres:password@rds-endpoint:5432/compliance_saas
```

### Issue: Redis connection failed

**Solution:**
```bash
# Check ElastiCache security group
# Test connection
redis-cli -h redis-endpoint -p 6379 ping
# Expected: PONG
```

### Issue: S3 access denied

**Solution:**
```bash
# Check IAM user has S3 permissions
aws iam list-user-policies --user-name compliance-saas-prod

# Test S3 access
aws s3 ls s3://compliance-saas-documents-prod
```

---

## 📞 Support

For deployment issues:
1. Check CloudWatch Logs: `/ecs/compliance-saas-backend`
2. Check Sentry for application errors
3. Review GitHub Actions workflow logs
4. Contact: admin@compliance-saas.nz

---

## 🎉 You're Live!

Once deployment is complete:

- **API:** https://api.compliance-saas.nz
- **App:** https://app.compliance-saas.nz
- **Admin:** https://app.compliance-saas.nz/dashboard

**Next Steps:**
1. Onboard first customers
2. Monitor performance
3. Gather feedback
4. Plan Phase 3 features

**Congratulations on going to production! 🚀**
