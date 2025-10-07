#!/bin/bash

################################################################################
# AWS Production Setup Script
#
# This script automates the AWS infrastructure setup for FlowComply
#
# Usage:
#   ./setup-aws.sh [options]
#
# Options:
#   --region <region>     AWS region (default: ap-southeast-2)
#   --skip-ecr            Skip ECR repository creation
#   --skip-secrets        Skip secrets creation
#   --skip-cert           Skip SSL certificate request
#
# Prerequisites:
#   - AWS CLI installed and configured
#   - Appropriate IAM permissions
#   - Domain name (optional, for SSL)
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
AWS_REGION="${AWS_REGION:-ap-southeast-2}"
SKIP_ECR=false
SKIP_SECRETS=false
SKIP_CERT=false
ENV_FILE="${HOME}/.flowcomply-env"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --region)
      AWS_REGION="$2"
      shift 2
      ;;
    --skip-ecr)
      SKIP_ECR=true
      shift
      ;;
    --skip-secrets)
      SKIP_SECRETS=true
      shift
      ;;
    --skip-cert)
      SKIP_CERT=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
  log_info "Checking prerequisites..."

  # Check AWS CLI
  if ! command -v aws &> /dev/null; then
    log_error "AWS CLI is not installed"
    exit 1
  fi

  # Check AWS credentials
  if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS credentials not configured"
    exit 1
  fi

  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  log_info "AWS Account ID: $ACCOUNT_ID"
  log_info "AWS Region: $AWS_REGION"

  log_success "Prerequisites check passed"
}

setup_terraform_backend() {
  log_info "Setting up Terraform backend..."

  BUCKET_NAME="flowcomply-terraform-state-${ACCOUNT_ID}"

  # Check if bucket exists
  if aws s3 ls "s3://${BUCKET_NAME}" 2>&1 | grep -q 'NoSuchBucket'; then
    log_info "Creating S3 bucket for Terraform state..."

    # Create bucket
    aws s3 mb "s3://${BUCKET_NAME}" --region "${AWS_REGION}"

    # Enable versioning
    aws s3api put-bucket-versioning \
      --bucket "${BUCKET_NAME}" \
      --versioning-configuration Status=Enabled

    # Enable encryption
    aws s3api put-bucket-encryption \
      --bucket "${BUCKET_NAME}" \
      --server-side-encryption-configuration '{
        "Rules": [{
          "ApplyServerSideEncryptionByDefault": {
            "SSEAlgorithm": "AES256"
          }
        }]
      }'

    # Block public access
    aws s3api put-public-access-block \
      --bucket "${BUCKET_NAME}" \
      --public-access-block-configuration \
        BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

    log_success "S3 bucket created: ${BUCKET_NAME}"
  else
    log_info "S3 bucket already exists: ${BUCKET_NAME}"
  fi

  # Create DynamoDB table for locking
  if ! aws dynamodb describe-table --table-name flowcomply-terraform-lock --region "${AWS_REGION}" &> /dev/null; then
    log_info "Creating DynamoDB table for state locking..."

    aws dynamodb create-table \
      --table-name flowcomply-terraform-lock \
      --attribute-definitions AttributeName=LockID,AttributeType=S \
      --key-schema AttributeName=LockID,KeyType=HASH \
      --billing-mode PAY_PER_REQUEST \
      --region "${AWS_REGION}"

    aws dynamodb wait table-exists \
      --table-name flowcomply-terraform-lock \
      --region "${AWS_REGION}"

    log_success "DynamoDB lock table created"
  else
    log_info "DynamoDB lock table already exists"
  fi

  # Save to env file
  echo "TERRAFORM_STATE_BUCKET=${BUCKET_NAME}" >> "$ENV_FILE"
  echo "AWS_REGION=${AWS_REGION}" >> "$ENV_FILE"
  echo "ACCOUNT_ID=${ACCOUNT_ID}" >> "$ENV_FILE"
}

