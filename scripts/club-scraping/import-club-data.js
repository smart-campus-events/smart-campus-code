// import-club-data.ts - Import club data from Google Sheets to database
import { PrismaClient, ContentStatus } from '@prisma/client';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const prisma = new PrismaClient();

// --- Configuration ---
const {
  GOOGLE_SPREADSHEET_ID,
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  GOOGLE_SHEET_NAME, // Optional: specify if needed
  GOOGLE_SHEET_GID, // Optional: specify if needed (as string)
} = process.env;

// --- !! IMPORTANT: Verify these header names match Row 1 in your sheet EXACTLY !! ---
const HEADER_NAME = 'Name of Organization'; // Expected header for Club Name
const HEADER_CATEGORY = 'Type'; // Expected header for Category Description
const HEADER_CONTACT_NAME = 'Main Contact Person'; // Expected header for Primary Contact Name
const HEADER_CONTACT_EMAIL = "Contact Person's Email"; // Expected header for Contact Email
const COLUMN_PURPOSE = 'G'; // We'll use column G directly instead of header name
// Optional fields - modify based on your spreadsheet headers
const HEADER_WEBSITE_URL = 'Website';
const HEADER_MEETING_TIME = 'Meeting Time';
const HEADER_MEETING_LOCATION = 'Meeting Location';
const HEADER_JOIN_INFO = 'How to Join';

// Google Sheets API Scopes
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

// Helper function to match category type to our predefined categories
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
          contains: normalizedName,
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

