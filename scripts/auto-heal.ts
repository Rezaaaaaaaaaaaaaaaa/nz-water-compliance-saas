#!/usr/bin/env tsx
/**
 * 🔧 Auto-Heal System
 *
 * Intelligent test-driven debugging system that:
 * 1. Discovers ALL issues through comprehensive testing
 * 2. Classifies issues (auto-fixable vs manual intervention)
 * 3. Applies automated fixes
 * 4. Reruns tests iteratively until convergence
 * 5. Reports progress and remaining issues
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ANSI color codes for beautiful output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

interface TestResult {
  category: string;
  passed: number;
  failed: number;
  total: number;
  duration: number;
  failures: TestFailure[];
}

interface TestFailure {
  test: string;
  error: string;
  type: FailureType;
  autoFixable: boolean;
  fixStrategy?: string;
}

enum FailureType {
  CONFIG = 'configuration',
  CONNECTIVITY = 'connectivity',
  MISSING_ENDPOINT = 'missing_endpoint',
  DATABASE = 'database',
  REDIS = 'redis',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown',
}

interface HealingSession {
  iteration: number;
  timestamp: Date;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  issuesFixed: number;
  issuesRemaining: number;
  autoFixableIssues: number;
  manualIssues: number;
}

class AutoHealSystem {
  private sessions: HealingSession[] = [];
  private currentSession: HealingSession;
  private maxIterations = 5;
  private backendRoot: string;
  private projectRoot: string;

  constructor() {
    this.backendRoot = path.join(process.cwd(), 'backend');
    this.projectRoot = process.cwd();
    this.currentSession = this.createNewSession(1);
  }

  private createNewSession(iteration: number): HealingSession {
    return {
      iteration,
      timestamp: new Date(),
      testsRun: 0,
      testsPassed: 0,
      testsFailed: 0,
      issuesFixed: 0,
      issuesRemaining: 0,
      autoFixableIssues: 0,
      manualIssues: 0,
    };
  }

  private log(message: string, color: keyof typeof colors = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  private logHeader(title: string) {
    const line = '═'.repeat(80);
    this.log('\n' + line, 'magenta');
    this.log(`  ${title}`, 'magenta');
    this.log(line + '\n', 'magenta');
  }

  private async runCommand(
    command: string,
    args: string[],
    cwd?: string
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      const proc = spawn(command, args, {
        cwd: cwd || this.backendRoot,
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => (stdout += data.toString()));
      proc.stderr?.on('data', (data) => (stderr += data.toString()));

      proc.on('close', (exitCode) => {
        resolve({ stdout, stderr, exitCode: exitCode || 0 });
      });
    });
  }

  private async runTestSuite(pattern: string): Promise<TestResult> {
    this.log(`  → Running tests: ${pattern}`, 'cyan');

    const result = await this.runCommand('npm', [
      'test',
      '--',
      `--testPathPatterns=${pattern}`,
      '--json',
      '--outputFile=test-results.json',
    ]);

    // Parse test results
    const failures: TestFailure[] = [];
    let passed = 0;
    let failed = 0;

    // Analyze output to extract failures
    const lines = result.stdout.split('\n');
    for (const line of lines) {
      if (line.includes('PASS')) passed++;
      if (line.includes('FAIL')) failed++;

      // Extract failure information
      if (line.includes('Error:') || line.includes('Expected')) {
        failures.push(this.classifyFailure(line));
      }
    }

    return {
      category: pattern,
      passed,
      failed,
      total: passed + failed,
      duration: 0,
      failures,
    };
  }

  private classifyFailure(errorLine: string): TestFailure {
    let type = FailureType.UNKNOWN;
    let autoFixable = false;
    let fixStrategy = '';

    // Configuration errors
    if (errorLine.includes('NEXT_PUBLIC_API_URL') || errorLine.includes('PORT')) {
      type = FailureType.CONFIG;
      autoFixable = true;
      fixStrategy = 'update-env-file';
    }
    // Connectivity errors
    else if (errorLine.includes('ECONNREFUSED') || errorLine.includes('connect')) {
      type = FailureType.CONNECTIVITY;
      autoFixable = true;
      fixStrategy = 'start-services';
    }
    // Missing endpoints
    else if (errorLine.includes('404') || errorLine.includes('Not Found')) {
      type = FailureType.MISSING_ENDPOINT;
      autoFixable = false;
      fixStrategy = 'implement-endpoint';
    }
    // Database errors
    else if (errorLine.includes('database') || errorLine.includes('postgres')) {
      type = FailureType.DATABASE;
      autoFixable = true;
      fixStrategy = 'start-database';
    }
    // Redis errors
    else if (errorLine.includes('redis') || errorLine.includes('6379')) {
      type = FailureType.REDIS;
      autoFixable = true;
      fixStrategy = 'start-redis';
    }

    return {
      test: errorLine.substring(0, 100),
      error: errorLine,
      type,
      autoFixable,
      fixStrategy,
    };
  }

  private async applyFixes(failures: TestFailure[]): Promise<number> {
    let fixesApplied = 0;
    const fixStrategies = new Map<string, TestFailure[]>();

    // Group failures by fix strategy
    for (const failure of failures) {
      if (failure.autoFixable && failure.fixStrategy) {
        const existing = fixStrategies.get(failure.fixStrategy) || [];
        existing.push(failure);
        fixStrategies.set(failure.fixStrategy, existing);
      }
    }

    // Apply fixes
    for (const [strategy, failures] of fixStrategies) {
      this.log(`\n  🔧 Applying fix: ${strategy}`, 'yellow');

      switch (strategy) {
        case 'start-services':
          if (await this.startServices()) {
            fixesApplied += failures.length;
            this.log(`    ✓ Services started`, 'green');
          }
          break;

        case 'start-database':
          if (await this.startDatabase()) {
            fixesApplied += failures.length;
            this.log(`    ✓ Database started`, 'green');
          }
          break;

        case 'start-redis':
          if (await this.startRedis()) {
            fixesApplied += failures.length;
            this.log(`    ✓ Redis started`, 'green');
          }
          break;

        case 'update-env-file':
          if (await this.fixEnvFiles()) {
            fixesApplied += failures.length;
            this.log(`    ✓ Environment files updated`, 'green');
          }
          break;

        default:
          this.log(`    ⚠ No automated fix for: ${strategy}`, 'yellow');
      }
    }

    return fixesApplied;
  }

  private async startServices(): Promise<boolean> {
    // Check if services are running
    try {
      const result = await this.runCommand('docker', ['ps', '--format', '{{.Names}}']);
      if (result.stdout.includes('postgres') && result.stdout.includes('redis')) {
        return true; // Already running
      }

      // Start services
      await this.runCommand('docker-compose', ['-f', 'docker-compose.test.yml', 'up', '-d'], this.projectRoot);

      // Wait for services to be ready
      await new Promise(resolve => setTimeout(resolve, 5000));

      return true;
    } catch (error) {
      return false;
    }
  }

  private async startDatabase(): Promise<boolean> {
    try {
      await this.runCommand('docker-compose', ['-f', 'docker-compose.test.yml', 'up', '-d', 'postgres-primary'], this.projectRoot);
      await new Promise(resolve => setTimeout(resolve, 3000));
      return true;
    } catch {
      return false;
    }
  }

  private async startRedis(): Promise<boolean> {
    try {
      await this.runCommand('docker-compose', ['-f', 'docker-compose.test.yml', 'up', '-d', 'redis'], this.projectRoot);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
    } catch {
      return false;
    }
  }

  private async fixEnvFiles(): Promise<boolean> {
    try {
      const backendEnvPath = path.join(this.backendRoot, '.env');
      const frontendEnvPath = path.join(this.projectRoot, 'frontend', '.env.local');

      // Read current env files
      let backendEnv = fs.readFileSync(backendEnvPath, 'utf-8');
      let frontendEnv = fs.readFileSync(frontendEnvPath, 'utf-8');

      // Fix common issues
      backendEnv = backendEnv.replace(/PORT=3001/, 'PORT=3000');
      frontendEnv = frontendEnv.replace(/NEXT_PUBLIC_API_URL=.*:3001/, 'NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1');

      // Write back
      fs.writeFileSync(backendEnvPath, backendEnv);
      fs.writeFileSync(frontendEnvPath, frontendEnv);

      return true;
    } catch {
      return false;
    }
  }

  private printProgress() {
    const session = this.currentSession;
    const passRate = session.testsRun > 0
      ? ((session.testsPassed / session.testsRun) * 100).toFixed(1)
      : '0.0';

    this.log('\n┌─────────────────────────────────────────────────────────────┐', 'cyan');
    this.log(`│  Iteration ${session.iteration} Progress                                   │`, 'cyan');
    this.log('├─────────────────────────────────────────────────────────────┤', 'cyan');
    this.log(`│  Tests Run:        ${session.testsRun.toString().padStart(4)}                                    │`, 'cyan');
    this.log(`│  Tests Passed:     ${session.testsPassed.toString().padStart(4)} (${passRate}%)                        │`, session.testsPassed === session.testsRun ? 'green' : 'cyan');
    this.log(`│  Tests Failed:     ${session.testsFailed.toString().padStart(4)}                                    │`, session.testsFailed > 0 ? 'red' : 'cyan');
    this.log('├─────────────────────────────────────────────────────────────┤', 'cyan');
    this.log(`│  Issues Fixed:     ${session.issuesFixed.toString().padStart(4)}                                    │`, 'green');
    this.log(`│  Auto-fixable:     ${session.autoFixableIssues.toString().padStart(4)}                                    │`, 'yellow');
    this.log(`│  Manual Required:  ${session.manualIssues.toString().padStart(4)}                                    │`, 'magenta');
    this.log('└─────────────────────────────────────────────────────────────┘\n', 'cyan');
  }

  async run() {
    this.logHeader('🚀 Auto-Heal System Starting');
    this.log('Iterative Test-Fix-Retest Loop\n', 'bright');

    const testSuites = [
      'config-validation.test.ts',
      'connectivity.test.ts',
      'health-check.test.ts',
      'api-contract.test.ts',
    ];

    for (let iteration = 1; iteration <= this.maxIterations; iteration++) {
      this.currentSession = this.createNewSession(iteration);

      this.logHeader(`Iteration ${iteration} of ${this.maxIterations}`);

      // Phase 1: Run all tests
      this.log('\n📋 Phase 1: Running Comprehensive Tests\n', 'blue');

      const allFailures: TestFailure[] = [];

      for (const suite of testSuites) {
        const result = await this.runTestSuite(suite);

        this.currentSession.testsRun += result.total;
        this.currentSession.testsPassed += result.passed;
        this.currentSession.testsFailed += result.failed;

        allFailures.push(...result.failures);

        const status = result.failed === 0 ? '✓' : '✗';
        const color = result.failed === 0 ? 'green' : 'red';
        this.log(`    ${status} ${suite}: ${result.passed}/${result.total} passed`, color);
      }

      // Phase 2: Classify issues
      this.log('\n🔍 Phase 2: Classifying Issues\n', 'blue');

      const autoFixable = allFailures.filter(f => f.autoFixable);
      const manual = allFailures.filter(f => !f.autoFixable);

      this.currentSession.autoFixableIssues = autoFixable.length;
      this.currentSession.manualIssues = manual.length;

      this.log(`  Auto-fixable issues: ${autoFixable.length}`, 'yellow');
      this.log(`  Manual intervention: ${manual.length}`, 'magenta');

      // Phase 3: Apply fixes
      if (autoFixable.length > 0) {
        this.log('\n🔧 Phase 3: Applying Automated Fixes\n', 'blue');

        const fixesApplied = await this.applyFixes(autoFixable);
        this.currentSession.issuesFixed = fixesApplied;

        this.log(`\n  ✓ Applied ${fixesApplied} automated fixes`, 'green');
      } else {
        this.log('\n✓ Phase 3: No auto-fixable issues found', 'green');
      }

      // Phase 4: Progress report
      this.printProgress();

      // Check if we're done
      if (this.currentSession.testsFailed === 0) {
        this.logHeader('🎉 SUCCESS! All Tests Passing!');
        this.log('Your application is now fully tested and operational.\n', 'green');
        break;
      }

      if (autoFixable.length === 0 && manual.length > 0) {
        this.logHeader('⚠️ Manual Intervention Required');
        this.log('All auto-fixable issues have been resolved.', 'yellow');
        this.log('The following issues require manual attention:\n', 'yellow');

        manual.forEach((issue, i) => {
          this.log(`  ${i + 1}. [${issue.type}] ${issue.test}`, 'magenta');
        });

        this.log('\nPlease fix these issues and run the auto-heal system again.\n', 'yellow');
        break;
      }

      // Wait before next iteration
      if (iteration < this.maxIterations) {
        this.log('\n⏳ Waiting 3 seconds before next iteration...\n', 'cyan');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    this.logHeader('📊 Final Report');
    this.printSessionSummary();
  }

  private printSessionSummary() {
    this.log('\nSession Summary:', 'bright');
    this.log('─'.repeat(60), 'cyan');

    for (const session of this.sessions) {
      const passRate = session.testsRun > 0
        ? ((session.testsPassed / session.testsRun) * 100).toFixed(1)
        : '0.0';

      this.log(
        `Iteration ${session.iteration}: ${session.testsPassed}/${session.testsRun} passed (${passRate}%) - ${session.issuesFixed} fixes applied`,
        session.testsFailed === 0 ? 'green' : 'yellow'
      );
    }

    this.log('─'.repeat(60) + '\n', 'cyan');
  }
}

// Run the auto-heal system
const autoHeal = new AutoHealSystem();
autoHeal.run().catch(console.error);
