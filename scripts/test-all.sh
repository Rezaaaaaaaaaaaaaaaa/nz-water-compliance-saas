#!/bin/bash

###############################################################################
# Comprehensive Local Test Suite
# Replicates GitHub Actions workflow but optimized for local development
#
# Usage: ./scripts/test-all.sh [options]
#
# Options:
#   --skip-lint          Skip linting and formatting checks
#   --skip-build         Skip build verification
#   --skip-e2e           Skip E2E tests (fastest)
#   --skip-security      Skip security audit
#   --parallel           Run tests in parallel (experimental)
#   --verbose            Show detailed output
#   --bail               Stop on first failure
#
# Examples:
#   ./scripts/test-all.sh                    # Run everything
#   ./scripts/test-all.sh --skip-e2e         # Skip slow E2E tests
#   ./scripts/test-all.sh --bail --verbose   # Stop on error, show details
###############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Parse arguments
SKIP_LINT=false
SKIP_BUILD=false
SKIP_E2E=false
SKIP_SECURITY=false
PARALLEL=false
VERBOSE=false
BAIL=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-lint)
      SKIP_LINT=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-e2e)
      SKIP_E2E=true
      shift
      ;;
    --skip-security)
      SKIP_SECURITY=true
      shift
      ;;
    --parallel)
      PARALLEL=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --bail)
      BAIL=true
      shift
      ;;
    --help)
      head -n 23 "$0" | tail -n +2 | sed 's/^# //; s/^#//'
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run with --help for usage"
      exit 1
      ;;
  esac
done

# Track timing
START_TIME=$(date +%s)

# Track results
TOTAL_STEPS=0
PASSED_STEPS=0
FAILED_STEPS=()

# Helper functions
print_header() {
  echo ""
  echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}${CYAN}  $1${NC}"
  echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

print_step() {
  echo -e "${BLUE}▶${NC} $1"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASSED_STEPS++))
}

