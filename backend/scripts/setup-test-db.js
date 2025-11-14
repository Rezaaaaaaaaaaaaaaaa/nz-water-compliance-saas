#!/usr/bin/env node
/**
 * Test Database Setup Script
 * Creates the test database and runs migrations
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Client } = pg;

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test database configuration
const TEST_DB_NAME = 'compliance_test';
const TEST_DB_USER = process.env.TEST_DB_USER || 'postgres';
const TEST_DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'password';
const TEST_DB_HOST = process.env.TEST_DB_HOST || 'localhost';
const TEST_DB_PORT = process.env.TEST_DB_PORT || '5432';

const DATABASE_URL = `postgresql://${TEST_DB_USER}:${TEST_DB_PASSWORD}@${TEST_DB_HOST}:${TEST_DB_PORT}/${TEST_DB_NAME}`;

console.log('🔧 Setting up test database...\n');

async function setupTestDatabase() {
  // Step 1: Create the test database
  console.log('Step 1: Creating test database...');
  try {
    const createDbUrl = `postgresql://${TEST_DB_USER}:${TEST_DB_PASSWORD}@${TEST_DB_HOST}:${TEST_DB_PORT}/postgres`;

    const client = new Client({
      connectionString: createDbUrl,
    });

    try {
      await client.connect();

      // Check if database exists
      const result = await client.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [TEST_DB_NAME]
      );

      if (result.rows.length === 0) {
        // Create database
        await client.query(`CREATE DATABASE ${TEST_DB_NAME}`);
        console.log(`✅ Database '${TEST_DB_NAME}' created successfully`);
      } else {
        console.log(`ℹ️  Database '${TEST_DB_NAME}' already exists`);
      }

      await client.end();

      // Step 2: Run migrations
      console.log('\nStep 2: Running Prisma migrations...');
      const backendDir = join(__dirname, '..');

      // Set environment variable for child process
      const env = {
        ...process.env,
        DATABASE_URL: DATABASE_URL,
      };

      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        cwd: backendDir,
        env: env,
      });
      console.log('✅ Migrations completed');

      // Step 3: Generate Prisma Client
      console.log('\nStep 3: Generating Prisma Client...');
      execSync('npx prisma generate', {
        stdio: 'inherit',
        cwd: backendDir,
      });
      console.log('✅ Prisma Client generated');

      console.log('\n✅ Test database setup complete!');
      console.log(`\nTest database URL: ${DATABASE_URL}`);
      console.log('\nYou can now run integration tests with:');
      console.log('  npm run test:integration');

    } catch (err) {
      console.error('❌ Error setting up test database:', err.message);
      process.exit(1);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('\nMake sure PostgreSQL is running and accessible at:');
    console.error(`  Host: ${TEST_DB_HOST}`);
    console.error(`  Port: ${TEST_DB_PORT}`);
    console.error(`  User: ${TEST_DB_USER}`);
    process.exit(1);
  }
}

// Run the setup
setupTestDatabase().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
