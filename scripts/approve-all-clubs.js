// approve-all-clubs.js
// Simple script to set all clubs to APPROVED status

import { PrismaClient, ContentStatus } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Updating all clubs to APPROVED status...');

  try {
    // Update all clubs
    const updateResult = await prisma.club.updateMany({
      where: {
        status: {
          not: ContentStatus.APPROVED
        }
      },
      data: {
        status: ContentStatus.APPROVED
      }
    });

    console.log(`Updated ${updateResult.count} club(s) to APPROVED status`);

    // Count the total clubs
    const total = await prisma.club.count();
    console.log(`Total clubs in database: ${total}`);

    // List all clubs
    const clubs = await prisma.club.findMany({
      select: {
        id: true,
        name: true,
        status: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log('\nClubs in the database:');
    clubs.forEach((club, index) => {
      console.log(`${index + 1}. ${club.name} (${club.status})`);
    });

  } catch (error) {
    console.error('Error updating clubs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Unhandled error:', e);
    process.exit(1);
  }); 