print_error() {
  echo -e "${RED}✗${NC} $1"
  FAILED_STEPS+=("$1")
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

run_step() {
  local step_name="$1"
  local command="$2"

  ((TOTAL_STEPS++))
  print_step "$step_name..."

  if $VERBOSE; then
    if eval "$command"; then
      print_success "$step_name"
      return 0
    else
      print_error "$step_name"
      if $BAIL; then
        print_header "STOPPED ON FAILURE"
        exit 1
      fi
      return 1
    fi
  else
    if eval "$command" > /tmp/test_output_$$.log 2>&1; then
      print_success "$step_name"
      return 0
    else
      print_error "$step_name"
      echo -e "${RED}Last 20 lines of output:${NC}"
      tail -n 20 /tmp/test_output_$$.log
      rm -f /tmp/test_output_$$.log
      if $BAIL; then
        print_header "STOPPED ON FAILURE"
        exit 1
      fi
      return 1
    fi
  fi
}

# Check prerequisites
print_header "PREREQUISITES CHECK"

run_step "Checking Node.js version" "node --version | grep -q 'v20'"
run_step "Checking npm" "command -v npm"
run_step "Checking Docker" "command -v docker"
run_step "Checking Docker Compose" "docker compose version || docker-compose --version"

# Ensure Docker services are running
print_header "DOCKER SERVICES"

print_step "Checking if Docker services are running..."
if docker ps | grep -q postgres && docker ps | grep -q redis; then
  print_success "Docker services already running"
else
  print_warning "Starting Docker services (PostgreSQL, Redis)..."
  cd backend && docker compose up -d
  print_step "Waiting for services to be healthy..."
  sleep 5

  # Wait for PostgreSQL
  for i in {1..30}; do
    if docker exec $(docker ps -q -f name=postgres) pg_isready -U postgres > /dev/null 2>&1; then
      print_success "PostgreSQL ready"
      break
    fi
    if [ $i -eq 30 ]; then
      print_error "PostgreSQL failed to start"
      exit 1
    fi
    sleep 1
  done

  # Wait for Redis
  for i in {1..30}; do
    if docker exec $(docker ps -q -f name=redis) redis-cli ping | grep -q PONG; then
      print_success "Redis ready"
      break
    fi
    if [ $i -eq 30 ]; then
      print_error "Redis failed to start"
      exit 1
    fi
    sleep 1
  done
fi

# Install dependencies
print_header "DEPENDENCIES"

print_step "Installing backend dependencies..."
if [ ! -d "backend/node_modules" ] || [ "backend/package.json" -nt "backend/node_modules" ]; then
  run_step "Backend npm install" "cd backend && npm install"
else
  print_success "Backend dependencies already installed"
  ((PASSED_STEPS++))
fi

print_step "Installing frontend dependencies..."
if [ ! -d "frontend/node_modules" ] || [ "frontend/package.json" -nt "frontend/node_modules" ]; then
  run_step "Frontend npm install" "cd frontend && npm install"
else
  print_success "Frontend dependencies already installed"
  ((PASSED_STEPS++))
fi

# Prisma setup
print_header "DATABASE SETUP"

run_step "Generating Prisma Client" "cd backend && npx prisma generate"
run_step "Running database migrations" "cd backend && npx prisma migrate deploy"

# Linting and formatting
if ! $SKIP_LINT; then
  print_header "CODE QUALITY"

  run_step "Backend linting" "cd backend && npm run lint || echo 'Linting has warnings'"
  run_step "Backend formatting check" "cd backend && npx prettier --check src || echo 'Formatting issues found'"
  run_step "Frontend linting" "cd frontend && npm run lint || echo 'Linting has warnings'"
else
  print_warning "Skipping linting (--skip-lint)"
fi

# Unit tests
print_header "UNIT TESTS"

run_step "Backend unit tests with coverage" "cd backend && npm test -- --coverage --maxWorkers=50%"

# Integration tests
print_header "INTEGRATION TESTS"

run_step "Backend integration tests" "cd backend && npm run test:integration"

# Build verification
if ! $SKIP_BUILD; then
  print_header "BUILD VERIFICATION"

  # Clean previous builds
  run_step "Cleaning previous builds" "rm -rf backend/dist frontend/.next"

  run_step "Building backend" "cd backend && npm run build"
  run_step "Verifying backend build output" "test -d backend/dist && test -f backend/dist/server.js"

  run_step "Building frontend" "cd frontend && NEXT_TELEMETRY_DISABLED=1 npm run build"
  run_step "Verifying frontend build output" "test -d frontend/.next"
else
  print_warning "Skipping build verification (--skip-build)"
fi

# E2E tests
if ! $SKIP_E2E; then
  print_header "END-TO-END TESTS"

  # Check if Playwright browsers are installed
  if ! npx playwright install --dry-run chromium > /dev/null 2>&1; then
    print_warning "Installing Playwright browsers (one-time setup)..."
    run_step "Installing Playwright" "npx playwright install chromium firefox"
  fi

  # Run E2E tests
  run_step "Playwright E2E tests" "npx playwright test --reporter=list"
else
  print_warning "Skipping E2E tests (--skip-e2e)"
fi

# Security audit
if ! $SKIP_SECURITY; then
  print_header "SECURITY AUDIT"

  run_step "Backend security audit" "cd backend && npm audit --production --audit-level=high || echo 'Security issues found (non-blocking)'"
  run_step "Frontend security audit" "cd frontend && npm audit --production --audit-level=high || echo 'Security issues found (non-blocking)'"
else
  print_warning "Skipping security audit (--skip-security)"
fi

# Summary
print_header "TEST RESULTS SUMMARY"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo -e "${BOLD}Total Steps:${NC}   $TOTAL_STEPS"
echo -e "${GREEN}${BOLD}Passed:${NC}        $PASSED_STEPS"
echo -e "${RED}${BOLD}Failed:${NC}        ${#FAILED_STEPS[@]}"
echo -e "${BOLD}Duration:${NC}      ${MINUTES}m ${SECONDS}s"
echo ""

if [ ${#FAILED_STEPS[@]} -gt 0 ]; then
  echo -e "${RED}${BOLD}Failed Steps:${NC}"
  for step in "${FAILED_STEPS[@]}"; do
    echo -e "${RED}  ✗${NC} $step"
  done
  echo ""
  echo -e "${RED}${BOLD}❌ TESTS FAILED${NC}"
  exit 1
else
  echo -e "${GREEN}${BOLD}✅ ALL TESTS PASSED${NC}"
  echo -e "${CYAN}🎉 Ready for deployment!${NC}"
  exit 0
fi
