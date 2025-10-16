#!/bin/bash
# ============================================================================
# Quick Start Script for NZ Water Compliance SaaS (Unix/Linux/Mac)
# ============================================================================
# This script will:
# 1. Check prerequisites (Docker, Node.js)
# 2. Start Docker services (PostgreSQL, Redis)
# 3. Run database migrations
# 4. Seed database with dummy data
# 5. Start backend and frontend servers
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "============================================================================"
echo "  NZ Water Compliance SaaS - Quick Start"
echo "============================================================================"
echo ""

# Check if Docker is installed
echo "[1/8] Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: Docker is not installed or not in PATH${NC}"
    echo "Please install Docker from https://www.docker.com/get-started"
    exit 1
fi
echo -e "  - Docker: ${GREEN}OK${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed or not in PATH${NC}"
    echo "Please install Node.js 20+ from https://nodejs.org"
    exit 1
fi
echo -e "  - Node.js: ${GREEN}OK${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}ERROR: npm is not installed${NC}"
    exit 1
fi
echo -e "  - npm: ${GREEN}OK${NC}"

echo ""
echo "[2/8] Stopping any existing services..."
cd backend
docker-compose down > /dev/null 2>&1 || true
cd ..

echo ""
echo "[3/8] Starting Docker services (PostgreSQL, Redis)..."
cd backend
docker-compose up -d
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to start Docker services${NC}"
    exit 1
fi
cd ..

echo -e "  - PostgreSQL: ${GREEN}Starting...${NC}"
echo -e "  - Redis: ${GREEN}Starting...${NC}"

echo ""
echo "[4/8] Waiting for services to be ready (15 seconds)..."
sleep 15

echo ""
echo "[5/8] Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "  - Running npm install..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR: Failed to install backend dependencies${NC}"
        exit 1
    fi
else
    echo "  - Dependencies already installed"
fi

echo ""
echo "[6/8] Running database migrations..."
npx prisma migrate deploy || {
    echo -e "${YELLOW}WARNING: migrate deploy failed, trying db push...${NC}"
    npx prisma db push --skip-generate
}

echo ""
echo "  - Generating Prisma client..."
npx prisma generate

echo ""
echo "[7/8] Seeding database with dummy data..."
npm run prisma:seed || {
    echo -e "${YELLOW}WARNING: Database seeding failed (might already be seeded)${NC}"
    echo "Continuing anyway..."
}

cd ..

echo ""
echo "[8/8] Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "  - Running npm install..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR: Failed to install frontend dependencies${NC}"
        exit 1
    fi
else
    echo "  - Dependencies already installed"
fi
cd ..

echo ""
echo "============================================================================"
echo "  Setup Complete!"
echo "============================================================================"
echo ""
echo "  Services:"
echo "   - PostgreSQL:  localhost:5432"
echo "   - Redis:       localhost:6379"
echo "   - Backend API: http://localhost:3000 (starting...)"
echo "   - Frontend:    http://localhost:3001 (starting...)"
echo ""
echo "  Database Tools:"
echo "   - Prisma Studio: Run 'npx prisma studio' in backend/"
echo "   - Adminer:       Run 'docker-compose --profile dev up -d' then visit http://localhost:8080"
echo ""
echo "  Test Credentials:"
echo "   - Admin:      admin@compliance-saas.co.nz / password123"
echo "   - Manager:    compliance@wcc.govt.nz / password123"
echo "   - Inspector:  inspector@wcc.govt.nz / password123"
echo "   - Auditor:    auditor@taumataarowai.govt.nz / password123"
echo ""
echo "============================================================================"
echo ""
echo "Starting servers..."
echo "Press Ctrl+C to stop"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup INT TERM

# Start backend in background
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a bit before starting frontend
sleep 3

# Start frontend in background
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}Servers started!${NC}"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Opening browser in 10 seconds..."
sleep 10

# Open browser (cross-platform)
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3001 &
elif command -v open &> /dev/null; then
    open http://localhost:3001 &
fi

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
