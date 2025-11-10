# Critical Fixes Quick Start Guide
## Top 20 Issues to Fix Before Production

**Generated:** 2025-11-10
**Priority:** CRITICAL & HIGH only
**Estimated Time:** 3 weeks (120 hours)

---

## 🚨 Week 1: Security Vulnerabilities (40 hours)

### 1. JWT Security - Move to httpOnly Cookies ⚠️ CRITICAL
**Time:** 8 hours | **Risk:** High - XSS attacks possible

**Current Issue:**
```typescript
// frontend/lib/api.ts:55
const token = localStorage.getItem('auth_token');
```
JWT tokens in localStorage are vulnerable to XSS attacks.

**Fix Steps:**
1. Update `backend/src/controllers/auth.controller.ts`:
   ```typescript
   // In login and register responses
   reply.setCookie('auth_token', accessToken, {
     httpOnly: true,
     secure: true,
     sameSite: 'strict',
     maxAge: 900000 // 15 minutes
   });
   ```

2. Remove localStorage from `frontend/lib/api.ts` and `frontend/contexts/AuthContext.tsx`

3. Update CORS to allow credentials:
   ```typescript
   cors: {
     origin: config.frontendUrl,
     credentials: true
   }
   ```

**Testing:**
- Login/logout flows
- Token refresh
- Cross-domain scenarios

---

### 2. CSRF Protection ⚠️ CRITICAL
**Time:** 4 hours | **Risk:** High - State-changing operations vulnerable

**Fix Steps:**
1. Install: `npm install @fastify/csrf-protection`

2. Add to `backend/src/server.ts`:
   ```typescript
   await app.register(csrf, {
     cookieKey: 'csrf_token',
     cookieOpts: { httpOnly: true }
   });
   ```

3. Update frontend to include CSRF token in requests

**Testing:**
- All POST/PUT/PATCH/DELETE requests
- CSRF token validation

---

### 3. Remove Password Bypass ⚠️ CRITICAL
**Time:** 2 hours | **Risk:** Critical - Anyone can login

**Location:** `backend/src/controllers/auth.controller.ts:42-43`

**Current Code:**
```typescript
// TEMPORARY: For development, accept any password for seeded users
// In production, use Auth0 or implement proper password authentication
```

**Fix:**
Remove the bypass and implement proper bcrypt verification:
```typescript
const isValidPassword = await bcrypt.compare(password, user.password);
if (!isValidPassword) {
  return reply.code(401).send({ success: false, error: 'Invalid credentials' });
}
```

**Testing:**
- Login with correct password ✅
- Login with incorrect password ❌
- Login with non-existent user ❌

---

### 4. File Upload Security ⚠️ HIGH
**Time:** 6 hours | **Risk:** Medium - Malicious file uploads

**Location:** `backend/src/services/s3.service.ts`

**Fix Steps:**
1. Install: `npm install file-type`

2. Add magic number validation:
   ```typescript
   import { fileTypeFromBuffer } from 'file-type';

   async function verifyFileType(buffer: Buffer, declaredType: string) {
     const detected = await fileTypeFromBuffer(buffer);
     if (!detected || detected.mime !== declaredType) {
       throw new Error('File type mismatch');
     }
   }
   ```

3. Add post-upload verification

**Testing:**
- Upload with spoofed MIME type
- Upload executable with image extension

---

### 5. Rate Limiting on Auth Endpoints ⚠️ HIGH
**Time:** 3 hours | **Risk:** Medium - Brute force attacks

**Location:** `backend/src/routes/auth.routes.ts`

**Fix:**
```typescript
fastify.post('/login', {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: '15 minutes'
    }
  },
  handler: authController.login
});
```

**Testing:**
- Attempt 6 logins in 15 minutes
- Verify 429 response

---

### 6. Add Input Validation to Auth ⚠️ HIGH
**Time:** 4 hours | **Risk:** Medium - Invalid data accepted

**Fix Steps:**
1. Create Zod schemas:
   ```typescript
   const loginSchema = z.object({
     email: z.string().email(),
     password: z.string().min(8)
   });
   ```

2. Add `validateBody(loginSchema)` to all auth routes

**Testing:**
- Invalid email format
- Short password
- SQL injection attempts

---

### 7. Docker Security ⚠️ HIGH
**Time:** 3 hours | **Risk:** High - Exposed credentials

**Location:** `backend/docker-compose.yml`

**Current Issue:**
```yaml
POSTGRES_PASSWORD: password  # ❌ Hardcoded
```

**Fix:**
```yaml
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
REDIS_PASSWORD: ${REDIS_PASSWORD}
```

Add to `.env`:
```
POSTGRES_PASSWORD=<strong-random-password>
REDIS_PASSWORD=<strong-random-password>
```

**Testing:**
- Docker compose up with new config

