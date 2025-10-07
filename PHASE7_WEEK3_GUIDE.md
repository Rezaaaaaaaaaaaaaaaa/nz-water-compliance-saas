# Phase 7 Week 3: Monitoring & Security - Quick Start Guide

**Week:** October 21-27, 2025
**Status:** 🚀 **READY TO START**
**Duration:** 5-7 days

---

## Overview

Week 3 focuses on implementing comprehensive monitoring, observability, and security hardening for the production deployment.

### Goals
- ✅ CloudWatch dashboard operational
- ✅ 11+ alarms configured
- ✅ X-Ray distributed tracing enabled
- ✅ Sentry error tracking integrated
- ✅ AWS WAF protecting application
- ✅ Load testing completed
- ✅ Security hardened
- ✅ Disaster recovery tested

---

## Day 1: CloudWatch Dashboard (Monday)

### Task 1: Create Dashboard (30 minutes)

```bash
cd infrastructure/cloudwatch

# Review dashboard configuration
cat dashboard.json

# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name FlowComply-Production \
  --dashboard-body file://dashboard.json

# Verify
aws cloudwatch get-dashboard \
  --dashboard-name FlowComply-Production
```

**Dashboard includes:**
- API request rate
- Response times (p50, p95)
- HTTP status codes
- Error rate percentage
- ECS CPU & memory
- RDS performance
- Redis cache hits/misses
- Recent error logs

### Task 2: Set Up CloudWatch Alarms (1 hour)

```bash
cd scripts/monitoring

# Run alarms setup script
./setup-cloudwatch-alarms.sh --email ops@flowcomply.com

# This creates 11 alarms:
# - 4 Critical (P1)
# - 5 Warning (P2)
# - 2 Info (P3)

# Verify alarms
aws cloudwatch describe-alarms \
  --alarm-name-prefix "FlowComply-" \
  --query 'MetricAlarms[].{Name:AlarmName,State:StateValue}' \
  --output table
```

**⚠️ IMPORTANT:** Check your email to confirm SNS subscription!

---

## Day 2: Load Testing (Tuesday)

### Task 1: Install k6 (10 minutes)

```bash
# Mac
brew install k6

# Linux
snap install k6

# Windows
choco install k6

# Verify
k6 version
```

### Task 2: Run Load Tests (1 hour)

```bash
cd tests/load-testing

# Set environment variables
export API_URL=https://api.flowcomply.com
export TEST_EMAIL=admin@flowcomply.com
export TEST_PASSWORD=<your-password>

# Run basic load test
k6 run api-load-test.js

# Run extended test (100 VUs, 10 minutes)
k6 run --vus 100 --duration 10m api-load-test.js

# Run stress test (200 VUs)
k6 run --vus 200 --duration 5m api-load-test.js
```

**Expected Results:**
- p95 response time < 500ms ✅
- p99 response time < 1000ms ✅
- Error rate < 5% ✅
- Successful requests > 95% ✅

### Task 3: Analyze Results (30 minutes)

```bash
# Check load test results
cat load-test-results.json | jq '.metrics.http_req_duration'

# Monitor during load test
watch -n 5 'aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --statistics Average \
  --start-time $(date -u -d "5 minutes ago" +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60'

# Check for auto-scaling
aws ecs describe-services \
  --cluster flowcomply-production \
  --services backend-service \
  --query 'services[0].{Desired:desiredCount,Running:runningCount}'
```

---

## Day 3: Security Hardening (Wednesday)

### Task 1: Enable AWS WAF (45 minutes)

```bash
# Create Web ACL
aws wafv2 create-web-acl \
  --name flowcomply-waf \
  --scope REGIONAL \
  --default-action Allow={} \
  --rules file://waf-rules.json \
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=flowcomplyWAF \
  --region ap-southeast-2

# Associate with ALB
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --names flowcomply-production-alb \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

aws wafv2 associate-web-acl \
  --web-acl-arn <WAF_ACL_ARN> \
  --resource-arn ${ALB_ARN} \
  --region ap-southeast-2
```

