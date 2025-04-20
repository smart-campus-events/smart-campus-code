// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Example: Create an Interest if it doesn't exist
  const interest = await prisma.interest.upsert({
    where: { name: 'Sample Interest' },
    update: {},
    create: {
      name: 'Sample Interest',
    },
  });
  console.log(`Created or found interest with id: ${interest.id}`);

  // Add more seeding logic here (create users, clubs, events, etc.)

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
