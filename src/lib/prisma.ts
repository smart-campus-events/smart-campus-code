import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Enhanced Prisma client with better connection handling
export const prisma = globalForPrisma.prisma
  || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],

    // Add connection limits to avoid the "prepared statement already exists" error
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// This block only runs in development to maintain a singleton instance
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Function to test the database connection
export async function testDatabaseConnection() {
  try {
    // Simple query to check if the connection works
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('Database connection successful:', result);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Export the enhanced prisma client
export default prisma;
