// Script to import clubs from the specified Google Sheet using the provided credentials
// IMPORTANT: Headers start on row 8 in the target spreadsheet
const { PrismaClient, ContentStatus } = require('@prisma/client');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');

const prisma = new PrismaClient();

// Path to the provided service account credentials file
const CREDENTIALS_PATH = '/Users/christian/Desktop/corded-imagery-459002-i5-ed0d7dfd8e5d.json';

// The actual Google Spreadsheet ID from the URL
const SPREADSHEET_ID = '1vK_ixq3a86uXjHXy9oNnyYHwAvyU9smNPKuJU6OYd-Q';

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
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    
    // Authenticate with Google Sheets API
    console.log('Authenticating with Google Sheets API using service account credentials...');
    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    // Load the spreadsheet
    console.log(`Connecting to spreadsheet with ID: ${SPREADSHEET_ID}`);
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, auth);
    await doc.loadInfo();
    console.log(`Connected to spreadsheet "${doc.title}"`);

    // Get the first sheet
    const sheet = doc.sheetsByIndex[0];
    
    // Load cells for the header row (row 8) and data rows
    console.log('Loading cells from the sheet...');
    
    // Load a subset of cells to identify structure first 
    await sheet.loadCells('A1:Z100');
    
    // Identify the header row (row 8)
    const headerRow = 8; // 1-indexed, header is on row 8
    const headerRowIdx = headerRow - 1; // 0-indexed for API usage
    
    // Extract headers from row 8
    const headers = [];
    let col = 0;
    let headerCell = sheet.getCell(headerRowIdx, col);
    
    // Read headers across the row until we hit an empty cell
    while (headerCell.value !== null && headerCell.value !== undefined && col < 26) { // Stop at column Z
      headers.push(headerCell.value.toString().trim());
      col++;
      headerCell = sheet.getCell(headerRowIdx, col);
    }
    
    console.log(`Found ${headers.length} headers in row ${headerRow}: ${headers.join(', ')}`);
    
    // Manual mapping of expected column indices
    const nameColIdx = headers.findIndex(h => h.toLowerCase().includes('name') && h.toLowerCase().includes('organization'));
    const typeColIdx = headers.findIndex(h => h.toLowerCase() === 'type');
    const contactColIdx = headers.findIndex(h => h.toLowerCase().includes('contact person'));
    const emailColIdx = headers.findIndex(h => h.toLowerCase().includes('email'));
    const purposeColIdx = headers.findIndex(h => h.toLowerCase() === 'purpose');
    
    if (nameColIdx === -1 || purposeColIdx === -1) {
      console.error('Could not find required columns for club name or purpose.');
      console.error(`Available headers: ${headers.join(', ')}`);
      return;
    }
    
    console.log(`Column mappings: Name=${nameColIdx}, Type=${typeColIdx}, Contact=${contactColIdx}, Email=${emailColIdx}, Purpose=${purposeColIdx}`);
    
    // Process data starting from row after headers
    const dataStartRow = headerRow + 1; // 1-indexed
    const dataStartRowIdx = dataStartRow - 1; // 0-indexed
    
    // Process all rows with data
    const processedData = [];
    let currentRowIdx = dataStartRowIdx;
    let hasMoreData = true;
    
    while (hasMoreData && currentRowIdx < 500) { // Safety limit to 500 rows
      const nameCell = sheet.getCell(currentRowIdx, nameColIdx);
      
      // If we hit a row with no name, we've reached the end of data
      if (!nameCell.value) {
        hasMoreData = false;
        continue;
      }
      
      // Extract data from the row
      const clubName = nameCell.value.toString().trim();
      const purpose = purposeColIdx !== -1 ? 
                     (sheet.getCell(currentRowIdx, purposeColIdx).value || '').toString().trim() : '';
      const categoryDescription = typeColIdx !== -1 ? 
                                 (sheet.getCell(currentRowIdx, typeColIdx).value || '').toString().trim() : '';
      const contactName = contactColIdx !== -1 ? 
                         (sheet.getCell(currentRowIdx, contactColIdx).value || '').toString().trim() : '';
      const contactEmail = emailColIdx !== -1 ? 
                          (sheet.getCell(currentRowIdx, emailColIdx).value || '').toString().trim() : '';
      
      // Add to processed data if we have a name and purpose
      if (clubName && purpose) {
        processedData.push({
          name: clubName,
          purpose,
          categoryDescription,
          contactName,
          contactEmail,
          rowNum: currentRowIdx + 1 // Convert back to 1-indexed for logging
        });
      } else if (clubName) {
        console.log(`[Row ${currentRowIdx + 1}] Skipping club "${clubName}": No purpose found`);
      }
      
      currentRowIdx++;
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