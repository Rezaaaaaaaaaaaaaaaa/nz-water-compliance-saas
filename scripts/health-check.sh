#!/bin/bash

# Post-Deployment Health Check Script
# Verifies production deployment is working correctly

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
API_URL="${1:-http://localhost:5000}"
FRONTEND_URL="${2:-http://localhost:3000}"

PASSED=0
FAILED=0

echo "🏥 NZ Water Compliance SaaS - Health Check"
echo "==========================================="
echo ""
echo "API URL: $API_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Function to check endpoint
check_endpoint() {
  local name=$1
  local url=$2
  local expected_status=$3
  local description=$4

  echo -n "Testing: $name..."

  response=$(curl -s -w "\n%{http_code}" -o /tmp/response.txt "$url" 2>&1) || true
  status_code=$(echo "$response" | tail -n1)
  body=$(cat /tmp/response.txt 2>/dev/null || echo "")

  if [ "$status_code" = "$expected_status" ]; then
    echo -e " ${GREEN}✓ PASS${NC} (HTTP $status_code)"
    PASSED=$((PASSED + 1))
    if [ -n "$body" ] && [ "$body" != "null" ]; then
      echo "  Response: $(echo $body | head -c 100)"
    fi
  else
    echo -e " ${RED}✗ FAIL${NC} (HTTP $status_code, expected $expected_status)"
    FAILED=$((FAILED + 1))
    echo "  URL: $url"
    echo "  Description: $description"
  fi
  echo ""
}

# Function to check JSON response
check_json_response() {
  local name=$1
  local url=$2
  local field=$3
  local expected_value=$4

  echo -n "Testing: $name..."

  response=$(curl -s "$url" 2>&1) || true

  if command -v jq &> /dev/null; then
    actual_value=$(echo "$response" | jq -r ".$field" 2>/dev/null || echo "")

    if [ "$actual_value" = "$expected_value" ]; then
      echo -e " ${GREEN}✓ PASS${NC}"
      PASSED=$((PASSED + 1))
    else
      echo -e " ${RED}✗ FAIL${NC}"
      echo "  Expected: $field = $expected_value"
      echo "  Actual: $field = $actual_value"
      FAILED=$((FAILED + 1))
    fi
  else
    # Fallback without jq
    if echo "$response" | grep -q "$expected_value"; then
      echo -e " ${GREEN}✓ PASS${NC}"
      PASSED=$((PASSED + 1))
    else
      echo -e " ${RED}✗ FAIL${NC}"
      echo "  Could not verify (jq not installed)"
      FAILED=$((FAILED + 1))
    fi
  fi
  echo ""
}

echo "🔍 Backend API Tests"
echo "===================="
echo ""

# Basic health check
check_endpoint "Health Check" \
  "$API_URL/health" \
  "200" \
  "Basic health endpoint should return 200 OK"

# API documentation
check_endpoint "API Documentation" \
  "$API_URL/api/v1/docs" \
  "200" \
  "Swagger documentation should be accessible"

# Auth endpoints (should require authentication)
check_endpoint "Auth - Register Endpoint" \
  "$API_URL/api/v1/auth/register" \
  "400" \
  "Register endpoint should return 400 (bad request) without body"

check_endpoint "Auth - Login Endpoint" \
  "$API_URL/api/v1/auth/login" \
  "400" \
  "Login endpoint should return 400 (bad request) without body"

# Protected endpoint (should require authentication)
check_endpoint "Protected Endpoint - Assets" \
  "$API_URL/api/v1/assets" \
  "401" \
  "Assets endpoint should return 401 (unauthorized) without token"

echo ""
echo "🌐 Frontend Tests"
echo "================="
echo ""

# Frontend homepage
check_endpoint "Frontend Homepage" \
  "$FRONTEND_URL" \
  "200" \
  "Homepage should load successfully"

# Login page
check_endpoint "Login Page" \
  "$FRONTEND_URL/login" \
  "200" \
  "Login page should load successfully"

# Dashboard (should redirect to login if not authenticated)
check_endpoint "Dashboard Redirect" \
  "$FRONTEND_URL/dashboard" \
  "307" \
  "Dashboard should redirect to login when not authenticated"

