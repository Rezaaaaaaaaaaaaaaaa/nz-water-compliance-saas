# NZ Water Compliance SaaS - Implementation Plan
## Comprehensive Fix & Improvement Roadmap

**Generated:** 2025-11-10
**Based on:** 8 Comprehensive Reviews (Backend, Frontend, Security, Database, API, Testing, Performance, Infrastructure)
**Total Issues Identified:** 150+
**Estimated Total Effort:** 12-16 weeks (3-4 months)

---

## Executive Summary

This implementation plan addresses all critical findings from the comprehensive review. The plan is organized into 4 phases:

1. **Phase 1 (Weeks 1-3):** Critical Security & Data Integrity - 21 issues
2. **Phase 2 (Weeks 4-6):** Architecture & Performance - 18 issues
3. **Phase 3 (Weeks 7-10):** Testing & Quality - 25 issues
4. **Phase 4 (Weeks 11-16):** Polish & Optimization - 30+ issues

**Total Effort:** ~480-640 hours (3-4 person-months for 1 developer, or 1.5-2 months for 2 developers)

---

## Phase 1: Critical Security & Data Integrity (Weeks 1-3)
**Priority:** CRITICAL - Production Blockers
**Effort:** 120 hours (3 weeks)
**Status:** Must complete before production deployment

### Week 1: Security Vulnerabilities (40 hours)

#### 1.1 JWT Token Security ⚠️ CRITICAL
- **Issue:** JWT stored in localStorage (XSS vulnerable)
- **Location:** `frontend/lib/api.ts`, `frontend/contexts/AuthContext.tsx`
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Update backend to send JWT via httpOnly cookie
  - [ ] Update `auth.controller.ts` to set cookie on login/register
  - [ ] Remove localStorage token storage from frontend
  - [ ] Update `api.ts` interceptor to rely on cookie
  - [ ] Update logout to clear cookie
  - [ ] Test with CORS credentials configuration
- **Dependencies:** None
- **Testing:** Login/logout flows, token refresh, cross-domain

#### 1.2 CSRF Protection ⚠️ CRITICAL
- **Issue:** No CSRF protection for state-changing operations
- **Location:** Backend server configuration
- **Effort:** 4 hours
- **Tasks:**
  - [ ] Install `@fastify/csrf-protection` plugin
  - [ ] Configure CSRF token generation
  - [ ] Add CSRF validation to POST/PUT/PATCH/DELETE routes
  - [ ] Update frontend to include CSRF token
  - [ ] Test with all mutation operations
- **Dependencies:** 1.1 (httpOnly cookies)
- **Testing:** All mutation endpoints, error cases

#### 1.3 Remove Password Bypass ⚠️ CRITICAL
- **Issue:** Development code accepts any password
- **Location:** `backend/src/controllers/auth.controller.ts:42-43`
- **Effort:** 2 hours
- **Tasks:**
  - [ ] Remove TEMPORARY comment and development bypass
  - [ ] Implement proper bcrypt password verification
  - [ ] Update all seeded users to have hashed passwords
  - [ ] Add password strength validation
  - [ ] Test login with correct/incorrect passwords
- **Dependencies:** None
- **Testing:** Login scenarios, password validation

#### 1.4 Standardize bcrypt Salt Rounds ⚠️ CRITICAL
- **Issue:** Inconsistent salt rounds (10 vs 12)
- **Location:** `auth.controller.ts:153`, `auth.service.ts:148`
- **Effort:** 1 hour
- **Tasks:**
  - [ ] Create constant `BCRYPT_ROUNDS = 12` in config
  - [ ] Update all bcrypt.hash() calls to use constant
  - [ ] Document password hashing policy
- **Dependencies:** 1.3
- **Testing:** Registration, password change

#### 1.5 File Upload Security ⚠️ HIGH
- **Issue:** File type validation relies on MIME type only
- **Location:** `backend/src/services/s3.service.ts`
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Install `file-type` package for magic number validation
  - [ ] Add post-upload file type verification
  - [ ] Add virus scanning (ClamAV or AWS solution)
  - [ ] Test with spoofed MIME types
- **Dependencies:** None
- **Testing:** Upload malicious files, type spoofing

#### 1.6 Rate Limiting Enhancement ⚠️ HIGH
- **Issue:** Authentication endpoints need stricter limits
- **Location:** `backend/src/routes/auth.routes.ts`
- **Effort:** 3 hours
- **Tasks:**
  - [ ] Add per-endpoint rate limits for login (5/15min)
  - [ ] Add per-endpoint rate limits for register (3/15min)
  - [ ] Add rate limit headers to responses
  - [ ] Add account lockout after failed attempts
  - [ ] Test rate limit enforcement
- **Dependencies:** None
- **Testing:** Brute force scenarios

#### 1.7 Input Validation - Auth Endpoints ⚠️ HIGH
- **Issue:** No validation middleware on auth routes
- **Location:** `backend/src/routes/auth.routes.ts`
- **Effort:** 4 hours
- **Tasks:**
  - [ ] Create Zod schema for login (email, password)
  - [ ] Create Zod schema for registration
  - [ ] Add validateBody middleware to all auth routes
  - [ ] Add email format validation
  - [ ] Add password strength validation
  - [ ] Test with invalid inputs
- **Dependencies:** None
- **Testing:** Invalid email, weak password, SQL injection

#### 1.8 Environment Variable Security ⚠️ MEDIUM
- **Issue:** JWT_SECRET validation insufficient
- **Location:** `backend/src/config/index.ts:32`
- **Effort:** 2 hours
- **Tasks:**
  - [ ] Increase JWT_SECRET minimum length to 64
  - [ ] Add entropy validation (min 20 unique chars)
  - [ ] Add validation error messages
  - [ ] Update .env.example with strong example
- **Dependencies:** None
- **Testing:** Config validation

#### 1.9 Docker Security Hardening ⚠️ HIGH
- **Issue:** Hardcoded passwords in docker-compose.yml
- **Location:** `backend/docker-compose.yml`
- **Effort:** 3 hours
- **Tasks:**
  - [ ] Remove hardcoded POSTGRES_PASSWORD
  - [ ] Add Redis password (requirepass)
  - [ ] Use .env file for all secrets
  - [ ] Add resource limits (memory, CPU)
  - [ ] Update documentation
- **Dependencies:** None
- **Testing:** Docker compose up with new config

#### 1.10 Create Backend .dockerignore ⚠️ CRITICAL
- **Issue:** No .dockerignore file for backend
- **Location:** `backend/.dockerignore` (missing)
- **Effort:** 1 hour
- **Tasks:**
  - [ ] Create .dockerignore file
  - [ ] Exclude node_modules, dist/, coverage/
  - [ ] Exclude .env files, test files, docs
  - [ ] Test Docker build size reduction
- **Dependencies:** None
- **Testing:** Docker build, verify excluded files

**Week 1 Deliverables:**
- ✅ JWT moved to httpOnly cookies
- ✅ CSRF protection active
- ✅ No password bypass
- ✅ File upload security enhanced
- ✅ Auth endpoints protected
- ✅ Docker security hardened

**Week 1 Testing Requirements:**
- Security test suite (XSS, CSRF, brute force)
- Integration tests pass
- Manual security testing

