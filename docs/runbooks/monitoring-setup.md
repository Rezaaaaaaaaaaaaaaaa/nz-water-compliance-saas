# Monitoring & Observability Setup

**Last Updated:** October 7, 2025
**Version:** 1.0
**Status:** Active

---

## Overview

Comprehensive monitoring and observability setup for FlowComply production environment.

**Goals:**
- 99.9% uptime SLA
- Mean Time to Detect (MTTD) < 5 minutes
- Mean Time to Resolve (MTTR) < 30 minutes
- Proactive issue detection

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Monitoring Stack                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  CloudWatch  │  │  X-Ray       │  │  Sentry      │      │
│  │  Metrics &   │  │  Distributed │  │  Error       │      │
│  │  Logs        │  │  Tracing     │  │  Tracking    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                       │
│                    │  CloudWatch    │                       │
│                    │  Dashboard     │                       │
│                    └───────┬────────┘                       │
│                            │                                 │
│                    ┌───────▼────────┐                       │
│                    │  SNS Alerts    │                       │
│                    │  (Email/SMS)   │                       │
│                    └────────────────┘                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. CloudWatch Metrics

### 1.1 Application Metrics

**Backend Metrics (Custom):**
```typescript
// backend/src/utils/metrics.ts
export const metrics = {
  // API metrics
  apiRequestDuration: 'FlowComply/API/RequestDuration',
  apiRequestCount: 'FlowComply/API/RequestCount',
  apiErrorCount: 'FlowComply/API/ErrorCount',

  // Database metrics
  dbQueryDuration: 'FlowComply/Database/QueryDuration',
  dbConnectionPoolSize: 'FlowComply/Database/ConnectionPoolSize',

  // Cache metrics
  cacheHitRate: 'FlowComply/Cache/HitRate',
  cacheMissRate: 'FlowComply/Cache/MissRate',

  // Background jobs
  jobQueueDepth: 'FlowComply/Jobs/QueueDepth',
  jobProcessingTime: 'FlowComply/Jobs/ProcessingTime',
  jobFailureCount: 'FlowComply/Jobs/FailureCount',

  // Business metrics
  userLoginCount: 'FlowComply/Business/UserLogins',
  documentUploadCount: 'FlowComply/Business/DocumentUploads',
  complianceScoreAvg: 'FlowComply/Business/ComplianceScoreAvg',
};
```

**Publishing Metrics:**
```typescript
// Example: Publishing a custom metric
import { CloudWatch } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatch({ region: 'ap-southeast-2' });

async function publishMetric(
  metricName: string,
  value: number,
  unit: string = 'Count'
) {
  await cloudwatch.putMetricData({
    Namespace: 'FlowComply',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date(),
    }],
  });
}
```

### 1.2 Infrastructure Metrics (AWS Native)

**ECS Metrics:**
- `CPUUtilization` - Task CPU usage
- `MemoryUtilization` - Task memory usage
- `DesiredTaskCount` - Target task count
- `RunningTaskCount` - Actual running tasks

**ALB Metrics:**
- `TargetResponseTime` - Response time (p50, p95, p99)
- `HTTPCode_Target_2XX_Count` - Successful requests
- `HTTPCode_Target_4XX_Count` - Client errors
- `HTTPCode_Target_5XX_Count` - Server errors
- `RequestCount` - Total requests
- `HealthyHostCount` - Healthy targets
- `UnHealthyHostCount` - Unhealthy targets

**RDS Metrics:**
- `CPUUtilization` - Database CPU
- `FreeableMemory` - Available memory
- `DatabaseConnections` - Active connections
- `ReadLatency` / `WriteLatency` - Query latency
- `FreeStorageSpace` - Available disk space

**ElastiCache Redis Metrics:**
- `CPUUtilization` - Redis CPU
- `NetworkBytesIn` / `NetworkBytesOut` - Network traffic
- `CacheHits` / `CacheMisses` - Cache performance
- `DatabaseMemoryUsagePercentage` - Memory usage
- `CurrConnections` - Active connections

---

## 2. CloudWatch Alarms

### 2.1 Critical Alarms (P1 - Immediate Response)

#### High Error Rate
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name flowcomply-high-error-rate \
  --alarm-description "5xx error rate > 5%" \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=LoadBalancer,Value=app/flowcomply-prod-alb/xxx \
  --alarm-actions arn:aws:sns:ap-southeast-2:xxx:critical-alerts \
  --treat-missing-data notBreaching
