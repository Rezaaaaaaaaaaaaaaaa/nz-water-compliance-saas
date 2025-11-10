#!/bin/bash

###############################################################################
# Quick Test Script
# Fast pre-commit validation (< 30 seconds)
#
# Usage: ./scripts/test-quick.sh
#
# Runs:
#   1. Linting (5s)
#   2. Type checking (5s)
#   3. Unit tests (10s)
#   4. Build check (10s)
#
# Perfect for:
#   - Pre-commit validation
#   - Quick feedback during development
#   - CI pipeline smoke tests
###############################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

START_TIME=$(date +%s)

print_header() {
  echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}${CYAN}  ⚡ QUICK TEST - Fast Feedback${NC}"
  echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

print_step() {
  echo -ne "${BLUE}▶${NC} $1... "
}

print_success() {
  echo -e "${GREEN}✓${NC}"
}

print_error() {
  echo -e "${RED}✗${NC}"
}

print_header

FAILED=0

# 1. Linting
print_step "Linting backend"
if cd backend && npm run lint > /dev/null 2>&1; then
  print_success
else
  print_error
  ((FAILED++))
  echo -e "${YELLOW}  Run 'npm run lint:fix' to auto-fix${NC}"
fi

print_step "Linting frontend"
if cd ../frontend && npm run lint > /dev/null 2>&1; then
  print_success
else
  print_error
  ((FAILED++))
fi

# 2. Type checking
cd ../backend
print_step "Type checking"
if npx tsc --noEmit > /dev/null 2>&1; then
  print_success
else
  print_error
  ((FAILED++))
  echo -e "${YELLOW}  TypeScript errors found${NC}"
fi

# 3. Unit tests (fast subset)
print_step "Running unit tests"
if npm test -- --silent --maxWorkers=2 --testPathIgnorePatterns=integration > /dev/null 2>&1; then
  print_success
else
  print_error
  ((FAILED++))
  echo -e "${YELLOW}  Run 'npm test' for details${NC}"
fi

# 4. Build check (backend only for speed)
print_step "Build check"
if npm run build > /dev/null 2>&1; then
  print_success
  rm -rf dist  # Clean up
else
  print_error
  ((FAILED++))
fi

# Summary
echo ""
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}${BOLD}✅ All checks passed${NC} ${CYAN}(${DURATION}s)${NC}"
  echo -e "${CYAN}Ready to commit!${NC}"
  exit 0
else
  echo -e "${RED}${BOLD}❌ $FAILED check(s) failed${NC} ${CYAN}(${DURATION}s)${NC}"
  echo ""
  echo -e "${YELLOW}Fix issues and run:${NC}"
  echo -e "  ${CYAN}./scripts/test-quick.sh${NC}    # Try again"
  echo -e "  ${CYAN}./scripts/test-watch.sh${NC}    # Interactive mode"
  echo -e "  ${CYAN}./scripts/test-all.sh${NC}      # Full suite"
  exit 1
fi
