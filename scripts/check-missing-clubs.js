// Script to check for missing clubs in Google Sheets data
const { PrismaClient } = require('@prisma/client');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const prisma = new PrismaClient();

// Path to your service account credentials file - you may need to adjust this
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || './credentials.json';
// Your Google Sheets ID - you should replace this with your actual ID
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

async function checkMissingClubs() {
  try {
    console.log('Starting to check for missing clubs...');
    
    if (!SPREADSHEET_ID) {
      console.error('SPREADSHEET_ID environment variable is not set.');
      return;
    }
    
    // First, get all club names from the database
    const dbClubs = await prisma.club.findMany({
      select: { name: true }
    });
    
    const dbClubNames = new Set(dbClubs.map(club => club.name.trim()));
    console.log(`Found ${dbClubNames.size} clubs in the database.`);
    
    // Now try to get clubs from Google Sheets
    try {
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
      const sheetClubNames = new Set();
      
      // Extract club names
      for (const row of rows) {
        const name = row._rawData[nameColumnIndex]?.trim();
        if (name) {
          sheetClubNames.add(name);
        }
      }
      
      console.log(`Found ${sheetClubNames.size} clubs in the Google Sheet.`);
      
      // Find missing clubs
      const missingClubs = [];
      for (const name of sheetClubNames) {
        if (!dbClubNames.has(name)) {
          missingClubs.push(name);
        }
      }
      
      // Sort missing clubs alphabetically
      missingClubs.sort();
      
      // Group missing clubs by first letter
      const missingByLetter = {};
      for (const club of missingClubs) {
        const firstLetter = club.charAt(0).toUpperCase();
        if (!missingByLetter[firstLetter]) {
          missingByLetter[firstLetter] = [];
        }
        missingByLetter[firstLetter].push(club);
      }
      
      console.log(`\nTotal missing clubs: ${missingClubs.length}`);
      
      if (missingClubs.length > 0) {
        console.log('\nMissing clubs by first letter:');
        for (const letter in missingByLetter) {
          console.log(`\n--- ${letter} (${missingByLetter[letter].length} clubs) ---`);
          missingByLetter[letter].forEach(club => {
            console.log(club);
          });
        }
      } else {
        console.log('No missing clubs found.');
      }
      
    } catch (error) {
      console.error('Error accessing Google Sheets:', error);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMissingClubs(); 