---

### 8. Create Backend .dockerignore ⚠️ CRITICAL
**Time:** 1 hour | **Risk:** Medium - Sensitive files in image

**Create:** `backend/.dockerignore`
```
node_modules
dist
coverage
*.test.ts
*.spec.ts
.env
.env.*
!.env.example
*.log
.git
README.md
docs/
```

**Testing:**
- Build Docker image
- Verify size reduction
- Check no sensitive files included

---

### 9. JWT Secret Validation ⚠️ MEDIUM
**Time:** 2 hours | **Risk:** Medium - Weak secrets

**Location:** `backend/src/config/index.ts:32`

**Current:**
```typescript
jwtSecret: z.string().min(32)
```

**Fix:**
```typescript
jwtSecret: z.string()
  .min(64)
  .refine((val) => {
    const uniqueChars = new Set(val).size;
    return uniqueChars >= 20;
  }, 'JWT secret must have sufficient randomness')
```

**Testing:**
- Weak secret rejected
- Strong secret accepted

---

### 10. Frontend .env.example ⚠️ HIGH
**Time:** 2 hours | **Risk:** Low - Configuration undocumented

**Create:** `frontend/.env.example`
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_APP_NAME=FlowComply
NEXT_PUBLIC_ENVIRONMENT=development
```

**Testing:**
- Frontend builds with config

---

## 🔧 Week 2: Database Integrity (40 hours)

### 11. Row-Level Security ⚠️ CRITICAL
**Time:** 10 hours | **Risk:** Critical - Cross-org data access

**Fix Steps:**
1. Enable RLS on all tables:
   ```sql
   ALTER TABLE "Asset" ENABLE ROW LEVEL SECURITY;
   ```

2. Create policies:
   ```sql
   CREATE POLICY tenant_isolation ON "Asset"
     USING (organizationId = current_setting('app.current_organization_id'));
   ```

3. Set organization ID in auth middleware:
   ```typescript
   await prisma.$executeRaw`SET app.current_organization_id = ${user.organizationId}`;
   ```

**Testing:**
- Cross-org queries blocked
- Same-org queries allowed

---

### 12. Fix String-Based Foreign Keys ⚠️ CRITICAL
**Time:** 6 hours | **Risk:** High - No referential integrity

**Location:** CompliancePlan model (submittedBy, approvedBy)

**Fix:**
```prisma
model CompliancePlan {
  submittedBy    User? @relation("SubmittedBy", fields: [submittedById], references: [id])
  submittedById  String?
  approvedBy     User? @relation("ApprovedBy", fields: [approvedById], references: [id])
  approvedById   String?
}
```

**Testing:**
- User deletion behavior
- Cascade deletes

---

### 13. Add Composite Indexes ⚠️ CRITICAL
**Time:** 4 hours | **Risk:** High - Slow queries

**Location:** `backend/prisma/schema.prisma`

**Fix:**
```prisma
model AuditLog {
  @@index([organizationId, timestamp, action])
}

model WaterQualityTest {
  @@index([organizationId, sampleDate, parameter])
}

model CompliancePlan {
  @@index([organizationId, targetDate, status])
}
```

**Testing:**
- EXPLAIN ANALYZE on queries
- Performance improvement measured

---

### 14. Fix Field Naming ⚠️ MEDIUM
**Time:** 4 hours | **Risk:** Low - Confusion

**Remove duplicates:**
- Document.uploadedById → use createdById only
- CompliancePlan.reviewDate → use nextReviewDate only

**Testing:**
- All queries updated
- No broken references

---

### 15. Fix Migration Structure ⚠️ CRITICAL
**Time:** 6 hours | **Risk:** High - No rollback

**Fix Steps:**
1. Document current schema state
2. Create rollback script template
3. Add migration validation to CI
4. Document migration procedures

**Testing:**
- Migration rollback works

---

### 16. Audit Logging Fix ⚠️ HIGH
**Time:** 2 hours | **Risk:** High - Compliance failures hidden

**Location:** `backend/src/services/audit.service.ts:68-76`

**Remove:**
```typescript
return null as any; // ❌ BAD
```

**Replace with proper mocking in tests**

**Testing:**
- Audit failures throw errors
- Tests properly mock auditing

---

### 17. Add Cross-Org Validation ⚠️ HIGH
**Time:** 5 hours | **Risk:** High - Data integrity

**Fix:**
```sql
ALTER TABLE "AssetDocument" ADD CONSTRAINT check_same_org
  CHECK (
    (SELECT organizationId FROM "Asset" WHERE id = assetId) =
    (SELECT organizationId FROM "Document" WHERE id = documentId)
  );
