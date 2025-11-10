#!/bin/bash

###############################################################################
# Debug Specific Tests
# Run specific tests with detailed debugging output
#
# Usage: ./scripts/test-debug.sh <pattern> [options]
#
# Examples:
#   ./scripts/test-debug.sh asset                    # All asset tests
#   ./scripts/test-debug.sh "auth.*login"            # Auth login tests
#   ./scripts/test-debug.sh analytics --integration  # Integration tests only
#   ./scripts/test-debug.sh dwsp --bail              # Stop on first failure
#
# Options:
#   --integration    Run integration tests instead of unit tests
#   --bail           Stop on first test failure
#   --coverage       Show coverage for matched tests
#   --verbose        Extra verbose output
###############################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

if [ $# -eq 0 ]; then
  echo "Usage: $0 <pattern> [options]"
  echo ""
  echo "Examples:"
  echo "  $0 asset"
  echo "  $0 \"auth.*login\" --bail"
  echo "  $0 analytics --integration"
  exit 1
fi

PATTERN="$1"
shift

# Parse options
INTEGRATION=false
BAIL=false
COVERAGE=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --integration)
      INTEGRATION=true
      shift
      ;;
    --bail)
      BAIL=true
      shift
      ;;
    --coverage)
      COVERAGE=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

print_header() {
  echo -e "${BOLD}${MAGENTA}"
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║              🐛 DEBUG TEST MODE                            ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

print_header

echo -e "${CYAN}Pattern:${NC} $PATTERN"
echo -e "${CYAN}Type:${NC}    $([ "$INTEGRATION" = true ] && echo "Integration" || echo "Unit")"
echo ""

# Ensure Docker services for integration tests
if [ "$INTEGRATION" = true ]; then
  echo -e "${BLUE}▶${NC} Checking Docker services..."
  cd backend
  if ! docker ps | grep -q postgres; then
    echo -e "${YELLOW}⚠${NC} Starting PostgreSQL..."
    docker compose up -d postgres
    sleep 3
  fi
  if ! docker ps | grep -q redis; then
    echo -e "${YELLOW}⚠${NC} Starting Redis..."
    docker compose up -d redis
    sleep 2
  fi
  echo -e "${GREEN}✓${NC} Docker services ready"
  echo ""
fi

# Build Jest command
cd backend
JEST_CMD="npm test --"

if [ "$INTEGRATION" = true ]; then
  JEST_CMD="npm run test:integration --"
fi

JEST_CMD="$JEST_CMD -t \"$PATTERN\""
JEST_CMD="$JEST_CMD --verbose"
JEST_CMD="$JEST_CMD --no-cache"

if [ "$BAIL" = true ]; then
  JEST_CMD="$JEST_CMD --bail"
fi

if [ "$COVERAGE" = true ]; then
  JEST_CMD="$JEST_CMD --coverage --collectCoverageFrom=\"**/$PATTERN*.ts\""
fi

if [ "$VERBOSE" = true ]; then
  JEST_CMD="$JEST_CMD --detectOpenHandles --forceExit"
fi

echo -e "${CYAN}Running:${NC} $JEST_CMD"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Run tests
eval "$JEST_CMD"

EXIT_CODE=$?

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}${BOLD}✅ Tests passed${NC}"
else
  echo -e "${RED}${BOLD}❌ Tests failed${NC}"
  echo ""
  echo -e "${YELLOW}Debugging tips:${NC}"
  echo -e "  1. Check test output above for error details"
  echo -e "  2. Add --verbose for more output"
  echo -e "  3. Add --bail to stop on first failure"
  echo -e "  4. Use --coverage to see what code was tested"
  echo ""
  echo -e "${CYAN}Quick fixes:${NC}"
  echo -e "  ./scripts/test-watch.sh file <test-file>   # Watch specific file"
  echo -e "  ./scripts/test-debug.sh $PATTERN --bail    # Stop on error"
fi

exit $EXIT_CODE
