#!/bin/bash

################################################################################
# FlowComply Production Deployment Script
#
# This script automates the deployment of FlowComply to AWS production
#
# Usage:
#   ./deploy.sh [options]
#
# Options:
#   --backend-only    Deploy only backend service
#   --frontend-only   Deploy only frontend service
#   --skip-tests      Skip running tests
#   --skip-backup     Skip database backup
#   --version <ver>   Deployment version tag (default: latest commit)
#
# Examples:
#   ./deploy.sh                          # Full deployment
#   ./deploy.sh --backend-only           # Backend only
#   ./deploy.sh --version v1.0.0         # Specific version
################################################################################

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AWS_REGION="${AWS_REGION:-ap-southeast-2}"
CLUSTER_NAME="flowcomply-production"
BACKEND_SERVICE="backend-service"
FRONTEND_SERVICE="frontend-service"

# Parse arguments
DEPLOY_BACKEND=true
DEPLOY_FRONTEND=true
RUN_TESTS=true
CREATE_BACKUP=true
VERSION=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --backend-only)
      DEPLOY_FRONTEND=false
      shift
      ;;
    --frontend-only)
      DEPLOY_BACKEND=false
      shift
      ;;
    --skip-tests)
      RUN_TESTS=false
      shift
      ;;
    --skip-backup)
      CREATE_BACKUP=false
      shift
      ;;
    --version)
      VERSION="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Set version if not provided
if [ -z "$VERSION" ]; then
  VERSION=$(git rev-parse --short HEAD)
fi

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

  # Check if AWS CLI is installed
  if ! command -v aws &> /dev/null; then
    log_error "AWS CLI is not installed"
    exit 1
  fi

  # Check if Docker is installed
  if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
  fi

  # Check if jq is installed
  if ! command -v jq &> /dev/null; then
    log_warning "jq is not installed (optional but recommended)"
  fi

  # Check AWS credentials
  if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS credentials not configured"
    exit 1
  fi

  AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  log_info "AWS Account ID: $AWS_ACCOUNT_ID"
  log_info "AWS Region: $AWS_REGION"

  log_success "Prerequisites check passed"
}

run_tests() {
  if [ "$RUN_TESTS" = false ]; then
    log_warning "Skipping tests (--skip-tests flag)"
    return
  fi

  log_info "Running tests..."

  if [ "$DEPLOY_BACKEND" = true ]; then
    log_info "Running backend tests..."
    cd "$PROJECT_ROOT/backend"
    npm test || {
      log_error "Backend tests failed"
      exit 1
    }
  fi

  if [ "$DEPLOY_FRONTEND" = true ]; then
    log_info "Running frontend build test..."
    cd "$PROJECT_ROOT/frontend"
    npm run build || {
      log_error "Frontend build failed"
      exit 1
    }
  fi

  log_success "All tests passed"
}

create_database_backup() {
  if [ "$CREATE_BACKUP" = false ]; then
    log_warning "Skipping database backup (--skip-backup flag)"
    return
  fi

  log_info "Creating database backup..."

  SNAPSHOT_ID="flowcomply-pre-deploy-$(date +%Y%m%d-%H%M%S)"

  aws rds create-db-snapshot \
    --db-instance-identifier flowcomply-production \
    --db-snapshot-identifier "$SNAPSHOT_ID" \
    --region "$AWS_REGION" || {
    log_error "Failed to create database snapshot"
    exit 1
  }

  log_info "Waiting for snapshot to complete (this may take a few minutes)..."
  aws rds wait db-snapshot-available \
    --db-snapshot-identifier "$SNAPSHOT_ID" \
    --region "$AWS_REGION" || {
    log_error "Snapshot creation failed"
    exit 1
  }

  log_success "Database backup created: $SNAPSHOT_ID"
}

build_and_push_backend() {
  log_info "Building and pushing backend..."

  cd "$PROJECT_ROOT/backend"

  # Build Docker image
  log_info "Building backend Docker image..."
  docker build -t flowcomply-backend:$VERSION . || {
    log_error "Backend Docker build failed"
    exit 1
  }

  # Tag for ECR
  docker tag flowcomply-backend:$VERSION \
    $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/flowcomply-backend:$VERSION

  docker tag flowcomply-backend:$VERSION \
    $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/flowcomply-backend:latest

  # Login to ECR
  log_info "Logging into ECR..."
  aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin \
    $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com || {
    log_error "ECR login failed"
    exit 1
  }

  # Push to ECR
  log_info "Pushing backend image to ECR..."
  docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/flowcomply-backend:$VERSION
  docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/flowcomply-backend:latest

  log_success "Backend image pushed: $VERSION"
}

