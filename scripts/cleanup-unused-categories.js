const { PrismaClient } = require('@prisma/client');

/**
 * Script to clean up unused categories from the database
 * Only keeps standard categories that are actually used by clubs
 */

// Initialize Prisma client
const prisma = new PrismaClient();

// Standard categories we want to keep (based on spreadsheet and standardization)
const STANDARD_CATEGORIES = [
  'Academic/Professional',
  'Ethnic/Cultural',
  'Fraternity/Sorority',
  'Honorary Society',
  'Leisure/Recreational',
  'Political',
  'Religious/Spiritual',
  'Service',
  'Sport/Leisure',
  'Student Affairs'
];

// Main function to clean up categories
async function cleanupCategories() {
  try {
    console.log('Starting category cleanup...');

    // Find all categories
    const allCategories = await prisma.category.findMany();
    console.log(`Found ${allCategories.length} total categories in the database`);

    // Find categories that are in use (have associated clubs)
    const usedCategories = await prisma.category.findMany({
      where: {
        clubs: {
          some: {} // Has at least one club
        }
      },
      include: {
        _count: {
          select: {
            clubs: true
          }
        }
      }
    });
    
    console.log(`Found ${usedCategories.length} categories in use`);
    
    // Find unused categories
    const unusedCategories = await prisma.category.findMany({
      where: {
        clubs: {
          none: {} // Has no clubs
        }
      }
    });
    
    console.log(`Found ${unusedCategories.length} unused categories`);
    
    // Delete unused categories
    if (unusedCategories.length > 0) {
      console.log('Deleting unused categories:');
      for (const category of unusedCategories) {
        console.log(`- "${category.name}" (ID: ${category.id})`);
        await prisma.category.delete({
          where: { id: category.id }
        });
      }
      console.log(`Deleted ${unusedCategories.length} unused categories`);
    }
    
    // Find non-standard categories that are in use
    const nonStandardUsedCategories = usedCategories.filter(
      cat => !STANDARD_CATEGORIES.includes(cat.name)
    );
    
    if (nonStandardUsedCategories.length > 0) {
      console.log('\nFound non-standard categories that are in use:');
      for (const category of nonStandardUsedCategories) {
        console.log(`- "${category.name}" (Used by ${category._count.clubs} clubs)`);
      }
      
      // Optionally, you could remap these non-standard categories to standard ones
      console.log('\nThese categories should be remapped using the standardize-club-categories.js script');
    }
    
    // Log current category usage
    console.log('\nCurrent category usage:');
    for (const category of usedCategories.sort((a, b) => b._count.clubs - a._count.clubs)) {
      console.log(`- "${category.name}": ${category._count.clubs} clubs`);
    }
    
    console.log('\nCategory cleanup complete');
  } catch (error) {
    console.error('Error cleaning up categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupCategories(); 