---

### Week 2: Database Integrity (40 hours)

#### 2.1 Row-Level Security (RLS) ⚠️ CRITICAL
- **Issue:** Multi-tenancy enforced in application only
- **Location:** All database queries
- **Effort:** 10 hours
- **Tasks:**
  - [ ] Enable RLS on all tenant-scoped tables
  - [ ] Create policy for Asset table
  - [ ] Create policy for Document table
  - [ ] Create policy for CompliancePlan table
  - [ ] Create policy for all other tenant tables
  - [ ] Add SET app.current_organization_id in auth middleware
  - [ ] Test cross-organization access blocked
- **Dependencies:** None
- **Testing:** Cross-org queries, policy enforcement

#### 2.2 Fix String-Based Foreign Keys ⚠️ CRITICAL
- **Issue:** submittedBy/approvedBy stored as strings
- **Location:** `backend/prisma/schema.prisma` CompliancePlan model
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Create migration to add submittedById, approvedById
  - [ ] Add proper User relations in schema
  - [ ] Migrate existing data
  - [ ] Update all queries to use new fields
  - [ ] Remove old string fields
  - [ ] Test referential integrity
- **Dependencies:** None
- **Testing:** CRUD operations, cascade deletes

#### 2.3 Add Cross-Organization Validation ⚠️ HIGH
- **Issue:** Junction tables can link cross-org entities
- **Location:** AssetDocument, CompliancePlanDocument, etc.
- **Effort:** 5 hours
- **Tasks:**
  - [ ] Add CHECK constraint to AssetDocument
  - [ ] Add CHECK constraint to CompliancePlanDocument
  - [ ] Add CHECK constraint to AssetCompliancePlan
  - [ ] Create database function for validation
  - [ ] Test cross-org linking blocked
- **Dependencies:** None
- **Testing:** Cross-org linking attempts

#### 2.4 Add Composite Database Indexes ⚠️ CRITICAL
- **Issue:** Missing indexes on date range queries
- **Location:** `backend/prisma/schema.prisma`
- **Effort:** 4 hours
- **Tasks:**
  - [ ] Add index on (organizationId, timestamp, action) for AuditLog
  - [ ] Add index on (organizationId, sampleDate, parameter) for WaterQualityTest
  - [ ] Add index on (organizationId, targetDate, status) for CompliancePlan
  - [ ] Add composite indexes for soft deletes
  - [ ] Generate and run migration
  - [ ] Verify index usage with EXPLAIN
- **Dependencies:** None
- **Testing:** Query performance tests

#### 2.5 Fix Field Naming Inconsistencies ⚠️ MEDIUM
- **Issue:** Duplicate fields (uploadedById, reviewDate)
- **Location:** Document, CompliancePlan models
- **Effort:** 4 hours
- **Tasks:**
  - [ ] Remove uploadedById from Document
  - [ ] Remove reviewDate duplicate from CompliancePlan
  - [ ] Update all references in code
  - [ ] Create migration
  - [ ] Test all affected queries
- **Dependencies:** None
- **Testing:** Document and compliance queries

#### 2.6 Add NOT NULL Constraints ⚠️ MEDIUM
- **Issue:** Critical fields optional (latitude/longitude for critical assets)
- **Location:** Asset model
- **Effort:** 3 hours
- **Tasks:**
  - [ ] Add application validation for critical asset location
  - [ ] Add CHECK constraint if isCritical then location NOT NULL
  - [ ] Update existing critical assets to have location
  - [ ] Create migration
  - [ ] Test validation
- **Dependencies:** None
- **Testing:** Asset creation/update

#### 2.7 Fix Migration Structure ⚠️ CRITICAL
- **Issue:** Single monolithic migration, no rollback
- **Location:** `backend/prisma/migrations/`
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Document current schema state
  - [ ] Create rollback scripts for future migrations
  - [ ] Set up migration workflow documentation
  - [ ] Create migration testing procedure
  - [ ] Add migration validation to CI
- **Dependencies:** None
- **Testing:** Migration rollback procedures

#### 2.8 Audit Logging Enhancement ⚠️ HIGH
- **Issue:** Audit failures silently swallowed in tests
- **Location:** `backend/src/services/audit.service.ts:68-76`
- **Effort:** 2 hours
- **Tasks:**
  - [ ] Remove `return null as any` in test environment
  - [ ] Implement proper audit mocking in tests
  - [ ] Never swallow audit errors
  - [ ] Add audit log monitoring
  - [ ] Test audit failures
- **Dependencies:** None
- **Testing:** Audit log creation, failure scenarios

**Week 2 Deliverables:**
- ✅ Row-Level Security active
- ✅ Foreign key integrity fixed
- ✅ Database indexes optimized
- ✅ Migration structure improved
- ✅ Audit logging never fails silently

**Week 2 Testing Requirements:**
- Database integrity tests
- Cross-organization access tests
- Query performance benchmarks

---

### Week 3: Configuration & Infrastructure (40 hours)

#### 3.1 Fix Port Configuration ⚠️ CRITICAL
- **Issue:** Dockerfile exposes 3001, .env says 3000
- **Location:** `backend/Dockerfile`, `.env.example`
- **Effort:** 2 hours
- **Tasks:**
  - [ ] Decide on standard port (recommend 3000)
  - [ ] Update Dockerfile EXPOSE
  - [ ] Update .env.example PORT
  - [ ] Update docker-compose.yml
  - [ ] Update all documentation
  - [ ] Test Docker deployment
- **Dependencies:** None
- **Testing:** Docker build and run

#### 3.2 Create Frontend .env.example ⚠️ HIGH
- **Issue:** No frontend environment configuration
- **Location:** `frontend/.env.example` (missing)
- **Effort:** 2 hours
- **Tasks:**
  - [ ] Create frontend/.env.example
  - [ ] Document NEXT_PUBLIC_API_URL
  - [ ] Document other frontend env vars
  - [ ] Update frontend README
  - [ ] Add to deployment docs
- **Dependencies:** None
- **Testing:** Frontend build

#### 3.3 Consolidate Redis Clients ⚠️ HIGH
- **Issue:** Two separate Redis client instances
- **Location:** `server.ts`, `cache.service.ts`
- **Effort:** 4 hours
- **Tasks:**
  - [ ] Create redis.ts singleton module
  - [ ] Export single Redis client
  - [ ] Update server.ts to use singleton
  - [ ] Update cache.service.ts to use singleton
  - [ ] Implement graceful shutdown
  - [ ] Test connection pooling
- **Dependencies:** None
- **Testing:** Redis operations, shutdown

#### 3.4 Log Retention Configuration ⚠️ CRITICAL
- **Issue:** CloudWatch logs only 30 days (need 2555 days)
- **Location:** `infrastructure/terraform/monitoring.tf`
- **Effort:** 2 hours
- **Tasks:**
  - [ ] Update retention_in_days to 2555 (7 years)
  - [ ] Apply Terraform changes
  - [ ] Configure S3 archival for compliance
  - [ ] Update backup strategy
  - [ ] Document log retention policy
- **Dependencies:** None
- **Testing:** Terraform apply

