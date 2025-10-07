# AWS Production Setup Guide

**Last Updated:** October 7, 2025
**Version:** 1.0
**Estimated Time:** 2-3 hours

---

## Overview

This guide walks through setting up AWS infrastructure for FlowComply production deployment.

**Prerequisites:**
- AWS account with admin access
- AWS CLI installed and configured
- Terraform 1.0+ installed
- Docker installed
- GitHub repository access

---

## Phase 1: AWS Account Setup (30 minutes)

### Step 1: Create/Configure AWS Account

**If creating new account:**
```bash
# 1. Go to https://aws.amazon.com/
# 2. Click "Create an AWS Account"
# 3. Follow signup process
# 4. Enable MFA on root account (REQUIRED)
# 5. Set up billing alerts
```

**If using existing account:**
```bash
# Verify account access
aws sts get-caller-identity

# Expected output:
# {
#   "UserId": "AIDASAMPLEUSERID",
#   "Account": "123456789012",
#   "Arn": "arn:aws:iam::123456789012:user/your-user"
# }
```

### Step 2: Configure IAM Users and Roles

**Create deployment user:**
```bash
# Create IAM user for deployments
aws iam create-user --user-name flowcomply-deploy

# Attach AdministratorAccess policy (temporary, will restrict later)
aws iam attach-user-policy \
  --user-name flowcomply-deploy \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# Create access keys
aws iam create-access-key --user-name flowcomply-deploy

# Save the output - you'll need this for GitHub Secrets!
# AccessKeyId: AKIA...
# SecretAccessKey: wJalr...
```

**Configure AWS CLI:**
```bash
# Configure default profile
aws configure

# Input:
# AWS Access Key ID: <your-access-key>
# AWS Secret Access Key: <your-secret-key>
# Default region name: ap-southeast-2
# Default output format: json

# Verify configuration
aws sts get-caller-identity
```

### Step 3: Enable Required AWS Services

**Enable services in ap-southeast-2 region:**
```bash
# ECS
aws ecs list-clusters --region ap-southeast-2

# RDS
aws rds describe-db-instances --region ap-southeast-2

# ElastiCache
aws elasticache describe-cache-clusters --region ap-southeast-2

# All should return empty lists or succeed
```

### Step 4: Set Up Billing Alerts

**Create budget:**
```bash
# Create budget alert at $500/month
cat > budget.json <<EOF
{
  "BudgetName": "FlowComply-Monthly-Budget",
  "BudgetLimit": {
    "Amount": "500",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST",
  "CostFilters": {},
  "TimePeriod": {
    "Start": "$(date +%Y-%m-01)",
    "End": "2087-06-15"
  }
}
EOF

aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget file://budget.json

# Create notification
cat > notifications.json <<EOF
{
  "NotificationType": "ACTUAL",
  "ComparisonOperator": "GREATER_THAN",
  "Threshold": 80,
  "ThresholdType": "PERCENTAGE",
  "NotificationState": "ALARM"
}
EOF

aws budgets create-notification \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget-name FlowComply-Monthly-Budget \
  --notification file://notifications.json \
  --subscribers Type=EMAIL,Address=your-email@example.com
```

---

## Phase 2: Terraform Backend Setup (20 minutes)

### Step 1: Create S3 Bucket for Terraform State

```bash
# Set variables
AWS_REGION=ap-southeast-2
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET_NAME="flowcomply-terraform-state-${ACCOUNT_ID}"

# Create bucket
aws s3 mb s3://${BUCKET_NAME} --region ${AWS_REGION}

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket ${BUCKET_NAME} \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket ${BUCKET_NAME} \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket ${BUCKET_NAME} \
  --public-access-block-configuration \
    BlockPublicAcls=true,\
IgnorePublicAcls=true,\
BlockPublicPolicy=true,\
RestrictPublicBuckets=true

echo "✅ Terraform state bucket created: ${BUCKET_NAME}"
```

### Step 2: Create DynamoDB Table for State Locking

```bash
# Create DynamoDB table
aws dynamodb create-table \
  --table-name flowcomply-terraform-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ${AWS_REGION}

# Wait for table to be active
aws dynamodb wait table-exists \
  --table-name flowcomply-terraform-lock \
  --region ${AWS_REGION}

echo "✅ DynamoDB lock table created"
```

