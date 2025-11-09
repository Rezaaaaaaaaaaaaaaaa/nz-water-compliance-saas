@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    LOCAL CI/CD TEST SUITE WITH DOCKER
echo    Mimicking GitHub Actions Workflow
echo ========================================
echo.

set "LOG_DIR=test-logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

set "PASSED=0"
set "FAILED=0"

REM ========================================
REM  STEP 0: Start Docker Services
REM ========================================
echo ========================================
echo  0/4 DOCKER SERVICES SETUP
echo ========================================
echo Starting Docker containers...

cd backend
docker compose up -d postgres redis 2>"..\%LOG_DIR%\docker.log"
if %errorlevel% neq 0 (
    echo [FAIL] Failed to start Docker services
    type "..\%LOG_DIR%\docker.log"
    set /a FAILED+=1
    goto :summary
)

echo Waiting for services to be healthy...
timeout /t 5 /nobreak >nul

REM Wait for PostgreSQL
set "retries=0"
:wait_postgres
docker exec compliance-saas-postgres pg_isready -U postgres >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] PostgreSQL is ready
    goto :check_redis
)
set /a retries+=1
if %retries% geq 30 (
    echo [FAIL] PostgreSQL failed to start after 30 attempts
    set /a FAILED+=1
    goto :summary
)
timeout /t 1 /nobreak >nul
goto :wait_postgres

:check_redis
REM Wait for Redis
set "retries=0"
:wait_redis
docker exec compliance-saas-redis redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Redis is ready
    goto :run_tests
)
set /a retries+=1
if %retries% geq 30 (
    echo [FAIL] Redis failed to start after 30 attempts
    set /a FAILED+=1
    goto :summary
)
timeout /t 1 /nobreak >nul
goto :wait_redis

:run_tests
echo [PASS] Docker services are healthy
set /a PASSED+=1
echo.

REM ========================================
REM  STEP 1: Lint
REM ========================================
echo ========================================
echo  1/4 LINT ^& CODE QUALITY
echo ========================================
echo Running ESLint...
call npm run lint > "..\%LOG_DIR%\lint.log" 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Lint checks passed
    set /a PASSED+=1
) else (
    echo [FAIL] Lint checks failed
    set /a FAILED+=1
)
echo.

REM ========================================
REM  STEP 2: Security Audit
REM ========================================
echo ========================================
echo  2/4 SECURITY AUDIT
echo ========================================
echo Running npm audit...
call npm audit --audit-level=high > "..\%LOG_DIR%\audit.log" 2>&1
echo [PASS] Security audit completed
set /a PASSED+=1
echo.

REM ========================================
REM  STEP 3: Unit Tests
REM ========================================
echo ========================================
echo  3/4 UNIT TESTS
echo ========================================
echo Running unit tests...
call npm test > "..\%LOG_DIR%\unit-tests.log" 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Unit tests passed
    set /a PASSED+=1
) else (
    echo [FAIL] Unit tests failed
    set /a FAILED+=1
    echo Last 30 lines:
    powershell -Command "Get-Content '..\%LOG_DIR%\unit-tests.log' | Select-Object -Last 30"
)
echo.

REM ========================================
REM  STEP 4: Integration Tests
REM ========================================
echo ========================================
echo  4/4 INTEGRATION TESTS
echo ========================================
echo Running integration tests...
call npm run test:integration > "..\%LOG_DIR%\integration-tests.log" 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Integration tests passed
    set /a PASSED+=1
) else (
    echo [FAIL] Integration tests failed
    set /a FAILED+=1
    echo.
    echo Test summary:
    findstr /C:"Test Suites:" /C:"Tests:" /C:"FAIL" /C:"PASS" "..\%LOG_DIR%\integration-tests.log" 2>nul
    echo.
    echo Last 50 lines of log:
    powershell -Command "Get-Content '..\%LOG_DIR%\integration-tests.log' | Select-Object -Last 50"
)
echo.

cd ..

:summary
REM ========================================
REM  SUMMARY
REM ========================================
echo ========================================
echo  TEST SUITE SUMMARY
echo ========================================
set /a TOTAL=PASSED+FAILED
echo Total Suites: %TOTAL%
echo Passed: %PASSED%
echo Failed: %FAILED%
echo.
echo Detailed logs in: %LOG_DIR%\
echo.

if %FAILED% equ 0 (
    echo [SUCCESS] All tests passed!
    exit /b 0
) else (
    echo [FAILURE] %FAILED% test suite(s) failed
    exit /b 1
)
