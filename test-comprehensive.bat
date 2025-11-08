@echo off
REM ============================================================================
REM  NZ Water Compliance SaaS - Comprehensive Local Test Suite
REM  Mimics GitHub Actions workflow for complete testing
REM ============================================================================

setlocal enabledelayedexpansion

REM Color codes for output (using PowerShell)
set "COLOR_GREEN=[92m"
set "COLOR_RED=[91m"
set "COLOR_YELLOW=[93m"
set "COLOR_BLUE=[94m"
set "COLOR_RESET=[0m"

REM Configuration
set "START_TIME=%time%"
set "TEST_LOG=test-results-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%.log"
set "TEST_LOG=!TEST_LOG: =0!"
set "FAILED_TESTS=0"
set "TOTAL_TESTS=0"

REM Parse command line arguments
set "RUN_MODE=full"
set "SKIP_E2E=0"
set "WATCH_MODE=0"
set "VERBOSE=0"

:parse_args
if "%~1"=="" goto done_parsing
if /i "%~1"=="--quick" (
    set "RUN_MODE=quick"
    set "SKIP_E2E=1"
    shift
    goto parse_args
)
if /i "%~1"=="--skip-e2e" (
    set "SKIP_E2E=1"
    shift
    goto parse_args
)
if /i "%~1"=="--watch" (
    set "WATCH_MODE=1"
    shift
    goto parse_args
)
if /i "%~1"=="--verbose" (
    set "VERBOSE=1"
    shift
    goto parse_args
)
if /i "%~1"=="--unit" (
    set "RUN_MODE=unit"
    shift
    goto parse_args
)
if /i "%~1"=="--integration" (
    set "RUN_MODE=integration"
    shift
    goto parse_args
)
if /i "%~1"=="--e2e" (
    set "RUN_MODE=e2e"
    shift
    goto parse_args
)
if /i "%~1"=="--help" goto show_help
shift
goto parse_args
:done_parsing

echo.
echo ============================================================================
echo   NZ Water Compliance SaaS - Comprehensive Test Suite
echo ============================================================================
echo   Mode: %RUN_MODE%
echo   Log: %TEST_LOG%
echo   Started: %START_TIME%
echo ============================================================================
echo.

REM Initialize log file
echo NZ Water Compliance SaaS - Test Results > %TEST_LOG%
echo Started: %date% %time% >> %TEST_LOG%
echo Mode: %RUN_MODE% >> %TEST_LOG%
echo. >> %TEST_LOG%

REM ============================================================================
REM STEP 0: Prerequisites Check
REM ============================================================================
call :print_header "PREREQUISITES CHECK"

call :check_command "node" "Node.js"
if errorlevel 1 goto test_failed

call :check_command "npm" "npm"
if errorlevel 1 goto test_failed

call :check_command "docker" "Docker"
if errorlevel 1 set "DOCKER_AVAILABLE=0" else set "DOCKER_AVAILABLE=1"

if exist "backend\.env" (
    call :print_success "Backend .env file exists"
) else (
    call :print_warning "Backend .env file not found - using defaults"
)

REM ============================================================================
REM STEP 1: Start Services (if Docker available)
REM ============================================================================
if "%DOCKER_AVAILABLE%"=="1" (
    call :print_header "STARTING SERVICES"
    echo Starting PostgreSQL and Redis via Docker... >> %TEST_LOG%

    docker compose up -d postgres redis 2>&1 >> %TEST_LOG%
    if errorlevel 1 (
        call :print_warning "Failed to start Docker services - ensure they're running manually"
    ) else (
        call :print_success "Docker services started"
        timeout /t 5 /nobreak > nul
    )
) else (
    call :print_warning "Docker not available - ensure PostgreSQL and Redis are running"
)