**WAF Rules (Managed):**
- AWS Managed Rules - Core Rule Set
- AWS Managed Rules - Known Bad Inputs
- AWS Managed Rules - SQL Injection
- Rate limiting: 100 requests/5min per IP

### Task 2: Security Group Review (30 minutes)

```bash
# Review ECS security groups
aws ec2 describe-security-groups \
  --filters "Name=tag:Application,Values=FlowComply" \
  --query 'SecurityGroups[].{Name:GroupName,Rules:IpPermissions}' \
  --output table

# Ensure:
# - Backend: Only ALB can access port 3001
# - Frontend: Only ALB can access port 3000
# - RDS: Only ECS tasks can access port 5432
# - Redis: Only ECS tasks can access port 6379
```

### Task 3: Enable VPC Flow Logs (15 minutes)

```bash
# Create CloudWatch log group
aws logs create-log-group \
  --log-group-name /aws/vpc/flowcomply-production

# Enable VPC flow logs
aws ec2 create-flow-logs \
  --resource-type VPC \
  --resource-ids <VPC_ID> \
  --traffic-type ALL \
  --log-destination-type cloud-watch-logs \
  --log-group-name /aws/vpc/flowcomply-production \
  --deliver-logs-permission-arn <IAM_ROLE_ARN>
```

---

## Day 4: Error Tracking & X-Ray (Thursday)

### Task 1: Set Up Sentry (30 minutes)

```bash
# 1. Create Sentry account at sentry.io
# 2. Create new project "FlowComply"
# 3. Get DSN

# Install Sentry in backend
cd backend
npm install @sentry/node @sentry/tracing

# Add to backend/src/config/sentry.ts
# (Configuration provided in codebase)

# Update environment variable
aws secretsmanager update-secret \
  --secret-id flowcomply/production/api-keys \
  --secret-string '{
    "sentry_dsn": "https://xxx@yyy.ingest.sentry.io/zzz",
    ...
  }'

# Redeploy backend
git commit -m "Add Sentry integration"
git push origin main
# GitHub Actions will redeploy
```

### Task 2: Enable X-Ray Tracing (Already Done!)

X-Ray sidecar is already configured in ECS task definition ✅

**Verify X-Ray:**
```bash
# Check X-Ray traces
aws xray get-trace-summaries \
  --start-time $(date -u -d "1 hour ago" +%s) \
  --end-time $(date -u +%s) \
  --region ap-southeast-2

# View service map in AWS Console
# https://console.aws.amazon.com/xray/home?region=ap-southeast-2#/service-map
```

---

## Day 5: Backup & DR Testing (Friday)

### Task 1: Verify Automated Backups (15 minutes)

```bash
# Check RDS backup status
aws rds describe-db-instances \
  --db-instance-identifier flowcomply-production \
  --query 'DBInstances[0].{
    BackupRetention:BackupRetentionPeriod,
    LatestBackup:LatestRestorableTime,
    PreferredBackup:PreferredBackupWindow
  }'

# List recent snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier flowcomply-production \
  --query 'DBSnapshots[*].{
    ID:DBSnapshotIdentifier,
    Created:SnapshotCreateTime,
    Status:Status
  }' \
  --output table
```

### Task 2: Test Database Restore (1 hour)

```bash
# Create test snapshot
aws rds create-db-snapshot \
  --db-instance-identifier flowcomply-production \
  --db-snapshot-identifier flowcomply-dr-test-$(date +%Y%m%d)

# Wait for completion
aws rds wait db-snapshot-available \
  --db-snapshot-identifier flowcomply-dr-test-$(date +%Y%m%d)

# Restore to new instance
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier flowcomply-dr-test \
  --db-snapshot-identifier flowcomply-dr-test-$(date +%Y%m%d) \
  --db-instance-class db.t3.small

# Wait for restore (15-30 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier flowcomply-dr-test

# Test connection
PGPASSWORD=<password> psql \
  -h <dr-test-endpoint> \
  -U flowcomply_admin \
  -d flowcomply_production \
  -c "SELECT COUNT(*) FROM \"User\";"

# Cleanup after test
aws rds delete-db-instance \
  --db-instance-identifier flowcomply-dr-test \
  --skip-final-snapshot
```

