# ============================================================================
# FlowComply Platform - Fresh Rebuild Script
# ============================================================================
# This script completely tears down and rebuilds the entire platform
# Run this after starting Docker Desktop
# ============================================================================

Write-Host "`n" -NoNewline
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "  FlowComply Platform - Fresh Rebuild" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "`n"

# Step 1: Check Docker is running
Write-Host "[1/8] Checking Docker Desktop..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "      Docker is running" -ForegroundColor Green
} catch {
    Write-Host "      ERROR: Docker Desktop is not running!" -ForegroundColor Red
    Write-Host "      Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Step 2: Stop and remove all containers/volumes
Write-Host "`n[2/8] Stopping and removing all containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.test.yml down -v
if ($LASTEXITCODE -eq 0) {
    Write-Host "      Containers stopped and removed" -ForegroundColor Green
} else {
    Write-Host "      Warning: Some containers may not have been removed" -ForegroundColor Yellow
}

# Step 3: Clean Docker system
Write-Host "`n[3/8] Cleaning Docker system..." -ForegroundColor Yellow
docker system prune -f
Write-Host "      Docker system cleaned" -ForegroundColor Green

# Step 4: Clean frontend build cache
Write-Host "`n[4/8] Cleaning frontend build cache..." -ForegroundColor Yellow
if (Test-Path "frontend\.next") {
    Remove-Item -Recurse -Force "frontend\.next"
    Write-Host "      Removed frontend\.next" -ForegroundColor Green
}
if (Test-Path "frontend\node_modules\.cache") {
    Remove-Item -Recurse -Force "frontend\node_modules\.cache"
    Write-Host "      Removed frontend\node_modules\.cache" -ForegroundColor Green
}
Write-Host "      Frontend cache cleaned" -ForegroundColor Green

# Step 5: Clean backend build cache
Write-Host "`n[5/8] Cleaning backend build cache..." -ForegroundColor Yellow
if (Test-Path "backend\dist") {
    Remove-Item -Recurse -Force "backend\dist"
    Write-Host "      Removed backend\dist" -ForegroundColor Green
}
if (Test-Path "backend\node_modules\.cache") {
    Remove-Item -Recurse -Force "backend\node_modules\.cache"
    Write-Host "      Removed backend\node_modules\.cache" -ForegroundColor Green
}
Write-Host "      Backend cache cleaned" -ForegroundColor Green

# Step 6: Rebuild all containers from scratch
Write-Host "`n[6/8] Rebuilding all containers (this may take 5-10 minutes)..." -ForegroundColor Yellow
docker-compose -f docker-compose.test.yml build --no-cache
if ($LASTEXITCODE -eq 0) {
    Write-Host "      All containers rebuilt successfully" -ForegroundColor Green
} else {
    Write-Host "      ERROR: Container rebuild failed!" -ForegroundColor Red
    exit 1
}

# Step 7: Start all services
Write-Host "`n[7/8] Starting all services..." -ForegroundColor Yellow
docker-compose -f docker-compose.test.yml up -d
if ($LASTEXITCODE -eq 0) {
    Write-Host "      All services started" -ForegroundColor Green
} else {
    Write-Host "      ERROR: Failed to start services!" -ForegroundColor Red
    exit 1
}

# Step 8: Wait for services to be ready
Write-Host "`n[8/8] Waiting for services to be ready (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30
Write-Host "      Services should be ready" -ForegroundColor Green

# Final status check
Write-Host "`n" -NoNewline
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "  Checking Service Status" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "`n"

docker-compose -f docker-compose.test.yml ps

Write-Host "`n" -NoNewline
Write-Host "=" * 80 -ForegroundColor Green
Write-Host "  Platform Rebuild Complete!" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Green
Write-Host "`n"

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run smoke tests:  node scripts/smoke-tests.js" -ForegroundColor White
Write-Host "  2. Access frontend:  http://localhost:3001" -ForegroundColor White
Write-Host "  3. Access backend:   http://localhost:3000" -ForegroundColor White
Write-Host "  4. Test login with:  admin@flowcomply.local / password123" -ForegroundColor White
Write-Host "`n"
