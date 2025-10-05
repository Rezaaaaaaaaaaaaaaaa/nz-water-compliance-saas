# Quick Deployment Guide (30 Minutes)

The fastest way to get NZ Water Compliance SaaS running in production.

## 🚀 Prerequisites

- AWS Account
- Domain name
- 30 minutes

---

## Option 1: Railway.app (Fastest - 10 Minutes)

**Perfect for:** MVP, demos, small deployments

### Step 1: Deploy Backend (5 minutes)

1. **Sign up at [Railway.app](https://railway.app)**

2. **Click "New Project" → "Deploy from GitHub repo"**

3. **Connect your repository:** `Rezaaaaaaaaaaaaaaaa/nz-water-compliance-saas`

4. **Select `backend` directory**

5. **Add environment variables:**
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=your-random-secret-here
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=ap-southeast-2
AWS_S3_BUCKET=your-bucket
EMAIL_PROVIDER=console
FRONTEND_URL=https://your-app.vercel.app
```

6. **Add PostgreSQL database:**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway automatically sets DATABASE_URL

7. **Add Redis:**
   - Click "New" → "Database" → "Add Redis"
   - Railway automatically sets REDIS_URL

8. **Deploy!** Railway will auto-deploy when you push to GitHub

**Your API will be live at:** `https://your-app.up.railway.app`

**Cost:** ~$10-20/month for starter

---

### Step 2: Deploy Frontend (5 minutes)

1. **Sign up at [Vercel.com](https://vercel.com)**

2. **Click "New Project" → Import Git Repository**

3. **Connect repository:** `Rezaaaaaaaaaaaaaaaa/nz-water-compliance-saas`

4. **Root directory:** `frontend`

5. **Environment variables:**
```env
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
```

6. **Deploy!**

**Your app will be live at:** `https://your-app.vercel.app`

**Cost:** Free for starter

---

## Option 2: Render.com (Simple - 15 Minutes)

**Perfect for:** Small to medium deployments

### Backend Deployment

1. **Go to [Render.com](https://render.com) → New → Web Service**

2. **Connect GitHub repo**

3. **Configure:**
```
Name: compliance-saas-backend
Root Directory: backend
Environment: Node
Build Command: npm install && npx prisma generate && npm run build
Start Command: npm start
```

4. **Add PostgreSQL:**
   - New → PostgreSQL
   - Connect to your web service

5. **Add Redis:**
   - New → Redis
   - Connect to your web service

6. **Environment Variables:**
```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=random-secret-here
EMAIL_PROVIDER=console
```

**Cost:** $7/month (Starter)

### Frontend Deployment

Deploy to Vercel (same as Option 1, Step 2)

---

## Option 3: DigitalOcean App Platform (15 Minutes)

**Perfect for:** Full control, predictable pricing

### 1. Create Account at DigitalOcean

### 2. Create App from GitHub

1. **Apps → Create App → GitHub**
2. **Select repository**
3. **Component 1: Backend**
   ```
   Name: backend
   Type: Web Service
   Source Directory: /backend
   Build Command: npm install && npx prisma generate && npm run build
   Run Command: npm start
   HTTP Port: 5000
   ```

4. **Component 2: PostgreSQL Database**
   - Add PostgreSQL managed database
   - Auto-connects to backend

5. **Component 3: Redis Cache**
   - Add Redis managed cache
   - Auto-connects to backend

6. **Component 4: Frontend**
   ```
   Name: frontend
   Type: Static Site
   Source Directory: /frontend
   Build Command: npm install && npm run build
   Output Directory: .next
   ```

### 3. Environment Variables

Backend:
```env
NODE_ENV=production
DATABASE_URL=${db.DATABASE_URL}
REDIS_URL=${redis.REDIS_URL}
JWT_SECRET=your-secret
EMAIL_PROVIDER=console
```

Frontend:
```env
NEXT_PUBLIC_API_URL=${backend.PUBLIC_URL}
```

**Cost:** ~$25/month (Basic tier)

---

## Post-Deployment Setup (10 Minutes)

### 1. Run Database Migrations

**Railway/Render:**
```bash
# Use the platform's CLI or web terminal
npx prisma migrate deploy
npx prisma db seed
```

### 2. Test Your Deployment

```bash
# Health check
curl https://your-api-url/health

# Create test user
curl -X POST https://your-api-url/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Test123!",
    "firstName": "Admin",
    "lastName": "User",
    "organizationName": "Test Organization"
  }'
```

### 3. Set Up Custom Domain (Optional)

**For API (Railway/Render):**
1. Platform settings → Custom Domain
2. Add: `api.your-domain.com`
3. Add CNAME record to your DNS:
   ```
   Type: CNAME
   Name: api
   Value: your-app.railway.app (or render.com)
   ```

**For Frontend (Vercel):**
1. Vercel Dashboard → Domains
2. Add: `app.your-domain.com`
3. Add CNAME record:
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

---

## Environment Variables Template

Save this as `.env.production`:

```env
# Backend
NODE_ENV=production
PORT=5000

# Database (auto-provided by platform)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis (auto-provided by platform)
REDIS_URL=redis://host:6379

# Security
JWT_SECRET=<generate with: openssl rand -base64 64>
JWT_EXPIRY=7d

# AWS (optional - for full features)
AWS_ACCESS_KEY_ID=your-key-id
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-southeast-2
AWS_S3_BUCKET=your-bucket-name

# Email (start with console, upgrade later)
EMAIL_PROVIDER=console
FROM_EMAIL=noreply@your-domain.com
FROM_NAME=NZ Water Compliance

# Frontend URL
FRONTEND_URL=https://app.your-domain.com

# Monitoring (optional)
SENTRY_DSN=your-sentry-dsn

# Frontend
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

---

## Cost Comparison

| Platform | Backend | Database | Cache | Total/Month |
|----------|---------|----------|-------|-------------|
| **Railway** | Free tier | $10 | $5 | ~$15 |
| **Render** | $7 | $7 | $10 | ~$24 |
| **DigitalOcean** | $12 | $15 | $15 | ~$42 |
| **AWS (Full)** | $30 | $50 | $20 | ~$100 |

**Recommendation:**
- **Start with Railway** (cheapest, easiest)
- **Scale to Render** (better performance)
- **Move to AWS** (enterprise-ready)

---

## Upgrade Path

### When to upgrade from Railway?

- More than 100 active users
- Need 99.9% uptime SLA
- Require SOC 2 compliance
- Need multi-region deployment

### Migration to AWS

1. Export database: `pg_dump DATABASE_URL > backup.sql`
2. Create AWS RDS, import backup
3. Update environment variables
4. Switch DNS to point to AWS
5. Monitor for 48 hours
6. Decommission Railway

---

## Common Issues

### "Database connection failed"

**Solution:** Check if DATABASE_URL is set correctly
```bash
# Print first 50 chars of DATABASE_URL
echo $DATABASE_URL | cut -c1-50
```

### "Redis connection timeout"

**Solution:** Ensure REDIS_URL includes protocol
```bash
# Correct: redis://host:6379
# Wrong: host:6379
```

### "Migrations failed"

**Solution:** Run migrations manually
```bash
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

### "Frontend can't connect to API"

**Solution:** Check CORS settings in backend/src/server.ts
```typescript
// Ensure CORS allows your frontend domain
origin: process.env.FRONTEND_URL || 'http://localhost:3000'
```

---

## 🎉 You're Live!

Your deployment is complete when:
- ✅ API health check returns 200 OK
- ✅ Frontend loads without errors
- ✅ Can create account and login
- ✅ Can create an asset
- ✅ Can upload a document

**Next Steps:**
1. Set up monitoring (Sentry)
2. Configure custom domain
3. Enable email (AWS SES)
4. Add first real users
5. Collect feedback

**Questions?** Check `PRODUCTION_DEPLOYMENT.md` for detailed AWS setup.

---

## Quick Commands Reference

```bash
# View logs (Railway)
railway logs

# View logs (Render)
render logs

# Connect to database
railway run psql $DATABASE_URL

# Run migrations
railway run npx prisma migrate deploy

# SSH into service (Render)
render ssh

# Restart service
railway restart
```

---

**Deployment time:** 10-30 minutes depending on platform
**Total cost:** $15-100/month depending on scale
**Difficulty:** Beginner friendly ⭐⭐⭐
