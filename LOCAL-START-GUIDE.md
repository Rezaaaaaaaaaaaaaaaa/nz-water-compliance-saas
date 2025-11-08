# Local Start Guide - FlowComply Water Compliance SaaS

## Quick Start (Recommended)

The easiest way to start the application with automatic issue resolution:

```bash
npm start
```

This single command will:
- ✅ Detect and resolve port conflicts
- ✅ Update configurations automatically
- ✅ Start Docker services (PostgreSQL, Redis)
- ✅ Seed database with test data
- ✅ Start backend on port 5000
- ✅ Start frontend on port 3000
- ✅ Test all endpoints
- ✅ Verify login functionality

## What Gets Fixed Automatically

### 1. Port Conflicts
**Problem**: Multiple processes fighting for the same port
**Solution**: Automatically detects conflicts and kills conflicting processes

### 2. Configuration Mismatches
**Problem**: Frontend pointing to wrong backend port
**Solution**: Updates `.env` files to ensure correct ports

### 3. Database Not Seeded
**Problem**: Empty database with no test data
**Solution**: Automatically runs migrations and seeds database

### 4. Services Not Running
**Problem**: PostgreSQL or Redis not started
**Solution**: Starts Docker services automatically

### 5. Prisma Client Outdated
**Problem**: Schema changes not reflected
**Solution**: Regenerates Prisma client

## Output Example

```
============================================================================
  Local Start & Test - FlowComply Water Compliance SaaS
============================================================================

🔍 Running diagnostics...

============================================================================
  STEP 1: Prerequisites Check
============================================================================

  ✓ Node.js: v20.10.0
  ✓ npm: 10.2.3
  ✓ Docker: 24.0.7

============================================================================
  STEP 2: Port Conflict Detection
============================================================================

  ✗ Port 3000 (frontend) is in use
  → Killing processes on port 3000...
  ✓ Port 3000 is now free
  ✓ Port 5000 (backend) is available
  ✓ Port 5432 (postgres) is in use
  ✓ Port 6379 (redis) is in use

============================================================================
  STEP 3: Configuration Update
============================================================================

  ✓ Updated backend port to 5000
  ✓ Updated frontend API URL to port 5000

============================================================================
  STEP 4: Starting Docker Services
============================================================================

  → Starting PostgreSQL and Redis...
  ✓ Docker services starting...

============================================================================
  STEP 5: Database Setup
============================================================================

  → Generating Prisma client...
  ✓ Prisma client generated
  → Running database migrations...
  ✓ Database migrations applied
  → Seeding database with test data...
  ✓ Database seeded successfully

============================================================================
  STEP 6: Starting Backend Server
============================================================================

  → Starting backend on port 5000...
  ✓ Backend server started
  ⏳ Waiting for backend to be ready
  .....
  ✓ Backend is responding

============================================================================
  STEP 7: Backend API Testing
============================================================================

  → Testing health endpoint...
  ✓ Health endpoint OK (200)
  → Testing login endpoint...
  ✓ Login endpoint working (200)
  ✓ JWT token received

============================================================================
  STEP 8: Starting Frontend Server
============================================================================

  → Starting frontend on port 3000...
  ✓ Frontend server started
  ⏳ Waiting for frontend to be ready
  ...............
  ✓ Frontend is responding

============================================================================
  SUMMARY
============================================================================

✅ Fixes Applied:
   • Freed port 3000
   • Updated backend/.env PORT to 5000
   • Created frontend/.env.local
   • Database seeded with test data


🎉 Application Started!

📍 Access URLs:
   Frontend:  http://localhost:3000
   Backend:   http://localhost:5000
   API Docs:  http://localhost:5000/api/v1/docs

🔑 Test Credentials:
   Email:     admin@compliance-saas.co.nz
   Password:  password123

💡 Tip: Press Ctrl+C to stop all services
```

## Manual Start (Advanced)

If you prefer manual control:

### 1. Start Docker Services
```bash
docker compose up -d postgres redis
```

### 2. Setup Database
```bash
cd backend
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
```

### 3. Start Backend
```bash
cd backend
PORT=5000 npm run dev
```

### 4. Start Frontend
```bash
cd frontend
PORT=3000 npm run dev
```

## Test Credentials

All test users have the same password: `password123`

| Role | Email | Access Level |
|------|-------|--------------|
| System Admin | admin@compliance-saas.co.nz | Full access |
| Compliance Manager | compliance@wcc.govt.nz | Organization admin |
| Inspector | inspector@wcc.govt.nz | Asset inspector |
| Auditor | auditor@taumataarowai.govt.nz | Read-only auditor |

## Troubleshooting

### "Port already in use" Error
**Solution**: The script automatically kills conflicting processes. If it fails, manually run:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Docker Services Won't Start
**Solution**: Ensure Docker Desktop is running:
```bash
docker ps  # Should list running containers
```

### Database Connection Error
**Solution**: Check PostgreSQL is running and accessible:
```bash
docker compose ps  # Should show postgres as healthy
```

### Login Fails
**Solution**: Ensure database is seeded:
```bash
cd backend && npm run prisma:seed
```

### Frontend Can't Connect to Backend
**Solution**: Check frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

## Advanced Features

### Run with Verbose Output
```bash
# Modify tools/local-start.js and set stdio to 'inherit'
```

### Custom Ports
Edit `backend/.env`:
```env
PORT=5000  # Backend port
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### Skip Database Seeding
Comment out the seeding step in `tools/local-start.js`

## Compare: Manual vs Automatic

| Task | Manual | Automatic (npm start) |
|------|--------|----------------------|
| Check prerequisites | Manual commands | ✅ Automatic |
| Detect port conflicts | Manual netstat | ✅ Automatic |
| Kill conflicting processes | Manual taskkill | ✅ Automatic |
| Update configurations | Manual editing | ✅ Automatic |
| Start Docker | Manual command | ✅ Automatic |
| Seed database | Manual command | ✅ Automatic |
| Start backend | Manual command | ✅ Automatic |
| Start frontend | Manual command | ✅ Automatic |
| Test endpoints | Manual curl | ✅ Automatic |
| Verify login | Manual browser test | ✅ Automatic |
| **Total Time** | ~10-15 minutes | ~2-3 minutes |
| **Error-prone?** | Yes | No |

## What's Next?

After starting the application:

1. **Access the app**: http://localhost:3000
2. **Login** with test credentials
3. **Explore features**:
   - Dashboard with analytics
   - Asset management
   - Compliance plan tracking (DWSP)
   - Document management
   - Reports and exports

4. **API Documentation**: http://localhost:5000/api/v1/docs

## Support

For issues not automatically resolved:
1. Check the console output for specific errors
2. Review the log files
3. Ensure all prerequisites are installed
4. Try stopping all services and running `npm start` again

---

**Last Updated**: 2025-11-08
**Version**: 2.0 (Enhanced with automatic issue resolution)
