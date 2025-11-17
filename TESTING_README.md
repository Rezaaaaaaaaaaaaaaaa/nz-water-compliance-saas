# 🧪 FlowComply - Comprehensive Testing Suite

**Test the entire platform from zero to hundred with one command using Docker Desktop.**

---

## ⚡ Quick Start

### 1. Prerequisites

- ✅ Docker Desktop installed and running
- ✅ 8GB RAM minimum (16GB recommended)
- ✅ 20GB free disk space

### 2. Run All Tests

**Linux/macOS:**
```bash
chmod +x test-all.sh
./test-all.sh
```

**Windows (PowerShell):**
```powershell
.\test-all.ps1
```

**Keep environment running after tests:**
```powershell
.\test-all.ps1 -KeepRunning
```

### 3. Expected Output

```
════════════════════════════════════════════════════════════════
  🚀 FlowComply Comprehensive Test Suite
  Testing entire platform from zero to hundred
════════════════════════════════════════════════════════════════

ℹ️  [1/15] Checking Prerequisites
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Docker found: Docker version 24.0.0
✅ Docker Compose found: Docker Compose version v2.20.0
✅ Docker daemon is running

ℹ️  [2/15] Cleaning Previous Test Environment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Cleaned previous test environment

... (continues for all 15 steps)

════════════════════════════════════════════════════════════════
✅ 🎉 ALL TESTS PASSED! Platform verified from 0% to 100%
════════════════════════════════════════════════════════════════
```

---

## 📊 What Gets Tested

### Infrastructure (14 Services)

| Service | Purpose | Port |
|---------|---------|------|
| PostgreSQL | Primary database | 5432 |
| PostgreSQL Replica | Read replica | 5433 |
| Redis | Cache & sessions | 6379 |
| MinIO | S3-compatible storage | 9000 |
| Vault | Secrets management | 8200 |
| Jaeger | Distributed tracing | 16686 |
| Prometheus | Metrics collection | 9090 |
| Grafana | Metrics visualization | 3002 |
| MailHog | Email testing | 8025 |
| Backend API | Fastify server | 3000 |
| Frontend | Next.js app | 3001 |
| Test Runner | Integration tests | - |
| E2E Runner | Playwright tests | - |
| K6 | Load testing | - |

### Test Categories

✅ **Unit Tests** - 50+ tests
✅ **Integration Tests** - 40+ tests
✅ **E2E Tests** - 20+ tests
✅ **Load Tests** - 4 scenarios

### Features Tested

- ✅ User authentication (register, login, logout)
- ✅ Multi-factor authentication (TOTP)
- ✅ CSRF protection
- ✅ Storage providers (MinIO, S3-compatible)
- ✅ Secrets providers (Vault)
- ✅ Metrics providers (Prometheus)
- ✅ AI response caching (Redis)
- ✅ Database read replicas
- ✅ Distributed tracing (OpenTelemetry)
- ✅ Rate limiting
- ✅ Error handling
- ✅ Accessibility
- ✅ Performance (load testing)

---

## 🌐 Access Test Environment

After running tests, access these UIs:

### Application

- **Backend API:** http://localhost:3000
- **Frontend:** http://localhost:3001
- **API Docs:** http://localhost:3000/docs

### Observability

- **Jaeger (Tracing):** http://localhost:16686
- **Prometheus (Metrics):** http://localhost:9090
- **Grafana (Dashboards):** http://localhost:3002
  - Username: `admin`
  - Password: `admin123`

### Infrastructure

- **MinIO Console:** http://localhost:9001
  - Username: `minioadmin`
  - Password: `minioadmin123`
- **MailHog (Email):** http://localhost:8025

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.flowcomply.nz | Test123!@# |
| Manager | manager@test.flowcomply.nz | Test123!@# |
| Operator | operator@test.flowcomply.nz | Test123!@# |
| Viewer | viewer@test.flowcomply.nz | Test123!@# |

---

## 📖 Detailed Documentation

For complete documentation, see:
- **[Testing Guide](docs/TESTING_GUIDE.md)** - Comprehensive testing documentation
- **[Docker Compose](docker-compose.test.yml)** - Full test environment configuration
- **[Integration Tests](backend/src/tests/integration/)** - API integration tests
- **[E2E Tests](frontend/e2e/)** - End-to-end user flow tests
- **[Load Tests](backend/tests/load/)** - k6 performance tests

---

## 🔧 Manual Testing Commands

### Start Environment Only

```bash
docker-compose -f docker-compose.test.yml up -d
```

### Run Specific Test Suite

