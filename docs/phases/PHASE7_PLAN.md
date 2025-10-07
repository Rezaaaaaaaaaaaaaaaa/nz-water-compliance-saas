# Phase 7: Production Deployment & Operations

**Date:** October 7, 2025
**Status:** 🚀 **IN PROGRESS**
**Project:** NZ Water Compliance SaaS (FlowComply)

---

## 🎯 Executive Summary

Phase 7 focuses on **deploying the production-ready application to AWS**, implementing **operational excellence**, and establishing **continuous monitoring and maintenance** processes.

### Phase 7 Objectives:
1. ✅ Deploy to AWS production environment
2. ✅ Implement CI/CD automation
3. ✅ Set up comprehensive monitoring & alerting
4. ✅ Establish backup & disaster recovery
5. ✅ Create operational runbooks
6. ✅ Implement security hardening

### Success Criteria:
- [ ] Application running in production AWS environment
- [ ] 99.9% uptime SLA achieved
- [ ] Automated CI/CD pipeline operational
- [ ] Full monitoring and alerting configured
- [ ] Disaster recovery plan tested
- [ ] Security compliance verified

---

## 📋 Phase 7 Work Breakdown

### 1. Pre-Deployment Preparation (Days 1-2)

#### 1.1 Environment Setup
- [ ] Create AWS production account/environment
- [ ] Set up IAM roles and policies
- [ ] Configure VPC and networking
- [ ] Create security groups
- [ ] Set up bastion host (if needed)

#### 1.2 Database Setup
- [ ] Create RDS PostgreSQL instance (db.t3.small)
- [ ] Configure automated backups (7-day retention)
- [ ] Enable encryption at rest
- [ ] Set up read replicas (if needed)
- [ ] Run Prisma migrations
- [ ] Seed production data

#### 1.3 Caching Layer
- [ ] Create ElastiCache Redis cluster (cache.t3.micro)
- [ ] Configure Redis persistence
- [ ] Set up Redis password authentication
- [ ] Test connection from ECS

#### 1.4 Storage Configuration
- [ ] Create S3 bucket for documents
- [ ] Enable versioning and encryption
- [ ] Configure lifecycle policies (7-year retention)
- [ ] Set up CORS policies
- [ ] Create CloudFront distribution (optional)

#### 1.5 Email Service
- [ ] Configure AWS SES in production region
- [ ] Verify domain for sending emails
- [ ] Request production access (remove sandbox)
- [ ] Set up email templates
- [ ] Configure bounce and complaint handling

---

### 2. Infrastructure Deployment (Days 3-5)

#### 2.1 Terraform Infrastructure
```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Create production workspace
terraform workspace new production

# Plan deployment
terraform plan -var-file="production.tfvars" -out=production.plan

# Review plan carefully
# Apply infrastructure
terraform apply production.plan
```

**Components to Deploy:**
- [ ] VPC with public/private subnets
- [ ] Application Load Balancer (ALB)
- [ ] ECS Cluster with Fargate
- [ ] RDS PostgreSQL instance
- [ ] ElastiCache Redis cluster
- [ ] S3 buckets
- [ ] CloudWatch log groups
- [ ] IAM roles and policies
- [ ] Security groups
- [ ] Route53 DNS records (if applicable)

#### 2.2 Container Registry
- [ ] Create ECR repositories for backend and frontend
- [ ] Configure repository policies
- [ ] Enable image scanning
- [ ] Set up lifecycle policies (keep last 10 images)

#### 2.3 Secrets Management
- [ ] Create AWS Secrets Manager secrets
- [ ] Store database credentials
- [ ] Store JWT secret
- [ ] Store API keys (AWS, Anthropic)
- [ ] Configure ECS task to read secrets

---

### 3. Application Deployment (Days 6-8)

#### 3.1 Backend Deployment
```bash
cd backend

# Build Docker image
docker build -t flowcomply-backend:latest .

# Tag for ECR
docker tag flowcomply-backend:latest \
  <account>.dkr.ecr.<region>.amazonaws.com/flowcomply-backend:latest

# Push to ECR
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker push <account>.dkr.ecr.<region>.amazonaws.com/flowcomply-backend:latest

# Update ECS service
aws ecs update-service \
  --cluster flowcomply-production \
  --service backend-service \
  --force-new-deployment
```