```

#### Service Down
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name flowcomply-service-down \
  --alarm-description "No healthy targets" \
  --metric-name HealthyHostCount \
  --namespace AWS/ApplicationELB \
  --statistic Average \
  --period 60 \
  --evaluation-periods 2 \
  --threshold 1 \
  --comparison-operator LessThanThreshold \
  --dimensions Name=TargetGroup,Value=targetgroup/flowcomply-backend/xxx \
  --alarm-actions arn:aws:sns:ap-southeast-2:xxx:critical-alerts
```

#### Database Connection Exhaustion
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name flowcomply-db-connections-high \
  --alarm-description "Database connections > 90% of max" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 90 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=flowcomply-production \
  --alarm-actions arn:aws:sns:ap-southeast-2:xxx:critical-alerts
```

### 2.2 Warning Alarms (P2 - Monitor Closely)

#### High CPU Utilization
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name flowcomply-high-cpu \
  --alarm-description "CPU utilization > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 3 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=backend-service Name=ClusterName,Value=flowcomply-production \
  --alarm-actions arn:aws:sns:ap-southeast-2:xxx:warning-alerts
```

#### Slow API Response
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name flowcomply-slow-response \
  --alarm-description "p95 response time > 2 seconds" \
  --metric-name TargetResponseTime \
  --namespace AWS/ApplicationELB \
  --statistic p95 \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 2 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:ap-southeast-2:xxx:warning-alerts
```

#### Low Cache Hit Rate
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name flowcomply-low-cache-hit \
  --alarm-description "Cache hit rate < 60%" \
  --metric-name CacheHitRate \
  --namespace AWS/ElastiCache \
  --statistic Average \
  --period 300 \
  --evaluation-periods 3 \
  --threshold 60 \
  --comparison-operator LessThanThreshold \
  --alarm-actions arn:aws:sns:ap-southeast-2:xxx:warning-alerts
```

### 2.3 Info Alarms (P3 - Informational)

#### Disk Space Low
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name flowcomply-disk-space-low \
  --alarm-description "Free storage < 10GB" \
  --metric-name FreeStorageSpace \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10000000000 \
  --comparison-operator LessThanThreshold \
  --alarm-actions arn:aws:sns:ap-southeast-2:xxx:info-alerts
```

---

## 3. CloudWatch Dashboard

### 3.1 Main Dashboard

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "title": "API Request Rate",
        "metrics": [
          ["AWS/ApplicationELB", "RequestCount", {"stat": "Sum", "period": 60}]
        ],
        "region": "ap-southeast-2",
        "yAxis": {"left": {"label": "Requests/min"}}
      }
    },
    {
      "type": "metric",
      "properties": {
        "title": "API Error Rate",
        "metrics": [
          ["AWS/ApplicationELB", "HTTPCode_Target_2XX_Count", {"stat": "Sum", "label": "2xx"}],
          [".", "HTTPCode_Target_4XX_Count", {"stat": "Sum", "label": "4xx"}],
          [".", "HTTPCode_Target_5XX_Count", {"stat": "Sum", "label": "5xx"}]
        ],
        "region": "ap-southeast-2",
        "stacked": true
      }
    },
    {
      "type": "metric",
      "properties": {
        "title": "API Response Time (p95)",
        "metrics": [
          ["AWS/ApplicationELB", "TargetResponseTime", {"stat": "p95"}]
        ],
        "region": "ap-southeast-2",
        "yAxis": {"left": {"label": "Seconds", "min": 0, "max": 2}}
      }
    },
    {
      "type": "metric",
      "properties": {
        "title": "ECS Task CPU & Memory",
        "metrics": [
          ["AWS/ECS", "CPUUtilization", {"stat": "Average", "label": "CPU %"}],
          [".", "MemoryUtilization", {"stat": "Average", "label": "Memory %"}]
        ],
        "region": "ap-southeast-2",
        "yAxis": {"left": {"min": 0, "max": 100}}
      }
    },
    {
      "type": "metric",
      "properties": {
        "title": "Database Performance",
        "metrics": [
          ["AWS/RDS", "DatabaseConnections", {"stat": "Average"}],
          [".", "ReadLatency", {"stat": "Average", "yAxis": "right"}],
          [".", "WriteLatency", {"stat": "Average", "yAxis": "right"}]
        ],
        "region": "ap-southeast-2"
      }
    },
    {
      "type": "metric",
      "properties": {
        "title": "Redis Cache Performance",
        "metrics": [
          ["AWS/ElastiCache", "CacheHits", {"stat": "Sum"}],
          [".", "CacheMisses", {"stat": "Sum"}]
        ],
        "region": "ap-southeast-2"
      }
    },
    {
      "type": "log",
      "properties": {
        "title": "Recent Application Errors",
        "query": "SOURCE '/ecs/flowcomply-backend' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20",
        "region": "ap-southeast-2"
      }
    }
  ]
}
```

