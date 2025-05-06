/**
 * Script to verify and fix club category types to match the spreadsheet's Type column
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Standard category names based on the UH Manoa RIOs Type column
const standardCategories = {
  'Academic/Professional': 'Academic/Professional',
  'Ethnic/Cultural': 'Ethnic/Cultural',
  'Fraternity/Sorority': 'Fraternity/Sorority',
  'Honorary Society': 'Honorary Society',
  'Political': 'Political',
  'Religious/Spiritual': 'Religious/Spiritual',
  'Service': 'Service',
  'Recreational': 'Leisure/Recreational',
  'Leisure/Recreational': 'Leisure/Recreational',
  'Sport/Leisure': 'Leisure/Recreational',
  'Student Affairs': 'Student Affairs',
  'Social': 'Social'
};

// Fix category names to match the standard naming system
async function fixCategoryTypes() {
  console.log('Starting category type standardization...');

  // Get all categories
  const categories = await prisma.category.findMany();
  console.log(`Found ${categories.length} categories in the database`);

  // Normalize category names
  for (const [originalName, standardName] of Object.entries(standardCategories)) {
    // Find category with this name 
    const category = categories.find(c => c.name === originalName);
    if (!category) {
      console.log(`Category "${originalName}" not found, skipping`);
      continue;
    }

    // If the category name is already standardized, skip
    if (category.name === standardName) {
      console.log(`Category "${category.name}" is already using the standard name`);
      continue;
    }

    // Update the category name
    try {
      await prisma.category.update({
        where: { id: category.id },
        data: { name: standardName }
      });
      console.log(`Updated category "${originalName}" -> "${standardName}"`);
    } catch (error) {
      console.error(`Error updating category "${originalName}":`, error.message);
    }
  }

  // Now ensure categoryDescription field in clubs matches category
  const clubs = await prisma.club.findMany({
    include: {
      categories: {
        include: {
          category: true
        }
      }
    }
  });
  
  console.log(`Found ${clubs.length} clubs to check for category description updates`);
  
  let updatedCount = 0;
  
  for (const club of clubs) {
    // If club has at least one category
    if (club.categories.length > 0) {
      const primaryCategory = club.categories[0].category;
      
      // If categoryDescription doesn't match the category name or needs standardization
      const newDescription = standardCategories[primaryCategory.name] || primaryCategory.name;
      
      if (club.categoryDescription !== newDescription) {
        try {
          await prisma.club.update({
            where: { id: club.id },
            data: { categoryDescription: newDescription }
          });
          console.log(`Updated club "${club.name}" category description: "${club.categoryDescription}" -> "${newDescription}"`);
          updatedCount++;
        } catch (error) {
          console.error(`Error updating club "${club.name}" category description:`, error.message);
        }
      }
    } else {
      console.log(`Club "${club.name}" has no categories assigned`);
    }
  }
  
  console.log(`\nCategory standardization complete.`);
  console.log(`Updated ${updatedCount} club category descriptions.`);
  
  // Print the final category counts
  const categoryCounts = await prisma.category.findMany({
    include: {
      _count: {
        select: { clubs: true }
      }
    }
  });
  
  console.log('\n--- Final Category Distribution ---');
  categoryCounts.sort((a, b) => b._count.clubs - a._count.clubs);
  for (const category of categoryCounts) {
    console.log(`${category.name}: ${category._count.clubs} clubs`);
  }
}

// Run the function
fixCategoryTypes()
  .catch(error => {
    console.error('Error during category type fixing:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 