**Deployment Checklist:**
- [ ] Build backend Docker image
- [ ] Push to ECR
- [ ] Create ECS task definition
- [ ] Configure environment variables
- [ ] Set up health check endpoint
- [ ] Deploy to ECS Fargate
- [ ] Verify service is running
- [ ] Test health check: `/api/monitoring/health`

#### 3.2 Frontend Deployment
```bash
cd frontend

# Build Next.js for production
npm run build

# Build Docker image
docker build -t flowcomply-frontend:latest .

# Tag and push to ECR
docker tag flowcomply-frontend:latest \
  <account>.dkr.ecr.<region>.amazonaws.com/flowcomply-frontend:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/flowcomply-frontend:latest

# Update ECS service
aws ecs update-service \
  --cluster flowcomply-production \
  --service frontend-service \
  --force-new-deployment
```

**Deployment Checklist:**
- [ ] Build frontend for production
- [ ] Build Docker image
- [ ] Push to ECR
- [ ] Create ECS task definition
- [ ] Configure environment variables
- [ ] Deploy to ECS Fargate
- [ ] Verify service is running
- [ ] Test homepage loads

#### 3.3 Database Migration
```bash
cd backend

# Run production migrations (use bastion or ECS exec)
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed initial data (optional)
npm run seed:production
```

#### 3.4 Background Workers
- [ ] Deploy BullMQ worker containers
- [ ] Configure queue connections
- [ ] Test email notification job
- [ ] Test compliance check job
- [ ] Verify job processing

---

### 4. CI/CD Pipeline Setup (Days 9-10)

#### 4.1 GitHub Actions Configuration
**Already Created:**
- `.github/workflows/backend-ci.yml` - Backend tests
- `.github/workflows/frontend-ci.yml` - Frontend tests
- `.github/workflows/deploy.yml` - Deployment automation

**Enhancements Needed:**
- [ ] Add production deployment workflow
- [ ] Configure AWS credentials in GitHub Secrets
- [ ] Add automated security scanning (Snyk/Dependabot)
- [ ] Add automated testing on PR
- [ ] Add deployment approval gates
- [ ] Configure rollback automation

#### 4.2 GitHub Secrets Configuration
Required secrets:
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
ECR_BACKEND_REPOSITORY
ECR_FRONTEND_REPOSITORY
ECS_CLUSTER_NAME
ECS_BACKEND_SERVICE
ECS_FRONTEND_SERVICE
DATABASE_URL (for migrations)
```

#### 4.3 Deployment Pipeline
```yaml
# .github/workflows/production-deploy.yml
name: Production Deployment

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Run tests
      - Security scan

  build-and-push:
    needs: test
    steps:
      - Build Docker images
      - Push to ECR

  deploy:
    needs: build-and-push
    steps:
      - Update ECS services
      - Run database migrations
      - Smoke tests

  verify:
    needs: deploy
    steps:
      - Health checks
      - Integration tests
```

---

### 5. Monitoring & Observability (Days 11-13)

#### 5.1 CloudWatch Setup
- [ ] Create custom CloudWatch dashboard
- [ ] Configure log aggregation
- [ ] Set up log retention (90 days)
- [ ] Create custom metrics
- [ ] Configure X-Ray tracing (optional)

**Key Metrics to Monitor:**
- ECS task CPU/Memory utilization
- ALB target response time
- ALB HTTP 4xx/5xx errors
- RDS CPU/Memory/Connections
- Redis cache hit rate
- S3 bucket storage usage
- API endpoint latency
- Background job queue depth

#### 5.2 CloudWatch Alarms
```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name flowcomply-high-cpu \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --period 300 \
  --statistic Average \
  --threshold 80 \
  --alarm-actions <SNS_TOPIC_ARN>