#### 3.5 Backup & Recovery Procedures ⚠️ CRITICAL
- **Issue:** No documented backup restore procedures
- **Location:** Documentation
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Create database backup script
  - [ ] Create database restore script
  - [ ] Document RDS snapshot restoration
  - [ ] Document S3 data recovery
  - [ ] Create Redis persistence config
  - [ ] Test full system restore
  - [ ] Create disaster recovery runbook
- **Dependencies:** None
- **Testing:** Full backup and restore drill

#### 3.6 Enable Redis Persistence ⚠️ CRITICAL
- **Issue:** Redis data lost on restart
- **Location:** `backend/docker-compose.yml`, AWS ElastiCache config
- **Effort:** 3 hours
- **Tasks:**
  - [ ] Enable RDB persistence (every 6 hours)
  - [ ] Enable AOF persistence
  - [ ] Configure backup schedule
  - [ ] Update docker-compose.yml
  - [ ] Update Terraform ElastiCache config
  - [ ] Test data persistence
- **Dependencies:** None
- **Testing:** Redis restart, data recovery

#### 3.7 S3 Lifecycle Policies ⚠️ CRITICAL
- **Issue:** No lifecycle policies, costs grow unbounded
- **Location:** `infrastructure/terraform/s3.tf`
- **Effort:** 3 hours
- **Tasks:**
  - [ ] Create lifecycle policy for documents bucket
  - [ ] Transition to Standard-IA after 90 days
  - [ ] Transition to Glacier after 365 days
  - [ ] Create lifecycle for backups bucket
  - [ ] Apply Terraform changes
  - [ ] Document archival strategy
- **Dependencies:** None
- **Testing:** Terraform apply

#### 3.8 Application Monitoring Setup ⚠️ CRITICAL
- **Issue:** No APM or error tracking configured
- **Location:** Backend and frontend
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Set up Sentry for error tracking
  - [ ] Add Sentry to backend (install @sentry/node)
  - [ ] Add Sentry to frontend (install @sentry/nextjs)
  - [ ] Configure source maps upload
  - [ ] Set up alerting rules
  - [ ] Test error capture
- **Dependencies:** None
- **Testing:** Trigger errors, verify capture

#### 3.9 Metrics Collection Integration ⚠️ HIGH
- **Issue:** Metrics service exists but not called
- **Location:** `backend/src/services/metrics.service.ts`
- **Effort:** 5 hours
- **Tasks:**
  - [ ] Add response time tracking middleware
  - [ ] Integrate metrics into request lifecycle
  - [ ] Add cache hit rate tracking
  - [ ] Add error rate tracking
  - [ ] Set up CloudWatch dashboard
  - [ ] Test metric collection
- **Dependencies:** None
- **Testing:** Verify metrics in CloudWatch

#### 3.10 Terraform Backend Setup ⚠️ MEDIUM
- **Issue:** Terraform backend commented out
- **Location:** `infrastructure/terraform/backend.tf`
- **Effort:** 2 hours
- **Tasks:**
  - [ ] Uncomment backend configuration
  - [ ] Create S3 bucket if not exists
  - [ ] Create DynamoDB table if not exists
  - [ ] Run terraform init with backend
  - [ ] Verify state locking
- **Dependencies:** None
- **Testing:** Terraform operations

#### 3.11 CI/CD Security Hardening ⚠️ MEDIUM
- **Issue:** Security scans continue-on-error
- **Location:** `.github/workflows/*.yml`
- **Effort:** 3 hours
- **Tasks:**
  - [ ] Remove continue-on-error from lint jobs
  - [ ] Remove continue-on-error from security scans
  - [ ] Add coverage thresholds (70%)
  - [ ] Fix linting errors that are ignored
  - [ ] Test workflow failures
- **Dependencies:** None
- **Testing:** GitHub Actions runs

**Week 3 Deliverables:**
- ✅ Configuration consistency
- ✅ Backup and recovery procedures tested
- ✅ Application monitoring active
- ✅ Infrastructure hardened
- ✅ CI/CD enforcing quality

**Week 3 Testing Requirements:**
- Full backup and restore drill
- Disaster recovery simulation
- Monitoring alert verification

---

## Phase 2: Architecture & Performance (Weeks 4-6)
**Priority:** HIGH - Scalability & Performance
**Effort:** 120 hours (3 weeks)

### Week 4: Backend Performance (40 hours)

#### 4.1 Implement Cache Invalidation ⚠️ CRITICAL
- **Issue:** Cache never invalidated after mutations
- **Location:** All service files
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Add cache invalidation to asset.service.ts
  - [ ] Add cache invalidation to document.service.ts
  - [ ] Add cache invalidation to dwsp.service.ts
  - [ ] Add cache invalidation to report.service.ts
  - [ ] Implement cache tags for selective invalidation
  - [ ] Test cache invalidation works
  - [ ] Add cache warming strategy
- **Dependencies:** None
- **Testing:** Create/update/delete operations

#### 4.2 Fix N+1 Query in Analytics ⚠️ CRITICAL
- **Issue:** System analytics fetches all orgs individually
- **Location:** `backend/src/services/analytics.service.ts:478-496`
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Replace findMany with aggregation query
  - [ ] Use groupBy for counts
  - [ ] Test performance improvement
  - [ ] Add query performance logging
  - [ ] Benchmark before/after
- **Dependencies:** None
- **Testing:** System analytics endpoint

#### 4.3 Fix N+1 Query in User Activity ⚠️ HIGH
- **Issue:** User activity does two queries instead of JOIN
- **Location:** `backend/src/services/analytics.service.ts:405-420`
- **Effort:** 4 hours
- **Tasks:**
  - [ ] Convert to single query with JOIN
  - [ ] Use raw SQL or Prisma include
  - [ ] Test performance
  - [ ] Verify data accuracy
- **Dependencies:** None
- **Testing:** User activity endpoint

#### 4.4 Optimize Compliance Scoring ⚠️ HIGH
- **Issue:** 20+ queries to calculate one score
- **Location:** `backend/src/services/compliance-scoring.service.ts`
- **Effort:** 10 hours
- **Tasks:**
  - [ ] Analyze query patterns
  - [ ] Consolidate into fewer queries
  - [ ] Consider materialized view
  - [ ] Add aggressive caching (15min TTL)
  - [ ] Benchmark improvement
- **Dependencies:** 4.1 (cache invalidation)
- **Testing:** Compliance score calculation

#### 4.5 Optimize Bulk Import ⚠️ HIGH
- **Issue:** Sequential inserts in asset import
- **Location:** `backend/src/services/asset.service.ts:375-398`
- **Effort:** 4 hours
- **Tasks:**
  - [ ] Replace loop with createMany()
  - [ ] Batch audit log creation
  - [ ] Add progress reporting
  - [ ] Test with 1000+ assets
  - [ ] Benchmark improvement
- **Dependencies:** None
- **Testing:** Bulk import of assets

#### 4.6 Add Query Result Limits ⚠️ MEDIUM
- **Issue:** Some queries fetch unlimited results
- **Location:** Multiple service files
- **Effort:** 4 hours
- **Tasks:**
  - [ ] Add default limit of 1000 to internal queries
  - [ ] Implement cursor-based pagination
  - [ ] Update getDocumentData() in compliance-scoring
  - [ ] Update getReportData() queries
  - [ ] Test memory usage
