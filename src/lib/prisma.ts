/* eslint-disable import/prefer-default-export */

import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

// Explicitly type globalThis for prisma
declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  console.log('[DEBUG] prisma.ts: Creating new PrismaClient instance'); // For debugging instantiation
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
};

const globalPrisma = globalThis.prisma ?? prismaClientSingleton();

export const prisma = globalPrisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = globalPrisma;
}

/**
 * Tests the database connection by attempting a simple query.
 * @returns {Promise<boolean>} True if the connection is successful, false otherwise.
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    // Perform a simple query to check the connection, e.g., count users or a raw query.
    // Using `$queryRaw` for a minimal query.
    await prisma.$queryRaw`SELECT 1`;
    console.log('[DEBUG] prisma.ts: Database connection test successful.');
    return true;
  } catch (error) {
    console.error('[DEBUG] prisma.ts: Database connection test failed:', error);
    return false;
  }
}
