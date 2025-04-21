// importSheetData.js (Revised for headers in Row 1)
import { PrismaClient } from '@prisma/client';
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

// --- !! IMPORTANT: Verify these header names match Row 1 in your new sheet EXACTLY !! ---
// ---          (Case-sensitivity might matter)                                    ---
const HEADER_NAME = 'Name of Organization'; // Expected header for Column A
const HEADER_CATEGORY = 'Type'; // Expected header for Column D
const HEADER_CONTACT_NAME = 'Main Contact Person'; // Expected header for Column E
const HEADER_CONTACT_EMAIL = "Contact Person's Email"; // Expected header for Column F
const HEADER_PURPOSE = 'Purpose'; // Expected header for Column G
// --- End Header Verification ---

// Google Sheets API Scopes
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

// Helper function for delays (optional, but good practice)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('Starting Google Sheet import process (using headers from Row 1)...');

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
    if (GOOGLE_SHEET_GID) sheet = doc.sheetsById[GOOGLE_SHEET_GID];
    else if (GOOGLE_SHEET_NAME) sheet = doc.sheetsByTitle[GOOGLE_SHEET_NAME];
    else sheet = doc.sheetsByIndex[0]; // Default to the first sheet
    if (!sheet) throw new Error('Sheet not found.');
    console.log(`Using Sheet: "${sheet.title}"`);
  } catch (error) {
    console.error('ERROR connecting to or loading Google Sheet:', error.message);
    process.exit(1);
  }

  // --- 3. Load Rows from the Sheet ---
  // getRows automatically uses the first row as header row by default
  console.log('Loading rows from the sheet (using Row 1 as header)...');
  const rows = await sheet.getRows();
  console.log(`Found ${rows.length} data rows.`);

  let processedCount = 0;
  let skippedCount = 0;

  // --- 4. Process Each Row using Header Names ---
  console.log('Processing all data rows (starting from Row 2)...');
  for (const row of rows) {
    const currentUiRow = row.rowIndex; // rowIndex includes header, so data starts at 2

    // --- Extract data using header names ---
    // Uses the header constants defined above. Ensure they match your sheet!
    const clubName = row.get(HEADER_NAME)?.trim();
    const category = row.get(HEADER_CATEGORY)?.trim();
    const contactName = row.get(HEADER_CONTACT_NAME)?.trim();
    const contactEmail = row.get(HEADER_CONTACT_EMAIL)?.trim();
    const purpose = row.get(HEADER_PURPOSE)?.trim();

    // --- Basic Validation (based on your schema requirements) ---
    if (!clubName) {
      console.warn(`[Row ${currentUiRow}] Skipping row: Missing required data for header "${HEADER_NAME}".`);
      skippedCount++;
      continue;
    }
    // Add checks for other *required* fields based on your Prisma schema
    if (!purpose) {
      console.warn(`[Row ${currentUiRow}] Skipping row for Club "${clubName}": Missing required data for header "${HEADER_PURPOSE}".`);
      skippedCount++;
      continue;
    }
    if (!category) {
      console.warn(`[Row ${currentUiRow}] Skipping row for Club "${clubName}": Missing required data for header "${HEADER_CATEGORY}".`);
      skippedCount++;
      continue;
    }
    if (!contactName) {
      console.warn(`[Row ${currentUiRow}] Skipping row for Club "${clubName}": Missing required data for header "${HEADER_CONTACT_NAME}".`);
      skippedCount++;
      continue;
    }
    if (!contactEmail) {
      console.warn(`[Row ${currentUiRow}] Skipping row for Club "${clubName}": Missing required data for header "${HEADER_CONTACT_EMAIL}".`);
      skippedCount++;
      continue;
    }

    // --- Prepare data for Prisma ---
    const clubData = {
      name: clubName,
      category,
      primary_contact_name: contactName,
      contact_email: contactEmail,
      purpose,
      // Add other optional fields from your schema as null if needed
      // logo_url: null,
      // website_url: null,
      // ...
    };

    // --- 5. Upsert data into the database ---
    try {
      await prisma.club.upsert({
        where: { name: clubName }, // Use the unique identifier (ensure name is @unique in schema)
        update: clubData, // Data to update if club exists
        create: clubData, // Data to create if club doesn't exist
      });
      console.log(`[Row ${currentUiRow}] Upserted: "${clubName}"`);
      processedCount++;
    } catch (dbError) {
      console.error(`[Row ${currentUiRow}] ERROR saving club "${clubName}":`, dbError.message);
      skippedCount++;
    }

    // Optional: add a small delay
    // await delay(50);
  }

  console.log('\n--- Import Finished ---');
  console.log(`Successfully processed (upserted): ${processedCount} clubs.`);
  console.log(`Skipped rows: ${skippedCount}.`);
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
