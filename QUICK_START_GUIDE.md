# 🚀 Quick Start Guide - NZ Water Compliance SaaS

Get the full system running locally in **5 minutes** with realistic dummy data!

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **Docker Desktop** (20.10+) - [Download here](https://www.docker.com/products/docker-desktop)
- ✅ **Node.js** (20+) - [Download here](https://nodejs.org)
- ✅ **npm** (9+) - Comes with Node.js
- ✅ **Git** - [Download here](https://git-scm.com/downloads)

**Verify installation:**
```bash
docker --version
node --version
npm --version
```

---

## 🎯 Quick Start (Automated)

### Windows

```batch
# Double-click or run:
quick-start.bat
```

### Mac/Linux

```bash
# Make executable (first time only):
chmod +x quick-start.sh

# Run:
./quick-start.sh
```

**That's it!** The script will:
1. Check prerequisites
2. Start Docker services (PostgreSQL, Redis)
3. Run database migrations (including password field for users)
4. Seed database with dummy data
5. Start backend and frontend servers
6. Open browser automatically

---

## 📋 Manual Setup (Step-by-Step)

If you prefer to run commands manually or need to troubleshoot:

### 1. Start Infrastructure Services

```bash
cd backend
docker-compose up -d
```

**Wait 15 seconds** for services to initialize.

Verify services are running:
```bash
docker ps
```

You should see:
- `compliance-saas-postgres` (port 5432)
- `compliance-saas-redis` (port 6379)

### 2. Setup Backend

```bash
cd backend

# Install dependencies (if not already installed)
npm install

# Run database migrations (creates tables + adds password field)
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed database with dummy data
npm run prisma:seed
```

**Expected output:**
```
🌱 Starting database seed...
✓ Created 3 organizations
✓ Created 4 users (password: password123)
✓ Created 3 assets
✓ Created 3 documents
✓ Created 1 compliance plan
✓ Created 3 audit log entries
✓ Created 3 notifications
✓ Created 1 report

Test Users (all passwords: password123):
  Admin:      admin@compliance-saas.co.nz
  Manager:    compliance@wcc.govt.nz
  Inspector:  inspector@wcc.govt.nz
  Auditor:    auditor@taumataarowai.govt.nz
```

### 3. Start Backend Server

```bash
# In backend/ directory
npm run dev
```

Server should start at: **http://localhost:3000**

### 4. Setup Frontend (New Terminal)

```bash
cd frontend

# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
```

Frontend should start at: **http://localhost:3001**

### 5. Access the Application

Open your browser to: **http://localhost:3001**

---

## 🔐 Test User Credentials

All test users have the same password: `password123`

| Email | Role | Access Level |
|-------|------|--------------|
| `admin@compliance-saas.co.nz` | System Admin | Full system access |
| `compliance@wcc.govt.nz` | Compliance Manager | Can submit to regulator |
| `inspector@wcc.govt.nz` | Inspector | Field staff, data entry |
| `auditor@taumataarowai.govt.nz` | Auditor | Read-only, regulator |

---

## 📊 What Data Is Included?

The seed script creates realistic NZ water utility data:

### Organizations
- **Wellington City Council** (215,000 population)
- **Watercare Services** (1.7M population)
- **Taumata Arowai** (Regulator)

### Assets
- Karori Water Treatment Plant (critical, high risk)
- Brooklyn Reservoir (critical, medium risk)
- Ngaio Pump Station (low risk)

### Documents
- Wellington City DWSP 2025 (approved)
- Karori WTP Inspection Report Q3 2025
- Wellington Asset Management Plan 2025-2035

### Compliance Plans
- Comprehensive DWSP with all 12 mandatory elements
- Hazard identification and risk assessments
- Operational and verification monitoring
- Emergency response procedures

### Reports
- Annual Compliance Report 2024 (completed)

---

## 🛠️ Available Services

Once running, you can access:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3001 | Main application UI |
| **Backend API** | http://localhost:3000 | REST API |
| **API Health** | http://localhost:3000/health | Health check |
| **DB Health** | http://localhost:3000/health/db | Database status |
| **Redis Health** | http://localhost:3000/health/redis | Cache status |
| **Prisma Studio** | http://localhost:5555 | Database UI (run `npx prisma studio` in backend/) |
| **Adminer** | http://localhost:8080 | Alternative DB UI (see below) |
| **Redis Insight** | http://localhost:8001 | Redis UI (see below) |

### Enable Database UIs

To use Adminer (PostgreSQL UI) and Redis Insight:

```bash
cd backend
docker-compose --profile dev up -d
```

**Adminer Login** (http://localhost:8080):
- System: PostgreSQL
- Server: `postgres`
- Username: `postgres`
- Password: `password`
- Database: `compliance_saas`

---

## 🧪 Testing the Application

### 1. Login and Dashboard

1. Go to http://localhost:3001
2. Login with: `compliance@wcc.govt.nz` / `password123`
3. View dashboard with summary stats

### 2. View Assets

- Navigate to Assets (http://localhost:3001/dashboard/assets)
- See 3 pre-loaded assets
- Click on Karori Water Treatment Plant
- View details, inspection dates, criticality

### 3. View Documents

- Navigate to Documents
- See 3 documents (DWSP, Inspection Report, Asset Plan)
- Documents are metadata only (S3 files not actually uploaded)

### 4. View Compliance Plans

- Navigate to Compliance Plans
- See Wellington DWSP (status: APPROVED)
- View comprehensive plan with all 12 elements

### 5. View Analytics

- Navigate to Analytics
- See compliance score, trends, asset stats
- Test Redis caching (reload page - should be faster)

### 6. Test API Directly

```bash
# Health check
curl http://localhost:3000/health

# Database health
curl http://localhost:3000/health/db

# Redis health
curl http://localhost:3000/health/redis

# Login (get token)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@compliance-saas.co.nz","password":"password123"}'

# Use token for authenticated requests
curl http://localhost:3000/api/v1/assets \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔄 Reset Database

To start fresh:

```bash
cd backend

# Stop and remove Docker containers + volumes
docker-compose down -v

# Start fresh
docker-compose up -d

# Wait 15 seconds
sleep 15  # Mac/Linux
# OR
timeout /t 15  # Windows

# Recreate database
npx prisma migrate deploy
npx prisma generate
npm run prisma:seed
```

---

## 🐛 Troubleshooting

### Port Already in Use

**Problem:** `Error: Port 5432 already in use`

**Solution:**
```bash
# Find what's using the port
# Windows:
netstat -ano | findstr :5432

# Mac/Linux:
lsof -i :5432

# Kill the process or change ports in .env
```

### Docker Not Running

**Problem:** `Cannot connect to Docker daemon`

**Solution:**
1. Start Docker Desktop
2. Wait for Docker to fully initialize
3. Retry `docker-compose up -d`

### Database Connection Failed

**Problem:** `Can't reach database server`

**Solution:**
```bash
# Check PostgreSQL logs
docker logs compliance-saas-postgres

# Restart services
docker-compose down
docker-compose up -d

# Wait 15 seconds and retry
```

### Redis Connection Failed

**Problem:** `Redis connection error`

**Solution:**
```bash
# Check Redis logs
docker logs compliance-saas-redis

# Test Redis manually
docker exec -it compliance-saas-redis redis-cli ping
# Should return: PONG

# Restart if needed
docker-compose restart redis
```

### Seed Script Fails

**Problem:** `Error seeding database`

**Solutions:**
```bash
# Option 1: Reset completely
docker-compose down -v
docker-compose up -d
npx prisma migrate deploy
npm run prisma:seed

# Option 2: Clear data manually
npx prisma studio
# Delete records from all tables manually
npm run prisma:seed
```

### Backend Won't Start

**Problem:** `Module not found` or build errors

**Solution:**
```bash
cd backend

# Clean install
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate

# Try again
npm run dev
```

### Frontend Won't Start

**Problem:** Next.js errors or module issues

**Solution:**
```bash
cd frontend

# Clean install
rm -rf node_modules .next package-lock.json
npm install

# Try again
npm run dev
```

### Migration Fails

**Problem:** `Migration failed to apply`

**Solution:**
```bash
# Try db push instead (development only)
npx prisma db push --skip-generate
npx prisma generate
```

---

## 📝 Environment Variables

The project includes pre-configured `.env` files for local development:

**Backend** (`backend/.env`):
- Database: `postgresql://postgres:password@localhost:5432/compliance_saas`
- Redis: `localhost:6379`
- JWT Secret: Auto-generated
- Email: `console` mode (logs emails to terminal)
- AI: Requires `ANTHROPIC_API_KEY` for AI features

**Frontend** (`frontend/.env.local`):
- API URL: `http://localhost:3000`

**Note:** For AI features to work, set `ANTHROPIC_API_KEY` in `backend/.env`:
```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

Get your API key from: https://console.anthropic.com/

---

## 🎓 Next Steps

Now that your system is running:

1. **Explore the UI** - Navigate through all pages
2. **Test RBAC** - Login with different user roles
3. **Create Data** - Add new assets, documents, compliance plans
4. **Run Tests** - `npm test` in backend/ directory
5. **Check API Docs** - Visit http://localhost:3000/api/v1/docs
6. **Monitor Performance** - Check Redis caching with Analytics page
7. **Review Code** - Explore backend services and frontend components

---

## 📚 Additional Resources

- **Main README**: `README.md` - Full project overview
- **Technical Docs**: `FlowComply_Technical_Documentation_Updated.md`
- **System Audit**: `SYSTEM_AUDIT_REPORT.md`
- **Project Status**: `PROJECT_STATUS.md`
- **Deployment Guide**: `docs/deployment/DEPLOYMENT_GUIDE.md`

---

## 🆘 Getting Help

If you encounter issues:

1. Check logs:
   - Backend: Terminal where `npm run dev` is running
   - Frontend: Browser console (F12)
   - Docker: `docker logs compliance-saas-postgres`

2. Verify services:
   ```bash
   docker ps                    # Should show 2 containers running
   curl http://localhost:3000/health  # Should return {"status":"ok"}
   ```

3. Reset everything:
   ```bash
   docker-compose down -v
   rm -rf backend/node_modules frontend/node_modules
   # Start from step 1 of manual setup
   ```

---

## ✅ Success Checklist

You'll know everything is working when:

- [ ] Docker shows 2 running containers
- [ ] `http://localhost:3000/health` returns OK
- [ ] `http://localhost:3001` loads login page
- [ ] You can login with test credentials
- [ ] Dashboard shows stats (3 assets, 3 documents, 1 plan)
- [ ] All pages load without errors
- [ ] API requests return data

---

**Happy Testing! 🎉**

Built with ❤️ for New Zealand water utilities

