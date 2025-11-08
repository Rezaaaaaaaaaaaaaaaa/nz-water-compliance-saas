# ============================================================================
# NZ Water Compliance SaaS - Comprehensive Local Test Suite (PowerShell)
# Mimics GitHub Actions workflow for complete testing
# ============================================================================

param(
    [switch]$Quick,
    [switch]$SkipE2E,
    [switch]$Watch,
    [switch]$Verbose,
    [switch]$Unit,
    [switch]$Integration,
    [switch]$E2E,
    [switch]$Build,
    [switch]$Security,
    [switch]$Help,
    [switch]$Iterative
)

# Configuration
$ErrorActionPreference = "Continue"
$global:FailedTests = 0
$global:TotalTests = 0
$global:TestResults = @()
$StartTime = Get-Date
$LogFile = "test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Colors
function Write-Header {
    param([string]$Text)
    Write-Host "`n============================================================================" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "============================================================================`n" -ForegroundColor Cyan
    Add-Content -Path $LogFile -Value "`n============================================================================"
    Add-Content -Path $LogFile -Value $Text
    Add-Content -Path $LogFile -Value "============================================================================"
}

function Write-Success {
    param([string]$Text)
    Write-Host "  [OK] $Text" -ForegroundColor Green
    Add-Content -Path $LogFile -Value "[OK] $Text"
}

function Write-Failure {
    param([string]$Text)
    Write-Host "  [FAIL] $Text" -ForegroundColor Red
    Add-Content -Path $LogFile -Value "[FAIL] $Text"
    $global:FailedTests++
}

function Write-Warning {
    param([string]$Text)
    Write-Host "  [WARN] $Text" -ForegroundColor Yellow
    Add-Content -Path $LogFile -Value "[WARN] $Text"
}

function Write-Info {
    param([string]$Text)
    Write-Host "  [INFO] $Text" -ForegroundColor Cyan
    Add-Content -Path $LogFile -Value "[INFO] $Text"
}

function Test-Command {
    param([string]$Command, [string]$Name)
    $global:TotalTests++
    if (Get-Command $Command -ErrorAction SilentlyContinue) {
        Write-Success "$Name found"
        return $true
    } else {
        Write-Failure "$Name not found"
        return $false
    }
}

function Add-TestResult {
    param(
        [string]$Name,
        [string]$Status,
        [string]$Duration,
        [string]$Details = ""
    )
    $global:TestResults += [PSCustomObject]@{
        Name = $Name
        Status = $Status
        Duration = $Duration
        Details = $Details
    }
}

# Show help
if ($Help) {
    Write-Host @"

NZ Water Compliance SaaS - Comprehensive Test Suite

Usage: .\test-comprehensive.ps1 [OPTIONS]

Options:
  -Quick         Run quick tests only (skip builds, E2E)
  -Unit          Run unit tests only
  -Integration   Run integration tests only
  -E2E           Run E2E tests only
  -Build         Run build verification only
  -Security      Run security audit only
  -SkipE2E       Skip E2E tests in full run
  -Watch         Run tests in watch mode (unit tests only)
  -Iterative     Run tests iteratively with progress updates
  -Verbose       Show verbose output
  -Help          Show this help message

Examples:
  .\test-comprehensive.ps1                    Run full test suite
  .\test-comprehensive.ps1 -Quick             Run quick tests
  .\test-comprehensive.ps1 -SkipE2E           Run all except E2E
  .\test-comprehensive.ps1 -Unit -Watch       Watch mode for unit tests
  .\test-comprehensive.ps1 -Iterative         Run with detailed progress

"@
    exit 0
}

# Determine run mode
$RunMode = "full"
if ($Quick) { $RunMode = "quick"; $SkipE2E = $true }
if ($Unit) { $RunMode = "unit" }
if ($Integration) { $RunMode = "integration" }
if ($E2E) { $RunMode = "e2e" }
if ($Build) { $RunMode = "build" }
if ($Security) { $RunMode = "security" }

# Header
Write-Host "`n============================================================================" -ForegroundColor Cyan
Write-Host "  NZ Water Compliance SaaS - Comprehensive Test Suite" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  Mode: $RunMode" -ForegroundColor White
Write-Host "  Log: $LogFile" -ForegroundColor White
Write-Host "  Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "============================================================================`n" -ForegroundColor Cyan

Add-Content -Path $LogFile -Value "NZ Water Compliance SaaS - Test Results"
Add-Content -Path $LogFile -Value "Started: $(Get-Date)"
Add-Content -Path $LogFile -Value "Mode: $RunMode`n"

