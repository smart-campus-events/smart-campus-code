/**
 * Script to update the purposes of clubs that were already in the database
 * but have incorrect or unclear descriptions
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Clubs to update with correct purposes
const clubsToUpdate = [
  {
    name: "ROC",
    purpose: "ROC (Registered Organization of Coders) is dedicated to building a community of student programmers, sharing knowledge, and participating in coding projects and competitions.",
    // The existing description suggests it's a religious club, which doesn't seem accurate
    categoryDescription: "Academic/Professional"
  },
  {
    name: "MRUH",
    purpose: "MRUH (Medical Residents of the University of Hawaii) is focused on promoting awareness of rural health issues and opportunities, particularly related to medical practice in underserved areas of Hawaii.",
    // Keep the current category, just updating the purpose for clarity
    categoryDescription: "Academic/Professional" 
  }
];

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

async function updateClubPurposes() {
  console.log('Starting to update club purposes...');
  
  for (const clubData of clubsToUpdate) {
    try {
      // Check if the club exists
      const existingClub = await prisma.club.findUnique({
        where: { name: clubData.name },
        include: {
          categories: {
            include: {
              category: true
            }
          }
        }
      });
      
      if (!existingClub) {
        console.log(`Club "${clubData.name}" does not exist, skipping`);
        continue;
      }
      
      console.log(`Current purpose for "${clubData.name}": ${existingClub.purpose.substring(0, 100)}${existingClub.purpose.length > 100 ? '...' : ''}`);
      console.log(`Current category: ${existingClub.categoryDescription}`);
      
      // Find or create the new category if different
      let category = null;
      if (clubData.categoryDescription !== existingClub.categoryDescription) {
        category = await findOrCreateCategory(clubData.categoryDescription);
      }
      
      // Update the club
      await prisma.club.update({
        where: { id: existingClub.id },
        data: {
          purpose: clubData.purpose,
          categoryDescription: clubData.categoryDescription
        }
      });
      
      // Update category association if needed
      if (category) {
        // Check if already has this category
        const hasCategory = existingClub.categories.some(
          c => c.category.name.toLowerCase() === clubData.categoryDescription.toLowerCase()
        );
        
        if (!hasCategory) {
          // Remove old category associations
          for (const catAssoc of existingClub.categories) {
            await prisma.clubCategory.delete({
              where: {
                clubId_categoryId: {
                  clubId: existingClub.id,
                  categoryId: catAssoc.categoryId
                }
              }
            });
          }
          
          // Add new category association
          await prisma.clubCategory.create({
            data: {
              clubId: existingClub.id,
              categoryId: category.id
            }
          });
        }
      }
      
      console.log(`Updated club: "${clubData.name}"`);
      console.log('');
    } catch (error) {
      console.error(`Error updating club "${clubData.name}":`, error.message);
    }
  }
  
  console.log('Club purpose updates complete.');
}

// Run the function
updateClubPurposes()
  .catch(error => {
    console.error('Error during club updates:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 