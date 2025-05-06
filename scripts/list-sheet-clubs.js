// Script to list all clubs from Google Sheets, focusing on T-Z letters
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');

// Path to your service account credentials file - you may need to adjust this
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || './credentials.json';
// Your Google Sheets ID - you should replace this with your actual ID
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

async function listSheetClubs() {
  try {
    console.log('Starting to list clubs from Google Sheets...');
    
    if (!SPREADSHEET_ID) {
      console.error('SPREADSHEET_ID environment variable is not set.');
      return;
    }
    
    // Load credentials
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.error(`Credentials file not found at ${CREDENTIALS_PATH}`);
      console.log('Please check your GOOGLE_APPLICATION_CREDENTIALS environment variable.');
      return;
    }
    
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const jwt = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    
    // Initialize the Google Sheets document
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, jwt);
    await doc.loadInfo();
    console.log(`Loaded document: ${doc.title}`);
    
    // Get the first sheet
    const sheet = doc.sheetsByIndex[0];
    await sheet.loadHeaderRow();
    
    // Print the headers to help debug
    console.log('Sheet headers:', sheet.headerValues.join(', '));
    
    // Determine column indices (assuming name is one of these columns)
    const possibleNameColumns = ['name', 'club name', 'organization name', 'club', 'organization'];
    const headers = sheet.headerValues.map(h => h.toLowerCase());
    
    let nameColumnIndex = -1;
    for (const column of possibleNameColumns) {
      const index = headers.findIndex(h => h.includes(column));
      if (index !== -1) {
        nameColumnIndex = index;
        console.log(`Found name column: ${sheet.headerValues[nameColumnIndex]}`);
        break;
      }
    }
    
    if (nameColumnIndex === -1) {
      console.error(`Couldn't find a name column in headers: ${sheet.headerValues.join(', ')}`);
      return;
    }
    
    // Load all rows
    const rows = await sheet.getRows();
    console.log(`Found ${rows.length} rows in the sheet`);
    
    // Group clubs by first letter
    const clubsByLetter = {};
    const targetLetters = ['T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    
    for (const row of rows) {
      const name = row._rawData[nameColumnIndex]?.trim();
      if (name) {
        const firstLetter = name.charAt(0).toUpperCase();
        
        // Only focus on clubs starting with T-Z
        if (targetLetters.includes(firstLetter)) {
          if (!clubsByLetter[firstLetter]) {
            clubsByLetter[firstLetter] = [];
          }
          clubsByLetter[firstLetter].push(name);
        }
      }
    }
    
    // Print clubs by letter
    let foundAny = false;
    for (const letter of targetLetters) {
      if (clubsByLetter[letter] && clubsByLetter[letter].length > 0) {
        foundAny = true;
        console.log(`\n--- ${letter} (${clubsByLetter[letter].length} clubs) ---`);
        clubsByLetter[letter].forEach(club => {
          console.log(club);
        });
      } else {
        console.log(`\n--- ${letter} (0 clubs) ---`);
      }
    }
    
    if (!foundAny) {
      console.log('\nNo clubs starting with T-Z found in the Google Sheet.');
    }
    
  } catch (error) {
    console.error('Error accessing Google Sheets:', error);
    console.error(error.stack);
  }
}

listSheetClubs(); 