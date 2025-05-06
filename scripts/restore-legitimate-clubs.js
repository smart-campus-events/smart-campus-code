/**
 * Script to restore legitimate clubs that were incorrectly deleted
 * by the text fragment removal scripts
 */

const { PrismaClient, ContentStatus } = require('@prisma/client');
const prisma = new PrismaClient();

// List of legitimate clubs to restore
const clubsToRestore = [
  {
    name: "SPARK (Service Passion Advocacy Responsibility Kindness)",
    purpose: "SPARK promotes service, passion, advocacy, responsibility, and kindness among students at the University of Hawaii at Manoa. The organization aims to provide leadership opportunities and foster community engagement.",
    categoryDescription: "Service"
  },
  {
    name: "ROC",
    purpose: "ROC (Registered Organization of Coders) is dedicated to building a community of student programmers, sharing knowledge, and participating in coding projects and competitions.",
    categoryDescription: "Academic/Professional"
  },
  {
    name: "MRUH",
    purpose: "MRUH is focused on promoting awareness of rural health issues and opportunities, particularly related to medical practice in underserved areas of Hawaii.",
    categoryDescription: "Academic/Professional"
  },
  {
    name: "Young Skal",
    purpose: "Young Skal is a student chapter of Skal International, focused on developing future leaders in the tourism and hospitality industries through networking and professional development.",
    categoryDescription: "Academic/Professional"
  },
  {
    name: "The Hawaii Pickleball Club at University of Hawaii Manoa",
    purpose: "The Hawaii Pickleball Club at University of Hawaii Manoa brings students together through the sport of pickleball. We aim to create a welcoming environment where everyone can learn and enjoy this fast-growing sport.",
    categoryDescription: "Leisure/Recreational"
  }
];

// Helper function to find or create a category
async function findOrCreateCategory(categoryName) {
  if (!categoryName) return null;
  
  // Normalize the category name
  const normalizedName = categoryName.trim();
  if (!normalizedName) return null;
  
  // Try to find an exact match
  let category = await prisma.category.findFirst({
    where: {
      name: {
        equals: normalizedName,
        mode: 'insensitive',
      },
    },
  });
  
  // If no category found, create it
  if (!category) {
    category = await prisma.category.create({
      data: { name: normalizedName },
    });
    console.log(`Created new category: "${normalizedName}"`);
  }
  
  return category;
}

async function restoreClubs() {
  console.log('Starting to restore legitimate clubs...');
  
  let restoredCount = 0;
  let existingCount = 0;
  
  for (const clubData of clubsToRestore) {
    try {
      // Check if the club already exists
      const existingClub = await prisma.club.findUnique({
        where: { name: clubData.name },
      });
      
      if (existingClub) {
        console.log(`Club "${clubData.name}" already exists, skipping`);
        existingCount++;
        continue;
      }
      
      // Find or create the category
      const category = await findOrCreateCategory(clubData.categoryDescription);
      
      // Create the club
      const club = await prisma.club.create({
        data: {
          name: clubData.name,
          purpose: clubData.purpose,
          categoryDescription: clubData.categoryDescription,
          status: ContentStatus.APPROVED,
        },
      });
      
      // Create category association
      if (category) {
        await prisma.clubCategory.create({
          data: {
            clubId: club.id,
            categoryId: category.id,
          },
        });
      }
      
      console.log(`Restored club: "${clubData.name}"`);
      restoredCount++;
    } catch (error) {
      console.error(`Error restoring club "${clubData.name}":`, error.message);
    }
  }
  
  console.log(`\nRestoration complete. Restored ${restoredCount} clubs.`);
  console.log(`${existingCount} clubs were already in the database.`);
}

// Run the function
restoreClubs()
  .catch(error => {
    console.error('Error during club restoration:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 