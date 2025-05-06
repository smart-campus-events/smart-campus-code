// prisma/seed.ts
import { Category, ContentStatus, PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { seedCategories } from './seed-data/categories';
import { seedClubs } from './seed-data/clubs';
import { seedEvents } from './seed-data/events';

const prisma = new PrismaClient();

// Function to easily hash passwords
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function main() {
  console.log(`Start seeding database...`);

  // Seed categories first (clubs and events depend on them)
  await seedCategories(prisma);
  console.log('Categories seeded!');

  // Seed clubs
  await seedClubs(prisma);
  console.log('Clubs seeded!');

  // Seed events
  await seedEvents(prisma);
  console.log('Events seeded!');

  // Update all existing clubs to APPROVED status
  const updatedClubs = await prisma.club.updateMany({
    where: {
      status: {
        not: ContentStatus.APPROVED
      }
    },
    data: {
      status: ContentStatus.APPROVED
    }
  });
  
  console.log(`Updated ${updatedClubs.count} clubs to APPROVED status`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