### 3.2 Creating Dashboard via CLI

```bash
# Save dashboard JSON to file
cat > dashboard.json <<'EOF'
{
  "dashboardName": "FlowComply-Production",
  "dashboardBody": "... (dashboard JSON from above)"
}
EOF

# Create dashboard
aws cloudwatch put-dashboard --cli-input-json file://dashboard.json
```

---

## 4. Log Management

### 4.1 Log Groups

**Backend Logs:**
- `/ecs/flowcomply-backend`
- Retention: 90 days
- Structured JSON format

**Frontend Logs:**
- `/ecs/flowcomply-frontend`
- Retention: 90 days

**Lambda Logs (if applicable):**
- `/aws/lambda/flowcomply-*`
- Retention: 30 days

### 4.2 Log Insights Queries

**Top 10 Errors:**
```
fields @timestamp, @message, level, error
| filter level = "error"
| sort @timestamp desc
| limit 10
```

**API Endpoint Performance:**
```
fields @timestamp, method, url, duration
| filter method = "GET" or method = "POST"
| stats avg(duration), max(duration), count() by url
| sort avg(duration) desc
```

**User Activity:**
```
fields @timestamp, userId, action
| filter action like /LOGIN|LOGOUT|CREATE|UPDATE|DELETE/
| stats count() by userId, action
```

**Error Rate Over Time:**
```
fields @timestamp
| filter level = "error"
| stats count() as errorCount by bin(5m)
```

### 4.3 Log-Based Metrics

**Create Metric Filter:**
```bash
# Count 5xx errors
aws logs put-metric-filter \
  --log-group-name /ecs/flowcomply-backend \
  --filter-name 5xxErrors \
  --filter-pattern '[time, request_id, level = ERROR, status_code = 5*]' \
  --metric-transformations \
    metricName=5xxErrorCount,\
metricNamespace=FlowComply/Logs,\
metricValue=1,\
unit=Count
```

---

## 5. Distributed Tracing (AWS X-Ray)

### 5.1 X-Ray Setup

**Install SDK:**
```bash
cd backend
npm install aws-xray-sdk-core
```

**Instrument Fastify:**
```typescript
// backend/src/server.ts
import AWSXRay from 'aws-xray-sdk-core';
import http from 'http';

// Wrap HTTP
const capturedHttp = AWSXRay.captureHTTPs(http);

// Add X-Ray middleware
fastify.addHook('onRequest', async (request, reply) => {
  const segment = AWSXRay.getSegment();
  if (segment) {
    segment.addAnnotation('userId', request.user?.id);
    segment.addAnnotation('organizationId', request.user?.organizationId);
  }
});

// Wrap Prisma client
const xrayPrisma = AWSXRay.capturePostgreSQLClient(prisma);
```

**ECS Task Definition:**
```json
{
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "...",
      ...
    },
    {
      "name": "xray-daemon",
      "image": "public.ecr.aws/xray/aws-xray-daemon:latest",
      "cpu": 32,
      "memoryReservation": 256,
      "portMappings": [{
        "containerPort": 2000,
        "protocol": "udp"
      }]
    }
  ]
}
```

### 5.2 X-Ray Insights

**Service Map:**
- View all service dependencies
- Identify bottlenecks
- Trace errors to source

**Trace Analysis:**
- Request duration breakdown
- Database query times
- External API calls
- Error traces

---

## 6. Error Tracking (Sentry)

### 6.1 Sentry Setup

**Install SDK:**
```bash
npm install @sentry/node @sentry/tracing
```

**Configure Backend:**
```typescript
// backend/src/config/sentry.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION,
  tracesSampleRate: 0.1, // 10% of transactions

  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Prisma({ prisma }),
  ],

  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.authorization;
    }
    return event;
  },
});
```

