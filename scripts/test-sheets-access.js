const fs = require('fs');
const { google } = require('googleapis');

// Credentials path - MAKE SURE THIS IS CORRECT
const credentialsPath = '/Users/christian/Desktop/corded-imagery-459002-i5-ed0d7dfd8e5d.json';

// Spreadsheet ID from the URL
const spreadsheetId = '1vK_ixq3a86uXjHXy9oNnyYHwAvyU9smNPKuJU6OYd-Q';

async function testAccess() {
  try {
    console.log('Loading credentials from:', credentialsPath);
    if (!fs.existsSync(credentialsPath)) {
      console.error('ERROR: Credentials file not found!');
      process.exit(1);
    }

    // Load credentials
    const credentials = require(credentialsPath);
    console.log('Credentials loaded successfully.');
    
    // Setup authentication
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );
    
    // Create sheets client
    const sheets = google.sheets({ version: 'v4', auth });
    
    console.log('Attempting to access spreadsheet:', spreadsheetId);
    
    // Get spreadsheet info
    const metadataResponse = await sheets.spreadsheets.get({
      spreadsheetId
    });
    
    console.log('SUCCESS! Spreadsheet title:', metadataResponse.data.properties.title);
    console.log('Sheets in this spreadsheet:');
    metadataResponse.data.sheets.forEach(sheet => {
      console.log(`- ${sheet.properties.title} (ID: ${sheet.properties.sheetId})`);
    });
    
    // Get sample data
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A1:J10'
    });
    
    const rows = dataResponse.data.values;
    if (rows && rows.length) {
      console.log('\nSample data:');
      rows.forEach((row, i) => {
        console.log(`Row ${i+1}: ${JSON.stringify(row)}`);
      });
    } else {
      console.log('No data found.');
    }
    
  } catch (error) {
    console.error('ERROR accessing spreadsheet:');
    if (error.response) {
      console.error('API Error:', error.response.data);
    } else {
      console.error(error);
    }
  }
}

// Run the test
testAccess();
