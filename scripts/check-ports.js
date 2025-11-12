#!/usr/bin/env node

/**
 * Port Conflict Checker
 *
 * Checks if required ports are available before starting servers.
 * Usage: node scripts/check-ports.js <port1> <port2> ...
 *
 * Example: node scripts/check-ports.js 3000 3001
 */

const net = require('net');

// Port configuration for all Water Intelligence platforms
const PORT_ALLOCATIONS = {
  'Compliance & Quality Management': { frontend: 3000, backend: 3001 },
  'Digital Twin Platform': { frontend: 3002, backend: 3003 },
  'Asset Intelligence Platform': { frontend: 3004, backend: 3005 },
  'Shared Infrastructure': { postgresql: 5432, redis: 6379 }
};

/**
 * Check if a port is in use
 */
function checkPort(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve({ port, available: false });
      } else {
        reject(err);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve({ port, available: true });
    });

    server.listen(port, '0.0.0.0');
  });
}

/**
 * Find which platform uses a port
 */
function findPlatformForPort(port) {
  for (const [platform, ports] of Object.entries(PORT_ALLOCATIONS)) {
    for (const [service, servicePort] of Object.entries(ports)) {
      if (servicePort === port) {
        return { platform, service };
      }
    }
  }
  return null;
}

/**
 * Main function
 */
async function main() {
  const portsToCheck = process.argv.slice(2).map(p => parseInt(p, 10));

  if (portsToCheck.length === 0) {
    console.error('Usage: node check-ports.js <port1> <port2> ...');
    console.error('\nExample: node check-ports.js 3000 3001');
    console.error('\n📋 Port Allocations:');
    for (const [platform, ports] of Object.entries(PORT_ALLOCATIONS)) {
      console.error(`\n${platform}:`);
      for (const [service, port] of Object.entries(ports)) {
        console.error(`  - ${service}: ${port}`);
      }
    }
    process.exit(1);
  }

  console.log('🔍 Checking port availability...\n');

  const results = await Promise.all(portsToCheck.map(checkPort));

  let hasConflicts = false;

  for (const result of results) {
    const platformInfo = findPlatformForPort(result.port);
    const platformLabel = platformInfo
      ? ` (${platformInfo.platform} - ${platformInfo.service})`
      : '';

    if (result.available) {
      console.log(`✅ Port ${result.port}${platformLabel} is available`);
    } else {
      console.error(`❌ Port ${result.port}${platformLabel} is already in use`);
      hasConflicts = true;
    }
  }

  console.log('');

  if (hasConflicts) {
    console.error('⚠️  Port conflicts detected!');
    console.error('\nTo find what is using the port:');
    console.error('  Windows: netstat -ano | findstr :<PORT>');
    console.error('  Linux/Mac: lsof -i :<PORT>');
    console.error('\nTo kill a process:');
    console.error('  Windows: taskkill /PID <PID> /F');
    console.error('  Linux/Mac: kill -9 <PID>');
    console.error('\n📋 All Platform Port Allocations:');
    for (const [platform, ports] of Object.entries(PORT_ALLOCATIONS)) {
      console.error(`\n${platform}:`);
      for (const [service, port] of Object.entries(ports)) {
        console.error(`  - ${service}: ${port}`);
      }
    }
    process.exit(1);
  } else {
    console.log('✅ All ports are available. Safe to start servers!');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Error checking ports:', err);
  process.exit(1);
});
