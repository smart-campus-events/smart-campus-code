const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');

// Configuration
const credentialsPath = '/Users/christian/Desktop/corded-imagery-459002-i5-ed0d7dfd8e5d.json';
const spreadsheetId = '1vK_ixq3a86uXjHXy9oNnyYHwAvyU9smNPKuJU6OYd-Q';
const seedFilePath = path.join(__dirname, '../prisma/seed.ts');

async function generateSeedCode() {
  try {
    console.log('Starting RIO import and seed generation process...');
    
    // Load credentials
    if (!fs.existsSync(credentialsPath)) {
      throw new Error(`Credentials file not found at: ${credentialsPath}`);
    }
    const credentials = require(credentialsPath);
    
    // Setup auth
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );
    
    // Access spreadsheet
    const sheets = google.sheets({ version: 'v4', auth });
    console.log('Accessing RIO spreadsheet...');
    
    // First, determine which sheet to use (2024-2025 is preferred)
    const metadataResponse = await sheets.spreadsheets.get({
      spreadsheetId
    });
    
    // Find the sheet with "2024-2025" in the title
    let sheetName = "2024-2025 UHM Approved RIOs";  // Default to the current sheet
    metadataResponse.data.sheets.forEach(sheet => {
      console.log(`Found sheet: ${sheet.properties.title}`);
    });
    
    // Get data from spreadsheet - adjust range as needed
    // The header row is at row 8, so we start from there
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A8:G200`, // Adjusted to include the purpose column (G)
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error('No data found in spreadsheet');
    }
    
    console.log(`Found ${rows.length} rows of data.`);
    
    // Skip header row and find actual data rows (first one with organization name)
    let clubRows = [];
    let headerRowIndex = -1;
    
    // Find the header row
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === "Name of Organization") {
        headerRowIndex = i;
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      console.log("Couldn't find header row. Using the first row as header.");
      headerRowIndex = 0;
    }
    
    // Process rows after the header
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (row && row[0] && row[0].trim()) {
        clubRows.push(row);
      }
    }
    
    console.log(`Found ${clubRows.length} club entries after processing.`);
    
    // Generate seed code for clubs
    let seedCode = '  // --- RIO Clubs from Google Sheet ---\n';
    seedCode += '  console.log(\'Seeding RIO Clubs...\');\n\n';
    
    // Process each row and generate code
    let count = 0;
    for (const row of clubRows) {
      // Skip empty rows
      if (!row || row.length === 0) continue;
      
      // Extract club data from row
      const clubName = row[0]?.trim();
      if (!clubName) continue; // Skip if no club name
      
      // Get other fields if available
      const orgType = row[4]?.trim() || 'Recreational'; // Type/Category
      const contactName = row[5]?.trim() || '';
      const contactEmail = ''; // Not provided in spreadsheet
      
      // Get the actual purpose from the spreadsheet (column G, index 6)
      let purpose = row[6]?.trim();
      
      // Use a default purpose if none is provided in the spreadsheet
      if (!purpose) {
        purpose = `Official Registered Independent Organization at UH Mānoa focused on ${orgType.toLowerCase()} activities.`;
      }
      
      // Create variable name from club name
      const varName = `rioClub${count}`;
      
      // Generate TypeScript code for this club
      seedCode += `  const ${varName} = await prisma.club.upsert({\n`;
      seedCode += `    where: { name: ${JSON.stringify(clubName)} },\n`;
      seedCode += `    update: { status: ContentStatus.APPROVED },\n`;
      seedCode += `    create: {\n`;
      seedCode += `      name: ${JSON.stringify(clubName)},\n`;
      seedCode += `      purpose: ${JSON.stringify(purpose)},\n`;
      seedCode += `      categoryDescription: ${JSON.stringify(orgType)},\n`;
      seedCode += `      primaryContactName: ${JSON.stringify(contactName)},\n`;
      seedCode += `      contactEmail: ${JSON.stringify(contactEmail)},\n`;
      seedCode += `      status: ContentStatus.APPROVED,\n`;
      seedCode += `      submittedByUserId: adminUser.id,\n`;
      seedCode += `    },\n`;
      seedCode += `  });\n`;
      seedCode += `  console.log(\`Upserted RIO club: \${${varName}.name} (ID: \${${varName}.id})\`);\n\n`;
      
      count++;
    }
    
    seedCode += `  console.log('Finished seeding ${count} RIO clubs.');\n`;
    
    // Read existing seed file
    console.log('Reading existing seed file...');
    if (!fs.existsSync(seedFilePath)) {
      throw new Error(`Seed file not found at: ${seedFilePath}`);
    }
    
    const seedContent = fs.readFileSync(seedFilePath, 'utf8');
    
    // Look for existing RIO section to replace
    const rioSectionStartMarker = '// --- RIO Clubs from Google Sheet ---';
    const rioSectionStart = seedContent.indexOf(rioSectionStartMarker);
    
    let updatedSeedContent;
    
    if (rioSectionStart !== -1) {
      // Find the end of the existing RIO section
      const rioSectionEndMarker = 'console.log(\'Finished seeding';
      const rioSectionEndSearchStart = rioSectionStart + rioSectionStartMarker.length;
      const rioSectionEnd = seedContent.indexOf(rioSectionEndMarker, rioSectionEndSearchStart);
      
      if (rioSectionEnd !== -1) {
        // Find the actual end of the line containing 'Finished seeding'
        const rioSectionRealEnd = seedContent.indexOf('\n', rioSectionEnd);
        if (rioSectionRealEnd !== -1) {
          // Replace the existing RIO section
          console.log('Replacing existing RIO clubs section...');
          updatedSeedContent = 
            seedContent.substring(0, rioSectionStart) + 
            seedCode + 
            seedContent.substring(rioSectionRealEnd + 1);
        } else {
          throw new Error('Could not find the end of the RIO section');
        }
      } else {
        throw new Error('Could not find the end marker of the RIO section');
      }
    } else {
      // No existing RIO section, find where to insert new code
      // Look for the part where clubs are seeded
      const insertMarker = 'console.log(\'Seeding Clubs...\');';
      const insertPos = seedContent.indexOf(insertMarker);
      
      if (insertPos === -1) {
        throw new Error('Could not find insertion point in seed file');
      }
      
      // Find the last club entry
      const lastClubPos = seedContent.lastIndexOf('console.log(`Upserted', insertPos);
      const insertCodePos = seedContent.indexOf('\n', lastClubPos) + 1;
      
      // Create updated seed content
      updatedSeedContent = 
        seedContent.substring(0, insertCodePos) + 
        '\n' + seedCode + '\n' +
        seedContent.substring(insertCodePos);
    }
    
    // Create backup of original file
    fs.writeFileSync(`${seedFilePath}.backup`, seedContent);
    console.log(`Created backup of original seed file at: ${seedFilePath}.backup`);
    
    // Write updated seed file
    fs.writeFileSync(seedFilePath, updatedSeedContent);
    console.log(`Updated seed file with ${count} RIO clubs.`);
    
    console.log('\nNext steps:');
    console.log('1. Run: npx prisma db seed');
    console.log('2. Start your app: npm run dev');
    
  } catch (error) {
    console.error('Error generating seed code:', error);
    if (error.response) {
      console.error('API Error:', error.response.data);
    }
  }
}

// Run the function
generateSeedCode();
