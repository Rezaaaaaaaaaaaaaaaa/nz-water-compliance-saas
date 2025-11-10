#!/bin/bash

###############################################################################
# Iterative Test Watcher
# Fast, incremental testing for development workflow
#
# Usage: ./scripts/test-watch.sh [type]
#
# Types:
#   unit         Watch unit tests only (fastest, default)
#   integration  Watch integration tests
#   all          Watch all tests
#   file <path>  Watch specific test file
#
# Features:
#   - Runs only affected tests when files change
#   - Instant feedback (< 2 seconds for unit tests)
#   - Interactive mode for filtering tests
#   - Automatic database migrations on schema changes
#
# Examples:
#   ./scripts/test-watch.sh                              # Unit tests
#   ./scripts/test-watch.sh integration                  # Integration tests
#   ./scripts/test-watch.sh file backend/src/services/asset.service.test.ts
###############################################################################

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Parse type
TYPE="${1:-unit}"
FILE_PATH="${2:-}"

clear

print_header() {
  echo -e "${BOLD}${CYAN}"
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║     🔄 ITERATIVE TEST WATCHER - NZ Water Compliance       ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_header

# Check if in backend directory
if [ ! -f "backend/package.json" ]; then
  echo -e "${RED}✗${NC} Must run from project root"
  exit 1
fi

# Ensure Docker services are running
print_info "Checking Docker services..."
cd backend
if ! docker ps | grep -q postgres; then
  print_warning "Starting PostgreSQL..."
  docker compose up -d postgres
  sleep 3
fi

if ! docker ps | grep -q redis; then
  print_warning "Starting Redis..."
  docker compose up -d redis
  sleep 2
fi

print_success "Docker services ready"

# Ensure Prisma client is generated
if [ ! -d "node_modules/.prisma" ]; then
  print_info "Generating Prisma client (one-time setup)..."
  npx prisma generate
fi

# Ensure migrations are up to date
print_info "Checking database migrations..."
npx prisma migrate deploy > /dev/null 2>&1 || true

echo ""
echo -e "${CYAN}${BOLD}Starting watch mode...${NC}"
echo -e "${YELLOW}Press 'a' to run all tests${NC}"
echo -e "${YELLOW}Press 'f' to run only failed tests${NC}"
echo -e "${YELLOW}Press 'p' to filter by file pattern${NC}"
echo -e "${YELLOW}Press 'q' to quit${NC}"
echo ""

# Run appropriate watch mode
case "$TYPE" in
  unit)
    print_info "Watching unit tests (fastest, no database needed)"
    echo ""
    npm test -- --watch --verbose
    ;;

  integration)
    print_info "Watching integration tests (requires database)"
    echo ""
    npm run test:integration -- --watch --verbose
    ;;

  all)
    print_info "Watching all tests (unit + integration)"
    echo ""
    # Use concurrently to watch both
    if command -v npx > /dev/null 2>&1; then
      npx concurrently \
        --names "UNIT,INTG" \
        --prefix-colors "cyan,magenta" \
        "npm test -- --watch" \
        "npm run test:integration -- --watch"
    else
      print_warning "Install 'concurrently' for better watch experience"
      npm test -- --watch
    fi
    ;;

  file)
    if [ -z "$FILE_PATH" ]; then
      echo "Error: Must specify file path"
      echo "Usage: ./scripts/test-watch.sh file <path>"
      exit 1
    fi
    print_info "Watching specific file: $FILE_PATH"
    echo ""
    npm test -- --watch "$FILE_PATH"
    ;;

  *)
    echo "Unknown type: $TYPE"
    echo "Available types: unit, integration, all, file"
    exit 1
    ;;
esac
