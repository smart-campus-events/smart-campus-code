/**
 * Script to fetch club data from a published Google Sheet using direct HTTP request
 * No authentication needed for published sheets
 */

const { PrismaClient, ContentStatus } = require('@prisma/client');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Google Sheet ID from .env
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '1vK_ixq3a86uXjHXy9oNnyYHwAvyU9smNPKuJU6OYd-Q';
const SHEET_GID = process.env.GOOGLE_SHEET_GID || '828154192';

// URL to access published sheet in CSV format
const publishedSheetUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

// Helper function to find or create a category
async function findOrCreateCategory(categoryName) {
  if (!categoryName) return null;
  
  // Normalize the category name for better matching
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

async function fetchAndImportClubs() {
  console.log('Starting club import from published Google Sheet...');
  console.log(`Fetching data from: ${publishedSheetUrl}`);
  
  try {
    // Fetch the CSV data
    const response = await axios.get(publishedSheetUrl);
    const csvData = response.data;
    
    // Parse the CSV data
    const lines = csvData.split('\n');
    
    // Check if we have data
    if (lines.length < 10) {
      console.log('Not enough data in the sheet. Please make sure the sheet is published and contains data.');
      return;
    }
    
    console.log(`Found ${lines.length} lines in the CSV`);
    
    // Find headers - they might be in different rows, so let's look for key columns
    let headerRow = -1;
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      if (lines[i].includes('Name of Organization') || 
          lines[i].includes('Type') || 
          lines[i].includes('Main Contact Person')) {
        headerRow = i;
        break;
      }
    }
    
    if (headerRow === -1) {
      console.error('Could not find header row in the CSV');
      return;
    }
    
    console.log(`Found header row at line ${headerRow + 1}`);
    
    // Parse headers
    const headers = lines[headerRow].split(',').map(h => h.trim().replace(/^"(.+)"$/, '$1'));
    
    // Find column indexes
    const nameIndex = headers.findIndex(h => h.includes('Name of Organization'));
    const typeIndex = headers.findIndex(h => h.includes('Type'));
    const contactNameIndex = headers.findIndex(h => h.includes('Main Contact Person'));
    const contactEmailIndex = headers.findIndex(h => h.includes('Contact Person'));
    const purposeIndex = headers.findIndex(h => h.includes('purpose') || h === 'G');
    
    if (nameIndex === -1) {
      console.error('Could not find "Name of Organization" column');
      return;
    }
    
    // Start from the row after the header
    const startRow = headerRow + 1;
    
    // Track progress
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Process each row
    for (let i = startRow; i < lines.length; i++) {
      // Skip empty lines
      if (!lines[i].trim()) {
        continue;
      }
      
      // Parse row - handle quoted fields with commas
      let row = [];
      let inQuote = false;
      let field = '';
      
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          row.push(field);
          field = '';
        } else {
          field += char;
        }
      }
      
      // Add the last field
      row.push(field);
      
      // Get club data
      const clubName = row[nameIndex]?.replace(/^"(.+)"$/, '$1').trim();
      const categoryName = row[typeIndex]?.replace(/^"(.+)"$/, '$1').trim();
      const contactName = contactNameIndex !== -1 ? row[contactNameIndex]?.replace(/^"(.+)"$/, '$1').trim() : null;
      const contactEmail = contactEmailIndex !== -1 ? row[contactEmailIndex]?.replace(/^"(.+)"$/, '$1').trim() : null;
      
      // For purpose, try to find it in the expected column, otherwise use the manually specified index
      let purpose = '';
      if (purposeIndex !== -1) {
        purpose = row[purposeIndex]?.replace(/^"(.+)"$/, '$1').trim();
      } else if (row.length > 6) {
        purpose = row[6]?.replace(/^"(.+)"$/, '$1').trim(); // Column G
      }
      
      // Skip if no club name
      if (!clubName) {
        continue;
      }
      
      console.log(`Processing: ${clubName}`);
      
      // Skip if no purpose (for real clubs)
      if (!purpose && i > startRow + 10) {
        console.warn(`[Row ${i+1}] Skipping "${clubName}": Missing purpose`);
        skippedCount++;
        continue;
      }
      
      try {
        // Use a default purpose if none found (for testing)
        if (!purpose) {
          purpose = `The purpose of ${clubName} is to provide students with opportunities to engage in activities related to ${categoryName || 'their interests'}.`;
          console.log(`[Row ${i+1}] Using default purpose for "${clubName}"`);
        }
        
        // Find or create category
        let category = null;
        if (categoryName) {
          category = await findOrCreateCategory(categoryName);
        }
        
        // Prepare club data
        const clubData = {
          name: clubName,
          purpose,
          categoryDescription: categoryName || null,
          primaryContactName: contactName || null,
          contactEmail: contactEmail || null,
          status: ContentStatus.APPROVED, // Default status for imported clubs
        };
        
        // Upsert the club (create if doesn't exist, update if it does)
        const club = await prisma.club.upsert({
          where: { name: clubName },
          update: clubData,
          create: clubData,
        });
        
        // Create category association if category was found or created
        if (category) {
          // Check if association already exists
          const existingAssoc = await prisma.clubCategory.findUnique({
            where: {
              clubId_categoryId: {
                clubId: club.id,
                categoryId: category.id,
              },
            },
          });
          
          // Create association if it doesn't exist
          if (!existingAssoc) {
            await prisma.clubCategory.create({
              data: {
                clubId: club.id,
                categoryId: category.id,
              },
            });
            console.log(`[Row ${i+1}] Associated club "${clubName}" with category "${category.name}"`);
          }
        }
        
        console.log(`[Row ${i+1}] Imported: ${clubName}`);
        successCount++;
      } catch (error) {
        console.error(`[Row ${i+1}] ERROR processing "${clubName}":`, error.message);
        errorCount++;
      }
    }
    
    // Print summary
    console.log('\n--- Import Complete ---');
    console.log(`Successfully imported: ${successCount} clubs`);
    console.log(`Skipped: ${skippedCount} rows`);
    console.log(`Errors: ${errorCount} rows`);
    
  } catch (error) {
    console.error('Error fetching or processing the sheet:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import function
fetchAndImportClubs(); 