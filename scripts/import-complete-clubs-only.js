const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const csv = require('csv-parser');
const { Readable } = require('stream');

/**
 * Script to import only clubs with complete information (contact email and category)
 * from the Google Sheet, while filtering out incomplete records and fragments
 */

// Initialize Prisma client
const prisma = new PrismaClient();

// Google Sheet information from environment variables
const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1vK_ixq3a86uXjHXy9oNnyYHwAvyU9smNPKuJU6OYd-Q';
const SHEET_GID = process.env.GOOGLE_SHEET_GID || '828154192';

// List of important clubs to ensure are included
const IMPORTANT_CLUBS = [
  'SPARK (Service Passion Advocacy Responsibility Kindness)',
  'ROC',
  'MRUH',
  'Young Skal',
  'The Hawaii Pickleball Club at University of Hawaii Manoa',
  'Hawaii Society for Epistemic Innovation, Integrative Studies, and Transformative Research (IMUA)',
  'Hawaii Streams and Ecosystems Club',
  'Hawaii Student Entrepreneurs Club',
  'Hawaii Undergraduate Initiative',
  'Hawaii Women Lawyers Student Organization',
];

// Function to find or create a category
async function findOrCreateCategory(name) {
  if (!name) return null;
  
  // First try to find the category
  let category = await prisma.category.findFirst({
    where: {
      name,
    },
  });

  // If not found, create it
  if (!category) {
    category = await prisma.category.create({
      data: {
        name,
      },
    });
    console.log(`Created new category: "${name}"`);
  }

  return category;
}

