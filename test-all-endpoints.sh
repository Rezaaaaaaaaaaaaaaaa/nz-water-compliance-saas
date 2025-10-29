#!/bin/bash

# Comprehensive Endpoint Testing Script
# Tests all endpoints across backend API

echo "======================================"
echo "NZ Water Compliance SaaS - Endpoint Testing"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Error log file
ERROR_LOG="endpoint-errors.log"
> "$ERROR_LOG"  # Clear the log file

# Track counts
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test function
test_endpoint() {
    local METHOD=$1
    local URL=$2
    local EXPECTED_STATUS=$3
    local DESCRIPTION=$4
    local AUTH_TOKEN=$5

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -n "Testing: $DESCRIPTION ... "

    if [ -n "$AUTH_TOKEN" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X "$METHOD" "$URL" -H "Authorization: Bearer $AUTH_TOKEN" 2>&1)
    else
        RESPONSE=$(curl -s -w "\n%{http_code}" -X "$METHOD" "$URL" 2>&1)
    fi

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [ "$HTTP_CODE" = "$EXPECTED_STATUS" ]; then
        echo -e "${GREEN}PASS${NC} ($HTTP_CODE)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}FAIL${NC} (Expected: $EXPECTED_STATUS, Got: $HTTP_CODE)"
        echo "========================================" >> "$ERROR_LOG"
        echo "FAILED: $DESCRIPTION" >> "$ERROR_LOG"
        echo "URL: $METHOD $URL" >> "$ERROR_LOG"
        echo "Expected: $EXPECTED_STATUS, Got: $HTTP_CODE" >> "$ERROR_LOG"
        echo "Response Body:" >> "$ERROR_LOG"
        echo "$BODY" >> "$ERROR_LOG"
        echo "" >> "$ERROR_LOG"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Backend URL
BACKEND_URL="http://localhost:3000"

echo "======================================"
echo "1. HEALTH & STATUS ENDPOINTS"
echo "======================================"

test_endpoint "GET" "$BACKEND_URL/health" "200" "Health check"
test_endpoint "GET" "$BACKEND_URL/health/db" "200" "Database health check"
test_endpoint "GET" "$BACKEND_URL/health/redis" "200" "Redis health check"
test_endpoint "GET" "$BACKEND_URL/api/v1" "200" "API root"

echo ""
echo "======================================"
echo "2. AUTHENTICATION ENDPOINTS (No Auth)"
echo "======================================"

# These should return 400/401 for missing credentials
test_endpoint "POST" "$BACKEND_URL/api/v1/auth/login" "400" "Login (no credentials)"
test_endpoint "POST" "$BACKEND_URL/api/v1/auth/register" "400" "Register (no data)"
test_endpoint "POST" "$BACKEND_URL/api/v1/auth/refresh" "401" "Refresh token (no token)"
test_endpoint "POST" "$BACKEND_URL/api/v1/auth/logout" "401" "Logout (no auth)"

echo ""
echo "======================================"
echo "3. PROTECTED ENDPOINTS (No Auth - Should be 401)"
echo "======================================"

# Assets
test_endpoint "GET" "$BACKEND_URL/api/v1/assets" "401" "List assets (no auth)"
test_endpoint "GET" "$BACKEND_URL/api/v1/assets/123" "401" "Get asset (no auth)"
test_endpoint "POST" "$BACKEND_URL/api/v1/assets" "401" "Create asset (no auth)"
test_endpoint "PATCH" "$BACKEND_URL/api/v1/assets/123" "401" "Update asset (no auth)"
test_endpoint "DELETE" "$BACKEND_URL/api/v1/assets/123" "401" "Delete asset (no auth)"

# Documents
test_endpoint "GET" "$BACKEND_URL/api/v1/documents" "401" "List documents (no auth)"
test_endpoint "GET" "$BACKEND_URL/api/v1/documents/123" "401" "Get document (no auth)"
test_endpoint "POST" "$BACKEND_URL/api/v1/documents" "401" "Create document (no auth)"
test_endpoint "DELETE" "$BACKEND_URL/api/v1/documents/123" "401" "Delete document (no auth)"

# DWSP (Drinking Water Safety Plans)
test_endpoint "GET" "$BACKEND_URL/api/v1/compliance/dwsp" "401" "List DWSPs (no auth)"
test_endpoint "GET" "$BACKEND_URL/api/v1/compliance/dwsp/123" "401" "Get DWSP (no auth)"
test_endpoint "POST" "$BACKEND_URL/api/v1/compliance/dwsp" "401" "Create DWSP (no auth)"
test_endpoint "PATCH" "$BACKEND_URL/api/v1/compliance/dwsp/123" "401" "Update DWSP (no auth)"
test_endpoint "DELETE" "$BACKEND_URL/api/v1/compliance/dwsp/123" "401" "Delete DWSP (no auth)"

# DWQAR (Drinking Water Quality Assurance Rules)
test_endpoint "GET" "$BACKEND_URL/api/v1/dwqar/current" "401" "DWQAR compliance (no auth)"
test_endpoint "GET" "$BACKEND_URL/api/v1/dwqar/completeness" "401" "DWQAR overview (no auth)"
test_endpoint "GET" "$BACKEND_URL/api/v1/dwqar/history" "401" "DWQAR checklist (no auth)"

# Reports
test_endpoint "GET" "$BACKEND_URL/api/v1/reports" "401" "List reports (no auth)"
test_endpoint "GET" "$BACKEND_URL/api/v1/reports/123" "401" "Get report (no auth)"
test_endpoint "POST" "$BACKEND_URL/api/v1/reports" "401" "Create report (no auth)"
test_endpoint "PATCH" "$BACKEND_URL/api/v1/reports/123" "401" "Update report (no auth)"
test_endpoint "DELETE" "$BACKEND_URL/api/v1/reports/123" "401" "Delete report (no auth)"

# Monitoring
test_endpoint "GET" "$BACKEND_URL/api/v1/monitoring/system" "401" "Get monitoring metrics (no auth)"
test_endpoint "GET" "$BACKEND_URL/api/v1/monitoring/queues" "401" "Get monitoring alerts (no auth)"

# Analytics
test_endpoint "GET" "$BACKEND_URL/api/v1/analytics/dashboard" "401" "Analytics dashboard (no auth)"
test_endpoint "GET" "$BACKEND_URL/api/v1/analytics/compliance/overview" "401" "Compliance score (no auth)"
test_endpoint "GET" "$BACKEND_URL/api/v1/analytics/dwsp-trends" "401" "Analytics trends (no auth)"

# Export
test_endpoint "GET" "$BACKEND_URL/api/v1/export/compliance-overview" "401" "Export compliance (no auth)"
test_endpoint "GET" "$BACKEND_URL/api/v1/export/assets" "401" "Export assets (no auth)"

# AI Routes (check if they exist)
test_endpoint "POST" "$BACKEND_URL/api/ai/generate-summary" "401" "AI generate (no auth)"
test_endpoint "POST" "$BACKEND_URL/api/ai/ask" "401" "AI chat (no auth)"

echo ""
echo "======================================"
echo "4. INVALID ROUTES (Should be 404)"
echo "======================================"

test_endpoint "GET" "$BACKEND_URL/api/v1/nonexistent" "404" "Non-existent route"
test_endpoint "GET" "$BACKEND_URL/invalid/path" "404" "Invalid path"
test_endpoint "POST" "$BACKEND_URL/api/v1/fake" "404" "Fake endpoint"

echo ""
echo "======================================"
echo "SUMMARY"
echo "======================================"
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${YELLOW}Error details saved to: $ERROR_LOG${NC}"
    echo ""
    echo "Failed tests summary:"
    grep "^FAILED:" "$ERROR_LOG" | while read line; do
        echo -e "${RED}  - $line${NC}"
    done
fi

echo ""
echo "======================================"
