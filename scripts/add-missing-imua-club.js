/**
 * Script to add the missing IMUA club
 */

const { PrismaClient, ContentStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMissingClub() {
  console.log('Adding missing IMUA club...');
  
  // Check if the club already exists with a slightly different name
  const existingClub = await prisma.club.findFirst({
    where: {
      name: {
        contains: 'IMUA',
        mode: 'insensitive',
      }
    },
    include: {
      categories: true
    }
  });
  
  if (existingClub) {
    console.log(`Found existing club with similar name: "${existingClub.name}"`);
    console.log(`Updating to the correct name...`);
    
    // Update the club with the correct name
    await prisma.club.update({
      where: { id: existingClub.id },
      data: {
        name: "Hawaii Society for Epistemic Innovation, Integrative Studies, and Transformative Research (IMUA)",
        categoryDescription: "Academic/Professional"
      }
    });
    
    console.log(`Updated club name successfully.`);
  } else {
    // Create the category if needed
    const category = await prisma.category.findFirst({
      where: {
        name: {
          equals: "Academic/Professional",
          mode: 'insensitive',
        },
      },
    });
    
    if (!category) {
      console.error('Could not find the Academic/Professional category.');
      return;
    }
    
    // Create the club
    const club = await prisma.club.create({
      data: {
        name: "Hawaii Society for Epistemic Innovation, Integrative Studies, and Transformative Research (IMUA)",
        purpose: "The Hawai'i Society for Epistemic Innovation, Integrative Studies, and Transformative Researchy (IMUA Labs) is a program of inquiry in a genuinely participatory action research mode to investigate the intellectual matrix of Hawaiʻi and understand what critical cognitive resources need to be cultivated and delivered through various public-education and social-learning vehicles to support a deep liberatory and systemic ecosocial transformation, consistent with a just sustainability transition in this day and age of complexity and change.",
        categoryDescription: "Academic/Professional",
        primaryContactName: "Travis Idol",
        contactEmail: "idol@hawaii.edu",
        status: ContentStatus.APPROVED,
      },
    });
    
    // Create category association
    await prisma.clubCategory.create({
      data: {
        clubId: club.id,
        categoryId: category.id,
      },
    });
    
    console.log(`Created new club: "Hawaii Society for Epistemic Innovation, Integrative Studies, and Transformative Research (IMUA)"`);
  }
  
  console.log('Done.');
}

// Run the function
addMissingClub()
  .catch(error => {
    console.error('Error:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 