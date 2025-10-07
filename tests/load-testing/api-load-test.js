/**
 * FlowComply API Load Test
 *
 * Uses k6 for load testing the production API
 *
 * Install k6:
 *   Mac: brew install k6
 *   Linux: snap install k6
 *   Windows: choco install k6
 *
 * Run:
 *   k6 run api-load-test.js
 *   k6 run --vus 100 --duration 5m api-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

// Configuration
const BASE_URL = __ENV.API_URL || 'https://api.flowcomply.com';

// Test scenarios
export const options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up to 10 users
    { duration: '5m', target: 10 },  // Stay at 10 users
    { duration: '2m', target: 50 },  // Ramp up to 50 users
    { duration: '5m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 100 }, // Spike to 100 users
    { duration: '3m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    http_req_failed: ['rate<0.05'],                  // Error rate < 5%
    errors: ['rate<0.05'],                           // Custom error rate < 5%
  },
};

// Setup function - runs once
export function setup() {
  console.log('Starting load test...');
  console.log(`Target: ${BASE_URL}`);

  // Health check before starting
  const healthRes = http.get(`${BASE_URL}/api/monitoring/health`);
  if (healthRes.status !== 200) {
    console.error('Health check failed! Aborting test.');
    return null;
  }

  console.log('Health check passed ✓');

  // Authenticate and get token
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: __ENV.TEST_EMAIL || 'admin@flowcomply.com',
      password: __ENV.TEST_PASSWORD || 'AdminPassword123!',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status === 200) {
    const token = loginRes.json('token');
    console.log('Authentication successful ✓');
    return { token };
  }

  console.warn('Authentication failed, running unauthenticated tests only');
  return { token: null };
}

// Main test function
export default function (data) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data && data.token) {
    params.headers['Authorization'] = `Bearer ${data.token}`;
  }

  // Test 1: Health Check (10% of requests)
  if (Math.random() < 0.1) {
    const res = http.get(`${BASE_URL}/api/monitoring/health`, params);
    const success = check(res, {
      'health check status is 200': (r) => r.status === 200,
      'health check has status field': (r) => r.json('status') !== undefined,
    });

    errorRate.add(!success);
    apiResponseTime.add(res.timings.duration);

    if (success) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }
  }

  // Test 2: Metrics Endpoint (20% of requests)
  if (Math.random() < 0.2 && data && data.token) {
    const res = http.get(`${BASE_URL}/api/monitoring/metrics`, params);
    const success = check(res, {
      'metrics status is 200': (r) => r.status === 200,
    });

    errorRate.add(!success);
    apiResponseTime.add(res.timings.duration);

    if (success) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }
  }

  // Test 3: Analytics Dashboard (30% of requests)
  if (Math.random() < 0.3 && data && data.token) {
    const res = http.get(`${BASE_URL}/api/analytics/dashboard`, params);
    const success = check(res, {
      'dashboard status is 200': (r) => r.status === 200,
      'dashboard response time < 2s': (r) => r.timings.duration < 2000,
    });

    errorRate.add(!success);
    apiResponseTime.add(res.timings.duration);

    if (success) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }
  }

  // Test 4: User Profile (20% of requests)
  if (Math.random() < 0.2 && data && data.token) {
    const res = http.get(`${BASE_URL}/api/users/me`, params);
    const success = check(res, {
      'user profile status is 200': (r) => r.status === 200,
      'has user email': (r) => r.json('email') !== undefined,
    });

    errorRate.add(!success);
    apiResponseTime.add(res.timings.duration);

    if (success) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }
  }

  // Test 5: Assets List (20% of requests)
  if (Math.random() < 0.2 && data && data.token) {
    const res = http.get(`${BASE_URL}/api/assets?limit=20`, params);
    const success = check(res, {
      'assets list status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    });

    errorRate.add(!success);
    apiResponseTime.add(res.timings.duration);

    if (success) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }
  }

  // Simulate think time (user reading/interacting)
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

// Teardown function - runs once at end
export function teardown(data) {
  console.log('\nLoad test complete!');
  console.log('Review the summary above for results.');
}

// Handle test summary
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = '\n';
  summary += indent + '==========================================\n';
  summary += indent + '       Load Test Summary\n';
  summary += indent + '==========================================\n\n';

  // Test duration
  summary += indent + `Duration: ${(data.state.testRunDurationMs / 1000).toFixed(2)}s\n`;

  // Requests
  const httpReqs = data.metrics.http_reqs.values.count;
  const httpReqsFailed = data.metrics.http_req_failed.values.rate * 100;
  summary += indent + `Total Requests: ${httpReqs}\n`;
  summary += indent + `Failed Requests: ${httpReqsFailed.toFixed(2)}%\n\n`;

  // Response times
  const avgDuration = data.metrics.http_req_duration.values.avg;
  const p95Duration = data.metrics.http_req_duration.values['p(95)'];
  const p99Duration = data.metrics.http_req_duration.values['p(99)'];

  summary += indent + 'Response Times:\n';
  summary += indent + `  Average: ${avgDuration.toFixed(2)}ms\n`;
  summary += indent + `  p95:     ${p95Duration.toFixed(2)}ms\n`;
  summary += indent + `  p99:     ${p99Duration.toFixed(2)}ms\n\n`;

  // Thresholds
  summary += indent + 'Thresholds:\n';
  for (const [name, threshold] of Object.entries(data.thresholds || {})) {
    const passed = threshold.ok ? '✓' : '✗';
    summary += indent + `  ${passed} ${name}\n`;
  }

  summary += indent + '\n==========================================\n';

  return summary;
}