# ============================================================================
# STEP 0: Prerequisites Check
# ============================================================================
Write-Header "PREREQUISITES CHECK"

$prereqsPassed = $true
$prereqsPassed = $prereqsPassed -and (Test-Command "node" "Node.js")
$prereqsPassed = $prereqsPassed -and (Test-Command "npm" "npm")

$dockerAvailable = Test-Command "docker" "Docker"

if (Test-Path "backend\.env") {
    Write-Success "Backend .env file exists"
} else {
    Write-Warning "Backend .env file not found - using defaults"
}

if (-not $prereqsPassed) {
    Write-Failure "Prerequisites check failed"
    exit 1
}

# ============================================================================
# STEP 1: Start Services
# ============================================================================
if ($dockerAvailable -and ($RunMode -eq "full" -or $RunMode -eq "integration")) {
    Write-Header "STARTING SERVICES"

    $startTime = Get-Date
    docker compose up -d postgres redis 2>&1 | Add-Content -Path $LogFile

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Docker services started"
        Write-Info "Waiting for services to be ready..."
        Start-Sleep -Seconds 5
    } else {
        Write-Warning "Failed to start Docker services - ensure they're running manually"
    }

    Add-TestResult -Name "Service Startup" -Status "Success" -Duration "$((Get-Date) - $startTime)"
}

# ============================================================================
# STEP 2: Install Dependencies
# ============================================================================
if ($RunMode -eq "full" -or $RunMode -eq "quick") {
    Write-Header "INSTALLING DEPENDENCIES"
    $global:TotalTests++

    $startTime = Get-Date
    Push-Location backend
    npm install 2>&1 | Add-Content -Path ..\$LogFile

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Backend dependencies installed"
        Add-TestResult -Name "Backend Dependencies" -Status "Success" -Duration "$((Get-Date) - $startTime)"
    } else {
        Write-Failure "Backend dependency installation failed"
        Add-TestResult -Name "Backend Dependencies" -Status "Failed" -Duration "$((Get-Date) - $startTime)"
    }
    Pop-Location

    if (-not $SkipE2E) {
        $startTime = Get-Date
        Push-Location frontend
        npm install 2>&1 | Add-Content -Path ..\$LogFile

        if ($LASTEXITCODE -eq 0) {
            Write-Success "Frontend dependencies installed"
            Add-TestResult -Name "Frontend Dependencies" -Status "Success" -Duration "$((Get-Date) - $startTime)"
        } else {
            Write-Warning "Frontend dependency installation failed"
            Add-TestResult -Name "Frontend Dependencies" -Status "Warning" -Duration "$((Get-Date) - $startTime)"
        }
        Pop-Location
    }
}

# ============================================================================
# STEP 3: Generate Prisma Client
# ============================================================================
if ($RunMode -ne "e2e") {
    Write-Header "GENERATING PRISMA CLIENT"
    $global:TotalTests++

    $startTime = Get-Date
    Push-Location backend
    npx prisma generate 2>&1 | Add-Content -Path ..\$LogFile

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Prisma client generated"
        Add-TestResult -Name "Prisma Generation" -Status "Success" -Duration "$((Get-Date) - $startTime)"
    } else {
        Write-Failure "Prisma generation failed"
        Add-TestResult -Name "Prisma Generation" -Status "Failed" -Duration "$((Get-Date) - $startTime)"
    }
    Pop-Location
}

# ============================================================================
# STEP 4: Lint & Code Quality
# ============================================================================
if ($RunMode -eq "full") {
    Write-Header "LINT & CODE QUALITY"
    $global:TotalTests++

    Push-Location backend

    # ESLint
    $startTime = Get-Date
    npm run lint 2>&1 | Add-Content -Path ..\$LogFile

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Linting passed"
    } else {
        Write-Warning "Linting issues found (non-blocking)"
    }

    # Prettier
    npx prettier --check src 2>&1 | Add-Content -Path ..\$LogFile

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Code formatting check passed"
        Add-TestResult -Name "Lint & Format" -Status "Success" -Duration "$((Get-Date) - $startTime)"
    } else {
        Write-Warning "Code formatting issues found (non-blocking)"
        Add-TestResult -Name "Lint & Format" -Status "Warning" -Duration "$((Get-Date) - $startTime)"
    }

    Pop-Location
}

