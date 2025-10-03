#!/bin/bash

# Pre-Deployment Checklist Script
# Verifies system is ready for production deployment

set -e

echo "🔍 NZ Water Compliance SaaS - Pre-Deployment Check"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check command
check_command() {
  if command -v $1 &> /dev/null; then
    echo -e "${GREEN}✓${NC} $1 is installed"
    return 0
  else
    echo -e "${RED}✗${NC} $1 is not installed"
    ERRORS=$((ERRORS + 1))
    return 1
  fi
}

# Function to check file
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1 exists"
    return 0
  else
    echo -e "${RED}✗${NC} $1 not found"
    ERRORS=$((ERRORS + 1))
    return 1
  fi
}

# Function to check env var
check_env() {
  if [ -n "${!1}" ]; then
    echo -e "${GREEN}✓${NC} $1 is set"
    return 0
  else
    echo -e "${YELLOW}⚠${NC} $1 is not set"
    WARNINGS=$((WARNINGS + 1))
    return 1
  fi
}

echo "📦 Checking Required Tools..."
echo "----------------------------"
check_command node
check_command npm
check_command docker
check_command git
check_command psql
check_command aws || echo -e "${YELLOW}⚠${NC} AWS CLI not installed (optional for AWS deployment)"
echo ""

echo "📁 Checking Project Structure..."
echo "--------------------------------"
check_file "backend/package.json"
check_file "backend/prisma/schema.prisma"
check_file "backend/src/server.ts"
check_file "frontend/package.json"
check_file "frontend/app/page.tsx"
check_file ".gitignore"
echo ""

echo "🔧 Checking Backend Configuration..."
echo "------------------------------------"
cd backend

# Check if node_modules exists
if [ -d "node_modules" ]; then
  echo -e "${GREEN}✓${NC} node_modules exists"
else
  echo -e "${YELLOW}⚠${NC} node_modules not found. Run: npm install"
  WARNINGS=$((WARNINGS + 1))
fi

# Check for .env.example
if [ -f ".env.example" ]; then
  echo -e "${GREEN}✓${NC} .env.example exists"

  # Check if .env exists
  if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env exists"
  else
    echo -e "${YELLOW}⚠${NC} .env not found. Copy from .env.example"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "${RED}✗${NC} .env.example not found"
  ERRORS=$((ERRORS + 1))
fi

# Check TypeScript compilation
if npm run build --dry-run &> /dev/null; then
  echo -e "${GREEN}✓${NC} TypeScript configuration valid"
else
  echo -e "${RED}✗${NC} TypeScript configuration invalid"
  ERRORS=$((ERRORS + 1))
fi

cd ..
echo ""

echo "🔧 Checking Frontend Configuration..."
echo "-------------------------------------"
cd frontend

# Check if node_modules exists
if [ -d "node_modules" ]; then
  echo -e "${GREEN}✓${NC} node_modules exists"
else
  echo -e "${YELLOW}⚠${NC} node_modules not found. Run: npm install"
  WARNINGS=$((WARNINGS + 1))
fi

cd ..
echo ""

echo "🔐 Checking Security Requirements..."
echo "------------------------------------"

# Check for common security issues
if grep -r "password.*=.*['\"][^'\"]*['\"]" backend/src/ 2>/dev/null | grep -v ".test.ts" | grep -v "example"; then
  echo -e "${RED}✗${NC} Found hardcoded passwords in source code!"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓${NC} No hardcoded passwords found"
fi

if grep -r "api[_-]?key.*=.*['\"][^'\"]*['\"]" backend/src/ 2>/dev/null | grep -v ".test.ts" | grep -v "example"; then
  echo -e "${RED}✗${NC} Found hardcoded API keys in source code!"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓${NC} No hardcoded API keys found"
fi

# Check .gitignore
if grep -q ".env" .gitignore; then
  echo -e "${GREEN}✓${NC} .env is in .gitignore"
else
  echo -e "${RED}✗${NC} .env should be in .gitignore"
  ERRORS=$((ERRORS + 1))
fi

echo ""

echo "📊 Running Tests..."
echo "-------------------"
cd backend

# Run tests
if npm test -- --passWithNoTests &> /dev/null; then
  echo -e "${GREEN}✓${NC} Backend tests passed"
else
  echo -e "${YELLOW}⚠${NC} Backend tests failed or not configured"
  WARNINGS=$((WARNINGS + 1))
fi

cd ..
echo ""

echo "🌐 Checking Production Readiness..."
echo "-----------------------------------"

# Check environment variables (production)
echo "Required environment variables for production:"
check_env "DATABASE_URL" || echo "  Example: postgresql://user:pass@host:5432/db"
check_env "REDIS_URL" || echo "  Example: redis://host:6379"
check_env "JWT_SECRET" || echo "  Generate with: openssl rand -base64 64"
check_env "AWS_ACCESS_KEY_ID" || echo "  (Optional) For S3 and SES"
check_env "AWS_SECRET_ACCESS_KEY" || echo "  (Optional) For S3 and SES"
check_env "FRONTEND_URL" || echo "  Example: https://app.compliance-saas.nz"

echo ""

echo "📋 Deployment Checklist..."
echo "--------------------------"
echo "Manual checks (verify before deploying):"
echo ""
echo "  [ ] Domain name registered"
echo "  [ ] DNS records configured"
echo "  [ ] SSL certificate obtained or ACM configured"
echo "  [ ] Database backup strategy in place"
echo "  [ ] Monitoring/alerting configured"
echo "  [ ] Error tracking configured (Sentry)"
echo "  [ ] Load testing completed"
echo "  [ ] Security scan completed"
echo "  [ ] Documentation updated"
echo "  [ ] Team notified of deployment"
echo ""

# Summary
echo "=================================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! Ready for deployment.${NC}"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠ $WARNINGS warnings found. Review before deploying.${NC}"
  exit 0
else
  echo -e "${RED}❌ $ERRORS errors and $WARNINGS warnings found. Fix before deploying.${NC}"
  exit 1
fi