### Step 3: Update Terraform Backend Configuration

```bash
cd infrastructure/terraform

# Create backend.tf
cat > backend.tf <<EOF
terraform {
  backend "s3" {
    bucket         = "${BUCKET_NAME}"
    key            = "production/terraform.tfstate"
    region         = "${AWS_REGION}"
    encrypt        = true
    dynamodb_table = "flowcomply-terraform-lock"
  }
}
EOF

echo "✅ Backend configuration created"
```

---

## Phase 3: ECR Repository Setup (15 minutes)

### Create ECR Repositories

```bash
# Set variables
AWS_REGION=ap-southeast-2

# Create backend repository
aws ecr create-repository \
  --repository-name flowcomply-backend \
  --region ${AWS_REGION} \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256

# Create frontend repository
aws ecr create-repository \
  --repository-name flowcomply-frontend \
  --region ${AWS_REGION} \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256

# Get repository URIs
BACKEND_REPO=$(aws ecr describe-repositories \
  --repository-names flowcomply-backend \
  --region ${AWS_REGION} \
  --query 'repositories[0].repositoryUri' \
  --output text)

FRONTEND_REPO=$(aws ecr describe-repositories \
  --repository-names flowcomply-frontend \
  --region ${AWS_REGION} \
  --query 'repositories[0].repositoryUri' \
  --output text)

echo "✅ ECR Repositories created:"
echo "Backend:  ${BACKEND_REPO}"
echo "Frontend: ${FRONTEND_REPO}"

# Save for later use
echo "BACKEND_REPO=${BACKEND_REPO}" >> ~/.flowcomply-env
echo "FRONTEND_REPO=${FRONTEND_REPO}" >> ~/.flowcomply-env
```

### Set Lifecycle Policies

```bash
# Backend lifecycle policy (keep last 10 images)
cat > lifecycle-policy.json <<EOF
{
  "rules": [{
    "rulePriority": 1,
    "description": "Keep last 10 images",
    "selection": {
      "tagStatus": "any",
      "countType": "imageCountMoreThan",
      "countNumber": 10
    },
    "action": {
      "type": "expire"
    }
  }]
}
EOF

aws ecr put-lifecycle-policy \
  --repository-name flowcomply-backend \
  --lifecycle-policy-text file://lifecycle-policy.json

aws ecr put-lifecycle-policy \
  --repository-name flowcomply-frontend \
  --lifecycle-policy-text file://lifecycle-policy.json

echo "✅ Lifecycle policies configured"
```

---

## Phase 4: AWS Secrets Manager Setup (15 minutes)

### Create Secrets

```bash
# Generate strong passwords
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
REDIS_AUTH_TOKEN=$(openssl rand -base64 32)

# Create database secret
aws secretsmanager create-secret \
  --name flowcomply/production/database \
  --description "FlowComply production database credentials" \
  --secret-string "{
    \"username\": \"flowcomply_admin\",
    \"password\": \"${DB_PASSWORD}\",
    \"engine\": \"postgres\",
    \"host\": \"to-be-updated-after-rds-creation\",
    \"port\": 5432,
    \"dbname\": \"flowcomply_production\"
  }"

# Create JWT secret
aws secretsmanager create-secret \
  --name flowcomply/production/jwt-secret \
  --description "FlowComply JWT signing secret" \
  --secret-string "${JWT_SECRET}"

# Create Redis auth token
aws secretsmanager create-secret \
  --name flowcomply/production/redis-auth \
  --description "FlowComply Redis authentication token" \
  --secret-string "${REDIS_AUTH_TOKEN}"

# Create API keys placeholder
aws secretsmanager create-secret \
  --name flowcomply/production/api-keys \
  --description "FlowComply external API keys" \
  --secret-string "{
    \"anthropic_api_key\": \"UPDATE_ME\",
    \"aws_ses_smtp_username\": \"UPDATE_ME\",
    \"aws_ses_smtp_password\": \"UPDATE_ME\"
  }"

echo "✅ Secrets created in AWS Secrets Manager"
echo "⚠️  IMPORTANT: Save these values locally (encrypted)!"
echo "Database Password: ${DB_PASSWORD}"
echo "JWT Secret: ${JWT_SECRET}"
echo "Redis Token: ${REDIS_AUTH_TOKEN}"
```

---