REM ============================================================================
REM STEP 2: Install Dependencies
REM ============================================================================
if "%RUN_MODE%"=="full" (
    call :print_header "INSTALLING DEPENDENCIES"
    set /a TOTAL_TESTS+=1

    echo Installing dependencies... >> %TEST_LOG%

    cd backend
    call npm install 2>&1 >> ..\%TEST_LOG%
    if errorlevel 1 (
        call :print_error "Backend dependency installation failed"
        set /a FAILED_TESTS+=1
    ) else (
        call :print_success "Backend dependencies installed"
    )
    cd ..

    if "%SKIP_E2E%"=="0" (
        cd frontend
        call npm install 2>&1 >> ..\%TEST_LOG%
        if errorlevel 1 (
            call :print_warning "Frontend dependency installation failed"
        ) else (
            call :print_success "Frontend dependencies installed"
        )
        cd ..
    )
)

REM ============================================================================
REM STEP 3: Generate Prisma Client
REM ============================================================================
if not "%RUN_MODE%"=="e2e" (
    call :print_header "GENERATING PRISMA CLIENT"
    set /a TOTAL_TESTS+=1

    cd backend
    call npx prisma generate 2>&1 >> ..\%TEST_LOG%
    if errorlevel 1 (
        call :print_error "Prisma generation failed"
        set /a FAILED_TESTS+=1
    ) else (
        call :print_success "Prisma client generated"
    )
    cd ..
)

REM ============================================================================
REM STEP 4: Lint & Code Quality
REM ============================================================================
if "%RUN_MODE%"=="full" (
    call :print_header "LINT & CODE QUALITY"
    set /a TOTAL_TESTS+=1

    echo Running ESLint... >> %TEST_LOG%
    cd backend
    call npm run lint 2>&1 >> ..\%TEST_LOG%
    if errorlevel 1 (
        call :print_warning "Linting issues found (non-blocking)"
    ) else (
        call :print_success "Linting passed"
    )

    echo Running Prettier check... >> %TEST_LOG%
    call npx prettier --check src 2>&1 >> ..\%TEST_LOG%
    if errorlevel 1 (
        call :print_warning "Code formatting issues found (non-blocking)"
    ) else (
        call :print_success "Code formatting check passed"
    )
    cd ..
)

REM ============================================================================
REM STEP 5: Unit Tests
REM ============================================================================
if "%RUN_MODE%"=="full" if "%RUN_MODE%"=="quick" if "%RUN_MODE%"=="unit" (
    call :print_header "UNIT TESTS"
    set /a TOTAL_TESTS+=1

    cd backend

    if "%WATCH_MODE%"=="1" (
        echo Running unit tests in watch mode...
        call npm run test:watch
    ) else (
        echo Running unit tests with coverage... >> ..\%TEST_LOG%
        call npm test -- --coverage --maxWorkers=2 --silent 2>&1 >> ..\%TEST_LOG%
        if errorlevel 1 (
            call :print_error "Unit tests failed"
            set /a FAILED_TESTS+=1
        ) else (
            call :print_success "Unit tests passed"

            REM Display coverage summary
            if exist "coverage\coverage-summary.json" (
                echo.
                echo Coverage Summary:
                powershell -Command "Get-Content coverage\coverage-summary.json | ConvertFrom-Json | ForEach-Object { Write-Host ('  Lines: ' + $_.total.lines.pct + '%% | Branches: ' + $_.total.branches.pct + '%% | Functions: ' + $_.total.functions.pct + '%%') -ForegroundColor Cyan }"
                echo.
            )
        )
    )
    cd ..
)

REM ============================================================================
REM STEP 6: Integration Tests
REM ============================================================================
if "%RUN_MODE%"=="full" if "%RUN_MODE%"=="integration" (
    call :print_header "INTEGRATION TESTS"
    set /a TOTAL_TESTS+=1

    cd backend

    REM Setup test database
    echo Setting up test database... >> ..\%TEST_LOG%
    call npx prisma migrate deploy 2>&1 >> ..\%TEST_LOG%
    if errorlevel 1 (
        call :print_warning "Database migration failed - may need manual setup"
    )

    echo Running integration tests... >> ..\%TEST_LOG%
    call npm run test:integration 2>&1 >> ..\%TEST_LOG%
    if errorlevel 1 (
        call :print_error "Integration tests failed"
        set /a FAILED_TESTS+=1
    ) else (
        call :print_success "Integration tests passed"
    )
    cd ..
)

