/**
 * Import club data from Google Sheets using JSON credentials file
 */

const { PrismaClient, ContentStatus } = require('@prisma/client');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Get configuration from environment variables
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const SHEET_GID = process.env.GOOGLE_SHEET_GID;
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Column mapping for the Google Sheet data
const COL_NAME = 'A';             // Club name
const COL_TYPE = 'E';             // Category/Type 
const COL_CONTACT_NAME = 'F';     // Contact person
const COL_CONTACT_EMAIL = 'G';    // Contact email
const COL_PURPOSE = 'H';          // Purpose description 

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

// Get cell value from a specific cell in a sheet
function getCellValue(sheet, cellAddress) {
  try {
    const cell = sheet.getCellByA1(cellAddress);
    return cell?.value?.toString().trim() || null;
  } catch (error) {
    console.error(`Error getting cell ${cellAddress}:`, error.message);
    return null;
  }
}

async function importClubsFromGoogleSheets() {
  console.log('Starting club import from Google Sheets...');
  
  try {
    // Validate configuration
    if (!SPREADSHEET_ID) {
      throw new Error('Missing GOOGLE_SPREADSHEET_ID in environment variables');
    }
    
    if (!CREDENTIALS_PATH) {
      throw new Error('Missing GOOGLE_APPLICATION_CREDENTIALS in environment variables');
    }
    
    // Check if credentials file exists
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      throw new Error(`Credentials file not found at: ${CREDENTIALS_PATH}`);
    }
    
    console.log(`Using spreadsheet ID: ${SPREADSHEET_ID}`);
    console.log(`Using credentials file: ${CREDENTIALS_PATH}`);
    
    // Load credentials
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    
    // Initialize Google Sheet
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
    
    // Authenticate with Google
    await doc.useServiceAccountAuth(credentials);
    
    // Load document info
    await doc.loadInfo();
    console.log(`Successfully loaded spreadsheet: ${doc.title}`);
    
    // Get sheet by GID if specified, otherwise use the first sheet
    let sheet;
    if (SHEET_GID) {
      sheet = doc.sheetsById[SHEET_GID];
      if (!sheet) {
        console.warn(`Sheet with GID ${SHEET_GID} not found, using first sheet`);
        sheet = doc.sheetsByIndex[0];
      }
    } else {
      sheet = doc.sheetsByIndex[0];
    }
    
    console.log(`Using sheet: ${sheet.title}`);
    
    // Load all cells in the sheet
    await sheet.loadCells();
    console.log('Successfully loaded all cells');
    
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Start from row 9 (assuming headers and other info is above)
    const startRow = 9;
    const maxRows = 500; // Safety limit
    
    // Process each row
    for (let rowIndex = startRow; rowIndex < startRow + maxRows; rowIndex++) {
      // Check if we've reached the end of data (empty club name)
      const clubNameCell = getCellValue(sheet, `${COL_NAME}${rowIndex}`);
      if (!clubNameCell) {
        // Skip this row if no club name, but check a few more rows before giving up
        if (rowIndex > startRow + 5 && !getCellValue(sheet, `${COL_NAME}${rowIndex+1}`) && !getCellValue(sheet, `${COL_NAME}${rowIndex+2}`)) {
          console.log(`No more data found after row ${rowIndex-1}`);
          break;
        }
        continue;
      }
      
      // Extract data from the row
      const clubName = clubNameCell;
      const categoryName = getCellValue(sheet, `${COL_TYPE}${rowIndex}`);
      const contactName = getCellValue(sheet, `${COL_CONTACT_NAME}${rowIndex}`);
      const contactEmail = getCellValue(sheet, `${COL_CONTACT_EMAIL}${rowIndex}`);
      const purpose = getCellValue(sheet, `${COL_PURPOSE}${rowIndex}`);
      
      // Basic validation
      if (!purpose) {
        console.warn(`[Row ${rowIndex}] Skipping "${clubName}": Missing purpose`);
        skippedCount++;
        continue;
      }
      
      try {
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
            console.log(`[Row ${rowIndex}] Associated club "${clubName}" with category "${category.name}"`);
          }
        }
        
        console.log(`[Row ${rowIndex}] Imported: ${clubName}`);
        successCount++;
      } catch (error) {
        console.error(`[Row ${rowIndex}] ERROR processing "${clubName}":`, error.message);
        errorCount++;
      }
    }
    
    // Print summary
    console.log('\n--- Import Complete ---');
    console.log(`Successfully imported: ${successCount} clubs`);
    console.log(`Skipped: ${skippedCount} rows`);
    console.log(`Errors: ${errorCount} rows`);
    
  } catch (error) {
    console.error('Error during Google Sheets import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import function
importClubsFromGoogleSheets(); 