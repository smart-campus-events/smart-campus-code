// Script to import clubs from Google Sheets using the provided service account credentials
const { PrismaClient, ContentStatus } = require('@prisma/client');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');

const prisma = new PrismaClient();

// Path to the provided service account credentials file
const CREDENTIALS_PATH = '/Users/christian/Desktop/corded-imagery-459002-i5-ed0d7dfd8e5d.json';

// You need to set your actual Google Spreadsheet ID here
// This is found in the URL: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

// Header mapping for the Google Sheet
const HEADER_NAME = 'Name of Organization'; // Expected header for Club Name
const HEADER_CATEGORY = 'Type'; // Expected header for Category Description
const HEADER_CONTACT_NAME = 'Main Contact Person'; // Expected header for Primary Contact Name
const HEADER_CONTACT_EMAIL = "Contact Person's Email"; // Expected header for Contact Email
const HEADER_PURPOSE = 'Purpose'; // Header for club purpose

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
    
    // Check if spreadsheet ID is set
    if (!SPREADSHEET_ID) {
      console.error('ERROR: Spreadsheet ID not set. Please set the GOOGLE_SPREADSHEET_ID in the .env file.');
      console.error('Current .env value for GOOGLE_SPREADSHEET_ID:', process.env.GOOGLE_SPREADSHEET_ID);
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

    // Load all rows
    const rows = await sheet.getRows();
    console.log(`Found ${rows.length} rows in the sheet`);

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each row - explicitly look for T-Z clubs too
    const processPromises = rows.map(async (row, index) => {
      const rowNum = index + 2; // +2 because header is row 1, and row indexing starts at 1
      
      // Extract data using header names
      const clubName = row[HEADER_NAME]?.trim();
      const categoryDescription = row[HEADER_CATEGORY]?.trim();
      const contactName = row[HEADER_CONTACT_NAME]?.trim();
      const contactEmail = row[HEADER_CONTACT_EMAIL]?.trim();
      const purpose = row[HEADER_PURPOSE]?.trim();
      
      // Skip rows with no club name
      if (!clubName) {
        console.log(`[Row ${rowNum}] Skipping: No club name found`);
        return { status: 'skipped', reason: 'missing-name' };
      }

      // Skip rows with no purpose
      if (!purpose) {
        console.log(`[Row ${rowNum}] Skipping club "${clubName}": No purpose found`);
        return { status: 'skipped', reason: 'missing-purpose' };
      }

      // Check the first letter of the club name
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
          
          return { status: 'updated', club: clubName };
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
          return { status: 'created', club: clubName };
        }
      } catch (error) {
        console.error(`[Row ${rowNum}] ERROR processing club "${clubName}":`, error.message);
        return { status: 'error', club: clubName, error: error.message };
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
        const firstLetter = result.club.charAt(0).toUpperCase();
        if (!clubsByFirstLetter[firstLetter]) {
          clubsByFirstLetter[firstLetter] = [];
        }
        clubsByFirstLetter[firstLetter].push({
          name: result.club,
          status: result.status,
        });
      }
    });

    console.log('\n--- Clubs processed by first letter ---');
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
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import function
importClubs(); 