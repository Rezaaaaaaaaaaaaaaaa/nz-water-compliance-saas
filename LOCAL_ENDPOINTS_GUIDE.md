# 🔗 Local Development Endpoints Guide

**Last Updated:** 2025-10-16
**Status:** Environment Partially Running ⚠️

---

## 📊 Current Service Status

### ✅ RUNNING SERVICES

| Service | URL | Status | Notes |
|---------|-----|--------|-------|
| **Frontend (Next.js)** | http://localhost:3001 | ✅ RUNNING | Main application UI |
| **Prisma Studio** | http://localhost:5555 | ✅ RUNNING | Database GUI |
| **PostgreSQL** | localhost:5432 | ✅ RUNNING | Database server |
| **Redis** | localhost:6379 | ✅ RUNNING | Cache server |

### ⚠️ SERVICES NEEDING ATTENTION

| Service | Expected URL | Status | Issue |
|---------|-------------|--------|-------|
| **Backend API** | http://localhost:3000 | ⚠️ NOT STARTED | Port conflict - frontend on port 3000 |

**IMPORTANT NOTE**: There are multiple duplicate processes running. The backend isn't starting because:
1. A frontend process (PID 18412) is occupying port 3000
2. Multiple frontend shells are running simultaneously
3. The backend tsx compilation is silently failing

**TO FIX**:
```bash
# Kill the rogue process on port 3000
# In PowerShell (run as admin):
Stop-Process -Id 18412 -Force

# Or in Command Prompt:
taskkill /F /PID 18412

# Then restart the backend:
cd backend
npm run dev
```

---

## 🌐 Frontend URLs (Port 3001)

### Main Application
```
http://localhost:3001
```

**Features:**
- Landing page with product information
- Login page: http://localhost:3001/login
- Register page: http://localhost:3001/register
- Dashboard: http://localhost:3001/dashboard

### Dashboard Pages
```
http://localhost:3001/dashboard          # Main dashboard
http://localhost:3001/dashboard/assets   # Asset management
http://localhost:3001/dashboard/compliance # Compliance plans
http://localhost:3001/dashboard/documents # Document management
http://localhost:3001/dashboard/reports  # Reports
http://localhost:3001/dashboard/analytics # Analytics dashboard
http://localhost:3001/dashboard/ai       # AI features
http://localhost:3001/dashboard/monitoring # System monitoring
```

**Test Credentials:**
- Email: `compliance@wcc.govt.nz`
- Password: `password123`

---

## 🔌 Backend API URLs (Port 3000)

### Health Checks
```
http://localhost:3000/health             # General health
http://localhost:3000/health/db          # Database health
http://localhost:3000/health/redis       # Redis health
```

### API Root
```
http://localhost:3000/api/v1             # API info
```

### Authentication Endpoints
```
POST http://localhost:3000/api/v1/auth/register  # Register user
POST http://localhost:3000/api/v1/auth/login     # Login
GET  http://localhost:3000/api/v1/auth/me        # Current user (requires auth)
POST http://localhost:3000/api/v1/auth/refresh   # Refresh token
POST http://localhost:3000/api/v1/auth/logout    # Logout
```

### Asset Endpoints
```
GET    http://localhost:3000/api/v1/assets           # List assets
POST   http://localhost:3000/api/v1/assets           # Create asset
GET    http://localhost:3000/api/v1/assets/statistics # Asset stats
GET    http://localhost:3000/api/v1/assets/:id       # Get asset
PATCH  http://localhost:3000/api/v1/assets/:id       # Update asset
DELETE http://localhost:3000/api/v1/assets/:id       # Delete asset
```

### Document Endpoints
```
GET    http://localhost:3000/api/v1/documents            # List documents
POST   http://localhost:3000/api/v1/documents            # Create document
POST   http://localhost:3000/api/v1/documents/upload-url # Get S3 upload URL
GET    http://localhost:3000/api/v1/documents/:id        # Get document
GET    http://localhost:3000/api/v1/documents/:id/download # Download
DELETE http://localhost:3000/api/v1/documents/:id        # Delete document
```