echo ""
echo "🔐 Security Tests"
echo "================="
echo ""

# Check HTTPS (if using HTTPS)
if [[ $API_URL == https://* ]]; then
  echo -n "Testing: SSL Certificate..."
  if curl -s --head "$API_URL" | grep -q "HTTP/[0-9.]* 200\|HTTP/[0-9.]* 30[0-9]"; then
    echo -e " ${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e " ${RED}✗ FAIL${NC}"
    FAILED=$((FAILED + 1))
  fi
  echo ""
fi

# Check CORS headers
echo -n "Testing: CORS Headers..."
response=$(curl -s -H "Origin: https://example.com" -I "$API_URL/health" 2>&1)
if echo "$response" | grep -q "access-control-allow-origin"; then
  echo -e " ${GREEN}✓ PASS${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e " ${YELLOW}⚠ WARNING${NC} (CORS headers not found)"
fi
echo ""

# Check security headers
echo -n "Testing: Security Headers..."
response=$(curl -s -I "$API_URL/health" 2>&1)
if echo "$response" | grep -qi "x-frame-options\|x-content-type-options"; then
  echo -e " ${GREEN}✓ PASS${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e " ${YELLOW}⚠ WARNING${NC} (Security headers not found)"
fi
echo ""

echo ""
echo "📊 Performance Tests"
echo "===================="
echo ""

# Response time test
echo -n "Testing: API Response Time..."
start_time=$(date +%s%N)
curl -s "$API_URL/health" > /dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

if [ $response_time -lt 1000 ]; then
  echo -e " ${GREEN}✓ PASS${NC} (${response_time}ms)"
  PASSED=$((PASSED + 1))
elif [ $response_time -lt 3000 ]; then
  echo -e " ${YELLOW}⚠ SLOW${NC} (${response_time}ms)"
  PASSED=$((PASSED + 1))
else
  echo -e " ${RED}✗ FAIL${NC} (${response_time}ms, expected < 3000ms)"
  FAILED=$((FAILED + 1))
fi
echo ""

echo ""
echo "🔌 Integration Tests"
echo "===================="
echo ""

# Test user registration
echo -n "Testing: User Registration Flow..."
registration_response=$(curl -s -X POST "$API_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test-$(date +%s)@example.com\",
    \"password\": \"Test123!\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"organizationName\": \"Test Organization\"
  }" 2>&1)

if echo "$registration_response" | grep -q "success\|token\|id"; then
  echo -e " ${GREEN}✓ PASS${NC}"
  PASSED=$((PASSED + 1))

  # Extract token if available (for further tests)
  if command -v jq &> /dev/null; then
    TOKEN=$(echo "$registration_response" | jq -r '.data.token // .token // empty' 2>/dev/null)
    if [ -n "$TOKEN" ]; then
      echo "  Token received: ${TOKEN:0:20}..."
    fi
  fi
else
  echo -e " ${YELLOW}⚠ WARNING${NC}"
  echo "  Response: $(echo $registration_response | head -c 100)"
fi
echo ""

echo ""
echo "==========================================="
echo "📊 Test Summary"
echo "==========================================="
echo ""
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=$((PASSED * 100 / TOTAL))

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed! System is healthy.${NC}"
  echo ""
  echo "🎉 Deployment verification complete!"
  echo ""
  echo "Next steps:"
  echo "  1. Monitor logs for errors"
  echo "  2. Test with real user accounts"
  echo "  3. Verify email sending works"
  echo "  4. Check database connections"
  echo "  5. Verify document uploads work"
  exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
  echo -e "${YELLOW}⚠️  $FAILED tests failed, but success rate is $SUCCESS_RATE%${NC}"
  echo ""
  echo "The system is mostly functional but has some issues."
  echo "Review failed tests and fix before production use."
  exit 1
else
  echo -e "${RED}❌ Too many failures! Success rate: $SUCCESS_RATE%${NC}"
  echo ""
  echo "The system has significant issues. Do not use in production."
  echo "Review all failed tests and fix issues before deploying."
  exit 2
fi