## Phase 5: SSL Certificate Setup (20 minutes)

### Option A: Request ACM Certificate

**If you have a domain:**
```bash
# Request certificate
CERT_ARN=$(aws acm request-certificate \
  --domain-name flowcomply.com \
  --subject-alternative-names "*.flowcomply.com" \
  --validation-method DNS \
  --region ap-southeast-2 \
  --query 'CertificateArn' \
  --output text)

echo "Certificate ARN: ${CERT_ARN}"
echo "CERT_ARN=${CERT_ARN}" >> ~/.flowcomply-env

# Get DNS validation records
aws acm describe-certificate \
  --certificate-arn ${CERT_ARN} \
  --region ap-southeast-2 \
  --query 'Certificate.DomainValidationOptions[*].[ResourceRecord.Name, ResourceRecord.Value]' \
  --output table

# Add these CNAME records to your DNS provider
# Then wait for validation (5-30 minutes)
aws acm wait certificate-validated \
  --certificate-arn ${CERT_ARN} \
  --region ap-southeast-2

echo "✅ Certificate validated"
```

### Option B: Skip for Now (Use HTTP)

```bash
# For testing, you can deploy without HTTPS initially
echo "CERT_ARN=none" >> ~/.flowcomply-env
echo "⚠️  Deploying without HTTPS - not recommended for production"
```

---

## Phase 6: Create Production tfvars File (10 minutes)

```bash
cd infrastructure/terraform

# Load environment variables
source ~/.flowcomply-env

# Get secrets
DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id flowcomply/production/database \
  --query 'SecretString' --output text | jq -r '.password')

JWT_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id flowcomply/production/jwt-secret \
  --query 'SecretString' --output text)

REDIS_AUTH_TOKEN=$(aws secretsmanager get-secret-value \
  --secret-id flowcomply/production/redis-auth \
  --query 'SecretString' --output text)

# Create production.tfvars
cat > production.tfvars <<EOF
# AWS Configuration
aws_region   = "ap-southeast-2"
environment  = "production"
project_name = "flowcomply"

# VPC Configuration
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]

# Database Configuration
db_name                  = "flowcomply_production"
db_username              = "flowcomply_admin"
db_password              = "${DB_PASSWORD}"
db_instance_class        = "db.t3.small"
db_allocated_storage     = 50
db_max_allocated_storage = 200
backup_retention_period  = 7

# Redis Configuration
redis_node_type       = "cache.t3.micro"
redis_num_cache_nodes = 1

# ECS Configuration
backend_image         = "${BACKEND_REPO}:latest"
backend_cpu           = 1024
backend_memory        = 2048
backend_desired_count = 2

# Application Configuration
jwt_secret    = "${JWT_SECRET}"
frontend_url  = "https://flowcomply.com"
certificate_arn = "${CERT_ARN}"

# Monitoring Configuration
log_retention_days = 90
alarm_email        = "ops@flowcomply.com"
EOF

echo "✅ production.tfvars created"
echo "⚠️  IMPORTANT: This file contains secrets! Add to .gitignore"

# Add to .gitignore
echo "production.tfvars" >> .gitignore
```

---

## Phase 7: GitHub Secrets Configuration (10 minutes)

### Add Secrets to GitHub Repository

**Via GitHub UI:**
1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret below:

**Required Secrets:**
```
AWS_ACCESS_KEY_ID=<from IAM user creation>
AWS_SECRET_ACCESS_KEY=<from IAM user creation>
AWS_REGION=ap-southeast-2
DATABASE_URL=postgresql://flowcomply_admin:<password>@<rds-endpoint>:5432/flowcomply_production
TEST_USER_EMAIL=admin@flowcomply.com
TEST_USER_PASSWORD=<create-test-password>
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SNYK_TOKEN=<optional-snyk-token>
```

**Via GitHub CLI:**
```bash
# Install GitHub CLI if needed: https://cli.github.com/

# Authenticate
gh auth login

# Set secrets
gh secret set AWS_ACCESS_KEY_ID --body "<your-key>"
gh secret set AWS_SECRET_ACCESS_KEY --body "<your-secret>"
gh secret set AWS_REGION --body "ap-southeast-2"
gh secret set SLACK_WEBHOOK --body "<your-webhook-url>"

echo "✅ GitHub secrets configured"
```

---