- **Dependencies:** None
- **Testing:** Large dataset queries

#### 4.7 Connection Pool Configuration ⚠️ MEDIUM
- **Issue:** No explicit connection pooling
- **Location:** DATABASE_URL, Prisma config
- **Effort:** 2 hours
- **Tasks:**
  - [ ] Add connection_limit=20 to DATABASE_URL
  - [ ] Add pool_timeout=10
  - [ ] Update .env.example
  - [ ] Document pooling strategy
  - [ ] Monitor connection usage
- **Dependencies:** None
- **Testing:** Load testing

#### 4.8 Add Slow Query Logging ⚠️ MEDIUM
- **Issue:** No visibility into slow queries
- **Location:** Prisma client initialization
- **Effort:** 2 hours
- **Tasks:**
  - [ ] Enable Prisma query logging
  - [ ] Log queries > 1 second
  - [ ] Add to monitoring dashboard
  - [ ] Set up alerts for slow queries
- **Dependencies:** None
- **Testing:** Slow query detection

**Week 4 Deliverables:**
- ✅ Cache invalidation working
- ✅ N+1 queries fixed
- ✅ 10x faster bulk import
- ✅ Compliance scoring optimized
- ✅ Query performance monitored

**Week 4 Testing Requirements:**
- Performance benchmarks
- Load testing
- Memory usage profiling

---

### Week 5: Frontend Performance (40 hours)

#### 5.1 Enable Image Optimization ⚠️ CRITICAL
- **Issue:** Images unoptimized in production
- **Location:** `frontend/next.config.ts:14`
- **Effort:** 2 hours
- **Tasks:**
  - [ ] Change unoptimized: false
  - [ ] Configure image formats (WebP, AVIF)
  - [ ] Configure device sizes
  - [ ] Configure S3 domain if needed
  - [ ] Test image loading
- **Dependencies:** None
- **Testing:** Image load performance

#### 5.2 Implement TanStack Query ⚠️ CRITICAL
- **Issue:** Package installed but completely unused
- **Location:** All frontend pages
- **Effort:** 16 hours
- **Tasks:**
  - [ ] Set up QueryClientProvider in _app.tsx
  - [ ] Convert dashboard page to use useQuery
  - [ ] Convert assets page to use useQuery
  - [ ] Convert documents page to use useQuery
  - [ ] Convert all GET endpoints to useQuery
  - [ ] Convert all mutations to useMutation
  - [ ] Add optimistic updates
  - [ ] Test all data fetching
- **Dependencies:** None
- **Testing:** All CRUD operations

#### 5.3 Add Route Protection Middleware ⚠️ CRITICAL
- **Issue:** No middleware.ts for auth protection
- **Location:** `frontend/middleware.ts` (missing)
- **Effort:** 4 hours
- **Tasks:**
  - [ ] Create middleware.ts
  - [ ] Implement auth check
  - [ ] Redirect to /login if unauthenticated
  - [ ] Configure protected route matchers
  - [ ] Test protection on all routes
- **Dependencies:** None
- **Testing:** Auth redirect flows

#### 5.4 Create Custom Hooks ⚠️ HIGH
- **Issue:** No hooks directory, logic in components
- **Location:** Create `frontend/hooks/`
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Create useAssets hook
  - [ ] Create useCreateAsset hook
  - [ ] Create useDocuments hook
  - [ ] Create useAuth hook
  - [ ] Create useCompliancePlans hook
  - [ ] Extract business logic from components
  - [ ] Test all hooks
- **Dependencies:** 5.2 (TanStack Query)
- **Testing:** Hook functionality

#### 5.5 Fix API Response Types ⚠️ HIGH
- **Issue:** All API functions use any
- **Location:** `frontend/lib/api.ts`
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Define TypeScript interfaces for all responses
  - [ ] Update assets API with types
  - [ ] Update documents API with types
  - [ ] Update compliance API with types
  - [ ] Update auth API with types
  - [ ] Remove all any types
  - [ ] Test type safety
- **Dependencies:** None
- **Testing:** TypeScript compilation

#### 5.6 Add Loading/Error Boundaries ⚠️ MEDIUM
- **Issue:** No loading.tsx or error.tsx files
- **Location:** `frontend/app/dashboard/`
- **Effort:** 4 hours
- **Tasks:**
  - [ ] Create dashboard/loading.tsx
  - [ ] Create dashboard/error.tsx
  - [ ] Remove manual loading states from pages
  - [ ] Add error boundaries to layouts
  - [ ] Test loading and error states
- **Dependencies:** None
- **Testing:** Loading and error scenarios

**Week 5 Deliverables:**
- ✅ Images optimized (50-80% faster loads)
- ✅ TanStack Query integrated
- ✅ Route protection active
- ✅ Custom hooks extracted
- ✅ Type safety improved

**Week 5 Testing Requirements:**
- Frontend E2E tests pass
- Performance metrics improved
- Type checking passes

---

### Week 6: API Standardization (40 hours)

#### 6.1 Standardize Error Responses ⚠️ HIGH
- **Issue:** Inconsistent error structures
- **Location:** All controllers
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Create standard error response type
  - [ ] Update global error handler in server.ts
  - [ ] Add error codes enum
  - [ ] Update all controllers to use standard format
  - [ ] Test error responses
- **Dependencies:** None
- **Testing:** Error scenarios

#### 6.2 Add OpenAPI Documentation ⚠️ HIGH
- **Issue:** No API documentation
- **Location:** Backend server
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Install @fastify/swagger and @fastify/swagger-ui
  - [ ] Configure Swagger plugin
  - [ ] Add schemas to all routes
  - [ ] Generate OpenAPI 3.0 spec
  - [ ] Add /api/docs endpoint
  - [ ] Document all endpoints
- **Dependencies:** None
- **Testing:** Documentation completeness

#### 6.3 Add Pagination Metadata ⚠️ HIGH
- **Issue:** No total count or hasMore in responses
- **Location:** All list endpoints
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Create pagination response wrapper
  - [ ] Add total count to all list queries
  - [ ] Add hasMore boolean
  - [ ] Update all list endpoints
  - [ ] Test pagination
- **Dependencies:** None
- **Testing:** List endpoints

#### 6.4 Add Sorting Capability ⚠️ MEDIUM
- **Issue:** No sorting on any list endpoint
- **Location:** All list routes
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Add ?sort= query parameter support
  - [ ] Implement sort parsing middleware
  - [ ] Add to assets endpoint
  - [ ] Add to documents endpoint
  - [ ] Add to compliance plans endpoint
  - [ ] Test sorting
- **Dependencies:** None
- **Testing:** Sort by various fields

#### 6.5 Add Request Validation ⚠️ HIGH
- **Issue:** Missing validation on many endpoints
- **Location:** Multiple route files
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Create Zod schemas for all requests
  - [ ] Add validateBody to asset routes
  - [ ] Add validateBody to document routes
  - [ ] Add validateBody to dwsp routes
  - [ ] Add validateQuery to all list routes
  - [ ] Test validation errors
- **Dependencies:** None
- **Testing:** Invalid input scenarios

