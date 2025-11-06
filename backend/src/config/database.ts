/**
 * Database Configuration
 *
 * Singleton Prisma Client to prevent multiple instances and connection pool exhaustion
 */

import { PrismaClient } from '@prisma/client';

declare global {
  // Allow global `var` declarations
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __prismaProd: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __prismaShutdownRegistered: boolean | undefined;
}

/**
 * Get singleton Prisma Client instance
 * In development, prevent multiple instances during hot reload
 */
function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === 'production') {
    if (!global.__prismaProd) {
      global.__prismaProd = new PrismaClient({
        log: ['error', 'warn'],
      });
    }
    return global.__prismaProd;
  } else {
    // In development, use a global variable to preserve the client across hot reloads
    if (!global.__prisma) {
      global.__prisma = new PrismaClient({
        log: ['error', 'warn'],
      });
    }
    return global.__prisma;
  }
}

// Export the singleton instance
export const prisma = getPrismaClient();

// Disconnect on shutdown
if (!global.__prismaShutdownRegistered) {
  global.__prismaShutdownRegistered = true;
  process.on('beforeExit', async () => {
    const client = process.env.NODE_ENV === 'production' ? global.__prismaProd : global.__prisma;
    if (client) {
      await client.$disconnect();
    }
  });
}