# ============================================================================
# STEP 5: Unit Tests
# ============================================================================
if ($RunMode -eq "full" -or $RunMode -eq "quick" -or $RunMode -eq "unit") {
    Write-Header "UNIT TESTS"
    $global:TotalTests++

    Push-Location backend

    if ($Watch) {
        Write-Info "Running unit tests in watch mode..."
        npm run test:watch
    } else {
        $startTime = Get-Date
        npm test -- --coverage --maxWorkers=2 --silent 2>&1 | Add-Content -Path ..\$LogFile

        if ($LASTEXITCODE -eq 0) {
            Write-Success "Unit tests passed"

            # Display coverage summary
            if (Test-Path "coverage\coverage-summary.json") {
                $coverage = Get-Content "coverage\coverage-summary.json" | ConvertFrom-Json
                $lines = [math]::Round($coverage.total.lines.pct, 2)
                $branches = [math]::Round($coverage.total.branches.pct, 2)
                $functions = [math]::Round($coverage.total.functions.pct, 2)

                Write-Host ""
                Write-Host "  Coverage Summary:" -ForegroundColor Cyan
                Write-Host "    Lines: $lines% | Branches: $branches% | Functions: $functions%" -ForegroundColor Cyan
                Write-Host ""

                Add-TestResult -Name "Unit Tests" -Status "Success" -Duration "$((Get-Date) - $startTime)" -Details "Coverage: $lines% lines"
            } else {
                Add-TestResult -Name "Unit Tests" -Status "Success" -Duration "$((Get-Date) - $startTime)"
            }
        } else {
            Write-Failure "Unit tests failed"
            Add-TestResult -Name "Unit Tests" -Status "Failed" -Duration "$((Get-Date) - $startTime)"
        }
    }

    Pop-Location
}

# ============================================================================
# STEP 6: Integration Tests
# ============================================================================
if ($RunMode -eq "full" -or $RunMode -eq "integration") {
    Write-Header "INTEGRATION TESTS"
    $global:TotalTests++

    Push-Location backend

    # Setup database
    Write-Info "Setting up test database..."
    npx prisma migrate deploy 2>&1 | Add-Content -Path ..\$LogFile

    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Database migration failed - may need manual setup"
    }

    # Run tests
    $startTime = Get-Date
    npm run test:integration 2>&1 | Add-Content -Path ..\$LogFile

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Integration tests passed"
        Add-TestResult -Name "Integration Tests" -Status "Success" -Duration "$((Get-Date) - $startTime)"
    } else {
        Write-Failure "Integration tests failed"
        Add-TestResult -Name "Integration Tests" -Status "Failed" -Duration "$((Get-Date) - $startTime)"
    }

    Pop-Location
}

# ============================================================================
# STEP 7: Build Verification
# ============================================================================
if ($RunMode -eq "full" -or $RunMode -eq "build") {
    Write-Header "BUILD VERIFICATION"
    $global:TotalTests++

    # Backend build
    Push-Location backend
    $startTime = Get-Date
    npm run build 2>&1 | Add-Content -Path ..\$LogFile

    if ($LASTEXITCODE -eq 0 -and (Test-Path "dist")) {
        Write-Success "Backend build successful"
        Add-TestResult -Name "Backend Build" -Status "Success" -Duration "$((Get-Date) - $startTime)"
    } else {
        Write-Failure "Backend build failed"
        Add-TestResult -Name "Backend Build" -Status "Failed" -Duration "$((Get-Date) - $startTime)"
    }
    Pop-Location

    # Frontend build
    if (-not $SkipE2E) {
        Push-Location frontend
        $startTime = Get-Date
        npm run build 2>&1 | Add-Content -Path ..\$LogFile

        if ($LASTEXITCODE -eq 0 -and (Test-Path ".next")) {
            Write-Success "Frontend build successful"
            Add-TestResult -Name "Frontend Build" -Status "Success" -Duration "$((Get-Date) - $startTime)"
        } else {
            Write-Failure "Frontend build failed"
            Add-TestResult -Name "Frontend Build" -Status "Failed" -Duration "$((Get-Date) - $startTime)"
        }
        Pop-Location
    }
}

# ============================================================================
# STEP 8: Security Audit
# ============================================================================
if ($RunMode -eq "full" -or $RunMode -eq "security") {
    Write-Header "SECURITY AUDIT"
    $global:TotalTests++

    $startTime = Get-Date

    # Backend audit
    Push-Location backend
    npm audit --production 2>&1 | Add-Content -Path ..\$LogFile
    $backendAudit = $LASTEXITCODE
    Pop-Location

    # Frontend audit
    if (-not $SkipE2E) {
        Push-Location frontend
        npm audit --production 2>&1 | Add-Content -Path ..\$LogFile
        $frontendAudit = $LASTEXITCODE
        Pop-Location
    }

    if ($backendAudit -eq 0) {
        Write-Success "Security audit passed"
        Add-TestResult -Name "Security Audit" -Status "Success" -Duration "$((Get-Date) - $startTime)"
    } else {
        Write-Warning "Security vulnerabilities found (check log)"
        Add-TestResult -Name "Security Audit" -Status "Warning" -Duration "$((Get-Date) - $startTime)" -Details "Vulnerabilities detected"
    }
}

