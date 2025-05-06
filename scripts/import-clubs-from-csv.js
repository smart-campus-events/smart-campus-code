/**
 * Simple script to import club data from a CSV file
 * Use this if you've downloaded the spreadsheet as a CSV file
 */

const { PrismaClient, ContentStatus } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Initialize Prisma client
const prisma = new PrismaClient();

// Configuration - adjust these to match your CSV file
const CSV_FILE_PATH = path.join(__dirname, 'rios-data.csv'); // Place your CSV in the scripts folder

// Column indexes (0-based) for CSV data
const COL_NAME = 0;         // Club name (Column A)
const COL_TYPE = 4;         // Category/Type (Column E)
const COL_CONTACT_NAME = 5; // Contact person (Column F)
const COL_CONTACT_EMAIL = 6; // Contact email (Column G)
const COL_PURPOSE = 7;      // Purpose description (Column H)
const COL_WEBSITE = 8;      // Optional website (Column I)

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

async function importClubsFromCSV() {
  console.log('Starting club import from CSV file...');
  
  try {
    // Check if file exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      console.error(`ERROR: CSV file not found at ${CSV_FILE_PATH}`);
      return;
    }
    
    // Read and parse the CSV file
    const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');
    const records = parse(fileContent, {
      skip_empty_lines: true,
      from_line: 9, // Skip header rows and start from row 9
    });
    
    console.log(`Found ${records.length} records in CSV file`);
    
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNum = i + 9; // Actual row number in spreadsheet
      
      // Extract data from the record
      const clubName = record[COL_NAME]?.trim();
      const categoryName = record[COL_TYPE]?.trim();
      const contactName = record[COL_CONTACT_NAME]?.trim();
      const contactEmail = record[COL_CONTACT_EMAIL]?.trim();
      const purpose = record[COL_PURPOSE]?.trim();
      const websiteUrl = record[COL_WEBSITE]?.trim();
      
      // Basic validation
      if (!clubName) {
        console.warn(`[Row ${rowNum}] Skipping: Missing club name`);
        skippedCount++;
        continue;
      }
      
      if (!purpose) {
        console.warn(`[Row ${rowNum}] Skipping "${clubName}": Missing purpose`);
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
          websiteUrl: websiteUrl || null,
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
            console.log(`[Row ${rowNum}] Associated club "${clubName}" with category "${category.name}"`);
          }
        }
        
        console.log(`[Row ${rowNum}] Imported: ${clubName}`);
        successCount++;
      } catch (error) {
        console.error(`[Row ${rowNum}] ERROR processing "${clubName}":`, error.message);
        errorCount++;
      }
    }
    
    // Print summary
    console.log('\n--- Import Complete ---');
    console.log(`Successfully imported: ${successCount} clubs`);
    console.log(`Skipped: ${skippedCount} rows`);
    console.log(`Errors: ${errorCount} rows`);
    
  } catch (error) {
    console.error('Error during CSV import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import function
importClubsFromCSV(); 