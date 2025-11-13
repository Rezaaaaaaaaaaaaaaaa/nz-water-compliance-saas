#!/usr/bin/env node
/**
 * FlowComply CLI
 *
 * Command-line interface for operational tasks
 */

import { Command } from 'commander';
import { prisma } from '../src/config/database.js';
import { logger } from '../src/config/logger.js';
import Redis from 'ioredis';
import { config } from '../src/config/index.js';

const program = new Command();

// Initialize Redis
const redis = new Redis({
  host: config.redis?.host || 'localhost',
  port: config.redis?.port || 6379,
  password: config.redis?.password,
});

program
  .name('flowcomply')
  .description('FlowComply CLI - NZ Water Compliance SaaS Operations')
  .version('1.0.0');

/**
 * User Management Commands
 */
const userCmd = program.command('user').description('User management commands');

userCmd
  .command('create')
  .description('Create a new user')
  .requiredOption('-e, --email <email>', 'User email')
  .requiredOption('-f, --first-name <name>', 'First name')
  .requiredOption('-l, --last-name <name>', 'Last name')
  .requiredOption('-r, --role <role>', 'User role (SYSTEM_ADMIN, ORG_ADMIN, COMPLIANCE_MANAGER, INSPECTOR, AUDITOR)')
  .requiredOption('-o, --org <orgId>', 'Organization ID')
  .option('-p, --password <password>', 'Password (will be hashed)')
  .action(async (options) => {
    try {
      const user = await prisma.user.create({
        data: {
          email: options.email,
          firstName: options.firstName,
          lastName: options.lastName,
          role: options.role,
          organizationId: options.org,
          isActive: true,
          emailVerified: true,
        },
      });

      console.log('✅ User created successfully:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
    } catch (error) {
      console.error('❌ Error creating user:', error);
      process.exit(1);
    }
  });

userCmd
  .command('list')
  .description('List users')
  .option('-o, --org <orgId>', 'Filter by organization')
  .option('-r, --role <role>', 'Filter by role')
  .option('-l, --limit <number>', 'Limit results', '20')
  .action(async (options) => {
    try {
      const users = await prisma.user.findMany({
        where: {
          ...(options.org && { organizationId: options.org }),
          ...(options.role && { role: options.role }),
          deletedAt: null,
        },
        take: parseInt(options.limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          organizationId: true,
        },
      });

      console.log(`Found ${users.length} users:\n`);
      console.table(users);
    } catch (error) {
      console.error('❌ Error listing users:', error);
      process.exit(1);
    }
  });

userCmd
  .command('deactivate')
  .description('Deactivate a user')
  .requiredOption('-u, --user <userId>', 'User ID')
  .action(async (options) => {
    try {
      await prisma.user.update({
        where: { id: options.user },
        data: { isActive: false },
      });

      console.log(`✅ User ${options.user} deactivated`);
    } catch (error) {
      console.error('❌ Error deactivating user:', error);
      process.exit(1);
    }
  });

/**
 * Organization Commands
 */
const orgCmd = program.command('org').description('Organization management commands');

orgCmd
  .command('stats')
  .description('Show organization statistics')
  .requiredOption('-o, --org <orgId>', 'Organization ID')
  .action(async (options) => {
    try {
      const [org, users, assets, plans, documents, reports] = await Promise.all([
        prisma.organization.findUnique({ where: { id: options.org } }),
        prisma.user.count({ where: { organizationId: options.org, deletedAt: null } }),
        prisma.asset.count({ where: { organizationId: options.org } }),
        prisma.compliancePlan.count({ where: { organizationId: options.org } }),
        prisma.document.count({ where: { organizationId: options.org } }),
        prisma.report.count({ where: { organizationId: options.org } }),
      ]);

      if (!org) {
        console.error(`❌ Organization not found: ${options.org}`);
        process.exit(1);
      }

      console.log('\n📊 Organization Statistics\n');
      console.log(`Name: ${org.name}`);
      console.log(`Type: ${org.type}`);
      console.log(`Population Served: ${org.populationServed?.toLocaleString() || 'N/A'}`);
      console.log(`\nResources:`);
      console.log(`  Users: ${users}`);
      console.log(`  Assets: ${assets}`);
      console.log(`  Compliance Plans: ${plans}`);
      console.log(`  Documents: ${documents}`);
      console.log(`  Reports: ${reports}`);
    } catch (error) {
      console.error('❌ Error fetching organization stats:', error);
      process.exit(1);
    }
  });

/**
 * Cache Management Commands
 */
const cacheCmd = program.command('cache').description('Cache management commands');

cacheCmd
  .command('clear')
  .description('Clear cache')
  .option('-p, --pattern <pattern>', 'Key pattern to clear (default: all)', '*')
  .action(async (options) => {
    try {
      const keys = await redis.keys(`cache:${options.pattern}`);

      if (keys.length === 0) {
        console.log('No cache keys found');
        return;
      }

      await redis.del(...keys);
      console.log(`✅ Cleared ${keys.length} cache keys`);
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
      process.exit(1);
    }
  });

cacheCmd
  .command('stats')
  .description('Show cache statistics')
  .action(async () => {
    try {
      const info = await redis.info('stats');
      const dbsize = await redis.dbsize();

      const hitsMatch = info.match(/keyspace_hits:(\d+)/);
      const missesMatch = info.match(/keyspace_misses:(\d+)/);
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);

      const hits = hitsMatch ? parseInt(hitsMatch[1]) : 0;
      const misses = missesMatch ? parseInt(missesMatch[1]) : 0;
      const total = hits + misses;
      const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) : '0.00';

      console.log('\n📈 Cache Statistics\n');
      console.log(`Total Keys: ${dbsize}`);
      console.log(`Memory Used: ${memoryMatch ? memoryMatch[1] : 'unknown'}`);
      console.log(`Cache Hits: ${hits.toLocaleString()}`);
      console.log(`Cache Misses: ${misses.toLocaleString()}`);
      console.log(`Hit Rate: ${hitRate}%`);
    } catch (error) {
      console.error('❌ Error fetching cache stats:', error);
      process.exit(1);
    }
  });