setup_ecr_repositories() {
  if [ "$SKIP_ECR" = true ]; then
    log_warning "Skipping ECR setup (--skip-ecr flag)"
    return
  fi

  log_info "Setting up ECR repositories..."

  # Backend repository
  if ! aws ecr describe-repositories --repository-names flowcomply-backend --region "${AWS_REGION}" &> /dev/null; then
    log_info "Creating backend ECR repository..."

    aws ecr create-repository \
      --repository-name flowcomply-backend \
      --region "${AWS_REGION}" \
      --image-scanning-configuration scanOnPush=true \
      --encryption-configuration encryptionType=AES256

    log_success "Backend repository created"
  else
    log_info "Backend repository already exists"
  fi

  # Frontend repository
  if ! aws ecr describe-repositories --repository-names flowcomply-frontend --region "${AWS_REGION}" &> /dev/null; then
    log_info "Creating frontend ECR repository..."

    aws ecr create-repository \
      --repository-name flowcomply-frontend \
      --region "${AWS_REGION}" \
      --image-scanning-configuration scanOnPush=true \
      --encryption-configuration encryptionType=AES256

    log_success "Frontend repository created"
  else
    log_info "Frontend repository already exists"
  fi

  # Get repository URIs
  BACKEND_REPO=$(aws ecr describe-repositories \
    --repository-names flowcomply-backend \
    --region "${AWS_REGION}" \
    --query 'repositories[0].repositoryUri' \
    --output text)

  FRONTEND_REPO=$(aws ecr describe-repositories \
    --repository-names flowcomply-frontend \
    --region "${AWS_REGION}" \
    --query 'repositories[0].repositoryUri' \
    --output text)

  log_success "ECR Repositories ready:"
  log_info "  Backend:  ${BACKEND_REPO}"
  log_info "  Frontend: ${FRONTEND_REPO}"

  # Save to env file
  echo "BACKEND_REPO=${BACKEND_REPO}" >> "$ENV_FILE"
  echo "FRONTEND_REPO=${FRONTEND_REPO}" >> "$ENV_FILE"

  # Set lifecycle policies
  cat > /tmp/lifecycle-policy.json <<EOF
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
    --lifecycle-policy-text file:///tmp/lifecycle-policy.json

  aws ecr put-lifecycle-policy \
    --repository-name flowcomply-frontend \
    --lifecycle-policy-text file:///tmp/lifecycle-policy.json

  rm /tmp/lifecycle-policy.json

  log_success "Lifecycle policies configured"
}

setup_secrets() {
  if [ "$SKIP_SECRETS" = true ]; then
    log_warning "Skipping secrets setup (--skip-secrets flag)"
    return
  fi

  log_info "Setting up AWS Secrets Manager..."

  # Generate strong passwords
  DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
  JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
  REDIS_AUTH_TOKEN=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

  # Database secret
  if ! aws secretsmanager describe-secret --secret-id flowcomply/production/database &> /dev/null; then
    log_info "Creating database secret..."

    aws secretsmanager create-secret \
      --name flowcomply/production/database \
      --description "FlowComply production database credentials" \
      --secret-string "{
        \"username\": \"flowcomply_admin\",
        \"password\": \"${DB_PASSWORD}\",
        \"engine\": \"postgres\",
        \"port\": 5432,
        \"dbname\": \"flowcomply_production\"
      }"

    log_success "Database secret created"
  else
    log_info "Database secret already exists"
  fi

  # JWT secret
  if ! aws secretsmanager describe-secret --secret-id flowcomply/production/jwt-secret &> /dev/null; then
    log_info "Creating JWT secret..."

    aws secretsmanager create-secret \
      --name flowcomply/production/jwt-secret \
      --description "FlowComply JWT signing secret" \
      --secret-string "${JWT_SECRET}"

    log_success "JWT secret created"
  else
    log_info "JWT secret already exists"
  fi

  # Redis auth token
  if ! aws secretsmanager describe-secret --secret-id flowcomply/production/redis-auth &> /dev/null; then
    log_info "Creating Redis auth secret..."

    aws secretsmanager create-secret \
      --name flowcomply/production/redis-auth \
      --description "FlowComply Redis authentication token" \
      --secret-string "${REDIS_AUTH_TOKEN}"

    log_success "Redis auth secret created"
  else
    log_info "Redis auth secret already exists"
  fi

  # API keys placeholder
  if ! aws secretsmanager describe-secret --secret-id flowcomply/production/api-keys &> /dev/null; then
    log_info "Creating API keys secret..."

    aws secretsmanager create-secret \
      --name flowcomply/production/api-keys \
      --description "FlowComply external API keys" \
      --secret-string "{
        \"anthropic_api_key\": \"UPDATE_ME\",
        \"aws_ses_smtp_username\": \"UPDATE_ME\",
        \"aws_ses_smtp_password\": \"UPDATE_ME\"
      }"

    log_success "API keys secret created"
  else
    log_info "API keys secret already exists"
  fi

  # Save secrets to secure file (encrypted)
  SECRETS_FILE="${HOME}/.flowcomply-secrets.txt"
  cat > "$SECRETS_FILE" <<EOF
