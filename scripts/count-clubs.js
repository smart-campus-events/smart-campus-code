// Script to list all clubs in the database alphabetically
const { PrismaClient } = require('@prisma/client');

/**
 * Simple script to count the total number of clubs in the database
 */
async function countClubs() {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.club.count();
    console.log(`Total clubs in database: ${count}`);
  } catch (error) {
    console.error('Error counting clubs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

countClubs();