```

**Testing:**
- Cross-org linking blocked

---

### 18. Add NOT NULL Constraints ⚠️ MEDIUM
**Time:** 3 hours | **Risk:** Medium - Missing required data

**Fix critical asset location validation:**
```prisma
// Add application validation
if (isCritical && (!latitude || !longitude)) {
  throw new Error('Critical assets must have location');
}
```

**Testing:**
- Critical asset creation validation

---

## ⚙️ Week 3: Infrastructure (40 hours)

### 19. Fix Port Configuration ⚠️ CRITICAL
**Time:** 2 hours | **Risk:** Low - Deployment confusion

**Standardize on port 3000:**
- Update `backend/Dockerfile` EXPOSE 3000
- Update `.env.example` PORT=3000
- Update `docker-compose.yml`
- Update all documentation

**Testing:**
- Docker build and run
- All services accessible

---

### 20. Implement Cache Invalidation ⚠️ CRITICAL
**Time:** 8 hours | **Risk:** High - Stale data

**Location:** All service mutation methods

**Fix:**
```typescript
// In asset.service.ts after create/update/delete
await cacheService.invalidateOrganization(user.organizationId);

// In cache.service.ts
async invalidateOrganization(orgId: string) {
  const keys = await redis.keys(`org:${orgId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

**Testing:**
- Create asset → cache cleared
- Dashboard shows fresh data

---

## 📊 Success Metrics for Week 1-3

### Security Metrics
- [ ] All tokens in httpOnly cookies
- [ ] CSRF protection active on all mutations
- [ ] No hardcoded passwords
- [ ] File upload security hardened
- [ ] Auth endpoints rate limited
- [ ] All inputs validated

### Database Metrics
- [ ] Row-Level Security active
- [ ] Foreign keys proper
- [ ] Composite indexes added
- [ ] Query performance improved 30%+
- [ ] No cross-org data access possible

### Infrastructure Metrics
- [ ] Port configuration consistent
- [ ] Cache invalidation working
- [ ] Docker images secure
- [ ] All services configurable via env vars
- [ ] Documentation complete

---

## Testing Checklist

After completing fixes, verify:

### Security Testing
- [ ] Run OWASP ZAP scan
- [ ] Test SQL injection attempts
- [ ] Test XSS payload injection
- [ ] Test CSRF token validation
- [ ] Test brute force protection
- [ ] Test file upload with malicious files

### Integration Testing
- [ ] All 115 integration tests pass
- [ ] Manual login/logout test
- [ ] Asset CRUD test
- [ ] Document upload test
- [ ] Dashboard loads correctly

### Performance Testing
- [ ] Dashboard loads < 1s (with cache)
- [ ] List endpoints < 300ms
- [ ] Database queries optimized
- [ ] No N+1 queries remain

---

## Rollback Procedures

If any fix causes issues:

### JWT Cookie Migration
1. Re-enable localStorage fallback
2. Support both methods for 1 week
3. Monitor error rates

### Database Changes
1. Keep rollback SQL scripts
2. Test rollback in staging first
3. Take backup before applying

### Cache Invalidation
1. Add feature flag
2. Disable if performance degrades
3. Investigate and fix

---

## Quick Command Reference

### Run Tests
```bash
cd backend
npm test                    # Unit tests
npm run test:integration    # Integration tests
npm run test:e2e           # E2E tests
```

### Database Operations
```bash
cd backend
npx prisma migrate dev     # Create migration
npx prisma generate        # Generate client
npx prisma db push         # Apply changes
```

### Docker Operations
```bash
docker-compose build       # Rebuild images
docker-compose up -d       # Start services
docker-compose logs -f     # View logs
```

### Check Security
```bash
npm audit                  # Check dependencies
npm audit fix              # Fix vulnerabilities
```

---

## Need Help?

### Common Issues

**Issue:** Tests failing after JWT change
**Solution:** Update token extraction in tests to read from cookies

**Issue:** CORS errors after adding credentials
**Solution:** Ensure `credentials: true` in both frontend axios config and backend CORS

**Issue:** Database migration fails
**Solution:** Check for existing data, add data migration script

**Issue:** Docker build slow
**Solution:** Ensure .dockerignore excludes node_modules and dist/

---

## Next Steps After Week 3

Once these 20 critical fixes are complete:

1. **Week 4-6:** Architecture & Performance (see IMPLEMENTATION_PLAN.md Phase 2)
2. **Week 7-10:** Testing & Quality (see IMPLEMENTATION_PLAN.md Phase 3)
3. **Week 11+:** Polish & Optimization (see IMPLEMENTATION_PLAN.md Phase 4)

**Refer to IMPLEMENTATION_PLAN.md for complete roadmap.**

---

**Priority:** Complete these 20 fixes before ANY new features.
**Timeline:** 3 weeks (120 hours)
**Risk Level:** High - Production blockers
**Status:** Ready to start 🚀
