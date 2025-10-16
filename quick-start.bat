@echo off
REM ============================================================================
REM Quick Start Script for NZ Water Compliance SaaS (Windows)
REM ============================================================================
REM This script will:
REM 1. Check prerequisites (Docker, Node.js)
REM 2. Start Docker services (PostgreSQL, Redis)
REM 3. Run database migrations
REM 4. Seed database with dummy data
REM 5. Start backend and frontend servers
REM ============================================================================

echo.
echo ============================================================================
echo  NZ Water Compliance SaaS - Quick Start
echo ============================================================================
echo.

REM Check if Docker is installed
echo [1/8] Checking prerequisites...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo   - Docker: OK

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 20+ from https://nodejs.org
    pause
    exit /b 1
)
echo   - Node.js: OK

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed
    pause
    exit /b 1
)
echo   - npm: OK

echo.
echo [2/8] Stopping any existing services...
cd backend
docker-compose down >nul 2>&1
cd ..

echo.
echo [3/8] Starting Docker services (PostgreSQL, Redis)...
cd backend
docker-compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Failed to start Docker services
    pause
    exit /b 1
)
cd ..

echo   - PostgreSQL: Starting...
echo   - Redis: Starting...

echo.
echo [4/8] Waiting for services to be ready (15 seconds)...
timeout /t 15 /nobreak >nul

echo.
echo [5/8] Installing backend dependencies...
cd backend
if not exist node_modules (
    echo   - Running npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo   - Dependencies already installed
)

echo.
echo [6/8] Running database migrations...
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo ERROR: Failed to run database migrations
    echo Trying with db push instead...
    call npx prisma db push --skip-generate
)

echo.
echo   - Generating Prisma client...
call npx prisma generate

echo.
echo [7/8] Seeding database with dummy data...
call npm run prisma:seed
if %errorlevel% neq 0 (
    echo WARNING: Database seeding failed (might already be seeded)
    echo Continuing anyway...
)

cd ..

echo.
echo [8/8] Installing frontend dependencies...
cd frontend
if not exist node_modules (
    echo   - Running npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo   - Dependencies already installed
)
cd ..

echo.
echo ============================================================================
echo  Setup Complete!
echo ============================================================================
echo.
echo  Services:
echo   - PostgreSQL:  localhost:5432
echo   - Redis:       localhost:6379
echo   - Backend API: http://localhost:3000 (starting...)
echo   - Frontend:    http://localhost:3001 (starting...)
echo.
echo  Database Tools:
echo   - Prisma Studio: Run 'npx prisma studio' in backend/
echo   - Adminer:       Run 'docker-compose --profile dev up -d' then visit http://localhost:8080
echo.
echo  Test Credentials:
echo   - Admin:      admin@compliance-saas.co.nz / password123
echo   - Manager:    compliance@wcc.govt.nz / password123
echo   - Inspector:  inspector@wcc.govt.nz / password123
echo   - Auditor:    auditor@taumataarowai.govt.nz / password123
echo.
echo ============================================================================
echo.
echo Starting servers in new windows...
echo Press Ctrl+C in each window to stop the servers
echo.

REM Start backend in new window
start "Backend Server (Port 3000)" cmd /k "cd backend && npm run dev"

REM Wait a bit before starting frontend
timeout /t 3 /nobreak >nul

REM Start frontend in new window
start "Frontend Server (Port 3001)" cmd /k "cd frontend && npm run dev"

echo.
echo Opening browser in 10 seconds...
timeout /t 10 /nobreak >nul

REM Open browser
start http://localhost:3001

echo.
echo Done! Check the new terminal windows for server logs.
echo.
pause
