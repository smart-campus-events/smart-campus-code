// Script to import clubs from the specified Google Sheet using the provided credentials
const { PrismaClient, ContentStatus } = require('@prisma/client');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');

const prisma = new PrismaClient();

// Path to the provided service account credentials file
const CREDENTIALS_PATH = '/Users/christian/Desktop/corded-imagery-459002-i5-ed0d7dfd8e5d.json';

// The actual Google Spreadsheet ID from the URL
const SPREADSHEET_ID = '1vK_ixq3a86uXjHXy9oNnyYHwAvyU9smNPKuJU6OYd-Q';

// Expected column headers based on the UH Manoa RIO spreadsheet
const HEADER_NAME = 'Name of Organization';
const HEADER_CATEGORY = 'Type';
const HEADER_CONTACT_NAME = 'Main Contact Person';
const HEADER_CONTACT_EMAIL = "Contact Person's Email";
const HEADER_PURPOSE = 'Purpose';

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
    await sheet.loadHeaderRow();
    console.log(`Using sheet "${sheet.title}" with headers: ${sheet.headerValues.join(', ')}`);

    // Map actual header indices since column names might not match exactly
    const headerMap = {};
    const lowerCaseHeaders = sheet.headerValues.map(h => h.toLowerCase());
    
    // Map Name of Organization
    const nameColumnIndex = lowerCaseHeaders.findIndex(h => 
      h.includes('name') && h.includes('organization') || h === 'name of organization');
    if (nameColumnIndex !== -1) {
      headerMap.name = sheet.headerValues[nameColumnIndex];
    } else {
      console.error('Could not find a column for club name!');
      return;
    }
    
    // Map Type (Category)
    const categoryColumnIndex = lowerCaseHeaders.findIndex(h => 
      h === 'type' || h.includes('category'));
    if (categoryColumnIndex !== -1) {
      headerMap.category = sheet.headerValues[categoryColumnIndex];
    }
    
    // Map Main Contact Person
    const contactNameColumnIndex = lowerCaseHeaders.findIndex(h => 
      h.includes('contact') && h.includes('person') || h.includes('main contact'));
    if (contactNameColumnIndex !== -1) {
      headerMap.contactName = sheet.headerValues[contactNameColumnIndex];
    }
    
    // Map Contact Person's Email
    const contactEmailColumnIndex = lowerCaseHeaders.findIndex(h => 
      h.includes('contact') && h.includes('email') || h.includes("person's email"));
    if (contactEmailColumnIndex !== -1) {
      headerMap.contactEmail = sheet.headerValues[contactEmailColumnIndex];
    }
    
    // Map Purpose
    const purposeColumnIndex = lowerCaseHeaders.findIndex(h => 
      h === 'purpose' || h.includes('description'));
    if (purposeColumnIndex !== -1) {
      headerMap.purpose = sheet.headerValues[purposeColumnIndex];
    } else {
      console.error('Could not find a column for club purpose!');
      return;
    }
    
    console.log('Mapped columns:', headerMap);

    // Load all rows
    const rows = await sheet.getRows();
    console.log(`Found ${rows.length} rows in the sheet`);

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each row - with special attention to T-Z clubs
    const processPromises = rows.map(async (row, index) => {
      const rowNum = index + 2; // +2 because header is row 1, and row indexing starts at 1
      
      // Extract data using header map
      const clubName = row[headerMap.name]?.trim();
      const categoryDescription = headerMap.category ? row[headerMap.category]?.trim() : null;
      const contactName = headerMap.contactName ? row[headerMap.contactName]?.trim() : null;
      const contactEmail = headerMap.contactEmail ? row[headerMap.contactEmail]?.trim() : null;
      const purpose = row[headerMap.purpose]?.trim();
      
      // Skip rows with no club name
      if (!clubName) {
        // Don't log for empty rows
        if (rowNum > 10) { 
          console.log(`[Row ${rowNum}] Skipping: No club name found`);
        }
        return { status: 'skipped', reason: 'missing-name' };
      }

      // Skip rows with no purpose
      if (!purpose) {
        console.log(`[Row ${rowNum}] Skipping club "${clubName}": No purpose found`);
        return { status: 'skipped', reason: 'missing-purpose' };
      }

      // Get the first letter to help identify T-Z clubs
      const firstLetter = clubName.charAt(0).toUpperCase();
      
      // Find or create the category
      let category = null;
      if (categoryDescription) {
        try {
          category = await findOrCreateCategory(categoryDescription);
        } catch (catError) {
          console.error(`[Row ${rowNum}] ERROR processing category "${categoryDescription}":`, catError.message);
        }
      }

      // Prepare club data
      const clubData = {
        name: clubName,
        purpose: purpose,
        categoryDescription: categoryDescription || null,
        primaryContactName: contactName || null,
        contactEmail: contactEmail || null,
        status: ContentStatus.APPROVED,
      };

      try {
        // Check if club already exists
        const existingClub = await prisma.club.findUnique({
          where: { name: clubName },
        });

        if (existingClub) {
          console.log(`[Row ${rowNum}] Club "${clubName}" already exists, updating it`);
          
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
              console.log(`[Row ${rowNum}] Associated club "${clubName}" with category "${category.name}"`);
            }
          }
          
          return { status: 'updated', club: clubName, letter: firstLetter };
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
            console.log(`[Row ${rowNum}] Associated new club "${clubName}" with category "${category.name}"`);
          }
          
          console.log(`[Row ${rowNum}] Created new club: "${clubName}"`);
          return { status: 'created', club: clubName, letter: firstLetter };
        }
      } catch (error) {
        console.error(`[Row ${rowNum}] ERROR processing club "${clubName}":`, error.message);
        return { status: 'error', club: clubName, letter: firstLetter, error: error.message };
      }
    });

    // Wait for all rows to be processed
    const results = await Promise.all(processPromises);
    
    // Count results
    const created = results.filter(r => r.status === 'created').length;
    const updated = results.filter(r => r.status === 'updated').length;
    skippedCount = results.filter(r => r.status === 'skipped').length;
    errorCount = results.filter(r => r.status === 'error').length;
    processedCount = created + updated;

    // Group clubs by first letter for reporting
    const clubsByFirstLetter = {};
    results.forEach(result => {
      if (result.club) {
        const firstLetter = result.letter;
        if (!clubsByFirstLetter[firstLetter]) {
          clubsByFirstLetter[firstLetter] = [];
        }
        clubsByFirstLetter[firstLetter].push({
          name: result.club,
          status: result.status,
        });
      }
    });

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
    console.log(`Skipped rows: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Total processed: ${processedCount}`);

  } catch (error) {
    console.error('ERROR during import process:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import function
importClubs(); 