### Task 3: Document DR Procedures (30 minutes)

Update `docs/runbooks/disaster-recovery.md`:
- RTO: 4 hours
- RPO: 1 hour (automated backups)
- Restore procedures tested ✅
- Contact information
- Escalation procedures

---

## Day 6-7: Performance Tuning & Review (Weekend)

### Task 1: Analyze Performance Metrics (1 hour)

```bash
# Review CloudWatch dashboard
# Check for:
# - High CPU/Memory usage
# - Slow endpoints
# - Cache effectiveness
# - Database query performance

# Get p95 response times
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --statistics p95 \
  --start-time $(date -u -d "7 days ago" +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400

# Check cache hit rate
aws cloudwatch get-metric-statistics \
  --namespace AWS/ElastiCache \
  --metric-name CacheHitRate \
  --statistics Average \
  --start-time $(date -u -d "7 days ago" +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400
```

### Task 2: Configure Auto-Scaling (if needed)

```bash
# Register ECS service as scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/flowcomply-production/backend-service \
  --min-capacity 2 \
  --max-capacity 10

# Create CPU-based scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/flowcomply-production/backend-service \
  --policy-name cpu-scaling-policy \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

### Task 3: Security Audit (2 hours)

```bash
# Run AWS Trusted Advisor
aws support describe-trusted-advisor-checks --language en

# Check for:
# - Security group rules
# - IAM policies
# - S3 bucket permissions
# - Public snapshots
# - MFA on root account

# Review Sentry errors
# Check for security-related errors
# Fix any high-priority issues
```

---

## Week 3 Completion Checklist

### Monitoring ✅
- [ ] CloudWatch dashboard created
- [ ] 11 alarms configured
- [ ] SNS notifications tested
- [ ] Log aggregation working
- [ ] Metrics being collected

### Observability ✅
- [ ] X-Ray tracing enabled
- [ ] Service map visible
- [ ] Sentry error tracking setup
- [ ] Error notifications working
- [ ] Performance baselines established

### Security ✅
- [ ] AWS WAF enabled
- [ ] Rate limiting configured
- [ ] Security groups locked down
- [ ] VPC flow logs enabled
- [ ] Secrets Manager in use
- [ ] Encryption enabled (rest + transit)

### Performance ✅
- [ ] Load testing completed
- [ ] p95 < 500ms
- [ ] Error rate < 5%
- [ ] Cache hit rate > 70%
- [ ] Auto-scaling configured

### DR & Backups ✅
- [ ] Automated backups enabled
- [ ] Backup retention set (7 days)
- [ ] DR restore tested
- [ ] DR procedures documented
- [ ] RTO/RPO defined

---

## Week 3 Costs

| Service | Duration | Cost |
|---------|----------|------|
| Infrastructure (ongoing) | 7 days | ~$56.50 |
| WAF | 7 days | ~$5 |
| Sentry (Basic plan) | Monthly | ~$26/month |
| **Total Week 3** | | **~$61.50** |

**Month-to-date:** ~$143

---

## Success Criteria

Week 3 complete when:
- ✅ All monitoring in place
- ✅ No critical alarms
- ✅ Load tests passing
- ✅ Security hardened
- ✅ DR tested
- ✅ Documentation complete
- ✅ Performance acceptable
- ✅ Team trained

---

## Next Week

**Week 4 (Oct 28 - Nov 6): UAT & Go-Live**
- User acceptance testing
- Final security review
- Performance optimization
- Production go-live
- Post-deployment monitoring
- Operations handoff

---

## Resources

**Scripts:**
- `scripts/monitoring/setup-cloudwatch-alarms.sh`
- `tests/load-testing/api-load-test.js`

**Configuration:**
- `infrastructure/cloudwatch/dashboard.json`

**Documentation:**
- `docs/runbooks/monitoring-setup.md`
- `docs/runbooks/production-deployment.md`

---

**Week 3 Status:** 🚀 **READY TO MONITOR**

**Let's secure and monitor! 🔒📊**
