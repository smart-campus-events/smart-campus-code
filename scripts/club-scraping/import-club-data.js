// import-club-data.js (Revised for new Club Schema, saving category to categoryDescription)
import { PrismaClient, ContentStatus } from '@prisma/client'; // Import ContentStatus if it's an enum
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
const HEADER_NAME = 'Name of Organization'; // Expected header for Club Name
const HEADER_CATEGORY = 'Type'; // Expected header for Category Description
const HEADER_CONTACT_NAME = 'Main Contact Person'; // Expected header for Primary Contact Name
const HEADER_CONTACT_EMAIL = "Contact Person's Email"; // Expected header for Contact Email
const HEADER_PURPOSE = 'Purpose'; // Expected header for Purpose
// --- Add header constants for optional fields if they exist in your sheet ---
// const HEADER_LOGO_URL = 'Logo URL';
// const HEADER_WEBSITE_URL = 'Website';
// const HEADER_INSTAGRAM_URL = 'Instagram';
// const HEADER_FACEBOOK_URL = 'Facebook';
// const HEADER_TWITTER_URL = 'Twitter';
// const HEADER_MEETING_TIME = 'Meeting Time';
// const HEADER_MEETING_LOCATION = 'Meeting Location';
// const HEADER_JOIN_INFO = 'How to Join';
// --- End Header Verification ---

// Google Sheets API Scopes
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

// Helper function for delays (optional, but good practice)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('Starting Google Sheet import process (saving category to categoryDescription)...');

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
  console.log('Loading rows from the sheet (using Row 1 as header)...');
  const rows = await sheet.getRows();
  console.log(`Found ${rows.length} data rows.`);

  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // --- 4. Process Each Row using Header Names ---
  console.log('Processing all data rows (starting from Row 2)...');
  for (const row of rows) {
    const currentUiRow = row.rowIndex; // rowIndex includes header, so data starts at 2

    // --- Extract data using header names ---
    const clubName = row.get(HEADER_NAME)?.trim();
    const categoryDescription = row.get(HEADER_CATEGORY)?.trim(); // Get category string for description field
    const contactName = row.get(HEADER_CONTACT_NAME)?.trim();
    const contactEmail = row.get(HEADER_CONTACT_EMAIL)?.trim();
    const purpose = row.get(HEADER_PURPOSE)?.trim();

    // --- Extract optional data ---
    // const logoUrl = row.get(HEADER_LOGO_URL)?.trim();
    // const websiteUrl = row.get(HEADER_WEBSITE_URL)?.trim();
    // const instagramUrl = row.get(HEADER_INSTAGRAM_URL)?.trim();
    // const facebookUrl = row.get(HEADER_FACEBOOK_URL)?.trim();
    // const twitterUrl = row.get(HEADER_TWITTER_URL)?.trim();
    // const meetingTime = row.get(HEADER_MEETING_TIME)?.trim();
    // const meetingLocation = row.get(HEADER_MEETING_LOCATION)?.trim();
    // const joinInfo = row.get(HEADER_JOIN_INFO)?.trim();

    // --- Basic Validation (based on your schema requirements) ---
    if (!clubName) {
      console.warn(`[Row ${currentUiRow}] Skipping row: Missing required Club Name (Header "${HEADER_NAME}").`);
      skippedCount++;
      continue;
    }
    if (!purpose) {
      console.warn(`[Row ${currentUiRow}] Skipping row for Club "${clubName}": Missing required Purpose (Header "${HEADER_PURPOSE}").`);
      skippedCount++;
      continue;
    }
    // Keep categoryDescription optional based on schema (String?)
    // if (!categoryDescription) {
    //   console.warn(`[Row ${currentUiRow}] Warning for Club "${clubName}": Missing Category Description (Header "${HEADER_CATEGORY}"). Proceeding without it.`);
    // }

    // --- Prepare data for Prisma (matching new schema fields) ---
    const clubInputData = {
      name: clubName,
      purpose,
      categoryDescription: categoryDescription || null, // Save category string here
      primaryContactName: contactName || null,
      contactEmail: contactEmail || null,
      status: ContentStatus.APPROVED, // Default status - change if needed
      // --- Include optional fields if they exist ---
      // logoUrl: logoUrl || null,
      // websiteUrl: websiteUrl || null,
      // instagramUrl: instagramUrl || null,
      // facebookUrl: facebookUrl || null,
      // twitterUrl: twitterUrl || null,
      // meetingTime: meetingTime || null,
      // meetingLocation: meetingLocation || null,
      // joinInfo: joinInfo || null,
      // submittedByUserId: null,
    };

    // --- 5. Upsert data into the database ---
    try {
      await prisma.club.upsert({
        where: { name: clubName }, // Use the unique identifier
        update: clubInputData, // Data to update if club exists
        create: clubInputData, // Data to create if club doesn't exist
      });

      console.log(`[Row ${currentUiRow}] Upserted Club: "${clubName}" (Category Desc: "${categoryDescription || 'N/A'}")`);
      processedCount++;
    } catch (dbError) {
      console.error(`[Row ${currentUiRow}] ERROR saving club "${clubName}":`, dbError.message);
      errorCount++;
    }

    // Optional: add a small delay
    // await delay(50);
  }

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