#### 6.6 Fix API Versioning ⚠️ MEDIUM
- **Issue:** AI routes use /api/ai/ instead of /api/v1/ai/
- **Location:** `backend/src/routes/ai.routes.ts`
- **Effort:** 2 hours
- **Tasks:**
  - [ ] Update AI route prefix to /api/v1/ai/
  - [ ] Update frontend API calls
  - [ ] Test all AI endpoints
  - [ ] Update documentation
- **Dependencies:** None
- **Testing:** AI endpoint calls

#### 6.7 Improve HTTP Status Codes ⚠️ MEDIUM
- **Issue:** DELETE returns 200 instead of 204
- **Location:** Multiple controllers
- **Effort:** 2 hours
- **Tasks:**
  - [ ] Change DELETE responses to 204 No Content
  - [ ] Add 409 Conflict for duplicates
  - [ ] Review all status codes
  - [ ] Test status code correctness
- **Dependencies:** None
- **Testing:** HTTP status verification

#### 6.8 Consolidate Authentication Middleware ⚠️ MEDIUM
- **Issue:** auth.ts and auth.middleware.ts confusion
- **Location:** `backend/src/middleware/`
- **Effort:** 2 hours
- **Tasks:**
  - [ ] Remove auth.middleware.ts
  - [ ] Update all imports to use auth.ts
  - [ ] Verify no broken imports
  - [ ] Test authentication
- **Dependencies:** None
- **Testing:** Auth middleware

**Week 6 Deliverables:**
- ✅ Consistent API responses
- ✅ OpenAPI documentation live
- ✅ Pagination standardized
- ✅ Request validation complete
- ✅ API versioning consistent

**Week 6 Testing Requirements:**
- API integration tests pass
- Documentation accurate
- Validation comprehensive

---

## Phase 3: Testing & Quality (Weeks 7-10)
**Priority:** HIGH - Confidence & Reliability
**Effort:** 160 hours (4 weeks)

### Week 7: Service Unit Tests (40 hours)

#### 7.1 Test Authentication Service ⚠️ CRITICAL
- **Location:** `backend/src/services/auth.service.ts` (no tests)
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Create auth.service.test.ts
  - [ ] Test password hashing
  - [ ] Test token generation
  - [ ] Test token validation
  - [ ] Test password verification
  - [ ] Test edge cases
  - [ ] Achieve 80%+ coverage
- **Dependencies:** None
- **Testing:** 20+ test cases

#### 7.2 Test Audit Service ⚠️ CRITICAL
- **Location:** `backend/src/services/audit.service.ts` (no tests)
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Create audit.service.test.ts
  - [ ] Test log creation
  - [ ] Test log retrieval
  - [ ] Test filtering
  - [ ] Test error handling
  - [ ] Achieve 80%+ coverage
- **Dependencies:** None
- **Testing:** 15+ test cases

#### 7.3 Test Document Service ⚠️ CRITICAL
- **Location:** `backend/src/services/document.service.ts` (no tests)
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Create document.service.test.ts
  - [ ] Test CRUD operations
  - [ ] Test metadata management
  - [ ] Test linking to assets
  - [ ] Test error scenarios
  - [ ] Achieve 80%+ coverage
- **Dependencies:** None
- **Testing:** 20+ test cases

#### 7.4 Test Report Service ⚠️ HIGH
- **Location:** `backend/src/services/report.service.ts` (no tests)
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Create report.service.test.ts
  - [ ] Test report creation
  - [ ] Test PDF generation
  - [ ] Test data aggregation
  - [ ] Test error handling
  - [ ] Achieve 80%+ coverage
- **Dependencies:** None
- **Testing:** 15+ test cases

#### 7.5 Test AI Services ⚠️ HIGH
- **Location:** 4 AI service files (no tests)
- **Effort:** 10 hours
- **Tasks:**
  - [ ] Create ai-compliance-assistant.service.test.ts
  - [ ] Create ai-document-analysis.service.test.ts
  - [ ] Create ai-usage.service.test.ts
  - [ ] Create ai-water-quality.service.test.ts
  - [ ] Mock Anthropic API calls
  - [ ] Test quota management
  - [ ] Test error handling
  - [ ] Achieve 70%+ coverage
- **Dependencies:** None
- **Testing:** 30+ test cases total

**Week 7 Deliverables:**
- ✅ 5 critical services tested
- ✅ 100+ new test cases
- ✅ Coverage increased by ~20%

---

### Week 8: Controller & Middleware Tests (40 hours)

#### 8.1 Test Auth Controller ⚠️ CRITICAL
- **Location:** `backend/src/controllers/auth.controller.ts` (no tests)
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Create auth.controller.test.ts
  - [ ] Test login endpoint
  - [ ] Test register endpoint
  - [ ] Test token refresh
  - [ ] Test logout
  - [ ] Test error responses
  - [ ] Achieve 80%+ coverage
- **Dependencies:** None
- **Testing:** 20+ test cases

#### 8.2 Test Asset Controller ⚠️ HIGH
- **Location:** `backend/src/controllers/asset.controller.ts` (no tests)
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Create asset.controller.test.ts
  - [ ] Test all CRUD endpoints
  - [ ] Test filtering
  - [ ] Test pagination
  - [ ] Test validation
  - [ ] Achieve 80%+ coverage
- **Dependencies:** None
- **Testing:** 15+ test cases

#### 8.3 Test Document Controller ⚠️ HIGH
- **Location:** `backend/src/controllers/document.controller.ts` (no tests)
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Create document.controller.test.ts
  - [ ] Test upload URL generation
  - [ ] Test document CRUD
  - [ ] Test download
  - [ ] Test linking
  - [ ] Achieve 80%+ coverage
- **Dependencies:** None
- **Testing:** 15+ test cases

#### 8.4 Test Middleware ⚠️ CRITICAL
- **Location:** 5 middleware files (no tests)
- **Effort:** 10 hours
- **Tasks:**
  - [ ] Create auth.middleware.test.ts
  - [ ] Create rbac.middleware.test.ts
  - [ ] Create validation.middleware.test.ts
  - [ ] Create error-handler.middleware.test.ts
  - [ ] Test all middleware functions
  - [ ] Test error scenarios
  - [ ] Achieve 80%+ coverage
- **Dependencies:** None
- **Testing:** 30+ test cases total

#### 8.5 Test Remaining Controllers ⚠️ MEDIUM
- **Location:** 6 controller files (no tests)
- **Effort:** 10 hours
- **Tasks:**
  - [ ] Create dwsp.controller.test.ts
  - [ ] Create report.controller.test.ts
  - [ ] Create analytics.controller.test.ts
  - [ ] Create export.controller.test.ts
  - [ ] Create dwqar.controller.test.ts
  - [ ] Create ai.controller.test.ts
  - [ ] Achieve 70%+ coverage
- **Dependencies:** None
- **Testing:** 40+ test cases total

**Week 8 Deliverables:**
- ✅ All 9 controllers tested
- ✅ All 5 middleware tested
- ✅ 120+ new test cases
- ✅ No untested entry points

---

### Week 9: Integration & E2E Tests (40 hours)