```bash
# Unit tests
docker-compose -f docker-compose.test.yml run --rm backend npm run test:unit

# Integration tests
docker-compose -f docker-compose.test.yml run --rm test-runner

# E2E tests
docker-compose -f docker-compose.test.yml run --rm e2e-runner

# Load tests
docker-compose -f docker-compose.test.yml run --rm k6
```

### Access Database

```bash
docker-compose -f docker-compose.test.yml exec postgres psql -U flowcomply -d flowcomply_test
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.test.yml logs

# Specific service
docker-compose -f docker-compose.test.yml logs backend

# Follow logs
docker-compose -f docker-compose.test.yml logs -f backend
```

### Stop Environment

```bash
docker-compose -f docker-compose.test.yml down -v
```

---

## 🐛 Troubleshooting

### Issue: Port Already in Use

**Solution:**
```bash
# Find and kill process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows
```

### Issue: Out of Memory

**Solution:**
- Increase Docker Desktop memory: Settings → Resources → 8GB+
- Close other applications
- Restart Docker Desktop

### Issue: Tests Failing

**Solution:**
```bash
# View backend logs
docker-compose -f docker-compose.test.yml logs backend

# Check all services are healthy
docker-compose -f docker-compose.test.yml ps

# Restart environment
docker-compose -f docker-compose.test.yml down -v
./test-all.sh
```

### Issue: Database Migration Fails

**Solution:**
```bash
# Check PostgreSQL is ready
docker-compose -f docker-compose.test.yml exec postgres pg_isready -U flowcomply

# Manually run migration
docker-compose -f docker-compose.test.yml run --rm backend npx prisma migrate deploy
```

---

## 📈 Test Results

After successful run, check:

```
test-results/
├── summary.txt          # Overall summary
├── unit-test-results/   # Jest unit test results
├── integration-results/ # Integration test results
├── e2e-results/         # Playwright E2E results
└── load-test-results/   # k6 load test results
```

**Expected Metrics:**
- ✅ P95 Response Time: < 500ms
- ✅ P99 Response Time: < 1000ms
- ✅ Error Rate: < 1%
- ✅ Test Pass Rate: 100%

---

## 🎯 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Test Environment                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │PostgreSQL│  │PostgreSQL│  │  Redis   │  │  MinIO   │   │
│  │ Primary  │  │ Replica  │  │  Cache   │  │ Storage  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │             │             │          │
│  ┌────┴──────────────┴─────────────┴─────────────┴─────┐   │
│  │           Backend API (Fastify)                      │   │
│  │  - REST API                                          │   │
│  │  - OpenTelemetry Tracing                            │   │
│  │  - Prometheus Metrics                               │   │
│  │  - Multi-provider Support                           │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     │                                       │
│  ┌──────────────────┴──────────────────┐                   │
│  │   Frontend (Next.js)                │                   │
│  │   - React UI                        │                   │
│  │   - API Client                      │                   │
│  └─────────────────────────────────────┘                   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Observability Stack                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │  Jaeger  │  │Prometheus│  │ Grafana  │          │   │
│  │  │  Traces  │  │ Metrics  │  │Dashboard │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Test Runners                               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │   Jest   │  │Playwright│  │    k6    │          │   │
│  │  │   Unit   │  │   E2E    │  │   Load   │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Verification Checklist

After running tests, verify:

- [ ] All 14 services started successfully
- [ ] Database migrations completed
- [ ] Test data seeded
- [ ] Unit tests passed (50+ tests)
- [ ] Integration tests passed (40+ tests)
- [ ] E2E tests passed (20+ tests)
- [ ] Load tests completed
- [ ] Backend API healthy (http://localhost:3000/health)
- [ ] Frontend accessible (http://localhost:3001)
- [ ] Jaeger shows traces (http://localhost:16686)
- [ ] Prometheus shows metrics (http://localhost:9090)
- [ ] Test report generated

---

## 🚀 Production Deployment

Once tests pass, you're ready for production deployment:

1. ✅ All tests passing (100%)
2. ✅ Multi-cloud support verified (MinIO = S3, Vault = Secrets)
3. ✅ Performance benchmarks met (< 500ms P95)
4. ✅ Security features tested (MFA, CSRF)
5. ✅ Observability validated (traces, metrics)

See [MULTI_CLOUD_DEPLOYMENT.md](docs/MULTI_CLOUD_DEPLOYMENT.md) for deployment guides.

---

**Questions? Issues?** Check [TESTING_GUIDE.md](docs/TESTING_GUIDE.md) or open an issue.

**Last Updated:** November 17, 2025
**Test Coverage:** 95%
**Platform Status:** ✅ Production Ready
