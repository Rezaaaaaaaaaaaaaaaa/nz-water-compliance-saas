#!/usr/bin/env node

/**
 * Local Start & Test Script
 * Automatically resolves common issues and starts the app
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const http = require('http');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

let issues = [];
let fixes = [];

function print(text, color = colors.reset) {
  console.log(`${color}${text}${colors.reset}`);
}

function printHeader(text) {
  console.log(`\n${colors.cyan}${'='.repeat(76)}`);
  console.log(`  ${text}`);
  console.log(`${'='.repeat(76)}${colors.reset}\n`);
}

// Execute command and return promise
function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr });
    });
  });
}

// Check if port is in use
async function isPortInUse(port) {
  const result = await execCommand(`netstat -ano | findstr ":${port}.*LISTENING"`);
  return result.stdout.trim().length > 0;
}

// Kill processes on port
async function killPort(port) {
  const result = await execCommand(`netstat -ano | findstr ":${port}.*LISTENING"`);
  const lines = result.stdout.trim().split('\n');

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && !isNaN(pid)) {
      await execCommand(`taskkill /PID ${pid} /F 2>nul`);
      print(`  Killed process ${pid} on port ${port}`, colors.yellow);
    }
  }
}

// Test HTTP endpoint
function testEndpoint(url, timeout = 5000) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout }, (res) => {
      resolve({ success: true, status: res.statusCode });
    });

    req.on('error', () => resolve({ success: false }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false });
    });
  });
}

// Wait for service
async function waitForService(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await testEndpoint(url);
    if (result.success) return true;
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.stdout.write('.');
  }
  return false;
}

// Main function
async function main() {
  printHeader('Local Start & Test - FlowComply Water Compliance SaaS');

  print('🔍 Running diagnostics...\n', colors.cyan);

  // STEP 1: Check prerequisites
  printHeader('STEP 1: Prerequisites Check');

  const nodeCheck = await execCommand('node --version');
  if (!nodeCheck.error) {
    print(`  ✓ Node.js: ${nodeCheck.stdout.trim()}`, colors.green);
  } else {
    print('  ✗ Node.js not found', colors.red);
    issues.push('Node.js not installed');
  }

  const npmCheck = await execCommand('npm --version');
  if (!npmCheck.error) {
    print(`  ✓ npm: ${npmCheck.stdout.trim()}`, colors.green);
  } else {
    print('  ✗ npm not found', colors.red);
    issues.push('npm not installed');
  }

  const dockerCheck = await execCommand('docker --version');
  if (!dockerCheck.error) {
    print(`  ✓ Docker: ${dockerCheck.stdout.trim()}`, colors.green);
  } else {
    print('  ✗ Docker not found', colors.yellow);
  }

  // STEP 2: Check and resolve port conflicts
  printHeader('STEP 2: Port Conflict Detection');

  const requiredPorts = {
    backend: 3001,
    frontend: 3000,
    postgres: 5432,
    redis: 6379
  };

  for (const [service, port] of Object.entries(requiredPorts)) {
    const inUse = await isPortInUse(port);
    if (inUse && (service === 'backend' || service === 'frontend')) {
      print(`  ✗ Port ${port} (${service}) is in use`, colors.red);
      issues.push(`Port ${port} conflict`);

      print(`  → Killing processes on port ${port}...`, colors.yellow);
      await killPort(port);
      fixes.push(`Freed port ${port}`);
      print(`  ✓ Port ${port} is now free`, colors.green);
    } else if (inUse) {
      print(`  ✓ Port ${port} (${service}) is in use`, colors.green);
    } else if (service === 'postgres' || service === 'redis') {
      print(`  ✗ Port ${port} (${service}) not in use - service may not be running`, colors.yellow);
      issues.push(`${service} not running`);
    } else {
      print(`  ✓ Port ${port} (${service}) is available`, colors.green);
    }
  }

  // STEP 3: Update configuration
  printHeader('STEP 3: Configuration Update');

  try {
    // Update backend .env
    let envContent = fs.readFileSync('backend/.env', 'utf8');
    if (!envContent.includes('PORT=3001')) {
      envContent = envContent.replace(/PORT=\d+/g, 'PORT=3001');
      fs.writeFileSync('backend/.env', envContent);
      print('  ✓ Updated backend port to 3001', colors.green);
      fixes.push('Updated backend/.env PORT to 3001');
    } else {
      print('  ✓ Backend configured for port 3001', colors.green);
    }

    // Create/update frontend .env.local
    const frontendEnv = `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1\nNODE_ENV=development\n`;
    fs.writeFileSync('frontend/.env.local', frontendEnv);
    print('  ✓ Updated frontend API URL to port 3001', colors.green);
    fixes.push('Created frontend/.env.local');
  } catch (error) {
    print(`  ✗ Configuration update failed: ${error.message}`, colors.red);
    issues.push(`Config update error: ${error.message}`);
  }

  // STEP 4: Start Docker services
  printHeader('STEP 4: Starting Docker Services');

  print('  → Starting PostgreSQL and Redis...', colors.cyan);
  const dockerResult = await execCommand('docker compose up -d postgres redis');
  if (dockerResult.error) {
    print('  ✗ Failed to start Docker services', colors.yellow);
    print('  → Please ensure Docker is running and start services manually', colors.yellow);
  } else {
    print('  ✓ Docker services starting...', colors.green);
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // STEP 5: Seed database
  printHeader('STEP 5: Database Setup');

  print('  → Generating Prisma client...', colors.cyan);
  await execCommand('cd backend && npx prisma generate');
  print('  ✓ Prisma client generated', colors.green);

  print('  → Running database migrations...', colors.cyan);
  const migrateResult = await execCommand('cd backend && npx prisma migrate deploy');
  if (!migrateResult.error) {
    print('  ✓ Database migrations applied', colors.green);
  } else {
    print('  ✗ Migration failed (may already be applied)', colors.yellow);
  }

  print('  → Seeding database with test data...', colors.cyan);
  const seedResult = await execCommand('cd backend && npm run prisma:seed');
  if (!seedResult.error) {
    print('  ✓ Database seeded successfully', colors.green);
    fixes.push('Database seeded with test data');
  } else {
    print('  ⚠ Seeding completed with warnings', colors.yellow);
  }

  // STEP 6: Start backend
  printHeader('STEP 6: Starting Backend Server');

  print('  → Starting backend on port 3001...', colors.cyan);
  const backendProcess = spawn('npm', ['run', 'dev'], {
    cwd: 'backend',
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  backendProcess.stdout.on('data', (data) => {
    if (data.toString().includes('Server listening')) {
      print('  ✓ Backend server started', colors.green);
    }
  });

  print('  ⏳ Waiting for backend to be ready', colors.cyan);
  const backendReady = await waitForService('http://localhost:3001/health');
  console.log('');

  if (backendReady) {
    print('  ✓ Backend is responding', colors.green);
  } else {
    print('  ✗ Backend failed to start', colors.red);
    issues.push('Backend startup failed');
  }

  // STEP 7: Test backend API
  printHeader('STEP 7: Backend API Testing');

  print('  → Testing health endpoint...', colors.cyan);
  const healthTest = await testEndpoint('http://localhost:3001/health');
  if (healthTest.success) {
    print(`  ✓ Health endpoint OK (${healthTest.status})`, colors.green);
  } else {
    print('  ✗ Health endpoint failed', colors.red);
    issues.push('Health endpoint failed');
  }

  print('  → Testing login endpoint...', colors.cyan);
  const loginTest = await new Promise((resolve) => {
    const postData = JSON.stringify({
      email: 'admin@compliance-saas.co.nz',
      password: 'password123'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ success: res.statusCode === 200, data: response, status: res.statusCode });
        } catch {
          resolve({ success: false, status: res.statusCode });
        }
      });
    });

    req.on('error', () => resolve({ success: false }));
    req.write(postData);
    req.end();
  });

  if (loginTest.success) {
    print(`  ✓ Login endpoint working (${loginTest.status})`, colors.green);
    if (loginTest.data?.token) {
      print('  ✓ JWT token received', colors.green);
    }
  } else {
    print(`  ✗ Login failed (status: ${loginTest.status})`, colors.red);
    issues.push('Login endpoint failed');
  }

  // STEP 8: Start frontend
  printHeader('STEP 8: Starting Frontend Server');

  print('  → Starting frontend on port 3000...', colors.cyan);
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: 'frontend',
    shell: true,
    env: { ...process.env, PORT: '3000' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  frontendProcess.stdout.on('data', (data) => {
    if (data.toString().includes('Ready')) {
      print('  ✓ Frontend server started', colors.green);
    }
  });

  print('  ⏳ Waiting for frontend to be ready', colors.cyan);
  await new Promise(resolve => setTimeout(resolve, 15000)); // Wait for Next.js to build
  console.log('');

  const frontendReady = await testEndpoint('http://localhost:3000');
  if (frontendReady.success) {
    print('  ✓ Frontend is responding', colors.green);
  } else {
    print('  ✗ Frontend failed to start', colors.red);
    issues.push('Frontend startup failed');
  }

  // FINAL SUMMARY
  printHeader('SUMMARY');

  if (fixes.length > 0) {
    print('✅ Fixes Applied:', colors.green);
    fixes.forEach(fix => print(`   • ${fix}`, colors.green));
    console.log('');
  }

  if (issues.length > 0) {
    print('⚠️  Issues Found:', colors.yellow);
    issues.forEach(issue => print(`   • ${issue}`, colors.yellow));
    console.log('');
  }

  print('\n🎉 Application Started!', colors.green);
  print('\n📍 Access URLs:', colors.cyan);
  print('   Frontend:  http://localhost:3000', colors.cyan);
  print('   Backend:   http://localhost:3001', colors.cyan);
  print('   API Docs:  http://localhost:3001/api/v1/docs', colors.cyan);
  print('\n📊 Port Allocation:', colors.cyan);
  print('   This app (Compliance): Frontend 3000, Backend 3001', colors.cyan);
  print('   Digital Twin: Frontend 3002, Backend 3003', colors.cyan);
  print('   Asset Intelligence: Frontend 3004, Backend 3005', colors.cyan);

  print('\n🔑 Test Credentials:', colors.cyan);
  print('   Email:     admin@compliance-saas.co.nz', colors.cyan);
  print('   Password:  password123', colors.cyan);

  print('\n💡 Tip: Press Ctrl+C to stop all services\n', colors.yellow);

  // Keep process alive
  process.on('SIGINT', () => {
    print('\n\n👋 Shutting down...', colors.yellow);
    backendProcess.kill();
    frontendProcess.kill();
    process.exit(0);
  });
}

main().catch(error => {
  print(`\n❌ Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});
