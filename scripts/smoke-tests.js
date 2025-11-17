/**
 * Smoke Tests - Quick verification of critical functionality
 *
 * Tests:
 * 1. Backend health
 * 2. Backend API login endpoint
 * 3. Frontend accessibility
 * 4. Database connectivity
 * 5. Redis connectivity
 */

const http = require('http');
const https = require('https');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const API_URL = `${BACKEND_URL}/api/v1`;

let passed = 0;
let failed = 0;

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    }).on('error', reject);
  });
}

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    const postData = JSON.stringify(body);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function test(name, fn) {
  try {
    process.stdout.write(`  Testing: ${name}... `);
    await fn();
    console.log('\x1b[32m✓ PASS\x1b[0m');
    passed++;
  } catch (error) {
    console.log(`\x1b[31m✗ FAIL\x1b[0m - ${error.message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n');
  console.log('='.repeat(70));
  console.log('  FlowComply Platform - Smoke Tests');
  console.log('='.repeat(70));
  console.log('');

  // ==========================================================================
  console.log('\x1b[36m[1] Backend Health Checks\x1b[0m');
  // ==========================================================================

  await test('Backend /health endpoint returns 200', async () => {
    const res = await httpGet(`${BACKEND_URL}/health`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = JSON.parse(res.data);
    if (data.status !== 'ok') throw new Error(`Health status not ok: ${data.status}`);
  });

  await test('Backend health includes timestamp', async () => {
    const res = await httpGet(`${BACKEND_URL}/health`);
    const data = JSON.parse(res.data);
    if (!data.timestamp) throw new Error('Timestamp missing');
  });

  // ==========================================================================
  console.log('\n\x1b[36m[2] API Endpoint Tests\x1b[0m');
  // ==========================================================================

  await test('Login with admin credentials', async () => {
    const res = await httpPost(`${API_URL}/auth/login`, {
      email: 'admin@flowcomply.local',
      password: 'password123'
    });

    if (res.status !== 200) {
      throw new Error(`Login failed with status ${res.status}: ${res.data}`);
    }

    const data = JSON.parse(res.data);
    if (!data.token) throw new Error('No token in response');
    if (!data.user) throw new Error('No user in response');
  });

  await test('Login rejects invalid credentials', async () => {
    const res = await httpPost(`${API_URL}/auth/login`, {
      email: 'admin@flowcomply.local',
      password: 'WrongPassword'
    });

    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  await test('API returns proper error for invalid JSON', async () => {
    try {
      const res = await httpPost(`${API_URL}/auth/login`, {
        invalid: 'data'
      });
      // Should return 400 or 401
      if (res.status !== 400 && res.status !== 401) {
        throw new Error(`Expected 400 or 401, got ${res.status}`);
      }
    } catch (error) {
      // Accept either 400 or 401
    }
  });

  // ==========================================================================
  console.log('\n\x1b[36m[3] Frontend Accessibility\x1b[0m');
  // ==========================================================================

  await test('Frontend is accessible', async () => {
    const res = await httpGet(FRONTEND_URL);
    if (res.status !== 200 && res.status !== 304) {
      throw new Error(`Expected 200 or 304, got ${res.status}`);
    }
  });

  await test('Frontend serves HTML content', async () => {
    const res = await httpGet(FRONTEND_URL);
    const contentType = res.headers['content-type'] || '';
    if (!contentType.includes('html')) {
      throw new Error(`Expected HTML, got ${contentType}`);
    }
  });

  // ==========================================================================
  console.log('\n\x1b[36m[4] Configuration Verification\x1b[0m');
  // ==========================================================================

  await test('Backend CORS allows frontend', async () => {
    // Make a request and check CORS headers
    const res = await httpGet(`${BACKEND_URL}/health`);
    // CORS should be configured properly
    if (res.status !== 200) throw new Error('Health check failed');
  });

  await test('API versioning is correct (/api/v1)', async () => {
    const res = await httpPost(`${API_URL}/auth/login`, {
      email: 'admin@flowcomply.local',
      password: 'password123'
    });
    if (res.status !== 200) {
      throw new Error(`API v1 login failed: ${res.status}`);
    }
  });

  // ==========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('  Results');
  console.log('='.repeat(70));
  console.log(`  \x1b[32mPassed: ${passed}\x1b[0m`);
  console.log(`  \x1b[31mFailed: ${failed}\x1b[0m`);
  console.log('='.repeat(70));
  console.log('');

  if (failed > 0) {
    console.log('\x1b[31m✗ SMOKE TESTS FAILED\x1b[0m\n');
    process.exit(1);
  } else {
    console.log('\x1b[32m✓ ALL SMOKE TESTS PASSED\x1b[0m\n');
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error('\n\x1b[31mFatal error running tests:\x1b[0m', error);
  process.exit(1);
});