build_and_push_frontend() {
  log_info "Building and pushing frontend..."

  cd "$PROJECT_ROOT/frontend"

  # Build Docker image
  log_info "Building frontend Docker image..."
  docker build -t flowcomply-frontend:$VERSION . || {
    log_error "Frontend Docker build failed"
    exit 1
  }

  # Tag for ECR
  docker tag flowcomply-frontend:$VERSION \
    $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/flowcomply-frontend:$VERSION

  docker tag flowcomply-frontend:$VERSION \
    $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/flowcomply-frontend:latest

  # Push to ECR
  log_info "Pushing frontend image to ECR..."
  docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/flowcomply-frontend:$VERSION
  docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/flowcomply-frontend:latest

  log_success "Frontend image pushed: $VERSION"
}

deploy_backend_service() {
  log_info "Deploying backend service..."

  # Force new deployment
  aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $BACKEND_SERVICE \
    --force-new-deployment \
    --region $AWS_REGION > /dev/null || {
    log_error "Failed to update backend service"
    exit 1
  }

  log_info "Waiting for backend deployment to stabilize..."
  aws ecs wait services-stable \
    --cluster $CLUSTER_NAME \
    --services $BACKEND_SERVICE \
    --region $AWS_REGION || {
    log_error "Backend service failed to stabilize"
    exit 1
  }

  log_success "Backend service deployed successfully"
}

deploy_frontend_service() {
  log_info "Deploying frontend service..."

  # Force new deployment
  aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $FRONTEND_SERVICE \
    --force-new-deployment \
    --region $AWS_REGION > /dev/null || {
    log_error "Failed to update frontend service"
    exit 1
  }

  log_info "Waiting for frontend deployment to stabilize..."
  aws ecs wait services-stable \
    --cluster $CLUSTER_NAME \
    --services $FRONTEND_SERVICE \
    --region $AWS_REGION || {
    log_error "Frontend service failed to stabilize"
    exit 1
  }

  log_success "Frontend service deployed successfully"
}

verify_deployment() {
  log_info "Verifying deployment..."

  # Get ALB DNS name (you may need to adjust this)
  ALB_DNS="api.flowcomply.com"

  # Health check
  log_info "Checking backend health..."
  HEALTH_RESPONSE=$(curl -s https://$ALB_DNS/api/monitoring/health || echo "failed")

  if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    log_success "Backend health check passed"
  else
    log_error "Backend health check failed"
    log_error "Response: $HEALTH_RESPONSE"
    exit 1
  fi

  # Check frontend
  log_info "Checking frontend..."
  FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://flowcomply.com || echo "failed")

  if [ "$FRONTEND_STATUS" = "200" ]; then
    log_success "Frontend health check passed"
  else
    log_error "Frontend health check failed (status: $FRONTEND_STATUS)"
    exit 1
  fi

  log_success "Deployment verification passed"
}

print_deployment_summary() {
  echo ""
  echo "=============================================="
  echo "         Deployment Summary"
  echo "=============================================="
  echo "Version:       $VERSION"
  echo "Region:        $AWS_REGION"
  echo "Cluster:       $CLUSTER_NAME"
  echo "Backend:       $([ "$DEPLOY_BACKEND" = true ] && echo "Deployed ✓" || echo "Skipped")"
  echo "Frontend:      $([ "$DEPLOY_FRONTEND" = true ] && echo "Deployed ✓" || echo "Skipped")"
  echo "Tests:         $([ "$RUN_TESTS" = true ] && echo "Passed ✓" || echo "Skipped")"
  echo "Backup:        $([ "$CREATE_BACKUP" = true ] && echo "Created ✓" || echo "Skipped")"
  echo "=============================================="
  echo ""
  log_success "Deployment completed successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Monitor CloudWatch dashboard"
  echo "2. Check error rates and performance"
  echo "3. Review application logs"
  echo "4. Notify stakeholders"
  echo ""
}

# Main deployment flow
main() {
  log_info "Starting FlowComply deployment..."
  log_info "Version: $VERSION"
  echo ""

  # Step 1: Check prerequisites
  check_prerequisites
  echo ""

  # Step 2: Run tests
  run_tests
  echo ""

  # Step 3: Create database backup
  create_database_backup
  echo ""

  # Step 4: Build and push images
  if [ "$DEPLOY_BACKEND" = true ]; then
    build_and_push_backend
    echo ""
  fi

  if [ "$DEPLOY_FRONTEND" = true ]; then
    build_and_push_frontend
    echo ""
  fi

  # Step 5: Deploy services
  if [ "$DEPLOY_BACKEND" = true ]; then
    deploy_backend_service
    echo ""
  fi

  if [ "$DEPLOY_FRONTEND" = true ]; then
    deploy_frontend_service
    echo ""
  fi

  # Step 6: Verify deployment
  verify_deployment
  echo ""

  # Step 7: Print summary
  print_deployment_summary
}

# Run main function
main