#### 9.1 Add File Upload Integration Tests ⚠️ HIGH
- **Location:** `backend/tests/integration/` (missing)
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Create document-upload.test.ts
  - [ ] Test upload URL generation
  - [ ] Test actual file upload
  - [ ] Test file type validation
  - [ ] Test file size limits
  - [ ] Test malicious file handling
- **Dependencies:** None
- **Testing:** 10+ test cases

#### 9.2 Add DWQAR Integration Tests ⚠️ HIGH
- **Location:** `backend/tests/integration/` (missing)
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Create dwqar.test.ts
  - [ ] Test DWQAR submission workflow
  - [ ] Test validation
  - [ ] Test Excel export
  - [ ] Test data aggregation
  - [ ] Test error handling
- **Dependencies:** None
- **Testing:** 15+ test cases

#### 9.3 Add Report Generation Tests ⚠️ MEDIUM
- **Location:** `backend/tests/integration/` (missing)
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Create reports.test.ts
  - [ ] Test report generation
  - [ ] Test PDF creation
  - [ ] Test scheduling
  - [ ] Test data accuracy
- **Dependencies:** None
- **Testing:** 10+ test cases

#### 9.4 Add AI Integration Tests ⚠️ MEDIUM
- **Location:** `backend/tests/integration/` (missing)
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Create ai.test.ts
  - [ ] Test compliance assistant
  - [ ] Test document analysis
  - [ ] Test water quality analysis
  - [ ] Mock Anthropic API
  - [ ] Test quota enforcement
- **Dependencies:** None
- **Testing:** 12+ test cases

#### 9.5 Add Notification Tests ⚠️ MEDIUM
- **Location:** `backend/tests/integration/` (missing)
- **Effort:** 4 hours
- **Tasks:**
  - [ ] Create notifications.test.ts
  - [ ] Test email sending
  - [ ] Test queue processing
  - [ ] Test notification preferences
  - [ ] Test error handling
- **Dependencies:** None
- **Testing:** 8+ test cases

#### 9.6 Improve E2E Test Quality ⚠️ MEDIUM
- **Location:** `frontend/tests/e2e/` (existing)
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Remove .catch(() => false) patterns
  - [ ] Remove conditional test.skip()
  - [ ] Add proper assertions
  - [ ] Add wait conditions
  - [ ] Test file upload workflow
  - [ ] Test multi-user scenarios
- **Dependencies:** None
- **Testing:** Fix 20+ weak tests

**Week 9 Deliverables:**
- ✅ File upload tested
- ✅ DWQAR workflow tested
- ✅ Report generation tested
- ✅ E2E tests hardened
- ✅ 55+ new test cases

---

### Week 10: Test Quality & Coverage (40 hours)

#### 10.1 Add Security Tests ⚠️ HIGH
- **Location:** Create `backend/tests/security/`
- **Effort:** 10 hours
- **Tasks:**
  - [ ] Create sql-injection.test.ts
  - [ ] Create xss.test.ts
  - [ ] Create csrf.test.ts
  - [ ] Create auth-bypass.test.ts
  - [ ] Create rate-limiting.test.ts
  - [ ] Test all security controls
- **Dependencies:** Phase 1 complete
- **Testing:** 20+ security test cases

#### 10.2 Add Edge Case Tests ⚠️ MEDIUM
- **Location:** All existing test files
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Test empty data scenarios
  - [ ] Test null values
  - [ ] Test boundary conditions
  - [ ] Test concurrent operations
  - [ ] Test race conditions
  - [ ] Add 50+ edge case tests
- **Dependencies:** None
- **Testing:** Comprehensive coverage

#### 10.3 Add Error Scenario Tests ⚠️ MEDIUM
- **Location:** All existing test files
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Test database connection failures
  - [ ] Test Redis connection failures
  - [ ] Test S3 upload failures
  - [ ] Test external API failures
  - [ ] Test invalid data handling
  - [ ] Add 40+ error tests
- **Dependencies:** None
- **Testing:** Error handling coverage

#### 10.4 Add Coverage Thresholds ⚠️ HIGH
- **Location:** `jest.config.js`
- **Effort:** 2 hours
- **Tasks:**
  - [ ] Add coverageThreshold configuration
  - [ ] Set global: 70% for all metrics
  - [ ] Set higher thresholds for critical files
  - [ ] Update CI to enforce thresholds
  - [ ] Fix failing tests to meet thresholds
- **Dependencies:** All previous testing tasks
- **Testing:** CI enforcement

#### 10.5 Frontend Component Tests ⚠️ MEDIUM
- **Location:** `frontend/` (no tests)
- **Effort:** 10 hours
- **Tasks:**
  - [ ] Set up React Testing Library
  - [ ] Test authentication components
  - [ ] Test form components
  - [ ] Test dashboard components
  - [ ] Test custom hooks
  - [ ] Achieve 60%+ frontend coverage
- **Dependencies:** None
- **Testing:** 30+ component tests

#### 10.6 Performance Tests ⚠️ LOW
- **Location:** Create `backend/tests/performance/`
- **Effort:** 2 hours
- **Tasks:**
  - [ ] Set up k6 or Artillery
  - [ ] Create load test scripts
  - [ ] Test dashboard endpoint
  - [ ] Test asset list endpoint
  - [ ] Document performance baselines
- **Dependencies:** None
- **Testing:** Load test results

**Week 10 Deliverables:**
- ✅ Security tests comprehensive
- ✅ Edge cases covered
- ✅ Error scenarios tested
- ✅ Coverage thresholds enforced (70%+)
- ✅ Frontend component tests added
- ✅ Performance baselines documented

**Phase 3 Testing Summary:**
- ✅ 100% controller coverage
- ✅ 100% middleware coverage
- ✅ 80%+ service coverage
- ✅ 70%+ overall coverage
- ✅ 300+ new test cases
- ✅ Security testing comprehensive
- ✅ CI enforcing quality

---

## Phase 4: Polish & Optimization (Weeks 11-16)
**Priority:** MEDIUM - Enhancement & Scaling
**Effort:** 200+ hours (6 weeks)

### Week 11-12: Frontend Architecture Refactoring (80 hours)

#### 11.1 Convert to Server Components ⚠️ MEDIUM
- **Issue:** 96% of pages use 'use client' unnecessarily
- **Location:** All frontend pages
- **Effort:** 30 hours
- **Tasks:**
  - [ ] Identify pages that can be server components
  - [ ] Convert static pages to server components
  - [ ] Convert dashboard pages with server data fetching
  - [ ] Keep interactivity on client where needed
  - [ ] Test SSR rendering
  - [ ] Measure performance improvement
- **Dependencies:** 5.2 (TanStack Query)
- **Testing:** All pages render correctly

#### 11.2 Abstract LocalStorage Access ⚠️ MEDIUM
- **Location:** Multiple files
- **Effort:** 4 hours
- **Tasks:**
  - [ ] Create lib/storage.ts utility
  - [ ] Add SSR compatibility checks
  - [ ] Add error handling
  - [ ] Add type safety
  - [ ] Replace all localStorage calls
  - [ ] Test in SSR environment
- **Dependencies:** None
- **Testing:** Storage operations

