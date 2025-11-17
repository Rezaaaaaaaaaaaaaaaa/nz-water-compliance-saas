# Comprehensive Test Runner Script
# Runs all test categories and generates a detailed report

param(
    [switch]$SkipConfig,
    [switch]$SkipUnit,
    [switch]$SkipIntegration,
    [switch]$SkipE2E,
    [switch]$SkipSmoke,
    [switch]$Quick
)

$ErrorActionPreference = "Continue"
$Global:TestResults = @()

function Write-TestHeader {
    param([string]$Title)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-TestResult {
    param(
        [string]$Category,
        [string]$Status,
        [int]$Passed = 0,
        [int]$Failed = 0,
        [int]$Total = 0,
        [double]$Duration = 0
    )

    $Global:TestResults += @{
        Category = $Category
        Status = $Status
        Passed = $Passed
        Failed = $Failed
        Total = $Total
        Duration = $Duration
    }

    $color = if ($Status -eq "PASSED") { "Green" } else { "Red" }
    Write-Host "[$Status] $Category - $Passed/$Total passed" -ForegroundColor $color
}

function Test-ServiceRunning {
    param([string]$Url)

    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

Write-Host @"
================================================================

        FlowComply Comprehensive Test Suite

================================================================
"@ -ForegroundColor Magenta

Write-Host "`nStarted at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# Change to backend directory
$backendDir = Join-Path $PSScriptRoot ".." "backend"
Set-Location $backendDir

# Check if services are running
Write-TestHeader "Service Availability Check"

$backendRunning = Test-ServiceRunning "http://localhost:3000/health"
$frontendRunning = Test-ServiceRunning "http://localhost:3001"

if ($backendRunning) {
    Write-Host "[✓] Backend service is running on port 3000" -ForegroundColor Green
} else {
    Write-Host "[✗] Backend service is NOT running on port 3000" -ForegroundColor Yellow
    Write-Host "    Some tests will be skipped. Start backend with: npm run dev" -ForegroundColor Gray
}

if ($frontendRunning) {
    Write-Host "[✓] Frontend service is running on port 3001" -ForegroundColor Green
} else {
    Write-Host "[✗] Frontend service is NOT running on port 3001" -ForegroundColor Yellow
    Write-Host "    Some tests will be skipped. Start frontend with: cd frontend && npm run dev" -ForegroundColor Gray
}

# 1. Configuration Validation Tests
if (-not $SkipConfig) {
    Write-TestHeader "Configuration Validation Tests"

    $start = Get-Date
    $output = npm test -- --testPathPattern=config-validation.test.ts --silent 2>&1
    $duration = (Get-Date) - $start

    if ($LASTEXITCODE -eq 0) {
        $passedMatch = $output | Select-String "(\d+) passed"
        $passed = if ($passedMatch) { [int]$passedMatch.Matches[0].Groups[1].Value } else { 0 }

        Write-TestResult -Category "Configuration Validation" -Status "PASSED" `
            -Passed $passed -Failed 0 -Total $passed `
            -Duration $duration.TotalSeconds
    } else {
        $failedMatch = $output | Select-String "(\d+) failed"
        $passedMatch = $output | Select-String "(\d+) passed"

        $failed = if ($failedMatch) { [int]$failedMatch.Matches[0].Groups[1].Value } else { 1 }
        $passed = if ($passedMatch) { [int]$passedMatch.Matches[0].Groups[1].Value } else { 0 }

        Write-TestResult -Category "Configuration Validation" -Status "FAILED" `
            -Passed $passed -Failed $failed -Total ($passed + $failed) `
            -Duration $duration.TotalSeconds

        Write-Host "`nError details:" -ForegroundColor Red
        Write-Host ($output | Select-Object -Last 20 | Out-String) -ForegroundColor Gray
    }
}

# 2. Unit Tests
if (-not $SkipUnit) {
    Write-TestHeader "Unit Tests"

    $start = Get-Date
    $output = npm test -- --testPathPattern=".*\.test\.ts$" --testPathIgnorePatterns="integration|config-validation|connectivity|deployment-smoke|environment-validation|api-contract|health-check" --silent 2>&1
    $duration = (Get-Date) - $start

    if ($LASTEXITCODE -eq 0) {
        $passedMatch = $output | Select-String "(\d+) passed"
        $passed = if ($passedMatch) { [int]$passedMatch.Matches[0].Groups[1].Value } else { 0 }

        Write-TestResult -Category "Unit Tests" -Status "PASSED" `
            -Passed $passed -Failed 0 -Total $passed `
            -Duration $duration.TotalSeconds
    } else {
        $failedMatch = $output | Select-String "(\d+) failed"
        $passedMatch = $output | Select-String "(\d+) passed"

        $failed = if ($failedMatch) { [int]$failedMatch.Matches[0].Groups[1].Value } else { 1 }
        $passed = if ($passedMatch) { [int]$passedMatch.Matches[0].Groups[1].Value } else { 0 }

        Write-TestResult -Category "Unit Tests" -Status "FAILED" `
            -Passed $passed -Failed $failed -Total ($passed + $failed) `
            -Duration $duration.TotalSeconds
    }
}

# 3. Environment Validation Tests
if (-not $SkipConfig) {
    Write-TestHeader "Environment-Specific Configuration Tests"

    $start = Get-Date
    $output = npm test -- --testPathPattern=environment-validation.test.ts --silent 2>&1
    $duration = (Get-Date) - $start

    if ($LASTEXITCODE -eq 0) {
        $passedMatch = $output | Select-String "(\d+) passed"
        $passed = if ($passedMatch) { [int]$passedMatch.Matches[0].Groups[1].Value } else { 0 }

        Write-TestResult -Category "Environment Validation" -Status "PASSED" `
            -Passed $passed -Failed 0 -Total $passed `
            -Duration $duration.TotalSeconds
    } else {
        $failedMatch = $output | Select-String "(\d+) failed"
        $passedMatch = $output | Select-String "(\d+) passed"

        $failed = if ($failedMatch) { [int]$failedMatch.Matches[0].Groups[1].Value } else { 1 }
        $passed = if ($passedMatch) { [int]$passedMatch.Matches[0].Groups[1].Value } else { 0 }

        Write-TestResult -Category "Environment Validation" -Status "FAILED" `
            -Passed $passed -Failed $failed -Total ($passed + $failed) `
            -Duration $duration.TotalSeconds

        Write-Host "`nError details:" -ForegroundColor Red
        Write-Host ($output | Select-Object -Last 20 | Out-String) -ForegroundColor Gray
    }
}

# 4. Connectivity Tests (requires services running)
if ($backendRunning -and -not $Quick) {
    Write-TestHeader "Frontend-to-Backend Connectivity Tests"

    $start = Get-Date
    $output = npm test -- --testPathPattern=connectivity.test.ts --silent 2>&1
    $duration = (Get-Date) - $start

    if ($LASTEXITCODE -eq 0) {
        $passedMatch = $output | Select-String "(\d+) passed"
        $passed = if ($passedMatch) { [int]$passedMatch.Matches[0].Groups[1].Value } else { 0 }

        Write-TestResult -Category "Connectivity Tests" -Status "PASSED" `
            -Passed $passed -Failed 0 -Total $passed `
            -Duration $duration.TotalSeconds
    } else {
        $failedMatch = $output | Select-String "(\d+) failed"
        $passedMatch = $output | Select-String "(\d+) passed"

        $failed = if ($failedMatch) { [int]$failedMatch.Matches[0].Groups[1].Value } else { 1 }
        $passed = if ($passedMatch) { [int]$passedMatch.Matches[0].Groups[1].Value } else { 0 }

        Write-TestResult -Category "Connectivity Tests" -Status "FAILED" `
            -Passed $passed -Failed $failed -Total ($passed + $failed) `
            -Duration $duration.TotalSeconds

        Write-Host "`nError details:" -ForegroundColor Red
        Write-Host ($output | Select-Object -Last 20 | Out-String) -ForegroundColor Gray
    }
}

# 5. Health Check Tests (requires backend running)
if ($backendRunning -and -not $Quick) {
    Write-TestHeader "Health Check Endpoint Tests"

    $start = Get-Date
    $output = npm test -- --testPathPattern=health-check.test.ts --silent 2>&1
    $duration = (Get-Date) - $start

    if ($LASTEXITCODE -eq 0) {
        $passedMatch = $output | Select-String "(\d+) passed"
        $passed = if ($passedMatch) { [int]$passedMatch.Matches[0].Groups[1].Value } else { 0 }

        Write-TestResult -Category "Health Check Tests" -Status "PASSED" `
            -Passed $passed -Failed 0 -Total $passed `
            -Duration $duration.TotalSeconds
    } else {
        $failedMatch = $output | Select-String "(\d+) failed"
        $passedMatch = $output | Select-String "(\d+) passed"

        $failed = if ($failedMatch) { [int]$failedMatch.Matches[0].Groups[1].Value } else { 1 }
        $passed = if ($passedMatch) { [int]$passedMatch.Matches[0].Groups[1].Value } else { 0 }

        Write-TestResult -Category "Health Check Tests" -Status "FAILED" `
            -Passed $passed -Failed $failed -Total ($passed + $failed) `
            -Duration $duration.TotalSeconds
    }
}

# 6. API Contract Tests (requires backend running)
if ($backendRunning -and -not $Quick) {
    Write-TestHeader "API Contract Validation Tests"

    $start = Get-Date
    $output = npm test -- --testPathPattern=api-contract.test.ts --silent 2>&1
    $duration = (Get-Date) - $start

    if ($LASTEXITCODE -eq 0) {
        $passedMatch = $output | Select-String "(\d+) passed"
        $passed = if ($passedMatch) { [int]$passedMatch.Matches[0].Groups[1].Value } else { 0 }

        Write-TestResult -Category "API Contract Tests" -Status "PASSED" `
            -Passed $passed -Failed 0 -Total $passed `
            -Duration $duration.TotalSeconds
    } else {
        $failedMatch = $output | Select-String "(\d+) failed"
        $passedMatch = $output | Select-String "(\d+) passed"

        $failed = if ($failedMatch) { [int]$failedMatch.Matches[0].Groups[1].Value } else { 1 }
        $passed = if ($passedMatch) { [int]$passedMatch.Matches[0].Groups[1].Value } else { 0 }

        Write-TestResult -Category "API Contract Tests" -Status "FAILED" `
            -Passed $passed -Failed $failed -Total ($passed + $failed) `
            -Duration $duration.TotalSeconds
    }
}

# 7. Integration Tests (requires backend running)
if ($backendRunning -and -not $SkipIntegration -and -not $Quick) {
    Write-TestHeader "Integration Tests"

    $start = Get-Date
    $output = npm test -- --testPathPattern=integration.test.ts --silent 2>&1
    $duration = (Get-Date) - $start

    if ($LASTEXITCODE -eq 0) {
        $passedMatch = $output | Select-String "(\d+) passed"
        $passed = if ($passedMatch) { [int]$passedMatch.Matches[0].Groups[1].Value } else { 0 }

        Write-TestResult -Category "Integration Tests" -Status "PASSED" `
            -Passed $passed -Failed 0 -Total $passed `
            -Duration $duration.TotalSeconds
    } else {
        $failedMatch = $output | Select-String "(\d+) failed"
        $passedMatch = $output | Select-String "(\d+) passed"

        $failed = if ($failedMatch) { [int]$failedMatch.Matches[0].Groups[1].Value } else { 1 }
        $passed = if ($passedMatch) { [int]$passedMatch.Matches[0].Groups[1].Value } else { 0 }

        Write-TestResult -Category "Integration Tests" -Status "FAILED" `
            -Passed $passed -Failed $failed -Total ($passed + $failed) `
            -Duration $duration.TotalSeconds
    }
}

# 8. Deployment Smoke Tests (requires both services running)
if ($backendRunning -and $frontendRunning -and -not $SkipSmoke -and -not $Quick) {
    Write-TestHeader "Deployment Smoke Tests"

    $start = Get-Date
    $output = npm test -- --testPathPattern=deployment-smoke.test.ts --silent 2>&1
    $duration = (Get-Date) - $start

    if ($LASTEXITCODE -eq 0) {
        $passedMatch = $output | Select-String "(\d+) passed"
        $passed = if ($passedMatch) { [int]$passedMatch.Matches[0].Groups[1].Value } else { 0 }

        Write-TestResult -Category "Deployment Smoke Tests" -Status "PASSED" `
            -Passed $passed -Failed 0 -Total $passed `
            -Duration $duration.TotalSeconds
    } else {
        $failedMatch = $output | Select-String "(\d+) failed"
        $passedMatch = $output | Select-String "(\d+) passed"

        $failed = if ($failedMatch) { [int]$failedMatch.Matches[0].Groups[1].Value } else { 1 }
        $passed = if ($passedMatch) { [int]$passedMatch.Matches[0].Groups[1].Value } else { 0 }

        Write-TestResult -Category "Deployment Smoke Tests" -Status "FAILED" `
            -Passed $passed -Failed $failed -Total ($passed + $failed) `
            -Duration $duration.TotalSeconds
    }
}

# Generate Summary Report
Write-Host "`n================================================================" -ForegroundColor Magenta
Write-Host "                                                                " -ForegroundColor Magenta
Write-Host "                    TEST SUMMARY REPORT                         " -ForegroundColor Magenta
Write-Host "                                                                " -ForegroundColor Magenta
Write-Host "================================================================`n" -ForegroundColor Magenta

$totalPassed = ($Global:TestResults | Measure-Object -Property Passed -Sum).Sum
$totalFailed = ($Global:TestResults | Measure-Object -Property Failed -Sum).Sum
$totalTests = $totalPassed + $totalFailed
$totalDuration = ($Global:TestResults | Measure-Object -Property Duration -Sum).Sum

Write-Host "Category                              Passed  Failed  Total   Duration" -ForegroundColor Cyan
Write-Host "──────────────────────────────────────────────────────────────────────" -ForegroundColor Gray

foreach ($result in $Global:TestResults) {
    $statusSymbol = if ($result.Status -eq "PASSED") { "[PASS]" } else { "[FAIL]" }
    $statusColor = if ($result.Status -eq "PASSED") { "Green" } else { "Red" }

    $categoryPadded = $result.Category.PadRight(30)
    $passedPadded = $result.Passed.ToString().PadLeft(6)
    $failedPadded = $result.Failed.ToString().PadLeft(7)
    $totalPadded = $result.Total.ToString().PadLeft(6)
    $durationFormatted = "{0:F2}s" -f $result.Duration

    Write-Host "$statusSymbol $categoryPadded" -NoNewline -ForegroundColor $statusColor
    Write-Host "$passedPadded $failedPadded $totalPadded   $durationFormatted"
}

Write-Host "──────────────────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "TOTAL".PadRight(36) -NoNewline -ForegroundColor Cyan
Write-Host "$($totalPassed.ToString().PadLeft(6)) $($totalFailed.ToString().PadLeft(7)) $($totalTests.ToString().PadLeft(6))   $("{0:F2}s" -f $totalDuration)"

Write-Host "`n"

# Overall Status
if ($totalFailed -eq 0 -and $totalTests -gt 0) {
    Write-Host "===============================================================" -ForegroundColor Green
    Write-Host "                                                               " -ForegroundColor Green
    Write-Host "               ALL TESTS PASSED                                " -ForegroundColor Green
    Write-Host "                                                               " -ForegroundColor Green
    Write-Host "===============================================================" -ForegroundColor Green
    Write-Host ""
    exit 0
} elseif ($totalFailed -gt 0) {
    Write-Host "===============================================================" -ForegroundColor Red
    Write-Host "                                                               " -ForegroundColor Red
    Write-Host "               SOME TESTS FAILED                               " -ForegroundColor Red
    Write-Host "                                                               " -ForegroundColor Red
    Write-Host "===============================================================" -ForegroundColor Red
    Write-Host ""
    exit 1
} else {
    Write-Host "===============================================================" -ForegroundColor Yellow
    Write-Host "                                                               " -ForegroundColor Yellow
    Write-Host "               NO TESTS WERE RUN                               " -ForegroundColor Yellow
    Write-Host "                                                               " -ForegroundColor Yellow
    Write-Host "===============================================================" -ForegroundColor Yellow
    Write-Host ""
    exit 0
}