# ============================================================================
# STEP 9: Health Check
# ============================================================================
if ($RunMode -eq "full") {
    Write-Header "HEALTH CHECK"
    $global:TotalTests++

    if (Test-Path "backend\dist") {
        Push-Location backend
        $startTime = Get-Date
        npm run health:check-once 2>&1 | Add-Content -Path ..\$LogFile

        if ($LASTEXITCODE -eq 0) {
            Write-Success "Health check passed"
            Add-TestResult -Name "Health Check" -Status "Success" -Duration "$((Get-Date) - $startTime)"
        } else {
            Write-Warning "Health check completed with warnings"
            Add-TestResult -Name "Health Check" -Status "Warning" -Duration "$((Get-Date) - $startTime)"
        }
        Pop-Location
    } else {
        Write-Warning "Skipping health check - backend not built"
    }
}

# ============================================================================
# STEP 10: E2E Tests
# ============================================================================
if (-not $SkipE2E -and ($RunMode -eq "full" -or $RunMode -eq "e2e")) {
    Write-Header "E2E TESTS"
    $global:TotalTests++

    Write-Host ""
    Write-Warning "E2E tests require backend and frontend to be running"
    Write-Host "  Please ensure:" -ForegroundColor Yellow
    Write-Host "    1. Backend is running on http://localhost:3000" -ForegroundColor Yellow
    Write-Host "    2. Frontend is running on http://localhost:3002" -ForegroundColor Yellow
    Write-Host "    3. PostgreSQL and Redis are running" -ForegroundColor Yellow
    Write-Host ""

    $response = Read-Host "Are services running? Continue with E2E tests? (y/n)"

    if ($response -eq 'y' -or $response -eq 'Y') {
        # Install Playwright browsers
        npx playwright install --with-deps chromium 2>&1 | Add-Content -Path $LogFile

        $startTime = Get-Date
        npx playwright test 2>&1 | Add-Content -Path $LogFile

        if ($LASTEXITCODE -eq 0) {
            Write-Success "E2E tests passed"
            Add-TestResult -Name "E2E Tests" -Status "Success" -Duration "$((Get-Date) - $startTime)"
        } else {
            Write-Failure "E2E tests failed"
            Write-Info "To view the Playwright report, run: npx playwright show-report"
            Add-TestResult -Name "E2E Tests" -Status "Failed" -Duration "$((Get-Date) - $startTime)"
        }
    } else {
        Write-Warning "E2E tests skipped"
        Add-TestResult -Name "E2E Tests" -Status "Skipped" -Duration "0s"
    }
}

# ============================================================================
# FINAL SUMMARY
# ============================================================================
$EndTime = Get-Date
$Duration = $EndTime - $StartTime

Write-Host "`n============================================================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================================`n" -ForegroundColor Cyan

# Display results table
if ($TestResults.Count -gt 0) {
    Write-Host "  Test Results:" -ForegroundColor White
    Write-Host ""
    $TestResults | Format-Table -Property Name, Status, Duration, Details -AutoSize | Out-String | ForEach-Object {
        if ($_ -match "Success") {
            Write-Host $_ -ForegroundColor Green
        } elseif ($_ -match "Failed") {
            Write-Host $_ -ForegroundColor Red
        } elseif ($_ -match "Warning") {
            Write-Host $_ -ForegroundColor Yellow
        } else {
            Write-Host $_
        }
    }
}

Write-Host "  Statistics:" -ForegroundColor White
Write-Host "    Total Test Suites: $global:TotalTests" -ForegroundColor White
Write-Host "    Failed: $global:FailedTests" -ForegroundColor White
Write-Host "    Duration: $($Duration.ToString('mm\:ss'))" -ForegroundColor White
Write-Host ""

if ($global:FailedTests -eq 0) {
    Write-Host "  Status: " -NoNewline -ForegroundColor White
    Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "  Ready for deployment" -ForegroundColor Green
    Write-Host ""
    Write-Host "============================================================================`n" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "  Status: " -NoNewline -ForegroundColor White
    Write-Host "SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "  Please review the log file: $LogFile" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "============================================================================`n" -ForegroundColor Cyan
    exit 1
}
