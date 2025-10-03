# Terraform Infrastructure for NZ Water Compliance SaaS

This directory contains Terraform configuration for deploying the complete AWS infrastructure for the NZ Water Utility Compliance Management System.

## Architecture

The infrastructure includes:

- **VPC**: Multi-AZ VPC with public and private subnets
- **RDS PostgreSQL**: Multi-AZ database with automated backups (30-day retention)
- **ElastiCache Redis**: In-memory cache and job queue
- **S3 Buckets**: Document storage, backups, and logs
- **ECS Fargate**: Container orchestration for backend API
- **Application Load Balancer**: HTTPS load balancing with SSL/TLS
- **CloudWatch**: Logging, monitoring, and alerting
- **IAM**: Roles and policies for secure access

## Prerequisites

1. **Terraform**: Install Terraform >= 1.0
   ```bash
   # macOS
   brew install terraform

   # Windows (Chocolatey)
   choco install terraform

   # Verify installation
   terraform version
   ```

2. **AWS CLI**: Configure AWS credentials
   ```bash
   aws configure
   ```

3. **Docker Image**: Build and push backend Docker image to ECR
   ```bash
   # Create ECR repository
   aws ecr create-repository --repository-name compliance-saas-backend --region ap-southeast-2

   # Build and push image
   cd backend
   docker build -t compliance-saas-backend .
   aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.ap-southeast-2.amazonaws.com
   docker tag compliance-saas-backend:latest 123456789012.dkr.ecr.ap-southeast-2.amazonaws.com/compliance-saas-backend:latest
   docker push 123456789012.dkr.ecr.ap-southeast-2.amazonaws.com/compliance-saas-backend:latest
   ```

4. **ACM Certificate**: Create SSL/TLS certificate in AWS Certificate Manager
   ```bash
   # Request certificate for your domain
   aws acm request-certificate \
     --domain-name api.compliance-saas.co.nz \
     --validation-method DNS \
     --region ap-southeast-2
   ```

## Setup

### 1. Configure Variables

Copy the example variables file and customize:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
db_password  = "your-strong-database-password"
jwt_secret   = "your-strong-jwt-secret-key"
backend_image = "123456789012.dkr.ecr.ap-southeast-2.amazonaws.com/compliance-saas-backend:latest"
certificate_arn = "arn:aws:acm:ap-southeast-2:123456789012:certificate/xxx"
frontend_url = "https://app.compliance-saas.co.nz"
alarm_email  = "alerts@your-domain.com"
```

### 2. Initialize Terraform

```bash
terraform init
```

This downloads required providers and initializes the backend.

### 3. Plan Infrastructure

Review the execution plan:

```bash
terraform plan
```

Verify all resources and configurations before proceeding.

### 4. Apply Configuration

Deploy the infrastructure:

```bash
terraform apply
```

Type `yes` when prompted.

This will take approximately 15-20 minutes to provision all resources.

### 5. Get Outputs

Retrieve important endpoints and values:

```bash
terraform output
```

Key outputs:
- `alb_dns_name`: Load balancer endpoint
- `database_endpoint`: PostgreSQL connection string
- `redis_endpoint`: Redis cluster endpoint
- `documents_bucket_name`: S3 bucket for files

## Post-Deployment Configuration

### 1. Update DNS

Point your domain to the ALB DNS name:

```bash
# Get ALB DNS
terraform output alb_dns_name
```

Create a CNAME record:
```
api.compliance-saas.co.nz -> compliance-saas-alb-123456789.ap-southeast-2.elb.amazonaws.com
```

### 2. Verify Application

Check the health endpoint:

```bash
curl https://api.compliance-saas.co.nz/health
```

### 3. Configure Database

Run Prisma migrations:

```bash
# From backend directory
DATABASE_URL="postgresql://dbadmin:password@rds-endpoint:5432/compliance_saas" npx prisma migrate deploy
```

### 4. Set up Monitoring

Configure CloudWatch alarms:
- Database CPU > 80%
- Application error rate > 5%
- API latency > 2 seconds

Alerts will be sent to `alarm_email` configured in variables.

## Environment-Specific Deployments

### Development Environment

```bash
terraform workspace new dev
terraform workspace select dev
terraform apply -var="environment=dev" -var="db_instance_class=db.t3.micro"
```

### Staging Environment

```bash
terraform workspace new staging
terraform workspace select staging
terraform apply -var="environment=staging"
```

### Production Environment

```bash
terraform workspace new production
terraform workspace select production
terraform apply -var="environment=production" -var="multi_az=true"
```

## Updating Infrastructure

### Update Backend Image

```bash
# Build new image
cd backend
docker build -t compliance-saas-backend:v1.1.0 .
docker tag compliance-saas-backend:v1.1.0 123456789012.dkr.ecr.ap-southeast-2.amazonaws.com/compliance-saas-backend:v1.1.0
docker push 123456789012.dkr.ecr.ap-southeast-2.amazonaws.com/compliance-saas-backend:v1.1.0