REM ============================================================================
REM STEP 7: Build Verification
REM ============================================================================
if "%RUN_MODE%"=="full" (
    call :print_header "BUILD VERIFICATION"
    set /a TOTAL_TESTS+=1

    REM Backend build
    echo Building backend... >> %TEST_LOG%
    cd backend
    call npm run build 2>&1 >> ..\%TEST_LOG%
    if errorlevel 1 (
        call :print_error "Backend build failed"
        set /a FAILED_TESTS+=1
    ) else (
        if exist "dist\" (
            call :print_success "Backend build successful"
        ) else (
            call :print_error "Backend dist directory not created"
            set /a FAILED_TESTS+=1
        )
    )
    cd ..

    REM Frontend build
    if "%SKIP_E2E%"=="0" (
        echo Building frontend... >> %TEST_LOG%
        cd frontend
        call npm run build 2>&1 >> ..\%TEST_LOG%
        if errorlevel 1 (
            call :print_error "Frontend build failed"
            set /a FAILED_TESTS+=1
        ) else (
            if exist ".next\" (
                call :print_success "Frontend build successful"
            ) else (
                call :print_error "Frontend .next directory not created"
                set /a FAILED_TESTS+=1
            )
        )
        cd ..
    )
)

REM ============================================================================
REM STEP 8: Security Audit
REM ============================================================================
if "%RUN_MODE%"=="full" (
    call :print_header "SECURITY AUDIT"
    set /a TOTAL_TESTS+=1

    echo Running npm audit... >> %TEST_LOG%

    cd backend
    call npm audit --production 2>&1 >> ..\%TEST_LOG%
    if errorlevel 1 (
        call :print_warning "Backend security vulnerabilities found (check log)"
    ) else (
        call :print_success "Backend security audit passed"
    )
    cd ..

    if "%SKIP_E2E%"=="0" (
        cd frontend
        call npm audit --production 2>&1 >> ..\%TEST_LOG%
        if errorlevel 1 (
            call :print_warning "Frontend security vulnerabilities found (check log)"
        ) else (
            call :print_success "Frontend security audit passed"
        )
        cd ..
    )
)

REM ============================================================================
REM STEP 9: Health Check
REM ============================================================================
if "%RUN_MODE%"=="full" (
    call :print_header "HEALTH CHECK"
    set /a TOTAL_TESTS+=1

    REM Check if backend is built
    if exist "backend\dist\" (
        cd backend
        echo Running health check... >> ..\%TEST_LOG%
        call npm run health:check-once 2>&1 >> ..\%TEST_LOG%
        if errorlevel 1 (
            call :print_warning "Health check completed with warnings"
        ) else (
            call :print_success "Health check passed"
        )
        cd ..
    ) else (
        call :print_warning "Skipping health check - backend not built"
    )
)

REM ============================================================================
REM STEP 10: E2E Tests (Optional)
REM ============================================================================
if "%SKIP_E2E%"=="0" if "%RUN_MODE%"=="full" if "%RUN_MODE%"=="e2e" (
    call :print_header "E2E TESTS"
    set /a TOTAL_TESTS+=1

    echo.
    call :print_warning "E2E tests require backend and frontend to be running"
    echo Please ensure:
    echo   1. Backend is running on http://localhost:3000
    echo   2. Frontend is running on http://localhost:3002
    echo   3. PostgreSQL and Redis are running
    echo.

    choice /C YN /M "Are services running? Continue with E2E tests"
    if errorlevel 2 (
        call :print_warning "E2E tests skipped"
    ) else (
        REM Install Playwright browsers if needed
        call npx playwright install --with-deps chromium 2>&1 >> %TEST_LOG%

        echo Running E2E tests... >> %TEST_LOG%
        call npx playwright test 2>&1 >> %TEST_LOG%
        if errorlevel 1 (
            call :print_error "E2E tests failed"
            set /a FAILED_TESTS+=1

            echo.
            echo To view the Playwright report, run:
            echo   npx playwright show-report
            echo.
        ) else (
            call :print_success "E2E tests passed"
        )
    )
)