```

**Alarms to Create:**
- [ ] High CPU utilization (>80%)
- [ ] High memory utilization (>85%)
- [ ] High error rate (>5% 5xx)
- [ ] Database connections exhausted
- [ ] Redis memory usage high
- [ ] Slow API response time (>2s p95)
- [ ] Failed background jobs (>10)
- [ ] Low disk space (<10%)

#### 5.3 Application Performance Monitoring (APM)
**Options:**
1. **AWS X-Ray** (Built-in, free tier available)
2. **Datadog APM** (Paid, comprehensive)
3. **New Relic** (Paid, popular)
4. **Sentry** (Error tracking, free tier)

**Recommendation:** Start with X-Ray + Sentry

- [ ] Integrate X-Ray SDK in backend
- [ ] Set up Sentry for error tracking
- [ ] Configure Sentry alerts
- [ ] Create performance baselines

#### 5.4 Log Management
- [ ] Configure structured JSON logging
- [ ] Set up log filtering and alerting
- [ ] Create log-based metrics
- [ ] Set up log exports to S3 (archival)

#### 5.5 Uptime Monitoring
- [ ] Set up external uptime monitoring (UptimeRobot/Pingdom)
- [ ] Configure health check endpoints
- [ ] Set up status page (optional)
- [ ] Configure SMS alerts for critical issues

---

### 6. Security Hardening (Days 14-15)

#### 6.1 Network Security
- [ ] Enable AWS WAF on ALB
- [ ] Configure WAF rules (OWASP Core Rule Set)
- [ ] Enable DDoS protection (AWS Shield Standard)
- [ ] Restrict security groups (least privilege)
- [ ] Enable VPC flow logs
- [ ] Configure network ACLs

#### 6.2 Application Security
- [ ] Enable HTTPS (SSL/TLS certificate)
- [ ] Configure security headers (Helmet.js)
- [ ] Enable rate limiting (100 req/15min)
- [ ] Configure CORS policies
- [ ] Enable audit logging
- [ ] Set up intrusion detection

#### 6.3 Data Security
- [ ] Enable encryption at rest (RDS, S3, Redis)
- [ ] Enable encryption in transit (HTTPS, TLS)
- [ ] Configure backup encryption
- [ ] Set up key rotation (AWS KMS)
- [ ] Enable S3 versioning and MFA delete

#### 6.4 Compliance
- [ ] Review OWASP Top 10 compliance
- [ ] Enable AWS Config for compliance monitoring
- [ ] Set up AWS Security Hub
- [ ] Configure CloudTrail for audit logging
- [ ] Document security controls

#### 6.5 Penetration Testing
- [ ] Conduct vulnerability assessment
- [ ] Perform penetration testing (AWS approved)
- [ ] Fix critical/high vulnerabilities
- [ ] Document findings and remediation

---

### 7. Backup & Disaster Recovery (Days 16-17)

#### 7.1 Database Backup
- [ ] Enable automated RDS backups (daily)
- [ ] Set backup retention (7 days minimum)
- [ ] Enable point-in-time recovery
- [ ] Test restore procedure
- [ ] Document RTO/RPO targets

**Backup Strategy:**
- Automated daily backups at 2 AM UTC
- 7-day retention for compliance
- Cross-region backup replication (optional)
- Monthly snapshot to S3 Glacier (long-term)

#### 7.2 Application Backup
- [ ] Configure S3 bucket versioning
- [ ] Set up S3 cross-region replication
- [ ] Back up configuration files
- [ ] Back up secrets (encrypted)
- [ ] Document restore procedures

#### 7.3 Disaster Recovery Plan
```
Recovery Time Objective (RTO): 4 hours
Recovery Point Objective (RPO): 1 hour