### Compliance (DWSP) Endpoints
```
GET    http://localhost:3000/api/v1/compliance/dwsp        # List DWSPs
POST   http://localhost:3000/api/v1/compliance/dwsp        # Create DWSP
GET    http://localhost:3000/api/v1/compliance/dwsp/:id    # Get DWSP
PATCH  http://localhost:3000/api/v1/compliance/dwsp/:id    # Update DWSP
POST   http://localhost:3000/api/v1/compliance/dwsp/:id/validate   # Validate
POST   http://localhost:3000/api/v1/compliance/dwsp/:id/approve    # Approve
POST   http://localhost:3000/api/v1/compliance/dwsp/:id/submit     # Submit
DELETE http://localhost:3000/api/v1/compliance/dwsp/:id    # Delete DWSP
```

### Analytics Endpoints
```
GET http://localhost:3000/api/v1/analytics/dashboard       # Dashboard data
GET http://localhost:3000/api/v1/analytics/compliance/overview # Compliance overview
GET http://localhost:3000/api/v1/analytics/assets          # Asset analytics
GET http://localhost:3000/api/v1/analytics/documents       # Document analytics
GET http://localhost:3000/api/v1/analytics/dwsp-trends     # DWSP trends
GET http://localhost:3000/api/v1/analytics/activity        # Activity timeline
GET http://localhost:3000/api/v1/analytics/users           # User activity
```

### Export Endpoints
```
GET http://localhost:3000/api/v1/export/assets?format=csv              # Export assets
GET http://localhost:3000/api/v1/export/documents?format=csv           # Export documents
GET http://localhost:3000/api/v1/export/compliance-plans?format=csv    # Export plans
GET http://localhost:3000/api/v1/export/audit-logs?format=csv          # Export audit logs
GET http://localhost:3000/api/v1/export/compliance-overview?format=text # Overview report
```

### AI Endpoints
```
POST   http://localhost:3000/api/ai/ask                     # AI assistant chat
POST   http://localhost:3000/api/ai/analyze-dwsp            # Analyze DWSP document
POST   http://localhost:3000/api/ai/analyze-water-quality   # Analyze water quality
POST   http://localhost:3000/api/ai/generate-summary        # Generate report summary
GET    http://localhost:3000/api/ai/usage                   # AI usage stats
GET    http://localhost:3000/api/ai/conversations           # Conversation history
DELETE http://localhost:3000/api/ai/conversations/:sessionId # Delete conversation
PUT    http://localhost:3000/api/ai/tier                    # Update AI tier
```

### Monitoring Endpoints
```
GET http://localhost:3000/api/v1/monitoring/system  # System health
GET http://localhost:3000/api/v1/monitoring/queues  # Queue statistics
GET http://localhost:3000/api/v1/monitoring/workers # Worker status
```

---

## 💾 Database Tools

### Prisma Studio
```
http://localhost:5555
```

**Features:**
- Visual database browser
- Edit records directly
- View all tables and relationships
- Query data with filters

**How to Access:**
1. Already running in background
2. Open browser to http://localhost:5555
3. Browse tables: User, Organization, Asset, Document, CompliancePlan, etc.

**To stop:**
```bash
# Find process on port 5555
netstat -ano | findstr :5555
# Kill the process ID shown
```

### Adminer (PostgreSQL Web UI)
```
http://localhost:8080  # Not currently running
```

**To start:**
```bash
cd backend
docker-compose --profile dev up -d
```

**Login credentials:**
- System: `PostgreSQL`
- Server: `postgres`
- Username: `postgres`
- Password: `password`
- Database: `compliance_saas`

### Redis Insight
```
http://localhost:8001  # Not currently running
```

**To start:**
```bash
cd backend
docker-compose --profile dev up -d
```

---

## 🐳 Docker Services

### Running Containers
```bash
# View status
docker ps

# Expected containers:
# - compliance-saas-postgres (port 5432)
# - compliance-saas-redis (port 6379)
```

### PostgreSQL
```
Host: localhost
Port: 5432
Username: postgres
Password: password
Database: compliance_saas
```

**Direct connection:**
```bash
# Using psql
docker exec -it compliance-saas-postgres psql -U postgres -d compliance_saas

# Sample queries
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Organization";
SELECT COUNT(*) FROM "Asset";
```

### Redis
```
Host: localhost
Port: 6379
Password: (none)
```

**Direct connection:**
```bash
# Using redis-cli
docker exec -it compliance-saas-redis redis-cli

# Sample commands
PING
KEYS *
GET some-key
```

---

## 📝 Quick Testing Commands

### Test Backend Health (when running)
```bash
# Health check
curl http://localhost:3000/health

# Database health
curl http://localhost:3000/health/db

# Redis health
curl http://localhost:3000/health/redis

# API info
curl http://localhost:3000/api/v1
```