REM ============================================================================
REM FINAL SUMMARY
REM ============================================================================
:test_summary
set "END_TIME=%time%"

echo. >> %TEST_LOG%
echo ============================================================================ >> %TEST_LOG%
echo Test Summary >> %TEST_LOG%
echo ============================================================================ >> %TEST_LOG%
echo Total Test Suites: %TOTAL_TESTS% >> %TEST_LOG%
echo Failed Test Suites: %FAILED_TESTS% >> %TEST_LOG%
echo Start Time: %START_TIME% >> %TEST_LOG%
echo End Time: %END_TIME% >> %TEST_LOG%
echo ============================================================================ >> %TEST_LOG%

echo.
echo ============================================================================
echo   TEST SUMMARY
echo ============================================================================

if %FAILED_TESTS% EQU 0 (
    call :print_success "ALL TESTS PASSED!"
    echo   Total Test Suites: %TOTAL_TESTS%
    echo   Failed: 0
    echo.
    echo   Status: READY FOR DEPLOYMENT
    echo ============================================================================
    echo.

    exit /b 0
) else (
    call :print_error "SOME TESTS FAILED"
    echo   Total Test Suites: %TOTAL_TESTS%
    echo   Failed: %FAILED_TESTS%
    echo.
    echo   Please review the log file: %TEST_LOG%
    echo ============================================================================
    echo.

    exit /b 1
)

REM ============================================================================
REM HELPER FUNCTIONS
REM ============================================================================

:print_header
echo.
echo ============================================================================
echo   %~1
echo ============================================================================
echo.
echo. >> %TEST_LOG%
echo ============================================================================ >> %TEST_LOG%
echo %~1 >> %TEST_LOG%
echo ============================================================================ >> %TEST_LOG%
exit /b 0

:print_success
powershell -Command "Write-Host '  [OK] %~1' -ForegroundColor Green"
echo [OK] %~1 >> %TEST_LOG%
exit /b 0

:print_error
powershell -Command "Write-Host '  [FAIL] %~1' -ForegroundColor Red"
echo [FAIL] %~1 >> %TEST_LOG%
exit /b 0

:print_warning
powershell -Command "Write-Host '  [WARN] %~1' -ForegroundColor Yellow"
echo [WARN] %~1 >> %TEST_LOG%
exit /b 0

:print_info
powershell -Command "Write-Host '  [INFO] %~1' -ForegroundColor Cyan"
echo [INFO] %~1 >> %TEST_LOG%
exit /b 0

:check_command
where %~1 >nul 2>&1
if errorlevel 1 (
    call :print_error "%~2 not found. Please install it first."
    exit /b 1
) else (
    call :print_success "%~2 found"
    exit /b 0
)

:test_failed
call :print_error "Prerequisites check failed"
echo Please ensure all required tools are installed and try again.
pause
exit /b 1

:show_help
echo.
echo NZ Water Compliance SaaS - Comprehensive Test Suite
echo.
echo Usage: test-comprehensive.bat [OPTIONS]
echo.
echo Options:
echo   --quick         Run quick tests only (skip builds, E2E)
echo   --unit          Run unit tests only
echo   --integration   Run integration tests only
echo   --e2e           Run E2E tests only
echo   --skip-e2e      Skip E2E tests
echo   --watch         Run tests in watch mode (unit tests only)
echo   --verbose       Show verbose output
echo   --help          Show this help message
echo.
echo Examples:
echo   test-comprehensive.bat                 Run full test suite
echo   test-comprehensive.bat --quick         Run quick tests
echo   test-comprehensive.bat --skip-e2e      Run all except E2E
echo   test-comprehensive.bat --unit --watch  Watch mode for unit tests
echo.
exit /b 0
