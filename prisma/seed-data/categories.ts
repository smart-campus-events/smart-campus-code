import { PrismaClient } from '@prisma/client';

// Define the category data
export const categoryData = [
  { name: 'Academic' },
  { name: 'Arts & Music' },
  { name: 'Community Service' },
  { name: 'Cultural' },
  { name: 'Environmental' },
  { name: 'Gaming' },
  { name: 'Health & Wellness' },
  { name: 'Hobbies' },
  { name: 'Outdoors & Recreation' },
  { name: 'Political' },
  { name: 'Professional Development' },
  { name: 'Religious & Spiritual' },
  { name: 'Social' },
  { name: 'Sports' },
  { name: 'Technology' },
];

export async function seedCategories(prisma: PrismaClient) {
  console.log('Seeding categories...');
  
  for (const category of categoryData) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {}, // No updates if it exists
      create: category,
    });
    console.log(`Upserted category: ${category.name}`);
  }
  
  console.log(`Seeded ${categoryData.length} categories`);
} 