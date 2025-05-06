const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

/**
 * Script to standardize club categories to match only those in the "Type" column of the spreadsheet
 * 
 * This ensures that the filter only shows legitimate categories from the source data.
 */

// Initialize Prisma client
const prisma = new PrismaClient();

// Google Sheet information from environment variables
const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1vK_ixq3a86uXjHXy9oNnyYHwAvyU9smNPKuJU6OYd-Q';
const SHEET_GID = process.env.GOOGLE_SHEET_GID || '828154192';

// Known standard categories based on spreadsheet
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

// Map for normalizing categories (mapping variations to standard names)
const CATEGORY_MAPPING = {
  'Sport/Leisure': 'Sport/Leisure',
  'Leisure/Sport': 'Sport/Leisure',
  'Sports': 'Sport/Leisure',
  'Sports/Leisure': 'Sport/Leisure',
  'Sports/Recreation': 'Sport/Leisure',
  
  'Academic': 'Academic/Professional',
  'Academic/Profesional': 'Academic/Professional',
  'Professional': 'Academic/Professional',
  
  'Cultural': 'Ethnic/Cultural',
  'Ethnic': 'Ethnic/Cultural',
  
  'Religious': 'Religious/Spiritual',
  'Spiritual': 'Religious/Spiritual',
  'Religious/Spirtual': 'Religious/Spiritual', // Fixing typo
  'Religiuos': 'Religious/Spiritual',
  
  'Service/Volunteer': 'Service',
  'Community Service': 'Service',
  'Volunteering': 'Service',
  
  'Fraternity': 'Fraternity/Sorority',
  'Sorority': 'Fraternity/Sorority',
  'Greek Life': 'Fraternity/Sorority',
  
  'Student Government': 'Student Affairs',
  'Student Organization': 'Student Affairs',
  
  'Honor Society': 'Honorary Society',
  'Honors': 'Honorary Society',
  
  'Political/Advocacy': 'Political',
  'Advocacy': 'Political',
  
  // Default case for anything not matching
  'Other': 'Academic/Professional'
};

/**
 * Find or create a category
 */
async function findOrCreateCategory(name) {
  if (!name) return null;
  
  // Check if this is a standard category
  const standardName = CATEGORY_MAPPING[name] || name;
  
  // First try to find the category
  let category = await prisma.category.findFirst({
    where: {
      name: standardName,
    },
  });

  // If not found, create it
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: standardName,
      },
    });
    console.log(`Created new category: "${standardName}"`);
  }

  return category;
}

/**
 * Get all unique categories from the spreadsheet
 */
