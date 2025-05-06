/**
 * Script to clean up and normalize club categories by merging similar ones
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupCategories() {
  console.log('Starting category cleanup...');
  
  // Define category mappings (incorrectly named → correct name)
  const categoryMappings = {
    'Religiuos': 'Religious/Spiritual',
    'Religious/Spirtual': 'Religious/Spiritual',
    'Spiritual/Religious': 'Religious/Spiritual',
    'Leisure/Sport': 'Sport/Leisure',
    'make friends': 'Social',
    'sports': 'Sport/Leisure',
    'faculty': 'Academic/Professional',
    'faculty and staff': 'Academic/Professional',
    'regulations': 'Academic/Professional',
    'sincerity essential': 'Service',
  };
  
  // Categories that are really just fragments of descriptions and should be deleted
  const categoriesToDelete = [
    'ACS has evolved into much more. The national organization aims to tackle the systemic and pre',
    'and demonstrate the immense value of neurodiversity. We believe these friendships enrich the',
    'and global community through service',
    'we do have the ability to deny said request if output is not achievable. The main objective i'
  ];
  
  // First, find all problematic categories
  const allCategories = await prisma.category.findMany();
  console.log(`Found ${allCategories.length} total categories`);
  
  // Process mappings (merge categories)
  for (const [oldName, newName] of Object.entries(categoryMappings)) {
    const oldCategory = allCategories.find(c => c.name === oldName);
    if (!oldCategory) {
      console.log(`Category "${oldName}" not found, skipping`);
      continue;
    }
    
    // Find or create the target category
    let targetCategory = allCategories.find(c => c.name === newName);
    if (!targetCategory) {
      targetCategory = await prisma.category.create({
        data: { name: newName }
      });
      console.log(`Created new category: ${newName}`);
    }
    
    // Find all club-category associations for the old category
    const associations = await prisma.clubCategory.findMany({
      where: { categoryId: oldCategory.id },
      include: { club: true }
    });
    
    console.log(`Found ${associations.length} clubs with category "${oldName}"`);
    
    // Re-associate clubs with the correct category
    for (const assoc of associations) {
      // Check if club already has the target category
      const existingAssoc = await prisma.clubCategory.findUnique({
        where: {
          clubId_categoryId: {
            clubId: assoc.clubId,
            categoryId: targetCategory.id
          }
        }
      });
      
      if (!existingAssoc) {
        // Create new association with target category
        await prisma.clubCategory.create({
          data: {
            clubId: assoc.clubId,
            categoryId: targetCategory.id
          }
        });
        console.log(`Re-associated club "${assoc.club.name}" with category "${newName}"`);
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
    }
    
    // Delete the old category
    await prisma.category.delete({
      where: { id: oldCategory.id }
    });
    console.log(`Deleted category "${oldName}"`);
  }
  
  // Handle categories to delete
  for (const categoryName of categoriesToDelete) {
    // Find the category by name (use a partial match since some are very long)
    const category = allCategories.find(c => c.name.startsWith(categoryName.substring(0, 40)));
    if (!category) {
      console.log(`Category starting with "${categoryName.substring(0, 40)}" not found, skipping`);
      continue;
    }
    
    // Find all clubs with this category
    const associations = await prisma.clubCategory.findMany({
      where: { categoryId: category.id },
      include: { club: true }
    });
    
    console.log(`Found ${associations.length} clubs with category starting with "${categoryName.substring(0, 40)}"`);
    
    // Associate them with Academic/Professional instead
    const academicCategory = allCategories.find(c => c.name === 'Academic/Professional');
    if (!academicCategory) {
      console.log('Academic/Professional category not found, skipping');
      continue;
    }
    
    for (const assoc of associations) {
      // Check if club already has Academic/Professional
      const existingAssoc = await prisma.clubCategory.findUnique({
        where: {
          clubId_categoryId: {
            clubId: assoc.clubId,
            categoryId: academicCategory.id
          }
        }
      });
      
      if (!existingAssoc) {
        // Create new association with Academic/Professional
        await prisma.clubCategory.create({
          data: {
            clubId: assoc.clubId,
            categoryId: academicCategory.id
          }
        });
        console.log(`Re-associated club "${assoc.club.name}" with category "Academic/Professional"`);
      }
      
      // Delete old association
      await prisma.clubCategory.delete({
        where: {
          clubId_categoryId: {
            clubId: assoc.clubId,
            categoryId: category.id
          }
        }
      });
    }
    
    // Delete the category
    await prisma.category.delete({
      where: { id: category.id }
    });
    console.log(`Deleted category starting with "${categoryName.substring(0, 40)}"`);
  }
  
  // Clean up any clubs that have description text as their category name
  const suspiciousCategories = await prisma.category.findMany({
    where: {
      name: {
        contains: ' '
      }
    }
  });
  
  for (const category of suspiciousCategories) {
    // Skip the known good categories with spaces
    if (['Academic/Professional', 'Sport/Leisure', 'Leisure/Recreational', 'Religious/Spiritual', 'Ethnic/Cultural'].includes(category.name)) {
      continue;
    }
    
    if (category.name.length > 30) {
      console.log(`Found suspicious category: "${category.name.substring(0, 30)}..."`);
      
      // Find Academic/Professional category
      const academicCategory = allCategories.find(c => c.name === 'Academic/Professional');
      if (!academicCategory) continue;
      
      // Find all club-category associations for this category
      const associations = await prisma.clubCategory.findMany({
        where: { categoryId: category.id },
        include: { club: true }
      });
      
      // Re-associate clubs
      for (const assoc of associations) {
        // Check if club already has Academic/Professional
        const existingAssoc = await prisma.clubCategory.findUnique({
          where: {
            clubId_categoryId: {
              clubId: assoc.clubId,
              categoryId: academicCategory.id
            }
          }
        });
        
        if (!existingAssoc) {
          // Create new association with Academic/Professional
          await prisma.clubCategory.create({
            data: {
              clubId: assoc.clubId,
              categoryId: academicCategory.id
            }
          });
          console.log(`Re-associated club "${assoc.club.name}" with category "Academic/Professional"`);
        }
        
        // Delete old association
        await prisma.clubCategory.delete({
          where: {
            clubId_categoryId: {
              clubId: assoc.clubId,
              categoryId: category.id
            }
          }
        });
      }
      
      // Delete the category
      await prisma.category.delete({
        where: { id: category.id }
      });
      console.log(`Deleted suspicious category: "${category.name.substring(0, 30)}..."`);
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
  for (const category of finalCategories) {
    console.log(`${category.name}: ${category._count.clubs} clubs`);
  }
}

// Run the function
cleanupCategories()
  .catch(error => {
    console.error('Error during category cleanup:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 