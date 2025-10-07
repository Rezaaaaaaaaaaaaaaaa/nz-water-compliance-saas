# Phase 7 Week 1: Infrastructure Setup - Quick Start Guide

**Week:** October 7-13, 2025
**Status:** 🚀 **READY TO START**
**Duration:** 5-7 days

---

## Overview

Week 1 focuses on setting up the foundational AWS infrastructure required for production deployment.

### Goals
- ✅ AWS account configured
- ✅ Terraform backend ready
- ✅ ECR repositories created
- ✅ Secrets Manager configured
- ✅ Infrastructure deployed via Terraform

---

## Day 1-2: AWS Account & Prerequisites (Monday-Tuesday)

### Tasks

#### 1. AWS Account Setup (1 hour)
```bash
# If you don't have an AWS account, create one
# Then configure AWS CLI:

aws configure
# AWS Access Key ID: <your-key>
# AWS Secret Access Key: <your-secret>
# Default region: ap-southeast-2
# Default output format: json

# Verify
aws sts get-caller-identity
```

**Checklist:**
- [ ] AWS account created/accessible
- [ ] AWS CLI installed
- [ ] AWS credentials configured
- [ ] MFA enabled on root account
- [ ] Billing alerts set up

#### 2. Run Automated Setup Script (20 minutes)
```bash
cd scripts/deployment

# Run the automated setup script
./setup-aws.sh

# This will create:
# - Terraform S3 state bucket
# - DynamoDB lock table
# - ECR repositories
# - AWS Secrets Manager secrets
# - Budget alerts
```

**Expected Output:**
```
✅ Terraform state bucket created
✅ DynamoDB lock table created
✅ ECR repositories created
✅ Secrets created
✅ Budget configured

Environment saved to: ~/.flowcomply-env
Secrets saved to: ~/.flowcomply-secrets.txt
```

#### 3. Manual Steps (Optional - 30 minutes)

**If you prefer manual setup:**
Follow the comprehensive guide:
```bash
# Open the detailed setup guide
cat docs/deployment/AWS_SETUP_GUIDE.md
```

#### 4. Backup Secrets (5 minutes)
```bash
# IMPORTANT: Backup secrets file securely
cp ~/.flowcomply-secrets.txt ~/secure-location/
chmod 600 ~/secure-location/.flowcomply-secrets.txt

# You can delete the original after backing up:
# rm ~/.flowcomply-secrets.txt
```

---

## Day 3: SSL Certificate & Domain (Wednesday)

### Option A: With Custom Domain

#### 1. Request ACM Certificate (10 minutes)
```bash
# Request certificate
aws acm request-certificate \
  --domain-name flowcomply.com \
  --subject-alternative-names "*.flowcomply.com" \
  --validation-method DNS \
  --region ap-southeast-2

# Get validation records
aws acm describe-certificate \
  --certificate-arn <cert-arn> \
  --query 'Certificate.DomainValidationOptions'
```

#### 2. Add DNS Records (30 minutes)
- Copy CNAME records from output
- Add to your DNS provider (Route53, Cloudflare, etc.)
- Wait for validation (5-30 minutes)

#### 3. Verify Certificate (5 minutes)
```bash
aws acm wait certificate-validated \
  --certificate-arn <cert-arn>
```

### Option B: Without Custom Domain (Testing)

```bash
# Skip SSL for initial testing
# You can deploy with HTTP and add HTTPS later
echo "Skipping SSL certificate for now"
```

---

## Day 4: Configure Terraform (Thursday)

### 1. Load Environment Variables
```bash
# Load saved environment
source ~/.flowcomply-env

# Verify
echo $BACKEND_REPO
echo $FRONTEND_REPO
echo $TERRAFORM_STATE_BUCKET
```

### 2. Create Terraform Backend Config
```bash
cd infrastructure/terraform

# Create backend configuration
cat > backend.tf <<EOF
terraform {
  backend "s3" {
    bucket         = "${TERRAFORM_STATE_BUCKET}"
    key            = "production/terraform.tfstate"
    region         = "ap-southeast-2"
    encrypt        = true
    dynamodb_table = "flowcomply-terraform-lock"
  }
}
EOF
```

### 3. Create production.tfvars
```bash
# Get secrets from AWS Secrets Manager
DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id flowcomply/production/database \
  --query 'SecretString' --output text | jq -r '.password')

JWT_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id flowcomply/production/jwt-secret \
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
jwt_secret      = "${JWT_SECRET}"
frontend_url    = "https://flowcomply.com"
certificate_arn = "arn:aws:acm:ap-southeast-2:xxx:certificate/xxx"  # Update if using SSL

# Monitoring
log_retention_days = 90
alarm_email        = "ops@flowcomply.com"
EOF

# Secure the file
chmod 600 production.tfvars

# Add to .gitignore
echo "production.tfvars" >> .gitignore
```

### 4. Initialize Terraform
```bash
# Initialize
terraform init

# Expected output:
# ✅ Backend initialized successfully
# ✅ Provider plugins installed
# ✅ Terraform initialized
```