## Phase 8: Pre-Deployment Validation (15 minutes)

### Checklist

**AWS Account:**
- [ ] AWS account created and accessible
- [ ] IAM user created with access keys
- [ ] AWS CLI configured and working
- [ ] Billing alerts configured
- [ ] MFA enabled on root account

**Terraform:**
- [ ] S3 bucket created for state
- [ ] DynamoDB table created for locking
- [ ] backend.tf configured
- [ ] production.tfvars created
- [ ] Secrets excluded from git

**ECR:**
- [ ] Backend repository created
- [ ] Frontend repository created
- [ ] Lifecycle policies configured
- [ ] Repository URIs saved

**Secrets:**
- [ ] Database password generated
- [ ] JWT secret generated
- [ ] Redis auth token generated
- [ ] All secrets stored in AWS Secrets Manager
- [ ] Secrets backed up securely offline

**SSL:**
- [ ] ACM certificate requested (or skipped)
- [ ] DNS validation completed (or skipped)
- [ ] Certificate ARN saved

**GitHub:**
- [ ] All required secrets added
- [ ] Deployment workflows reviewed
- [ ] Repository access confirmed

### Validation Tests

```bash
# Test AWS access
echo "Testing AWS access..."
aws sts get-caller-identity && echo "✅ AWS access OK" || echo "❌ AWS access FAILED"

# Test S3 state bucket
echo "Testing Terraform state bucket..."
aws s3 ls s3://flowcomply-terraform-state-* && echo "✅ S3 bucket OK" || echo "❌ S3 bucket FAILED"

# Test ECR repositories
echo "Testing ECR repositories..."
aws ecr describe-repositories --repository-names flowcomply-backend flowcomply-frontend && echo "✅ ECR OK" || echo "❌ ECR FAILED"

# Test Secrets Manager
echo "Testing Secrets Manager..."
aws secretsmanager list-secrets --filters Key=name,Values=flowcomply && echo "✅ Secrets OK" || echo "❌ Secrets FAILED"

# Terraform validation
echo "Testing Terraform..."
cd infrastructure/terraform
terraform init && echo "✅ Terraform init OK" || echo "❌ Terraform init FAILED"
terraform validate && echo "✅ Terraform validate OK" || echo "❌ Terraform validate FAILED"

echo ""
echo "============================================"
echo "  Pre-Deployment Validation Complete"
echo "============================================"
```

---

## Next Steps

After completing this setup:

1. **Review:** Double-check all secrets are secure
2. **Plan:** Run `terraform plan` to preview infrastructure
3. **Deploy:** Follow deployment runbook to deploy infrastructure
4. **Monitor:** Set up CloudWatch dashboard
5. **Test:** Run smoke tests after deployment

**Documentation:**
- `docs/runbooks/production-deployment.md` - Deployment procedures
- `docs/runbooks/monitoring-setup.md` - Monitoring configuration
- `docs/phases/PHASE7_PLAN.md` - Complete Phase 7 plan

---

## Estimated Costs (Monthly)

After this setup, expected monthly costs:

| Service | Cost |
|---------|------|
| ECS Fargate | $60-90 |
| RDS | $35 |
| ElastiCache | $15 |
| ALB | $20 |
| S3 | $3-10 |
| CloudWatch | $10 |
| Data Transfer | $45 |
| **Total** | **~$200-300/month** |

---

## Troubleshooting

### Issue: Access Denied Errors
```bash
# Check IAM permissions
aws iam get-user

# Verify policy attachments
aws iam list-attached-user-policies --user-name flowcomply-deploy
```

### Issue: Region Not Enabled
```bash
# Some AWS accounts need to explicitly enable regions
# Go to AWS Console → Account → AWS Regions
```

### Issue: Terraform State Lock
```bash
# If state is locked, check DynamoDB
aws dynamodb scan --table-name flowcomply-terraform-lock

# Force unlock (use with caution!)
terraform force-unlock <LOCK_ID>
```

---

## Security Notes

**⚠️ IMPORTANT:**
- Never commit secrets to Git
- Use AWS Secrets Manager for all sensitive data
- Enable MFA on all IAM users
- Rotate access keys every 90 days
- Review IAM policies regularly
- Enable CloudTrail for audit logging

---

**Document Version:** 1.0
**Last Updated:** October 7, 2025
**Next Review:** November 7, 2025