async function main() {
  console.log('Starting Google Sheet import process for clubs...');

  // --- Validate Configuration ---
  if (!GOOGLE_SPREADSHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.error('ERROR: Missing necessary Google credentials or Sheet ID in .env file.');
    process.exit(1);
  }
  const formattedPrivateKey = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

  // --- 1. Authenticate with Google ---
  console.log('Authenticating with Google Sheets API...');
  const auth = new JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: formattedPrivateKey,
    scopes: SCOPES,
  });

  // --- 2. Load Spreadsheet and Sheet ---
  const doc = new GoogleSpreadsheet(GOOGLE_SPREADSHEET_ID, auth);
  let sheet;
  try {
    await doc.loadInfo();
    console.log(`Connected to Spreadsheet: "${doc.title}"`);
    // Get the sheet based on provided information or default to first sheet
    if (GOOGLE_SHEET_GID) {
      sheet = doc.sheetsById[GOOGLE_SHEET_GID];
    } else if (GOOGLE_SHEET_NAME) {
      sheet = doc.sheetsByTitle[GOOGLE_SHEET_NAME];
    } else {
      [sheet] = doc.sheetsByIndex; // Default to the first sheet using destructuring
    }
    if (!sheet) throw new Error('Sheet not found.');
    console.log(`Using Sheet: "${sheet.title}"`);
  } catch (error) {
    console.error('ERROR connecting to or loading Google Sheet:', error.message);
    process.exit(1);
  }

  // --- 3. Load Raw Cells directly to get exact column values ---
  console.log('Loading data from the sheet...');
  try {
    await sheet.loadCells('A1:Z100'); // Load a range that should cover your data
    console.log('Sheet cells loaded successfully');
  } catch (error) {
    console.error('ERROR loading cells:', error.message);
    process.exit(1);
  }

  // --- 4. Load Rows for other data ---
  console.log('Loading rows from the sheet...');
  const rows = await sheet.getRows();
  console.log(`Found ${rows.length} data rows.`);

  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // --- 5. Process Each Row ---
  console.log('Processing all data rows...');
  // Using Promise.all to process rows in parallel for better performance
  const processPromises = rows.map(async (row, index) => {
    const currentRowIndex = index + 2; // +2 because we skip header, and row indexes start at 1
    
    // Skip rows before row 9 if needed
    if (currentRowIndex < 9) {
      console.log(`Skipping row ${currentRowIndex} (before row 9)`);
      return { status: 'skipped', reason: 'before-row-9' };
    }

    // --- Extract data using header names ---
    const clubName = row.get(HEADER_NAME)?.trim();
    const categoryDescription = row.get(HEADER_CATEGORY)?.trim();
    const contactName = row.get(HEADER_CONTACT_NAME)?.trim();
    const contactEmail = row.get(HEADER_CONTACT_EMAIL)?.trim();
    
    // MODIFIED: Get purpose directly from column G for this row
    // Find the cell in column G for this row
    const purposeCell = sheet.getCell(currentRowIndex - 1, 6); // Column G is index 6 (0-indexed)
    const purpose = purposeCell.value?.toString().trim();
    
    // Extract optional fields if they exist in the spreadsheet
    const websiteUrl = row.get(HEADER_WEBSITE_URL)?.trim();
    const meetingTime = row.get(HEADER_MEETING_TIME)?.trim();
    const meetingLocation = row.get(HEADER_MEETING_LOCATION)?.trim();
    const joinInfo = row.get(HEADER_JOIN_INFO)?.trim();

    // --- Basic Validation (based on your schema requirements) ---
    if (!clubName) {
      console.warn(`[Row ${currentRowIndex}] Skipping: Missing required Club Name.`);
      return { status: 'skipped', reason: 'missing-name' };
    }
    
    if (!purpose) {
      console.warn(
        `[Row ${currentRowIndex}] Skipping club "${clubName}": Missing required Purpose in column G.`,
      );
      return { status: 'skipped', reason: 'missing-purpose' };
    }

    // Find or create the category
    let category = null;
    if (categoryDescription) {
      try {
        category = await findOrCreateCategory(categoryDescription);
      } catch (catError) {
        console.error(`[Row ${currentRowIndex}] ERROR processing category "${categoryDescription}":`, catError.message);
      }
    }

    // --- Prepare data for Prisma (matching schema fields) ---
    const clubInputData = {
      name: clubName,
      purpose,
      categoryDescription: categoryDescription || null,
      primaryContactName: contactName || null,
      contactEmail: contactEmail || null,
      status: ContentStatus.APPROVED, // Default status - change if needed
      // Include optional fields if they exist
      websiteUrl: websiteUrl || null,
      meetingTime: meetingTime || null,
      meetingLocation: meetingLocation || null,
      joinInfo: joinInfo || null,
    };

    // --- 5. Upsert data into the database ---
    try {
      const club = await prisma.club.upsert({
        where: { name: clubName }, // Use the unique identifier
        update: clubInputData, // Data to update if club exists
        create: clubInputData, // Data to create if club doesn't exist
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
          console.log(`[Row ${currentRowIndex}] Associated club "${clubName}" with category "${category.name}"`);
        }
      }

      console.log(
        `[Row ${currentRowIndex}] Upserted: "${clubName}" with purpose: "${purpose.substring(0, 50)}${purpose.length > 50 ? '...' : ''}"`,
      );
      return { status: 'success', club: clubName };
    } catch (dbError) {
      console.error(`[Row ${currentRowIndex}] ERROR saving "${clubName}":`, dbError.message);
      return { status: 'error', club: clubName, error: dbError.message };
    }
  });

  // Wait for all rows to be processed
  const results = await Promise.all(processPromises);
  // Count results
  processedCount = results.filter(r => r.status === 'success').length;
  skippedCount = results.filter(r => r.status === 'skipped').length;
  errorCount = results.filter(r => r.status === 'error').length;

  console.log('\n--- Import Finished ---');
  console.log(`Successfully processed (upserted): ${processedCount} clubs.`);
  console.log(`Skipped rows (missing required data): ${skippedCount}.`);
  console.log(`Rows with errors: ${errorCount}.`);
}

// --- Run the main function and disconnect Prisma ---
main()
  .catch(async (e) => {
    console.error('\nUnhandled error during import process:', e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    console.log('Disconnecting Prisma client...');
    await prisma.$disconnect();
  });
