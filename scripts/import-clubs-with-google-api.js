// Script to import clubs from the specified Google Sheet using the Google API directly
// This script uses the same authentication method as test-sheets-access.js
const { PrismaClient, ContentStatus } = require('@prisma/client');
const { google } = require('googleapis');
const fs = require('fs');

const prisma = new PrismaClient();

// Path to the credentials file
const CREDENTIALS_PATH = '/Users/christian/Desktop/corded-imagery-459002-i5-ed0d7dfd8e5d.json';

// The actual Google Spreadsheet ID from the URL
const SPREADSHEET_ID = '1vK_ixq3a86uXjHXy9oNnyYHwAvyU9smNPKuJU6OYd-Q';

// The sheet name to import from
const SHEET_NAME = '2024-2025 UHM Approved RIOs';

// Row where headers are located (1-indexed)
const HEADER_ROW = 8;

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
  
  // If no exact match, try to find a category that contains this as a substring
  if (!category) {
    category = await prisma.category.findFirst({
      where: {
        name: {
          contains: normalizedName.split('/')[0],
          mode: 'insensitive',
        },
      },
    });
  }
  
  // If still no match, create the category
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: normalizedName,
      },
    });
    console.log(`Created new category: "${normalizedName}"`);
  }
  
  return category;
}