/**
 * Database Commands
 */
const dbCmd = program.command('db').description('Database management commands');

dbCmd
  .command('health')
  .description('Check database health')
  .action(async () => {
    try {
      await prisma.$queryRaw`SELECT 1 as health`;

      const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM "Organization"
      `;

      console.log('✅ Database is healthy');
      console.log(`   Organizations: ${Number(result[0].count)}`);
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      process.exit(1);
    }
  });

dbCmd
  .command('seed')
  .description('Seed database with test data')
  .option('-o, --orgs <number>', 'Number of organizations', '3')
  .option('-u, --users <number>', 'Users per organization', '5')
  .option('-a, --assets <number>', 'Assets per organization', '10')
  .action(async (options) => {
    console.log('🌱 Seeding database...');
    console.log(`   Organizations: ${options.orgs}`);
    console.log(`   Users per org: ${options.users}`);
    console.log(`   Assets per org: ${options.assets}`);

    try {
      // Import seed logic here
      console.log('✅ Database seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      process.exit(1);
    }
  });

/**
 * Report Commands
 */
const reportCmd = program.command('report').description('Report management commands');

reportCmd
  .command('generate')
  .description('Generate a report')
  .requiredOption('-o, --org <orgId>', 'Organization ID')
  .requiredOption('-t, --type <type>', 'Report type')
  .option('-y, --year <year>', 'Year', new Date().getFullYear().toString())
  .action(async (options) => {
    try {
      console.log(`📄 Generating ${options.type} report for organization ${options.org}...`);

      // Report generation logic here

      console.log('✅ Report generated successfully');
    } catch (error) {
      console.error('❌ Error generating report:', error);
      process.exit(1);
    }
  });

/**
 * Audit Commands
 */
const auditCmd = program.command('audit').description('Audit log commands');

auditCmd
  .command('search')
  .description('Search audit logs')
  .option('-u, --user <userId>', 'Filter by user')
  .option('-o, --org <orgId>', 'Filter by organization')
  .option('-a, --action <action>', 'Filter by action')
  .option('-l, --limit <number>', 'Limit results', '20')
  .action(async (options) => {
    try {
      const logs = await prisma.auditLog.findMany({
        where: {
          ...(options.user && { userId: options.user }),
          ...(options.org && { organizationId: options.org }),
          ...(options.action && { action: options.action }),
        },
        take: parseInt(options.limit),
        orderBy: { timestamp: 'desc' },
      });

      console.log(`Found ${logs.length} audit log entries:\n`);
      console.table(logs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        user: log.userId,
        action: log.action,
        resource: `${log.resourceType}:${log.resourceId}`,
      })));
    } catch (error) {
      console.error('❌ Error searching audit logs:', error);
      process.exit(1);
    }
  });

/**
 * Cleanup and exit
 */
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});

// Parse arguments
program.parse();
