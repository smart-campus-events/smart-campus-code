// check-sheet-data.js - Script to check spreadsheet data
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const {
  GOOGLE_SPREADSHEET_ID,
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  GOOGLE_SHEET_NAME, // Optional: specify if needed
  GOOGLE_SHEET_GID, // Optional: specify if needed (as string)
} = process.env;

// Google Sheets API Scopes
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

async function main() {
  console.log('Checking Google Sheet data...');

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
    
    // Log sheet metadata
    console.log(`Sheet has ${sheet.rowCount} rows and ${sheet.columnCount} columns`);
    
  } catch (error) {
    console.error('ERROR connecting to or loading Google Sheet:', error.message);
    process.exit(1);
  }

  // --- 3. Load Rows and examine data structure ---
  console.log('\nLoading and examining rows...');
  const rows = await sheet.getRows();
  console.log(`Found ${rows.length} data rows.`);
  
  // Check headers
  const headers = sheet.headerValues;
  console.log('\nSheet Headers:');
  headers.forEach((header, index) => {
    const columnLetter = String.fromCharCode(65 + index); // A, B, C, etc.
    console.log(`${columnLetter}: "${header}"`);
  });
  
  // Check the first few rows for the purpose field (column G)
  console.log('\nExamining purpose data in column G:');
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i];
    const rowIndex = i + 2; // +2 because row 1 is headers
    const clubName = row.get('Name of Organization') || 'Unknown';
    const columnGHeader = headers[6]; // G is the 7th column (0-indexed)
    const columnGValue = row.get(columnGHeader) || 'N/A';
    const purpose = row.get('Purpose') || 'N/A';
    
    console.log(`Row ${rowIndex}: Club "${clubName}"`);
    console.log(`  Column G (${columnGHeader}): "${columnGValue}"`);
    console.log(`  Purpose field from header: "${purpose}"`);
    console.log();
  }
}

// --- Run the main function ---
main()
  .catch((e) => {
    console.error('\nUnhandled error:', e);
    process.exit(1);
  }); 