### Test Authentication
```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@compliance-saas.co.nz","password":"password123"}'

# This will return a token, use it for authenticated requests:
curl http://localhost:3000/api/v1/assets \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Frontend
```bash
# Home page
curl -I http://localhost:3001

# Login page
curl -I http://localhost:3001/login

# Dashboard (will redirect if not authenticated)
curl -I http://localhost:3001/dashboard
```

---

## 🔧 Troubleshooting

### Backend Not Responding

**Problem:** `curl http://localhost:3000/health` fails or returns HTML

**Solutions:**

1. **Check if backend is actually running:**
   ```bash
   netstat -ano | findstr :3000
   ```

2. **Restart backend:**
   ```bash
   cd backend
   npm run dev
   ```

3. **Check logs for errors:**
   - Look in the terminal where `npm run dev` is running
   - Check for TypeScript compilation errors
   - Verify database connection

### Port Conflicts

**Problem:** Port already in use

**Solutions:**

1. **Find what's using the port:**
   ```bash
   # Windows
   netstat -ano | findstr :3000

   # Then kill the process
   taskkill /PID <process_id> /F
   ```

2. **Change port in .env:**
   ```bash
   # backend/.env
   PORT=3002  # Use different port

   # Don't forget to update frontend .env.local:
   # NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1
   ```

### Database Connection Failed

**Problem:** Cannot connect to database

**Solutions:**

1. **Verify PostgreSQL is running:**
   ```bash
   docker ps | grep postgres
   ```

2. **Check database password in .env:**
   ```bash
   # backend/.env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/compliance_saas?schema=public"
   #                                  ^^^^^^^^ Must match docker-compose.yml
   ```

3. **Restart database:**
   ```bash
   cd backend
   docker-compose restart postgres
   ```

### Frontend Shows Errors

**Problem:** Frontend displays error page or won't load

**Solutions:**

1. **Check if running on correct port:**
   ```bash
   # Should show port 3001, not 3000
   netstat -ano | findstr :3001
   ```

2. **Restart frontend with PORT variable:**
   ```bash
   cd frontend
   PORT=3001 npm run dev
   ```

3. **Clear Next.js cache:**
   ```bash
   cd frontend
   rm -rf .next
   npm run dev
   ```

---

## 🎯 Recommended Workflow

### 1. Start Infrastructure
```bash
cd backend
docker-compose up -d
```

### 2. Start Backend
```bash
cd backend
npm run dev
# Wait for "Server listening at http://0.0.0.0:3000"
```

### 3. Start Frontend
```bash
cd frontend
PORT=3001 npm run dev
# Wait for "Ready on http://localhost:3001"
```

### 4. Access Application
- **Frontend:** http://localhost:3001
- **Login:** http://localhost:3001/login
  - Email: `compliance@wcc.govt.nz`
  - Password: `password123`

### 5. Browse Database (Optional)
- **Prisma Studio:** http://localhost:5555
- Or run: `cd backend && npx prisma studio`

---

## 📊 Test Data Summary

### Organizations
- Wellington City Council (215k population)
- Watercare Services (1.7M population)
- Taumata Arowai (Regulator)

### Users (all password: `password123`)
- admin@compliance-saas.co.nz - System Admin
- compliance@wcc.govt.nz - Compliance Manager
- inspector@wcc.govt.nz - Inspector
- auditor@taumataarowai.govt.nz - Auditor

### Assets
- Karori Water Treatment Plant (critical, high risk)
- Brooklyn Reservoir (critical, medium risk)
- Ngaio Pump Station (low risk)

### Documents
- 3 documents (DWSP, inspection report, asset plan)

### Compliance Plans
- 1 approved DWSP with all 12 elements

---

## ✅ Verification Checklist

- [ ] Docker containers running (`docker ps` shows 2 containers)
- [ ] Backend responds at http://localhost:3000/health
- [ ] Frontend loads at http://localhost:3001
- [ ] Can login with test credentials
- [ ] Dashboard shows stats (3 assets, 3 documents, 1 plan)
- [ ] Prisma Studio accessible at http://localhost:5555
- [ ] Database has data (4 users, 3 organizations)

---

**Status Key:**
- ✅ Working and tested
- ⚠️ Running but needs attention
- ❌ Not running
- 🔧 Requires manual start

---

Generated: 2025-10-16
Environment: Local Development
Stack: PostgreSQL + Redis + Fastify + Next.js
