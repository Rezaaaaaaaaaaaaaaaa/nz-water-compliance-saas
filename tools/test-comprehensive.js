#!/usr/bin/env node

/**
 * NZ Water Compliance SaaS - Comprehensive Test Suite
 * Cross-platform test runner that mimics GitHub Actions workflow
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  runMode: 'full',
  skipE2E: false,
  watch: false,
  verbose: false,
  iterative: false,
};

// Test results tracking
const testResults = [];
let failedTests = 0;
let totalTests = 0;
const startTime = new Date();
const logFile = `test-results-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.log`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Utility functions
function writeLog(message) {
  fs.appendFileSync(logFile, message + '\n');
}

function printHeader(text) {
  const line = '='.repeat(76);
  console.log(`\n${colors.cyan}${line}`);
  console.log(`  ${text}`);
  console.log(`${line}${colors.reset}\n`);
  writeLog(`\n${line}\n${text}\n${line}`);
}

function printSuccess(text) {
  console.log(`${colors.green}  [OK] ${text}${colors.reset}`);
  writeLog(`[OK] ${text}`);
}

function printFailure(text) {
  console.log(`${colors.red}  [FAIL] ${text}${colors.reset}`);
  writeLog(`[FAIL] ${text}`);
  failedTests++;
}

function printWarning(text) {
  console.log(`${colors.yellow}  [WARN] ${text}${colors.reset}`);
  writeLog(`[WARN] ${text}`);
}

function printInfo(text) {
  console.log(`${colors.cyan}  [INFO] ${text}${colors.reset}`);
  writeLog(`[INFO] ${text}`);
}

function addTestResult(name, status, duration, details = '') {
  testResults.push({ name, status, duration, details });
}

// Execute command and return promise
function execCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, { shell: true, ...options });
    let stdout = '';
    let stderr = '';
    let lastOutput = Date.now();

    // Progress indicator for long-running commands
    const progressInterval = config.verbose ? null : setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastOutput) / 1000);
      if (elapsed > 5) {
        process.stdout.write('.');
      }
    }, 2000);

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
      lastOutput = Date.now();
      if (config.verbose) process.stdout.write(data);
      writeLog(data.toString());
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
      lastOutput = Date.now();
      if (config.verbose) process.stderr.write(data);
      writeLog(data.toString());
    });

    proc.on('close', (code) => {
      if (progressInterval) {
        clearInterval(progressInterval);
        if (!config.verbose) process.stdout.write('\n');
      }
      resolve({ code, stdout, stderr });
    });

    proc.on('error', (error) => {
      if (progressInterval) clearInterval(progressInterval);
      reject(error);
    });
  });
}

// Check if command exists
function commandExists(command) {
  return new Promise((resolve) => {
    exec(`${command} --version`, (error) => {
      resolve(!error);
    });
  });
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);

  for (const arg of args) {
    switch (arg) {
      case '--quick':
        config.runMode = 'quick';
        config.skipE2E = true;
        break;
      case '--unit':
        config.runMode = 'unit';
        break;
      case '--integration':
        config.runMode = 'integration';
        break;
      case '--e2e':
        config.runMode = 'e2e';
        break;
      case '--build':
        config.runMode = 'build';
        break;
      case '--security':
        config.runMode = 'security';
        break;
      case '--skip-e2e':
        config.skipE2E = true;
        break;
      case '--watch':
        config.watch = true;
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--iterative':
        config.iterative = true;
        break;
      case '--help':
        showHelp();
        process.exit(0);
        break;
    }
  }
}

function showHelp() {
  console.log(`
NZ Water Compliance SaaS - Comprehensive Test Suite

Usage: node tools/test-comprehensive.js [OPTIONS]

Options:
  --quick         Run quick tests only (skip builds, E2E)
  --unit          Run unit tests only
  --integration   Run integration tests only
  --e2e           Run E2E tests only
  --build         Run build verification only
  --security      Run security audit only
  --skip-e2e      Skip E2E tests in full run
  --watch         Run tests in watch mode (unit tests only)
  --iterative     Run tests iteratively with progress updates
  --verbose       Show verbose output
  --help          Show this help message

Examples:
  node tools/test-comprehensive.js                    Run full test suite
  node tools/test-comprehensive.js --quick            Run quick tests
  node tools/test-comprehensive.js --skip-e2e         Run all except E2E
  node tools/test-comprehensive.js --unit --watch     Watch mode for unit tests
  node tools/test-comprehensive.js --iterative        Run with detailed progress
`);
}

// Main test runner
async function runTests() {
  parseArgs();

  // Header
  printHeader('NZ Water Compliance SaaS - Comprehensive Test Suite');
  console.log(`  Mode: ${config.runMode}`);
  console.log(`  Log: ${logFile}`);
  console.log(`  Started: ${startTime.toISOString()}\n`);

  writeLog('NZ Water Compliance SaaS - Test Results');
  writeLog(`Started: ${startTime.toISOString()}`);
  writeLog(`Mode: ${config.runMode}\n`);

  try {
    // Prerequisites check
    await checkPrerequisites();

    // Start services if needed
    if (config.runMode === 'full' || config.runMode === 'integration') {
      await startServices();
    }

    // Install dependencies
    if (config.runMode === 'full' || config.runMode === 'quick') {
      await installDependencies();
    }

    // Generate Prisma client
    if (config.runMode !== 'e2e') {
      await generatePrisma();
    }

    // Run test suites based on mode
    if (config.runMode === 'full') {
      await runLint();
      await runUnitTests();
      await runIntegrationTests();
      await runBuildVerification();
      await runSecurityAudit();
      await runHealthCheck();
      if (!config.skipE2E) await runE2ETests();
    } else if (config.runMode === 'quick') {
      await runUnitTests();
    } else if (config.runMode === 'unit') {
      await runUnitTests();
    } else if (config.runMode === 'integration') {
      await runIntegrationTests();
    } else if (config.runMode === 'e2e') {
      await runE2ETests();
    } else if (config.runMode === 'build') {
      await runBuildVerification();
    } else if (config.runMode === 'security') {
      await runSecurityAudit();
    }

    // Show summary
    await showSummary();
  } catch (error) {
    printFailure(`Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

async function checkPrerequisites() {
  printHeader('PREREQUISITES CHECK');

  totalTests++;
  const hasNode = await commandExists('node');
  const hasNpm = await commandExists('npm');
  const hasDocker = await commandExists('docker');

  if (hasNode) printSuccess('Node.js found');
  else printFailure('Node.js not found');

  if (hasNpm) printSuccess('npm found');
  else printFailure('npm not found');

  if (hasDocker) printSuccess('Docker found');
  else printWarning('Docker not found - ensure PostgreSQL and Redis are running');

  if (fs.existsSync('backend/.env')) {
    printSuccess('Backend .env file exists');
  } else {
    printWarning('Backend .env file not found - using defaults');
  }

  if (!hasNode || !hasNpm) {
    throw new Error('Prerequisites check failed');
  }
}

async function startServices() {
  printHeader('STARTING SERVICES');

  const startTime = Date.now();

  // Check if services are already running
  const checkResult = await execCommand('docker ps --format "{{.Names}}" | grep -E "(postgres|redis)"');

  if (checkResult.stdout.includes('postgres') && checkResult.stdout.includes('redis')) {
    printSuccess('Docker services already running');
    addTestResult('Service Startup', 'Success', `${Date.now() - startTime}ms`, 'Already running');
    return;
  }

  printInfo('Starting PostgreSQL and Redis via Docker...');
  const result = await execCommand('docker compose up -d postgres redis');

  if (result.code === 0) {
    printSuccess('Docker services started');
    printInfo('Waiting for services to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    addTestResult('Service Startup', 'Success', `${Date.now() - startTime}ms`);
  } else {
    printWarning('Failed to start Docker services - ensure they\'re running manually');
    addTestResult('Service Startup', 'Warning', `${Date.now() - startTime}ms`, 'Manual start required');
  }
}

async function installDependencies() {
  printHeader('INSTALLING DEPENDENCIES');
  totalTests++;

  // Backend
  let startTime = Date.now();
  process.chdir('backend');
  const backendResult = await execCommand('npm install');
  process.chdir('..');

  if (backendResult.code === 0) {
    printSuccess('Backend dependencies installed');
    addTestResult('Backend Dependencies', 'Success', `${Date.now() - startTime}ms`);
  } else {
    printFailure('Backend dependency installation failed');
    addTestResult('Backend Dependencies', 'Failed', `${Date.now() - startTime}ms`);
  }

  // Frontend
  if (!config.skipE2E) {
    startTime = Date.now();
    process.chdir('frontend');
    const frontendResult = await execCommand('npm install');
    process.chdir('..');

    if (frontendResult.code === 0) {
      printSuccess('Frontend dependencies installed');
      addTestResult('Frontend Dependencies', 'Success', `${Date.now() - startTime}ms`);
    } else {
      printWarning('Frontend dependency installation failed');
      addTestResult('Frontend Dependencies', 'Warning', `${Date.now() - startTime}ms`);
    }
  }
}

async function generatePrisma() {
  printHeader('GENERATING PRISMA CLIENT');
  totalTests++;

  const startTime = Date.now();
  process.chdir('backend');
  const result = await execCommand('npx prisma generate');
  process.chdir('..');

  if (result.code === 0) {
    printSuccess('Prisma client generated');
    addTestResult('Prisma Generation', 'Success', `${Date.now() - startTime}ms`);
  } else {
    printFailure('Prisma generation failed');
    addTestResult('Prisma Generation', 'Failed', `${Date.now() - startTime}ms`);
  }
}

async function runLint() {
  printHeader('LINT & CODE QUALITY');
  totalTests++;

  const startTime = Date.now();
  process.chdir('backend');

  // ESLint
  const lintResult = await execCommand('npm run lint');
  // Prettier
  const prettierResult = await execCommand('npx prettier --check src');

  process.chdir('..');

  if (lintResult.code === 0 && prettierResult.code === 0) {
    printSuccess('Linting and formatting passed');
    addTestResult('Lint & Format', 'Success', `${Date.now() - startTime}ms`);
  } else {
    printWarning('Linting or formatting issues found (non-blocking)');
    addTestResult('Lint & Format', 'Warning', `${Date.now() - startTime}ms`);
  }
}

async function runUnitTests() {
  printHeader('UNIT TESTS');
  totalTests++;

  process.chdir('backend');

  if (config.watch) {
    printInfo('Running unit tests in watch mode...');
    await execCommand('npm run test:watch');
  } else {
    const startTime = Date.now();
    const result = await execCommand('npm test -- --coverage --maxWorkers=2 --silent');

    if (result.code === 0) {
      printSuccess('Unit tests passed');

      // Display coverage
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        const lines = coverage.total.lines.pct.toFixed(2);
        const branches = coverage.total.branches.pct.toFixed(2);
        const functions = coverage.total.functions.pct.toFixed(2);

        console.log(`\n  ${colors.cyan}Coverage Summary:${colors.reset}`);
        console.log(`    Lines: ${lines}% | Branches: ${branches}% | Functions: ${functions}%\n`);

        addTestResult('Unit Tests', 'Success', `${Date.now() - startTime}ms`, `Coverage: ${lines}%`);
      } else {
        addTestResult('Unit Tests', 'Success', `${Date.now() - startTime}ms`);
      }
    } else {
      printFailure('Unit tests failed');
      addTestResult('Unit Tests', 'Failed', `${Date.now() - startTime}ms`);
    }
  }

  process.chdir('..');
}

async function runIntegrationTests() {
  printHeader('INTEGRATION TESTS');
  totalTests++;

  process.chdir('backend');

  // Setup database
  printInfo('Setting up test database...');
  const migrateResult = await execCommand('npx prisma migrate deploy --skip-generate');

  if (migrateResult.code !== 0) {
    printWarning('Database migration had warnings (continuing)');
    if (config.verbose) {
      console.log('Migration output:', migrateResult.stderr);
    }
  } else {
    printSuccess('Database migration completed');
  }

  // Run tests
  const startTime = Date.now();
  printInfo('Running integration tests (this may take a while)...');
  const result = await execCommand('npm run test:integration');

  if (result.code === 0) {
    printSuccess('Integration tests passed');
    addTestResult('Integration Tests', 'Success', `${Date.now() - startTime}ms`);
  } else {
    printFailure('Integration tests failed');
    addTestResult('Integration Tests', 'Failed', `${Date.now() - startTime}ms`);
    if (config.verbose && result.stderr) {
      console.log('Error output:', result.stderr.substring(0, 500));
    }
  }

  process.chdir('..');
}

async function runBuildVerification() {
  printHeader('BUILD VERIFICATION');
  totalTests++;

  // Backend build
  process.chdir('backend');
  let startTime = Date.now();
  const backendResult = await execCommand('npm run build');

  if (backendResult.code === 0 && fs.existsSync('dist')) {
    printSuccess('Backend build successful');
    addTestResult('Backend Build', 'Success', `${Date.now() - startTime}ms`);
  } else {
    printFailure('Backend build failed');
    addTestResult('Backend Build', 'Failed', `${Date.now() - startTime}ms`);
  }
  process.chdir('..');

  // Frontend build
  if (!config.skipE2E) {
    process.chdir('frontend');
    startTime = Date.now();
    const frontendResult = await execCommand('npm run build');

    if (frontendResult.code === 0 && fs.existsSync('.next')) {
      printSuccess('Frontend build successful');
      addTestResult('Frontend Build', 'Success', `${Date.now() - startTime}ms`);
    } else {
      printFailure('Frontend build failed');
      addTestResult('Frontend Build', 'Failed', `${Date.now() - startTime}ms`);
    }
    process.chdir('..');
  }
}

async function runSecurityAudit() {
  printHeader('SECURITY AUDIT');
  totalTests++;

  const startTime = Date.now();

  process.chdir('backend');
  const backendResult = await execCommand('npm audit --production');
  process.chdir('..');

  if (!config.skipE2E) {
    process.chdir('frontend');
    await execCommand('npm audit --production');
    process.chdir('..');
  }

  if (backendResult.code === 0) {
    printSuccess('Security audit passed');
    addTestResult('Security Audit', 'Success', `${Date.now() - startTime}ms`);
  } else {
    printWarning('Security vulnerabilities found (check log)');
    addTestResult('Security Audit', 'Warning', `${Date.now() - startTime}ms`, 'Vulnerabilities detected');
  }
}

async function runHealthCheck() {
  printHeader('HEALTH CHECK');
  totalTests++;

  if (fs.existsSync('backend/dist')) {
    process.chdir('backend');
    const startTime = Date.now();
    const result = await execCommand('npm run health:check-once');

    if (result.code === 0) {
      printSuccess('Health check passed');
      addTestResult('Health Check', 'Success', `${Date.now() - startTime}ms`);
    } else {
      printWarning('Health check completed with warnings');
      addTestResult('Health Check', 'Warning', `${Date.now() - startTime}ms`);
    }
    process.chdir('..');
  } else {
    printWarning('Skipping health check - backend not built');
  }
}

async function runE2ETests() {
  printHeader('E2E TESTS');
  totalTests++;

  console.log('');
  printWarning('E2E tests require backend and frontend to be running');
  console.log('  Please ensure:');
  console.log('    1. Backend is running on http://localhost:3000');
  console.log('    2. Frontend is running on http://localhost:3002');
  console.log('    3. PostgreSQL and Redis are running\n');

  // Install Playwright browsers
  await execCommand('npx playwright install --with-deps chromium');

  const startTime = Date.now();
  const result = await execCommand('npx playwright test');

  if (result.code === 0) {
    printSuccess('E2E tests passed');
    addTestResult('E2E Tests', 'Success', `${Date.now() - startTime}ms`);
  } else {
    printFailure('E2E tests failed');
    printInfo('To view the Playwright report, run: npx playwright show-report');
    addTestResult('E2E Tests', 'Failed', `${Date.now() - startTime}ms`);
  }
}

async function showSummary() {
  const endTime = new Date();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  printHeader('TEST SUMMARY');

  // Display results table
  if (testResults.length > 0) {
    console.log('  Test Results:\n');
    console.table(testResults);
  }

  console.log('  Statistics:');
  console.log(`    Total Test Suites: ${totalTests}`);
  console.log(`    Failed: ${failedTests}`);
  console.log(`    Duration: ${duration}s\n`);

  if (failedTests === 0) {
    console.log(`  ${colors.green}Status: ALL TESTS PASSED!${colors.reset}`);
    console.log(`  ${colors.green}Ready for deployment${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`  ${colors.red}Status: SOME TESTS FAILED${colors.reset}`);
    console.log(`  ${colors.yellow}Please review the log file: ${logFile}${colors.reset}\n`);
    process.exit(1);
  }
}

// Run the test suite
runTests().catch((error) => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
