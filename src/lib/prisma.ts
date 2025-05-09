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
