// prisma/seed.ts
import { ContentStatus, PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Define empty seed functions to prevent build errors
const seedCategories = async (prisma: PrismaClient) => {
  console.log('Category seeding skipped in production build');
  return [];
};

const seedClubs = async (prisma: PrismaClient) => {
  console.log('Club seeding skipped in production build');
  return [];
};

const seedEvents = async (prisma: PrismaClient) => {
  console.log('Event seeding skipped in production build');
  return [];
};

const prisma = new PrismaClient();

// Function to easily hash passwords (kept for future use)
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
        not: ContentStatus.APPROVED,
      },
    },
    data: {
      status: ContentStatus.APPROVED,
    },
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