### 5. Validate Configuration
```bash
# Validate syntax
terraform validate

# Format files
terraform fmt

# Expected: All files validated ✅
```

---

## Day 5: Deploy Infrastructure (Friday)

### 1. Review Terraform Plan
```bash
cd infrastructure/terraform

# Generate plan
terraform plan -var-file=production.tfvars -out=production.plan

# Review carefully:
# - VPC and subnets
# - RDS PostgreSQL instance
# - ElastiCache Redis
# - ECS cluster
# - Application Load Balancer
# - S3 buckets
# - CloudWatch logs
# - IAM roles
```

**Expected Resources (~40+ resources):**
- VPC with public/private subnets
- NAT gateway
- Internet gateway
- Security groups
- RDS instance
- Redis cluster
- ECS cluster (no tasks yet)
- ALB with target groups
- S3 buckets (3)
- CloudWatch log groups
- IAM roles and policies

### 2. Apply Infrastructure (60-90 minutes)
```bash
# Apply the plan
terraform apply production.plan

# This will take 30-60 minutes
# RDS creation takes the longest (15-30 min)
# Grab a coffee ☕
```

**What's happening:**
1. Creating VPC (2 min)
2. Creating subnets and NAT (5 min)
3. Creating RDS database (15-30 min)
4. Creating Redis cluster (10 min)
5. Creating ECS cluster (2 min)
6. Creating ALB (5 min)
7. Creating S3 buckets (1 min)
8. Creating IAM roles (2 min)
9. Creating CloudWatch resources (2 min)

### 3. Save Outputs
```bash
# Get outputs
terraform output

# Save important values
terraform output -raw database_endpoint > ~/rds-endpoint.txt
terraform output -raw redis_endpoint > ~/redis-endpoint.txt
terraform output -raw alb_dns_name > ~/alb-dns.txt

echo "Infrastructure deployment complete!"
```

### 4. Verify Infrastructure
```bash
# Check RDS
aws rds describe-db-instances \
  --db-instance-identifier flowcomply-production \
  --query 'DBInstances[0].DBInstanceStatus'
# Expected: "available"

# Check Redis
aws elasticache describe-cache-clusters \
  --cache-cluster-id flowcomply-production-redis \
  --query 'CacheClusters[0].CacheClusterStatus'
# Expected: "available"

# Check ECS cluster
aws ecs describe-clusters \
  --clusters flowcomply-production \
  --query 'clusters[0].status'
# Expected: "ACTIVE"

# Check ALB
aws elbv2 describe-load-balancers \
  --names flowcomply-production-alb \
  --query 'LoadBalancers[0].State.Code'
# Expected: "active"
```

---

## Day 6-7: Post-Deployment Setup (Weekend)

### 1. Update Secrets with Endpoints
```bash
# Get RDS endpoint
RDS_ENDPOINT=$(terraform output -raw database_endpoint)

# Update database secret with host
aws secretsmanager update-secret \
  --secret-id flowcomply/production/database \
  --secret-string "{
    \"username\": \"flowcomply_admin\",
    \"password\": \"${DB_PASSWORD}\",
    \"engine\": \"postgres\",
    \"host\": \"${RDS_ENDPOINT}\",
    \"port\": 5432,
    \"dbname\": \"flowcomply_production\"
  }"
```

### 2. Test Database Connection
```bash
# Install PostgreSQL client if needed
# On Mac: brew install postgresql
# On Ubuntu: sudo apt-get install postgresql-client

# Get connection details
DB_HOST=$(echo $RDS_ENDPOINT | cut -d: -f1)
DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id flowcomply/production/database \
  --query 'SecretString' --output text | jq -r '.password')

# Test connection
PGPASSWORD=$DB_PASSWORD psql \
  -h $DB_HOST \
  -U flowcomply_admin \
  -d flowcomply_production \
  -c "SELECT version();"

# Expected: PostgreSQL version information ✅
```

### 3. Configure GitHub Secrets
```bash
# Add to GitHub repository secrets
gh secret set AWS_ACCESS_KEY_ID --body "<your-key>"
gh secret set AWS_SECRET_ACCESS_KEY --body "<your-secret>"
gh secret set AWS_REGION --body "ap-southeast-2"

# Database URL
DATABASE_URL="postgresql://flowcomply_admin:${DB_PASSWORD}@${DB_HOST}:5432/flowcomply_production"
gh secret set DATABASE_URL --body "$DATABASE_URL"
```

### 4. Document Infrastructure
```bash
# Create infrastructure summary
cat > infrastructure-summary.md <<EOF
# FlowComply Production Infrastructure

**Deployed:** $(date)
**Region:** ap-southeast-2

## Resources

### Database
- Endpoint: ${RDS_ENDPOINT}
- Instance: db.t3.small
- Storage: 50GB (max 200GB)
- Backups: 7 days

### Redis
- Endpoint: $(terraform output -raw redis_endpoint)
- Node type: cache.t3.micro

### Load Balancer
- DNS: $(terraform output -raw alb_dns_name)

### S3 Buckets
- Documents: $(terraform output -raw documents_bucket_name)

## Access
- Secrets: AWS Secrets Manager (flowcomply/production/*)
- Terraform state: s3://${TERRAFORM_STATE_BUCKET}

## Costs (Estimated)
- ~$250-300/month
EOF

echo "Infrastructure summary saved to infrastructure-summary.md"
```