# Update Terraform
cd ../infrastructure/terraform
terraform apply -var="backend_image=123456789012.dkr.ecr.ap-southeast-2.amazonaws.com/compliance-saas-backend:v1.1.0"
```

### Scale Application

```bash
terraform apply -var="backend_desired_count=4"
```

## Destroying Infrastructure

⚠️ **WARNING**: This deletes all resources including data!

```bash
# Review what will be destroyed
terraform plan -destroy

# Destroy infrastructure
terraform destroy
```

## Backup and Recovery

### Database Backups

Automated backups are configured with 30-day retention.

Manual backup:
```bash
aws rds create-db-snapshot \
  --db-instance-identifier compliance-saas-prod-db \
  --db-snapshot-identifier manual-backup-$(date +%Y%m%d)
```

Restore from backup:
```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier compliance-saas-restored \
  --db-snapshot-identifier manual-backup-20250101
```

### S3 Backups

S3 buckets have versioning enabled.

Export all documents:
```bash
aws s3 sync s3://compliance-saas-documents-production ./backup/documents/
```

## Cost Estimation

Approximate monthly costs (NZ region, production):

- **RDS PostgreSQL** (db.t3.medium, Multi-AZ): ~$200 NZD
- **ElastiCache Redis** (cache.t3.medium): ~$100 NZD
- **ECS Fargate** (2 tasks, 1GB CPU, 2GB RAM): ~$150 NZD
- **Application Load Balancer**: ~$35 NZD
- **S3 Storage** (100GB): ~$3 NZD
- **Data Transfer**: ~$20 NZD
- **CloudWatch Logs**: ~$10 NZD

**Total**: ~$518 NZD/month

Development environment (single-AZ, smaller instances): ~$200 NZD/month

## Security Best Practices

### Required Actions

- [ ] Enable MFA on AWS root account
- [ ] Use IAM roles, not access keys, for applications
- [ ] Rotate database password quarterly
- [ ] Enable AWS CloudTrail for audit logging
- [ ] Configure VPC Flow Logs
- [ ] Enable GuardDuty for threat detection
- [ ] Set up AWS Config for compliance monitoring
- [ ] Use AWS Secrets Manager for sensitive values
- [ ] Enable S3 bucket encryption (already configured)
- [ ] Review security groups regularly

### Compliance Requirements

For NZ water utility compliance:
- Database backups: 30 days (configured)
- Log retention: 7 years / 2555 days (configured)
- Multi-AZ deployment for high availability (production)
- Encryption at rest and in transit (configured)

## Troubleshooting

### Terraform State Locked

```bash
# Force unlock (use carefully!)
terraform force-unlock <LOCK_ID>
```

### ECS Tasks Failing

Check CloudWatch logs:
```bash
aws logs tail /ecs/compliance-saas-backend --follow
```

### Database Connection Issues

Verify security groups allow traffic from ECS tasks to RDS.

Check RDS security group inbound rules.

### High Costs

Review AWS Cost Explorer for unexpected charges.

Consider:
- Reducing RDS instance size
- Decreasing ECS task count
- Enabling S3 Lifecycle policies

## Support

For infrastructure issues:
- AWS Support: https://console.aws.amazon.com/support
- Terraform Docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs

For application issues:
- See backend/README.md
- Contact: devops@compliance-saas.co.nz
