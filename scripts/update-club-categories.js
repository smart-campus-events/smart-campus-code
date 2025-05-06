/**
 * Script to update club categories by reassociating clubs from old to new categories
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Category mappings (old category name -> new category name)
const categoryMappings = {
  'Sport/Leisure': 'Leisure/Recreational'
};

async function updateClubCategories() {
  console.log('Starting club category updates...');
  
  // Get all categories
  const allCategories = await prisma.category.findMany();
  console.log(`Found ${allCategories.length} categories in the database`);
  
  // Process each mapping
  for (const [oldName, newName] of Object.entries(categoryMappings)) {
    // Find the old category
    const oldCategory = allCategories.find(c => c.name === oldName);
    if (!oldCategory) {
      console.log(`Old category "${oldName}" not found, skipping`);
      continue;
    }
    
    // Find or create the new category
    let newCategory = allCategories.find(c => c.name === newName);
    if (!newCategory) {
      try {
        newCategory = await prisma.category.create({
          data: { name: newName }
        });
        console.log(`Created new category: "${newName}"`);
      } catch (error) {
        console.error(`Error creating category "${newName}":`, error.message);
        continue;
      }
    }
    
    // Find all clubs with the old category
    const associations = await prisma.clubCategory.findMany({
      where: { categoryId: oldCategory.id },
      include: { club: true }
    });
    
    console.log(`Found ${associations.length} clubs with category "${oldName}"`);
    
    // Move clubs to the new category
    for (const assoc of associations) {
      try {
        // Check if club already has the new category
        const existingAssoc = await prisma.clubCategory.findUnique({
          where: {
            clubId_categoryId: {
              clubId: assoc.clubId,
              categoryId: newCategory.id
            }
          }
        });
        
        if (!existingAssoc) {
          // Create new association
          await prisma.clubCategory.create({
            data: {
              clubId: assoc.clubId,
              categoryId: newCategory.id
            }
          });
          
          // Also update the club's categoryDescription
          await prisma.club.update({
            where: { id: assoc.clubId },
            data: { categoryDescription: newName }
          });
          
          console.log(`Moved club "${assoc.club.name}" from "${oldName}" to "${newName}"`);
        }
        
        // Delete old association
        await prisma.clubCategory.delete({
          where: {
            clubId_categoryId: {
              clubId: assoc.clubId,
              categoryId: oldCategory.id
            }
          }
        });
      } catch (error) {
        console.error(`Error moving club "${assoc.club.name}":`, error.message);
      }
    }
    
    // Try to delete the old category if it's empty
    try {
      // Check if category is empty
      const remainingAssocs = await prisma.clubCategory.findMany({
        where: { categoryId: oldCategory.id }
      });
      
      if (remainingAssocs.length === 0) {
        await prisma.category.delete({
          where: { id: oldCategory.id }
        });
        console.log(`Deleted old empty category "${oldName}"`);
      } else {
        console.log(`Old category "${oldName}" still has ${remainingAssocs.length} associated clubs, not deleting`);
      }
    } catch (error) {
      console.error(`Error deleting old category "${oldName}":`, error.message);
    }
  }
  
  // Print final category counts
  const finalCategories = await prisma.category.findMany({
    include: {
      _count: {
        select: { clubs: true }
      }
    }
  });
  
  console.log('\n--- Final Category Counts ---');
  finalCategories.sort((a, b) => b._count.clubs - a._count.clubs);
  for (const category of finalCategories) {
    console.log(`${category.name}: ${category._count.clubs} clubs`);
  }
}

// Run the function
updateClubCategories()
  .catch(error => {
    console.error('Error during category updates:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 