---

## Week 1 Completion Checklist

### AWS Setup ✅
- [ ] AWS account configured
- [ ] IAM users created
- [ ] AWS CLI working
- [ ] Billing alerts set up
- [ ] MFA enabled

### Terraform Backend ✅
- [ ] S3 state bucket created
- [ ] DynamoDB lock table created
- [ ] Backend configuration complete
- [ ] Terraform initialized

### ECR ✅
- [ ] Backend repository created
- [ ] Frontend repository created
- [ ] Lifecycle policies configured
- [ ] Repository URIs saved

### Secrets ✅
- [ ] Database password generated
- [ ] JWT secret generated
- [ ] Redis auth token generated
- [ ] All secrets in Secrets Manager
- [ ] Secrets backed up securely

### Infrastructure ✅
- [ ] VPC deployed
- [ ] RDS database running
- [ ] Redis cluster running
- [ ] ECS cluster created
- [ ] ALB configured
- [ ] S3 buckets created
- [ ] IAM roles created
- [ ] CloudWatch logs configured

### Configuration ✅
- [ ] production.tfvars created
- [ ] Terraform plan reviewed
- [ ] Infrastructure applied
- [ ] Outputs saved
- [ ] Database connection tested
- [ ] GitHub secrets configured

---

## Troubleshooting

### Issue: Terraform Apply Fails

**Symptoms:** Error during `terraform apply`

**Common Causes:**
1. Insufficient IAM permissions
2. Resource limits exceeded
3. Invalid configuration
4. Region not enabled

**Solutions:**
```bash
# Check IAM permissions
aws iam get-user-policy --user-name your-user

# Check service quotas
aws service-quotas list-service-quotas \
  --service-code ec2 \
  --query 'Quotas[?QuotaName==`Running On-Demand Standard instances`]'

# Review error logs
terraform apply -var-file=production.tfvars 2>&1 | tee terraform-error.log
```

### Issue: Database Connection Fails

**Solutions:**
```bash
# Check security group
aws rds describe-db-instances \
  --db-instance-identifier flowcomply-production \
  --query 'DBInstances[0].VpcSecurityGroups'

# Verify endpoint
aws rds describe-db-instances \
  --db-instance-identifier flowcomply-production \
  --query 'DBInstances[0].Endpoint'

# Test from bastion or local with VPN
```

### Issue: Terraform State Locked

**Solutions:**
```bash
# View lock
aws dynamodb scan --table-name flowcomply-terraform-lock

# Force unlock (use with caution!)
terraform force-unlock <LOCK_ID>
```

---

## Cost Tracking

### Week 1 Estimated Costs

| Service | Duration | Cost |
|---------|----------|------|
| RDS (db.t3.small) | 7 days | ~$8 |
| Redis (cache.t3.micro) | 7 days | ~$3.50 |
| ALB | 7 days | ~$5 |
| NAT Gateway | 7 days | ~$8 |
| S3 | Minimal | ~$0.50 |
| **Total Week 1** | | **~$25** |

**Monthly projection:** ~$250-300

---

## Next Week (Week 2)

**Focus:** Application Deployment

Tasks:
1. Build Docker images
2. Push to ECR
3. Run database migrations
4. Deploy backend to ECS
5. Deploy frontend to ECS
6. Configure CI/CD pipeline
7. Test deployment

---

## Resources

**Documentation:**
- [AWS Setup Guide](docs/deployment/AWS_SETUP_GUIDE.md)
- [Production Deployment Runbook](docs/runbooks/production-deployment.md)
- [Monitoring Setup](docs/runbooks/monitoring-setup.md)
- [Phase 7 Plan](docs/phases/PHASE7_PLAN.md)

**Scripts:**
- `scripts/deployment/setup-aws.sh` - Automated AWS setup
- `scripts/deployment/deploy.sh` - Application deployment

**Support:**
- Phase 7 Plan: `docs/phases/PHASE7_PLAN.md`
- Phase 7 Kickoff: `PHASE7_KICKOFF.md`

---

## Success Criteria

Week 1 is complete when:
- ✅ All infrastructure deployed via Terraform
- ✅ Database accessible
- ✅ Redis accessible
- ✅ ECS cluster ready
- ✅ ALB configured
- ✅ No Terraform errors
- ✅ Estimated costs within budget
- ✅ All secrets secure
- ✅ Documentation updated

---

**Week 1 Status:** 🚀 **READY TO START**

**Estimated Time:** 2-3 hours hands-on + wait time for AWS resources

**Let's deploy! 🎉**