async function importClubs() {
  try {
    console.log('Starting Google Sheet import process for clubs...');

    // Check if credentials file exists
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.error(`ERROR: Credentials file not found at ${CREDENTIALS_PATH}`);
      return;
    }

    // Load credentials from the file
    const credentials = require(CREDENTIALS_PATH);
    
    // Authenticate with Google Sheets API
    console.log('Authenticating with Google Sheets API using service account credentials...');
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );
    
    // Create sheets client
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get spreadsheet info to confirm connection
    console.log(`Connecting to spreadsheet with ID: ${SPREADSHEET_ID}`);
    const metadataResponse = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });
    console.log(`Connected to spreadsheet "${metadataResponse.data.properties.title}"`);

    // Find the sheet we want to use
    const sheetInfo = metadataResponse.data.sheets.find(
      s => s.properties.title === SHEET_NAME
    );
    
    if (!sheetInfo) {
      console.error(`Could not find sheet named "${SHEET_NAME}" in the spreadsheet. Available sheets:`);
      metadataResponse.data.sheets.forEach(s => {
        console.log(`- ${s.properties.title}`);
      });
      return;
    }
    
    // Get enough rows to cover headers and all potential club data
    console.log(`Reading data from sheet "${SHEET_NAME}"...`);
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A1:Z500`
    });
    
    const rows = dataResponse.data.values || [];
    
    if (rows.length < HEADER_ROW) {
      console.error(`Sheet has fewer rows (${rows.length}) than the expected header row (${HEADER_ROW})`);
      return;
    }
    
    // Get the headers from row 8 (index 7)
    const headers = rows[HEADER_ROW - 1] || [];
    console.log(`Found ${headers.length} headers in row ${HEADER_ROW}: ${headers.join(', ')}`);
    
    // Find relevant column indices
    const nameColIdx = headers.findIndex(h => h && h.toLowerCase().includes('name') && h.toLowerCase().includes('organization'));
    const typeColIdx = headers.findIndex(h => h && h.toLowerCase() === 'type');
    const contactColIdx = headers.findIndex(h => h && h.toLowerCase().includes('contact person'));
    const emailColIdx = headers.findIndex(h => h && h.toLowerCase().includes('email'));
    const purposeColIdx = headers.findIndex(h => h && h.toLowerCase() === 'purpose');
    
    if (nameColIdx === -1 || purposeColIdx === -1) {
      console.error('Could not find required columns for club name or purpose.');
      console.error(`Available headers: ${headers.join(', ')}`);
      return;
    }
    
    console.log(`Column mappings: Name=${nameColIdx}, Type=${typeColIdx}, Contact=${contactColIdx}, Email=${emailColIdx}, Purpose=${purposeColIdx}`);
    
    // Process data starting from row after headers
    const dataStartRow = HEADER_ROW; // Start from the header row to include all data
    
    // Extract and process all rows with data
    const processedData = [];
    
    for (let i = dataStartRow; i < rows.length; i++) {
      const row = rows[i] || [];
      
      // Skip the header row itself
      if (i === HEADER_ROW - 1) continue;
      
      // If we don't have enough columns or no name, skip
      if (row.length <= nameColIdx || !row[nameColIdx]) continue;
      
      // Extract data from the row
      const clubName = row[nameColIdx].toString().trim();
      const purpose = purposeColIdx !== -1 && row[purposeColIdx] ? 
                     row[purposeColIdx].toString().trim() : '';
      const categoryDescription = typeColIdx !== -1 && row[typeColIdx] ? 
                                 row[typeColIdx].toString().trim() : '';
      const contactName = contactColIdx !== -1 && row[contactColIdx] ? 
                         row[contactColIdx].toString().trim() : '';
      const contactEmail = emailColIdx !== -1 && row[emailColIdx] ? 
                          row[emailColIdx].toString().trim() : '';
      
      // Add to processed data if we have a name and purpose
      if (clubName && purpose) {
        processedData.push({
          name: clubName,
          purpose,
          categoryDescription,
          contactName,
          contactEmail,
          rowNum: i + 1 // Convert to 1-indexed for logging
        });
      } else if (clubName) {
        console.log(`[Row ${i + 1}] Skipping club "${clubName}": No purpose found`);
      }
    }
    
    console.log(`Found ${processedData.length} valid club entries to process`);
    
    // Store results to track progress
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errorCount = 0;
    
    // Process clubs data in database
    const clubsByFirstLetter = {};
    
    // Process each club entry
    for (const club of processedData) {
      const firstLetter = club.name.charAt(0).toUpperCase();
      
      try {
        // Find or create category
        let category = null;
        if (club.categoryDescription) {
          category = await findOrCreateCategory(club.categoryDescription);
        }
        
        // Prepare club data
        const clubData = {
          name: club.name,
          purpose: club.purpose,
          categoryDescription: club.categoryDescription || null,
          primaryContactName: club.contactName || null,
          contactEmail: club.contactEmail || null,
          status: ContentStatus.APPROVED,
        };
        
        // Check if club already exists
        const existingClub = await prisma.club.findUnique({
          where: { name: club.name },
        });
        
        if (existingClub) {
          console.log(`[Row ${club.rowNum}] Club "${club.name}" already exists, updating it`);
          
          // Update the existing club
          await prisma.club.update({
            where: { id: existingClub.id },
            data: clubData,
          });
          
          // Make sure it has category association
          if (category) {
            const existingAssoc = await prisma.clubCategory.findFirst({
              where: {
                clubId: existingClub.id,
                categoryId: category.id,
              },
            });
            
            if (!existingAssoc) {
              await prisma.clubCategory.create({
                data: {
                  clubId: existingClub.id,
                  categoryId: category.id,
                },
              });
              console.log(`[Row ${club.rowNum}] Associated club "${club.name}" with category "${category.name}"`);
            }
          }
          
          if (!clubsByFirstLetter[firstLetter]) {
            clubsByFirstLetter[firstLetter] = [];
          }
          clubsByFirstLetter[firstLetter].push({ name: club.name, status: 'updated' });
          updated++;
        } else {
          // Create a new club
          const newClub = await prisma.club.create({
            data: clubData,
          });
          
          // Add category association
          if (category) {
            await prisma.clubCategory.create({
              data: {
                clubId: newClub.id,
                categoryId: category.id,
              },
            });
            console.log(`[Row ${club.rowNum}] Associated new club "${club.name}" with category "${category.name}"`);
          }
          
          console.log(`[Row ${club.rowNum}] Created new club: "${club.name}"`);
          
          if (!clubsByFirstLetter[firstLetter]) {
            clubsByFirstLetter[firstLetter] = [];
          }
          clubsByFirstLetter[firstLetter].push({ name: club.name, status: 'created' });
          created++;
        }
      } catch (error) {
        console.error(`[Row ${club.rowNum}] ERROR processing club "${club.name}":`, error.message);
        errorCount++;
      }
    }
    
    // Check for T-Z clubs specifically
    const tzLetters = ['T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    const tzClubs = {};
    tzLetters.forEach(letter => {
      if (clubsByFirstLetter[letter]) {
        tzClubs[letter] = clubsByFirstLetter[letter];
      }
    });
    
    console.log('\n--- T-Z Clubs processed ---');
    if (Object.keys(tzClubs).length === 0) {
      console.log('No T-Z clubs were found in the spreadsheet.');
    } else {
      Object.keys(tzClubs).sort().forEach(letter => {
        console.log(`\n--- ${letter} (${tzClubs[letter].length} clubs) ---`);
        tzClubs[letter].forEach(club => {
          console.log(`${club.name} (${club.status})`);
        });
      });
    }
    
    console.log('\n--- All Clubs processed by first letter ---');
    Object.keys(clubsByFirstLetter).sort().forEach(letter => {
      console.log(`\n--- ${letter} (${clubsByFirstLetter[letter].length} clubs) ---`);
      clubsByFirstLetter[letter].forEach(club => {
        console.log(`${club.name} (${club.status})`);
      });
    });
    
    console.log('\n--- Import Summary ---');
    console.log(`New clubs created: ${created}`);
    console.log(`Existing clubs updated: ${updated}`);
    console.log(`Skipped entries: ${skipped}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Total processed: ${created + updated}`);
    
  } catch (error) {
    console.error('ERROR during import process:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import function
importClubs(); 