#### 11.3 Configure Theme System ⚠️ MEDIUM
- **Location:** `frontend/tailwind.config.ts`
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Define color palette in theme
  - [ ] Create design tokens
  - [ ] Replace hardcoded colors
  - [ ] Create component variants
  - [ ] Document theme usage
- **Dependencies:** None
- **Testing:** Visual consistency

#### 11.4 Extract Reusable Components ⚠️ MEDIUM
- **Location:** Pages with inline components
- **Effort:** 10 hours
- **Tasks:**
  - [ ] Extract StatCard component
  - [ ] Extract DataTable component
  - [ ] Extract FormField components
  - [ ] Create component library structure
  - [ ] Document components
- **Dependencies:** None
- **Testing:** Component reusability

#### 11.5 Add Suspense Boundaries ⚠️ LOW
- **Location:** All data-fetching pages
- **Effort:** 4 hours
- **Tasks:**
  - [ ] Add Suspense to dashboard layout
  - [ ] Add Suspense to list pages
  - [ ] Create loading fallbacks
  - [ ] Test streaming rendering
- **Dependencies:** 11.1
- **Testing:** Loading states

#### 11.6 Improve AuthContext ⚠️ MEDIUM
- **Location:** `frontend/contexts/AuthContext.tsx`
- **Effort:** 4 hours
- **Tasks:**
  - [ ] Fix race condition in checkAuth
  - [ ] Use router instead of window.location
  - [ ] Clear queries on logout
  - [ ] Add proper cleanup
  - [ ] Test auth flows
- **Dependencies:** None
- **Testing:** Auth scenarios

#### 11.7 Add Optimistic Updates ⚠️ LOW
- **Location:** All mutation operations
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Add optimistic updates to asset mutations
  - [ ] Add optimistic updates to document mutations
  - [ ] Add rollback on error
  - [ ] Test error scenarios
- **Dependencies:** 5.2
- **Testing:** Mutation operations

#### 11.8 Improve Responsive Design ⚠️ LOW
- **Location:** All pages
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Fix sidebar on mobile
  - [ ] Add mobile menu
  - [ ] Fix table overflow
  - [ ] Test on multiple devices
- **Dependencies:** None
- **Testing:** Responsive layouts

#### 11.9 Accessibility Improvements ⚠️ MEDIUM
- **Location:** All components
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Add ARIA landmarks
  - [ ] Add skip to content link
  - [ ] Improve focus management
  - [ ] Add keyboard navigation
  - [ ] Test with screen reader
- **Dependencies:** None
- **Testing:** Accessibility audit

**Weeks 11-12 Deliverables:**
- ✅ Server components implemented
- ✅ Better component architecture
- ✅ Improved user experience
- ✅ Better accessibility
- ✅ Bundle size reduced

---

### Week 13-14: Advanced Features (80 hours)

#### 13.1 Implement Token Blacklist ⚠️ HIGH
- **Location:** Backend auth system
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Create Redis-based token blacklist
  - [ ] Add tokens to blacklist on logout
  - [ ] Check blacklist in auth middleware
  - [ ] Implement refresh token rotation
  - [ ] Test token revocation
- **Dependencies:** Phase 1 complete
- **Testing:** Token lifecycle

#### 13.2 Add Email Verification ⚠️ MEDIUM
- **Location:** Auth system
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Add verified field to User model
  - [ ] Generate verification tokens
  - [ ] Send verification emails
  - [ ] Create verification endpoint
  - [ ] Require verification for actions
  - [ ] Test verification flow
- **Dependencies:** None
- **Testing:** Email verification

#### 13.3 Add Password Reset ⚠️ MEDIUM
- **Location:** Auth system
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Create password reset endpoint
  - [ ] Generate secure reset tokens
  - [ ] Send reset emails
  - [ ] Implement token validation
  - [ ] Invalidate sessions on reset
  - [ ] Test reset flow
- **Dependencies:** None
- **Testing:** Password reset

#### 13.4 Add Session Management UI ⚠️ LOW
- **Location:** Frontend user settings
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Create sessions endpoint
  - [ ] Show active sessions to user
  - [ ] Add revoke session button
  - [ ] Test session listing
- **Dependencies:** 13.1
- **Testing:** Session management

#### 13.5 Implement Advanced Filtering ⚠️ MEDIUM
- **Location:** All list endpoints
- **Effort:** 10 hours
- **Tasks:**
  - [ ] Add filter[field][operator] syntax
  - [ ] Support AND/OR logic
  - [ ] Add date range filters
  - [ ] Add numeric comparison filters
  - [ ] Test complex filters
- **Dependencies:** None
- **Testing:** Filter combinations

#### 13.6 Add Field Selection ⚠️ LOW
- **Location:** All GET endpoints
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Add ?fields= parameter support
  - [ ] Parse field lists
  - [ ] Apply Prisma select
  - [ ] Test field selection
- **Dependencies:** None
- **Testing:** Field selection

#### 13.7 Implement HATEOAS Links ⚠️ LOW
- **Location:** All API responses
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Add _links field to responses
  - [ ] Generate resource URLs
  - [ ] Add action links
  - [ ] Test link generation
- **Dependencies:** None
- **Testing:** API discoverability

#### 13.8 Add Bundle Analysis ⚠️ LOW
- **Location:** Frontend build config
- **Effort:** 4 hours
- **Tasks:**
  - [ ] Install @next/bundle-analyzer
  - [ ] Configure analyzer
  - [ ] Analyze current bundle
  - [ ] Identify optimization opportunities
  - [ ] Implement code splitting
- **Dependencies:** None
- **Testing:** Bundle size

#### 13.9 Add Web Vitals Tracking ⚠️ LOW
- **Location:** Frontend _app.tsx
- **Effort:** 4 hours
- **Tasks:**
  - [ ] Implement reportWebVitals
  - [ ] Send to analytics
  - [ ] Monitor LCP, FID, CLS
  - [ ] Set performance budgets
- **Dependencies:** None
- **Testing:** Performance metrics

#### 13.10 Implement Circuit Breaker ⚠️ MEDIUM
- **Location:** External service calls
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Implement circuit breaker pattern
  - [ ] Add to S3 calls
  - [ ] Add to email service
  - [ ] Add to AI service
  - [ ] Test failure scenarios
- **Dependencies:** None
- **Testing:** Service failures

#### 13.11 Add Request Correlation IDs ⚠️ LOW
- **Location:** Backend logging
- **Effort:** 4 hours
- **Tasks:**
  - [ ] Generate correlation ID per request
  - [ ] Add to all log entries
  - [ ] Pass to downstream services
  - [ ] Test tracing
- **Dependencies:** None
- **Testing:** Log correlation

#### 13.12 Dependency Injection Pattern ⚠️ MEDIUM
- **Location:** All services
- **Effort:** 10 hours
- **Tasks:**
  - [ ] Create DI container
  - [ ] Refactor services to use injection
  - [ ] Update tests with mocking
  - [ ] Test service isolation
- **Dependencies:** None
- **Testing:** Service initialization

**Weeks 13-14 Deliverables:**
- ✅ Token management improved
- ✅ Email verification active
- ✅ Password reset working
- ✅ Advanced filtering available
- ✅ Better architecture patterns

---

### Week 15-16: Production Readiness (40 hours)