Disaster Scenarios:
1. Database failure → Restore from latest automated backup
2. Complete region failure → Failover to DR region
3. Data corruption → Point-in-time recovery
4. Application failure → Rollback to previous version
5. Security breach → Isolate, investigate, restore
```

**DR Checklist:**
- [ ] Document failover procedures
- [ ] Create DR runbooks
- [ ] Test disaster recovery (quarterly)
- [ ] Train team on DR procedures
- [ ] Maintain emergency contact list

#### 7.4 Backup Testing
- [ ] Quarterly restore test from backup
- [ ] Document restore time
- [ ] Verify data integrity
- [ ] Test cross-region failover

---

### 8. Operational Runbooks (Days 18-19)

#### 8.1 Deployment Runbook
**File:** `docs/runbooks/deployment.md`

Topics:
- Pre-deployment checklist
- Deployment steps
- Rollback procedures
- Post-deployment verification
- Common deployment issues

#### 8.2 Incident Response Runbook
**File:** `docs/runbooks/incident-response.md`

Topics:
- Incident severity levels
- Escalation procedures
- Communication plan
- Troubleshooting steps
- Post-incident review

#### 8.3 Database Operations Runbook
**File:** `docs/runbooks/database-ops.md`

Topics:
- Running migrations
- Backup and restore
- Performance tuning
- Connection pool management
- Common database issues

#### 8.4 Monitoring & Alerting Runbook
**File:** `docs/runbooks/monitoring.md`

Topics:
- Monitoring dashboard access
- Alert investigation procedures
- Performance troubleshooting
- Log analysis
- Metrics interpretation

#### 8.5 Security Incident Runbook
**File:** `docs/runbooks/security-incident.md`

Topics:
- Security incident classification
- Containment procedures
- Investigation steps
- Recovery procedures
- Regulatory reporting

---

### 9. Performance Optimization (Days 20-21)

#### 9.1 Load Testing
```bash
# Install k6
brew install k6

# Run load test
k6 run load-tests/api-load-test.js

# Analyze results
# - Requests per second
# - Response time (p95, p99)
# - Error rate
# - Throughput
```

**Load Test Scenarios:**
- [ ] Normal load (100 concurrent users)
- [ ] Peak load (500 concurrent users)
- [ ] Stress test (1000 concurrent users)
- [ ] Endurance test (24 hours)

#### 9.2 Performance Baselines
- [ ] Establish p95 response time baseline
- [ ] Document database query performance
- [ ] Measure cache hit rate
- [ ] Analyze slow endpoints
- [ ] Create performance dashboard

#### 9.3 Optimization Targets
| Metric | Current | Target |
|--------|---------|--------|
| API p95 response time | TBD | <200ms |
| Dashboard load (cached) | 50ms | <100ms |
| DWQAR export | TBD | <2s |
| Cache hit rate | TBD | >70% |
| Database query p95 | TBD | <50ms |

#### 9.4 Scaling Configuration
- [ ] Configure ECS auto-scaling (CPU-based)
- [ ] Set min/max task count (2-10)
- [ ] Configure RDS read replicas (if needed)
- [ ] Set up Redis cluster (if needed)
- [ ] Test auto-scaling behavior

---

### 10. User Acceptance Testing (Days 22-25)

#### 10.1 UAT Environment Setup
- [ ] Create staging environment (mirror of production)
- [ ] Load test data
- [ ] Create test user accounts
- [ ] Document test scenarios

#### 10.2 UAT Test Scenarios
1. **User Authentication**
   - Registration, login, logout
   - Password reset
   - Role-based access

2. **Asset Management**
   - Create/edit/delete assets
   - Asset search and filtering
   - Risk classification

3. **Document Management**
   - Upload documents
   - Download documents
   - Search and filter
   - 7-year retention

4. **Compliance Plans (DWSP)**
   - Create DWSP (6-step wizard)
   - Validate 12 mandatory elements
   - Submit to regulator
   - Export to PDF

5. **Reports & Analytics**
   - Generate monthly report
   - View analytics dashboard
   - Export data to CSV
   - Compliance scoring

6. **DWQAR System**
   - Record water quality tests
   - Generate DWQAR report
   - Export to Excel
   - Validate compliance rules

7. **AI Features**
   - AI compliance assistant chat
   - DWSP document analyzer
   - Water quality analysis
   - Risk prediction

#### 10.3 UAT Sign-off
- [ ] Test all critical user journeys
- [ ] Document bugs and issues
- [ ] Prioritize and fix critical issues
- [ ] Obtain stakeholder approval
- [ ] Create go-live checklist

---

### 11. Production Go-Live (Day 26-28)

#### 11.1 Pre-Go-Live Checklist
- [ ] All UAT issues resolved
- [ ] Stakeholder approval obtained
- [ ] Production deployment tested in staging
- [ ] Rollback plan documented and tested
- [ ] Monitoring and alerts configured
- [ ] Team trained on operations
- [ ] Emergency contacts documented
- [ ] Communication plan ready

#### 11.2 Go-Live Day Activities
**Timeline:**
- **T-2 hours:** Final staging verification
- **T-1 hour:** Production deployment starts
- **T-0 (Go-Live):** DNS cutover / traffic enabled
- **T+1 hour:** Smoke tests and monitoring
- **T+4 hours:** First checkpoint
- **T+24 hours:** Full stability check

**Activities:**
1. Deploy backend and frontend to production
2. Run database migrations
3. Verify all services are healthy
4. Run smoke tests
5. Enable traffic (DNS or load balancer)
6. Monitor error rates and performance
7. Communicate go-live status
8. Be ready for rollback

#### 11.3 Smoke Tests
```bash
# Health check
curl https://api.flowcomply.com/api/monitoring/health