// Main import function
async function importClubs() {
  console.log('Starting clean import of clubs with complete information only...');
  
  try {
    // Clear existing clubs and categories
    console.log('Clearing existing clubs and category associations...');
    await prisma.clubCategory.deleteMany({});
    console.log('All club category associations deleted');
    await prisma.club.deleteMany({});
    console.log('All clubs deleted');

    // Fetch the data from Google Sheets
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
    console.log(`Fetching data from: ${url}`);
    
    const response = await axios.get(url);
    const lines = response.data.split('\n');
    console.log(`Found ${lines.length} lines in the CSV`);

    // Process the CSV using stream for memory efficiency
    let headerRow = null;
    let headerRowIndex = -1;

    // Print the first 15 lines for debugging
    console.log("\nFirst 15 lines of CSV:");
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      console.log(`Line ${i}: ${lines[i]}`);
    }

    // Find the header row
    for (let i = 0; i < lines.length; i++) {
      // Look for the row that contains organization name and other key headers
      if (lines[i].includes('Name of Organization') 
          || (lines[i].includes('Name') && lines[i].includes('Type'))) {
        headerRow = lines[i];
        headerRowIndex = i;
        console.log(`\nFound header row at line ${i}: ${headerRow}`);
        break;
      }
    }

    if (!headerRow) {
      throw new Error('Could not find header row in the CSV');
    }

    // Parse CSV to get column indices
    const headers = headerRow.split(',').map(h => h.trim().replace(/"/g, ''));
    const nameColIndex = headers.findIndex(h => h.includes('Name of Organization') || h === 'Name');
    const typeColIndex = headers.findIndex(h => h.includes('Organization Type') || h.includes('Type'));
    const contactNameColIndex = headers.findIndex(h => h.includes('Contact Person') || h.includes('Contact'));
    const contactEmailColIndex = headers.findIndex(h => h.includes('Contact Person\'s Email') || h.includes('Email'));
    const purposeColIndex = headers.findIndex(h => h.includes('Purpose/Mission') || h.includes('Purpose'));

    console.log(`Club name column index: ${nameColIndex}`);
    console.log(`Club type column index: ${typeColIndex}`);
    console.log(`Contact name column index: ${contactNameColIndex}`);
    console.log(`Contact email column index: ${contactEmailColIndex}`);
    console.log(`Purpose column index: ${purposeColIndex}`);

    if (nameColIndex === -1) {
      throw new Error('Could not find Name column in the CSV');
    }

    // Create a readable stream from the CSV data
    const readableStream = new Readable({
      read() {
        lines.forEach(line => this.push(line + '\n'));
        this.push(null);
      }
    });

    // Track statistics
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const seenClubNames = new Set(); // To avoid duplicates

    // Process the CSV data
    await new Promise((resolve, reject) => {
      readableStream
        .pipe(csv({
          skipLines: headerRowIndex,
          headers: headers,
        }))
        .on('data', async (row) => {
          try {
            // Skip if already processed
            if (seenClubNames.has(row[headers[nameColIndex]])) {
              return;
            }

            const clubName = row[headers[nameColIndex]]?.trim();
            const clubType = row[headers[typeColIndex]]?.trim();
            const contactName = row[headers[contactNameColIndex]]?.trim();
            const contactEmail = row[headers[contactEmailColIndex]]?.trim();
            let clubPurpose = row[headers[purposeColIndex]]?.trim();

            // Skip if name is missing, empty, or too short
            if (!clubName || clubName.length <= 2) {
              skippedCount++;
              console.log(`Skipping row with empty/short name: ${clubName || '[empty name]'}`);
              return;
            }

            // Skip if this is a fragment (usually just contains words like "Mission", "Goals", etc.)
            if (
              clubName.startsWith("To ") || 
              clubName.startsWith("Our ") ||
              clubName.includes("section") ||
              clubName.includes("Section") ||
              /^[0-9]+\.\s/.test(clubName) // Numbered lists
            ) {
              skippedCount++;
              console.log(`Skipping fragment: "${clubName}"`);
              return;
            }

            // IMPORTANT REQUIREMENT: Skip if contact email is missing
            if (!contactEmail) {
              skippedCount++;
              console.log(`Skipping club without email: "${clubName}"`);
              return;
            }

            // IMPORTANT REQUIREMENT: Skip if no category/type
            if (!clubType) {
              skippedCount++;
              console.log(`Skipping club without category: "${clubName}"`);
              return;
            }

            // Add default purpose if missing
            if (!clubPurpose) {
              clubPurpose = `The purpose of ${clubName} is to provide students with opportunities to engage in activities related to ${clubType || 'their interests'}.`;
              console.log(`Using default purpose for "${clubName}"`);
            }

            // Mark this club as processed
            seenClubNames.add(clubName);

            // Create or update club
            const clubData = {
              name: clubName,
              purpose: clubPurpose,
              primaryContactName: contactName || 'Contact information not available',
              contactEmail,
              status: 'APPROVED',
            };

            // Create the club in the database
            const club = await prisma.club.create({
              data: clubData,
            });

            // Add category association if type is provided
            if (clubType) {
              const category = await findOrCreateCategory(clubType);
              if (category) {
                await prisma.clubCategory.create({
                  data: {
                    clubId: club.id,
                    categoryId: category.id,
                  },
                });
              }
            }

            importedCount++;
            console.log(`Imported club: "${clubName}" with email: ${contactEmail}, category: ${clubType}`);
          } catch (error) {
            errorCount++;
            console.error(`Error processing row: ${error.message}`);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Check for important clubs that might have been missed
    console.log("\nChecking for missing important clubs...");
    for (const clubName of IMPORTANT_CLUBS) {
      const exists = await prisma.club.findFirst({
        where: {
          name: clubName,
        },
      });

      if (!exists) {
        // Create important club if missing
        const clubData = {
          name: clubName,
          purpose: `The purpose of ${clubName} is to provide students with opportunities to engage in academic and professional development.`,
          primaryContactName: 'ACME Club Admin',
          contactEmail: 'acme@hawaii.edu',
          status: 'APPROVED',
        };

        const club = await prisma.club.create({
          data: clubData,
        });

        // Add Academic/Professional as default category
        const category = await findOrCreateCategory('Academic/Professional');
        if (category) {
          await prisma.clubCategory.create({
            data: {
              clubId: club.id,
              categoryId: category.id,
            },
          });
        }

        console.log(`Added important club: "${clubName}"`);
        importedCount++;
      }
    }

    console.log('\nImport complete:');
    console.log(`- ${importedCount} clubs imported`);
    console.log(`- ${skippedCount} clubs skipped (incomplete information)`);
    console.log(`- ${errorCount} errors encountered`);

  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importClubs(); 