#### 15.1 Create Disaster Recovery Plan ⚠️ HIGH
- **Location:** Documentation
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Define RTO and RPO
  - [ ] Document recovery procedures
  - [ ] Create recovery scripts
  - [ ] Test DR procedures
  - [ ] Document DR testing schedule
- **Dependencies:** Phase 1 complete
- **Testing:** DR drill

#### 15.2 Implement Cost Optimization ⚠️ MEDIUM
- **Location:** Infrastructure
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Switch to RDS Reserved Instances
  - [ ] Configure S3 lifecycle to Glacier
  - [ ] Implement CloudWatch log sampling
  - [ ] Add ECR lifecycle policies
  - [ ] Document cost savings
- **Dependencies:** None
- **Testing:** Cost monitoring

#### 15.3 Add WAF Configuration ⚠️ MEDIUM
- **Location:** Terraform infrastructure
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Create WAF module
  - [ ] Configure rate limiting rules
  - [ ] Configure SQL injection rules
  - [ ] Configure XSS protection rules
  - [ ] Test WAF blocking
- **Dependencies:** None
- **Testing:** WAF rules

#### 15.4 Setup Multi-Region Backup ⚠️ MEDIUM
- **Location:** AWS configuration
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Configure cross-region RDS replication
  - [ ] Configure S3 cross-region replication
  - [ ] Test failover procedures
  - [ ] Document multi-region setup
- **Dependencies:** None
- **Testing:** Failover drill

#### 15.5 Performance Benchmarking ⚠️ MEDIUM
- **Location:** Testing infrastructure
- **Effort:** 6 hours
- **Tasks:**
  - [ ] Set up load testing environment
  - [ ] Run load tests on all endpoints
  - [ ] Document performance baselines
  - [ ] Identify bottlenecks
  - [ ] Create performance dashboard
- **Dependencies:** Phase 2 complete
- **Testing:** Load tests

#### 15.6 Security Audit Preparation ⚠️ HIGH
- **Location:** Entire application
- **Effort:** 8 hours
- **Tasks:**
  - [ ] Run OWASP ZAP scan
  - [ ] Fix identified vulnerabilities
  - [ ] Document security controls
  - [ ] Prepare for external audit
  - [ ] Create security documentation
- **Dependencies:** Phase 1 complete
- **Testing:** Security scans

**Weeks 15-16 Deliverables:**
- ✅ Production-ready infrastructure
- ✅ DR procedures tested
- ✅ Cost optimized
- ✅ Security audit ready
- ✅ Performance benchmarked

---

## Success Metrics

### Phase 1 Success Criteria
- [ ] All security vulnerabilities fixed
- [ ] Database integrity enforced
- [ ] Configuration consistent
- [ ] Backup procedures tested
- [ ] No critical issues remaining

### Phase 2 Success Criteria
- [ ] Cache invalidation working
- [ ] N+1 queries eliminated
- [ ] API responses consistent
- [ ] Frontend performance improved by 50%+
- [ ] TanStack Query integrated

### Phase 3 Success Criteria
- [ ] 70%+ test coverage
- [ ] All controllers tested
- [ ] All middleware tested
- [ ] Security tests passing
- [ ] CI enforcing quality

### Phase 4 Success Criteria
- [ ] Server components implemented
- [ ] Advanced features complete
- [ ] DR procedures documented
- [ ] Production deployment successful
- [ ] Performance baselines met

---

## Risk Mitigation

### High-Risk Items
1. **JWT Migration** - Could break existing sessions
   - Mitigation: Support both localStorage and cookies during transition
   - Rollback: Keep old code for 1 week

2. **Database Schema Changes** - Could cause data loss
   - Mitigation: Test migrations in staging thoroughly
   - Rollback: Keep rollback scripts ready

3. **Cache Invalidation** - Could cause performance issues
   - Mitigation: Implement gradually, monitor metrics
   - Rollback: Feature flag to disable

4. **TanStack Query Migration** - Large refactor
   - Mitigation: Migrate one page at a time
   - Rollback: Keep old code until fully tested

### Testing Strategy
- Unit tests before integration
- Integration tests in isolated environment
- E2E tests in staging
- Load tests before production
- Manual QA for critical flows

---

## Resource Requirements

### Team Composition
- **1 Senior Full-Stack Developer** (Backend + Frontend)
- **1 DevOps Engineer** (Infrastructure, part-time)
- **1 QA Engineer** (Testing, part-time)

### Alternative: Solo Developer
- Phases 1-2: 6 weeks (160 hours)
- Phases 3-4: 10 weeks (320 hours)
- **Total: 16 weeks (480 hours)**

### External Resources
- Security audit firm (Phase 4)
- Performance testing tools (k6, Artillery)
- Monitoring services (Sentry, Datadog)

---

## Budget Estimates

### Development Costs
- Senior Developer (480 hours @ $100/hr): $48,000
- DevOps (80 hours @ $120/hr): $9,600
- QA (160 hours @ $75/hr): $12,000
- **Total Development: $69,600**

### Infrastructure Costs (Monthly)
- AWS Services: $400-500/month
- Monitoring (Sentry/Datadog): $100-200/month
- **Total Monthly: $500-700**

### One-Time Costs
- Security Audit: $5,000-10,000
- Performance Testing Tools: $500
- **Total One-Time: $5,500-10,500**

---

## Timeline Summary

| Phase | Duration | Effort | Priority |
|-------|----------|--------|----------|
| Phase 1: Security & Integrity | 3 weeks | 120h | CRITICAL |
| Phase 2: Architecture & Performance | 3 weeks | 120h | HIGH |
| Phase 3: Testing & Quality | 4 weeks | 160h | HIGH |
| Phase 4: Polish & Optimization | 6 weeks | 200h | MEDIUM |
| **Total** | **16 weeks** | **600h** | - |

### With 2 Developers (Parallel Work)
- **Reduced Timeline: 10-12 weeks**
- Phase 1 & 2 can be partially parallelized
- Phase 3 testing can happen alongside Phase 2

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Prioritize phases** based on business needs
3. **Allocate resources** (developers, budget)
4. **Set up project tracking** (Jira, GitHub Projects)
5. **Begin Phase 1** - Critical Security Fixes
6. **Weekly status reviews** to track progress
7. **Adjust timeline** based on actual progress

---

## Appendix: Quick Reference

### Critical Issues (Must Fix Before Production)
1. JWT in localStorage → httpOnly cookies
2. No CSRF protection → Implement CSRF
3. Password bypass → Remove dev code
4. No Row-Level Security → Add RLS policies
5. Cache never invalidated → Implement invalidation
6. Images unoptimized → Enable optimization
7. No backup restore procedures → Create & test
8. Log retention 30 days → Change to 2555 days
9. No application monitoring → Set up Sentry
10. Port mismatch → Standardize on 3000 or 3001

### High-Value Quick Wins
1. Enable image optimization (2h, 75% faster loads)
2. Fix port consistency (2h, no confusion)
3. Remove password bypass (2h, security)
4. Create .dockerignore (1h, smaller images)
5. Add cache invalidation (5h, no stale data)

### Tracking Progress
Use this document as a checklist. Check off tasks as completed. Update estimates based on actual time spent.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Next Review:** After Phase 1 completion