# Authentication
curl -X POST https://api.flowcomply.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Dashboard API
curl https://api.flowcomply.com/api/analytics/dashboard \
  -H "Authorization: Bearer $TOKEN"

# Frontend
curl https://flowcomply.com
```

#### 11.4 Post-Go-Live Monitoring
- [ ] Monitor error rates (CloudWatch, Sentry)
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Analyze logs for issues
- [ ] Document any incidents

---

### 12. Post-Deployment Operations (Days 29-30)

#### 12.1 Operations Handoff
- [ ] Train operations team
- [ ] Provide runbook access
- [ ] Set up on-call rotation
- [ ] Document escalation procedures
- [ ] Establish SLA commitments

#### 12.2 Continuous Improvement
- [ ] Weekly performance review
- [ ] Monthly security audit
- [ ] Quarterly DR test
- [ ] Regular dependency updates
- [ ] User feedback analysis

#### 12.3 Documentation Updates
- [ ] Update architecture diagrams
- [ ] Document known issues
- [ ] Create FAQ for users
- [ ] Update API documentation
- [ ] Maintain change log

---

## 📊 Phase 7 Success Metrics

### Deployment Metrics
- [ ] Zero-downtime deployment achieved
- [ ] Rollback capability tested and verified
- [ ] CI/CD pipeline fully automated
- [ ] Deployment time < 15 minutes

### Performance Metrics
- [ ] 99.9% uptime SLA achieved
- [ ] p95 API response time < 200ms
- [ ] Dashboard load time < 100ms
- [ ] Cache hit rate > 70%

### Security Metrics
- [ ] Zero critical vulnerabilities
- [ ] WAF rules active and tested
- [ ] Encryption enabled (rest + transit)
- [ ] Audit logs enabled and monitored

### Operational Metrics
- [ ] Mean Time to Detect (MTTD) < 5 minutes
- [ ] Mean Time to Resolve (MTTR) < 30 minutes
- [ ] Backup success rate 100%
- [ ] DR test completed successfully

---

## 🚧 Known Risks & Mitigations

### Risk 1: Database Migration Failure
**Likelihood:** Medium
**Impact:** High
**Mitigation:**
- Test migrations in staging first
- Take full database backup before migration
- Have rollback script ready
- Perform during low-traffic window

### Risk 2: Performance Degradation in Production
**Likelihood:** Low
**Impact:** Medium
**Mitigation:**
- Load test before go-live
- Configure auto-scaling
- Monitor performance closely
- Have scaling plan ready

### Risk 3: Third-party API Failures (AWS SES, Anthropic)
**Likelihood:** Low
**Impact:** Medium
**Mitigation:**
- Implement retry logic
- Configure fallback mechanisms
- Monitor API quotas
- Set up alerts for failures

### Risk 4: Security Breach
**Likelihood:** Low
**Impact:** Critical
**Mitigation:**
- Enable WAF and Shield
- Implement intrusion detection
- Regular security audits
- Incident response plan ready

---

## 💰 Production Cost Estimation

### AWS Infrastructure (Monthly)
| Service | Configuration | Cost |
|---------|--------------|------|
| ECS Fargate (Backend) | 2 tasks, 1 vCPU, 2GB RAM | $60 |
| ECS Fargate (Frontend) | 2 tasks, 0.5 vCPU, 1GB RAM | $30 |
| RDS PostgreSQL | db.t3.small | $35 |
| ElastiCache Redis | cache.t3.micro | $15 |
| Application Load Balancer | Standard | $20 |
| S3 Storage | 100GB | $3 |
| CloudWatch | Logs + Metrics | $10 |
| NAT Gateway | Standard | $35 |
| Data Transfer | 500GB/month | $45 |
| **Subtotal** | | **$253/month** |

### Additional Services
| Service | Cost |
|---------|------|
| AWS SES | $0.10/1000 emails (~$5/month) |
| Claude API (AI) | $50-200/month (usage-based) |
| Domain & SSL | $15/month |
| **Total Estimated Cost** | **$323-473/month** |

### Cost Optimization Tips:
- Use Savings Plans for ECS (20-40% discount)
- Schedule non-prod environments (shut down nights/weekends)
- Use S3 lifecycle policies to move old data to Glacier
- Monitor and right-size instances regularly

---

## 📅 Phase 7 Timeline

**Total Duration:** 30 days

| Week | Focus Area | Days |
|------|-----------|------|
| Week 1 | Pre-deployment prep + Infrastructure | 1-7 |
| Week 2 | Application deployment + CI/CD | 8-14 |
| Week 3 | Monitoring + Security + DR | 15-21 |
| Week 4 | UAT + Go-Live + Operations | 22-30 |

---

## ✅ Phase 7 Deliverables

### Infrastructure
- [ ] Production AWS environment fully configured
- [ ] Terraform infrastructure deployed
- [ ] Database running with migrations applied
- [ ] Redis cache operational
- [ ] S3 buckets configured
- [ ] Email service configured

### Application
- [ ] Backend deployed to ECS
- [ ] Frontend deployed to ECS
- [ ] Background workers running
- [ ] Health checks passing
- [ ] Smoke tests passing

### CI/CD
- [ ] GitHub Actions pipelines configured
- [ ] Automated testing on PR
- [ ] Automated deployment to production
- [ ] Rollback automation

### Monitoring
- [ ] CloudWatch dashboard created
- [ ] Alarms configured (11+ alarms)
- [ ] APM integrated (X-Ray/Sentry)
- [ ] Log aggregation configured
- [ ] Uptime monitoring active

### Security
- [ ] WAF rules deployed
- [ ] HTTPS enabled
- [ ] Encryption configured
- [ ] Security audit completed
- [ ] Penetration testing done

### Operations
- [ ] 5 operational runbooks created
- [ ] On-call rotation established
- [ ] Disaster recovery tested
- [ ] Team training completed
- [ ] SLA commitments documented

### Documentation
- [ ] Production deployment guide
- [ ] Operations handbook
- [ ] Incident response procedures
- [ ] Architecture diagrams updated
- [ ] API documentation updated

---

## 🎯 Next Steps (Immediate)

### This Week:
1. **Set up AWS production account**
   - Create IAM users and roles
   - Configure billing alerts

2. **Review Terraform configuration**
   - Update `production.tfvars`
   - Validate all module configurations

3. **Create deployment scripts**
   - Build and push Docker images script
   - Database migration script
   - Smoke test script

4. **Configure GitHub Secrets**
   - AWS credentials
   - ECR repository URLs
   - Database connection strings

5. **Create monitoring dashboard**
   - Design CloudWatch dashboard
   - Define key metrics
   - Set up initial alarms

---

## 📝 Phase 7 Status: 🚀 IN PROGRESS

**Current Focus:** Infrastructure setup and deployment planning

**Next Milestone:** AWS infrastructure deployed and verified

**Estimated Completion:** November 6, 2025 (30 days from start)

---

**Prepared by:** Development Team
**Document Date:** October 7, 2025
**Version:** 1.0 DRAFT

---

*This plan will be updated as Phase 7 progresses. Check back for status updates and completion reports.*
