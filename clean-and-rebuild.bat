@echo off
REM ============================================================================
REM Clean Cache and Fresh Rebuild Script
REM ============================================================================
REM This script will:
REM 1. Kill all Node.js processes
REM 2. Clear all build caches (backend and frontend)
REM 3. Delete node_modules and reinstall dependencies
REM 4. Rebuild both backend and frontend
REM 5. Restart the development servers
REM ============================================================================

echo.
echo ============================================================================
echo  Clean Cache and Fresh Rebuild
echo ============================================================================
echo.

REM Step 1: Kill all Node processes
echo [1/8] Killing all Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo   - Node processes killed
) else (
    echo   - No Node processes running
)
timeout /t 2 /nobreak >nul

REM Step 2: Clear backend cache
echo.
echo [2/8] Clearing backend cache...
cd backend

if exist dist (
    echo   - Removing dist folder...
    rmdir /s /q dist
)

if exist node_modules (
    echo   - Removing node_modules...
    rmdir /s /q node_modules
)

if exist package-lock.json (
    echo   - Removing package-lock.json...
    del package-lock.json
)

echo   - Clearing npm cache...
call npm cache clean --force >nul 2>&1

echo   - Backend cache cleared
cd ..

REM Step 3: Clear frontend cache
echo.
echo [3/8] Clearing frontend cache...
cd frontend

if exist .next (
    echo   - Removing .next folder...
    rmdir /s /q .next
)

if exist node_modules (
    echo   - Removing node_modules...
    rmdir /s /q node_modules
)

if exist package-lock.json (
    echo   - Removing package-lock.json...
    del package-lock.json
)

if exist out (
    echo   - Removing out folder...
    rmdir /s /q out
)

echo   - Frontend cache cleared
cd ..

REM Step 4: Reinstall backend dependencies
echo.
echo [4/8] Reinstalling backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo   - Backend dependencies installed
cd ..

REM Step 5: Generate Prisma client
echo.
echo [5/8] Generating Prisma client...
cd backend
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)
echo   - Prisma client generated
cd ..

REM Step 6: Build backend
echo.
echo [6/8] Building backend...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo WARNING: Backend build had issues, continuing anyway...
)
echo   - Backend build complete
cd ..

REM Step 7: Reinstall frontend dependencies
echo.
echo [7/8] Reinstalling frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo   - Frontend dependencies installed
cd ..

REM Step 8: Build frontend (optional - dev mode will build on demand)
echo.
echo [8/8] Building frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo WARNING: Frontend build had issues, continuing anyway...
)
echo   - Frontend build complete
cd ..

echo.
echo ============================================================================
echo  ✅ Clean and Rebuild Complete!
echo ============================================================================
echo.
echo  All caches cleared and dependencies reinstalled.
echo.
echo  Starting development servers...
echo.

REM Start backend in new window
start "Backend Server (Port 3000)" cmd /k "cd backend && npm run dev"

REM Wait a bit before starting frontend
timeout /t 3 /nobreak >nul

REM Start frontend in new window
start "Frontend Server (Port 3002)" cmd /k "cd frontend && npm run dev"

echo.
echo  Servers starting in separate windows...
echo  - Backend:  http://localhost:3000
echo  - Frontend: http://localhost:3002
echo.
echo  Opening browser in 10 seconds...
timeout /t 10 /nobreak >nul

REM Open browser
start http://localhost:3002

echo.
echo Done! Check the new terminal windows for server logs.
echo.
pause