async function getSpreadsheetCategories() {
  try {
    // Fetch the data from Google Sheets
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
    console.log(`Fetching data from: ${url}`);
    
    const response = await axios.get(url);
    const lines = response.data.split('\n');
    console.log(`Found ${lines.length} lines in the CSV`);

    // Find the header row
    let headerRow = null;
    let headerRowIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Name of Organization') && lines[i].includes('Type')) {
        headerRow = lines[i];
        headerRowIndex = i;
        console.log(`Found header row at line ${i}`);
        break;
      }
    }

    if (!headerRow) {
      throw new Error('Could not find header row in the CSV');
    }

    // Parse CSV to get the Type column index
    const headers = headerRow.split(',').map(h => h.trim().replace(/"/g, ''));
    const typeColIndex = headers.findIndex(h => h.includes('Organization Type') || h === 'Type');

    if (typeColIndex === -1) {
      throw new Error('Could not find Type column in the CSV');
    }

    // Extract all unique categories from the Type column
    const uniqueCategories = new Set();
    for (let i = headerRowIndex + 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      if (row.length > typeColIndex) {
        const categoryValue = row[typeColIndex].trim().replace(/"/g, '');
        if (categoryValue && categoryValue !== 'Type') {
          // Only add category if it's one of our standard categories or can be mapped to one
          if (STANDARD_CATEGORIES.includes(categoryValue) || CATEGORY_MAPPING[categoryValue]) {
            uniqueCategories.add(categoryValue);
          }
        }
      }
    }

    return Array.from(uniqueCategories);
  } catch (error) {
    console.error('Error getting spreadsheet categories:', error);
    return STANDARD_CATEGORIES; // Fall back to standard categories if error
  }
}

/**
 * Standardize all club categories
 */
async function standardizeClubCategories() {
  try {
    console.log('Starting club category standardization...');
    
    // Get categories from spreadsheet
    const spreadsheetCategories = await getSpreadsheetCategories();
    console.log('\nCategories found in spreadsheet:');
    spreadsheetCategories.forEach(cat => console.log(`- ${cat}`));
    
    // Create a set of allowed categories (standard + from spreadsheet)
    const allowedCategories = new Set([...STANDARD_CATEGORIES, ...spreadsheetCategories]);
    console.log('\nAllowed categories after combining standard and spreadsheet:');
    Array.from(allowedCategories).sort().forEach(cat => console.log(`- ${cat}`));
    
    // Get all existing categories
    const existingCategories = await prisma.category.findMany();
    console.log(`\nFound ${existingCategories.length} existing categories in database`);
    
    // Prepare standard categories in the database
    console.log('\nEnsuring all standard categories exist in database:');
    for (const categoryName of allowedCategories) {
      await findOrCreateCategory(categoryName);
    }
    
    // Get all clubs with their categories
    const clubs = await prisma.club.findMany({
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    console.log(`\nFound ${clubs.length} clubs to process`);

    // Track stats
    let clubsUpdated = 0;
    let categoriesRemapped = 0;
    
    // Process each club
    for (const club of clubs) {
      let clubUpdated = false;
      const categoriesToRemove = [];
      const categoriesToAdd = [];
      
      // Process each club's categories
      for (const clubCategory of club.categories) {
        const currentCategory = clubCategory.category.name;
        
        // If the category is not in our allowed list or needs mapping
        if (!allowedCategories.has(currentCategory) || CATEGORY_MAPPING[currentCategory]) {
          // Get the standardized category name
          const standardName = CATEGORY_MAPPING[currentCategory] || 'Academic/Professional';
          
          if (standardName !== currentCategory) {
            console.log(`Remapping category for club "${club.name}": ${currentCategory} -> ${standardName}`);
            
            // Find or create the standard category
            const standardCategory = await findOrCreateCategory(standardName);
            
            // Check if the club already has this standard category
            const hasStandardCategory = club.categories.some(
              cc => cc.category.name === standardName
            );
            
            if (!hasStandardCategory) {
              // Add category to our list to add
              categoriesToAdd.push({
                categoryId: standardCategory.id,
                clubId: club.id
              });
            }
            
            // Add category to our list to remove
            categoriesToRemove.push({
              categoryId: clubCategory.category.id,
              clubId: club.id
            });
            
            categoriesRemapped++;
            clubUpdated = true;
          }
        }
      }
      
      // Process removals
      for (const item of categoriesToRemove) {
        await prisma.clubCategory.deleteMany({
          where: {
            clubId: item.clubId,
            categoryId: item.categoryId
          }
        });
      }
      
      // Process additions
      for (const item of categoriesToAdd) {
        await prisma.clubCategory.create({
          data: item
        });
      }
      
      // If the club has no categories, add a default one
      if (club.categories.length === 0 || (categoriesToRemove.length > 0 && categoriesToRemove.length === club.categories.length && categoriesToAdd.length === 0)) {
        console.log(`Adding default category for club with no categories: "${club.name}"`);
        const defaultCategory = await findOrCreateCategory('Academic/Professional');
        
        await prisma.clubCategory.create({
          data: {
            clubId: club.id,
            categoryId: defaultCategory.id
          }
        });
        
        clubUpdated = true;
      }
      
      if (clubUpdated) {
        clubsUpdated++;
      }
    }
    
    // Find and remove unused categories
    const categoriesInUse = await prisma.category.findMany({
      where: {
        clubs: {
          some: {}
        }
      }
    });
    
    const categoriesNotInUse = await prisma.category.findMany({
      where: {
        clubs: {
          none: {}
        }
      }
    });
    
    console.log(`\nFound ${categoriesNotInUse.length} unused categories`);
    
    if (categoriesNotInUse.length > 0) {
      console.log('Unused categories:');
      for (const category of categoriesNotInUse) {
        console.log(`- ${category.name} (ID: ${category.id})`);
      }
      
      // Uncomment this to delete unused categories
      // for (const category of categoriesNotInUse) {
      //   await prisma.category.delete({
      //     where: { id: category.id }
      //   });
      //   console.log(`Deleted unused category: ${category.name}`);
      // }
    }
    
    console.log('\nCategory standardization complete:');
    console.log(`- ${clubs.length} clubs processed`);
    console.log(`- ${clubsUpdated} clubs updated`);
    console.log(`- ${categoriesRemapped} categories remapped`);
    console.log(`- ${categoriesInUse.length} categories in use`);
    console.log(`- ${categoriesNotInUse.length} unused categories`);
    
  } catch (error) {
    console.error('Error standardizing categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the standardization
standardizeClubCategories(); 