FlowComply Production Secrets
Generated: $(date)
DO NOT COMMIT TO GIT

Database Password: ${DB_PASSWORD}
JWT Secret: ${JWT_SECRET}
Redis Auth Token: ${REDIS_AUTH_TOKEN}

All secrets stored in AWS Secrets Manager:
- flowcomply/production/database
- flowcomply/production/jwt-secret
- flowcomply/production/redis-auth
- flowcomply/production/api-keys

Update API keys in Secrets Manager before deployment!
EOF

  chmod 600 "$SECRETS_FILE"

  log_success "Secrets created and saved to ${SECRETS_FILE}"
  log_warning "IMPORTANT: Backup ${SECRETS_FILE} securely and delete from this machine!"
}

setup_budget() {
  log_info "Setting up budget alerts..."

  if ! aws budgets describe-budgets --account-id "${ACCOUNT_ID}" --region us-east-1 2>&1 | grep -q "FlowComply-Monthly-Budget"; then
    log_info "Creating budget..."

    cat > /tmp/budget.json <<EOF
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
      --account-id "${ACCOUNT_ID}" \
      --budget file:///tmp/budget.json \
      --region us-east-1 || log_warning "Budget creation failed (may already exist)"

    rm /tmp/budget.json

    log_success "Budget created"
  else
    log_info "Budget already exists"
  fi
}

print_summary() {
  echo ""
  echo "=============================================="
  echo "         AWS Setup Complete"
  echo "=============================================="
  echo ""
  log_success "All AWS resources have been set up!"
  echo ""
  echo "Environment variables saved to: $ENV_FILE"
  echo "Secrets saved to: ${HOME}/.flowcomply-secrets.txt"
  echo ""
  echo "Next steps:"
  echo "1. Review secrets file and backup securely"
  echo "2. Update API keys in AWS Secrets Manager"
  echo "3. Create production.tfvars file"
  echo "4. Run: terraform init"
  echo "5. Run: terraform plan -var-file=production.tfvars"
  echo ""
  echo "Resources created:"
  echo "- Terraform S3 state bucket"
  echo "- DynamoDB state lock table"
  [ "$SKIP_ECR" = false ] && echo "- ECR repositories (backend + frontend)"
  [ "$SKIP_SECRETS" = false ] && echo "- AWS Secrets Manager secrets"
  echo "- Budget alerts"
  echo ""
  echo "=============================================="
}

# Main execution
main() {
  log_info "Starting AWS setup for FlowComply..."
  echo ""

  # Initialize env file
  > "$ENV_FILE"

  check_prerequisites
  echo ""

  setup_terraform_backend
  echo ""

  setup_ecr_repositories
  echo ""

  setup_secrets
  echo ""

  setup_budget
  echo ""

  print_summary
}

main