**Capture Errors:**
```typescript
// In error handler middleware
fastify.setErrorHandler((error, request, reply) => {
  Sentry.captureException(error, {
    user: { id: request.user?.id },
    tags: {
      endpoint: request.url,
      method: request.method,
    },
  });

  reply.status(500).send({ error: 'Internal server error' });
});
```

### 6.2 Sentry Alerts

**Configure in Sentry UI:**
1. New errors (immediate)
2. Error frequency increase (>50% in 1 hour)
3. Unhandled promise rejections
4. Performance degradation

---

## 7. Uptime Monitoring

### 7.1 External Monitoring (UptimeRobot)

**Endpoints to Monitor:**
- `https://api.flowcomply.com/api/monitoring/health` (1 minute)
- `https://flowcomply.com` (1 minute)

**Alert Contacts:**
- Email: ops@flowcomply.com
- SMS: +64-XXX-XXXX
- Slack: #ops-alerts

### 7.2 Health Check Endpoint

```typescript
// backend/src/routes/monitoring.ts
fastify.get('/api/monitoring/health', async (request, reply) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    s3: await checkS3(),
    memory: process.memoryUsage().heapUsed < 1024 * 1024 * 1024, // < 1GB
  };

  const isHealthy = Object.values(checks).every(Boolean);

  return reply
    .status(isHealthy ? 200 : 503)
    .send({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    });
});
```

---

## 8. Alerting & On-Call

### 8.1 SNS Topics

**Create Topics:**
```bash
# Critical alerts (P1)
aws sns create-topic --name flowcomply-critical-alerts

# Warning alerts (P2)
aws sns create-topic --name flowcomply-warning-alerts

# Info alerts (P3)
aws sns create-topic --name flowcomply-info-alerts
```

**Subscribe:**
```bash
# Email
aws sns subscribe \
  --topic-arn arn:aws:sns:ap-southeast-2:xxx:flowcomply-critical-alerts \
  --protocol email \
  --notification-endpoint ops@flowcomply.com

# SMS
aws sns subscribe \
  --topic-arn arn:aws:sns:ap-southeast-2:xxx:flowcomply-critical-alerts \
  --protocol sms \
  --notification-endpoint +64-XXX-XXXX
```

### 8.2 On-Call Rotation

**Week 1-2:** Engineer A (Primary), Engineer B (Backup)
**Week 3-4:** Engineer B (Primary), Engineer C (Backup)

**Responsibilities:**
- Monitor alerts 24/7
- Respond within SLA (15 minutes for P1)
- Escalate if needed
- Document incidents

---

## 9. Performance Monitoring

### 9.1 Key Metrics

| Metric | Target | Alerting Threshold |
|--------|--------|-------------------|
| API Response Time (p95) | <200ms | >500ms |
| Database Query Time (p95) | <50ms | >200ms |
| Cache Hit Rate | >70% | <60% |
| Error Rate | <1% | >5% |
| Uptime | 99.9% | <99.5% |

### 9.2 Performance Dashboard

**Create Custom Dashboard:**
- API endpoint latency breakdown
- Database slow queries
- Cache hit/miss ratio
- Background job queue depth
- Resource utilization trends

---

## 10. Cost Monitoring

### 10.1 Budget Alerts

```bash
aws budgets create-budget \
  --account-id xxx \
  --budget file://budget.json
```

**budget.json:**
```json
{
  "BudgetName": "FlowComply-Monthly",
  "BudgetLimit": {
    "Amount": "500",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
```

### 10.2 Cost Allocation Tags

**Tag all resources:**
```
Project: FlowComply
Environment: Production
CostCenter: Engineering
Owner: DevOps
```

---

## Checklist

### Initial Setup
- [ ] Create CloudWatch log groups
- [ ] Configure log retention policies
- [ ] Create custom metrics namespace
- [ ] Build CloudWatch dashboard
- [ ] Create all alarms (11+ alarms)
- [ ] Set up SNS topics and subscriptions
- [ ] Configure X-Ray tracing
- [ ] Set up Sentry error tracking
- [ ] Configure external uptime monitoring
- [ ] Set up on-call rotation
- [ ] Create runbooks for common alerts

### Ongoing Maintenance
- [ ] Review dashboard weekly
- [ ] Tune alarm thresholds monthly
- [ ] Review error rates weekly
- [ ] Analyze performance trends monthly
- [ ] Update runbooks as needed
- [ ] Test alerting quarterly
- [ ] Review and optimize costs monthly

---

**Document Version:** 1.0
**Last Updated:** October 7, 2025
**Next Review:** November 7, 2025
