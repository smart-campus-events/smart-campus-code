/**
 * Script to import clubs directly from the Google Sheet, starting from row 9
 * This ensures we only get legitimate clubs and not text fragments
 */

const { PrismaClient, ContentStatus } = require('@prisma/client');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Google Sheet ID and GID
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '1vK_ixq3a86uXjHXy9oNnyYHwAvyU9smNPKuJU6OYd-Q';
const SHEET_GID = process.env.GOOGLE_SHEET_GID || '828154192';

// URL to access published sheet in CSV format
const publishedSheetUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

// List of important clubs to ensure are imported
const importantClubs = [
  "SPARK (Service Passion Advocacy Responsibility Kindness)",
  "ROC",
  "MRUH", 
  "Young Skal",
  "The Hawaii Pickleball Club at University of Hawaii Manoa",
  "Hawaii Society for Epistemic Innovation, Integrative Studies, and Transformative Research (IMUA)",
  "Hawaii Streams and Ecosystems Club",
  "Hawaii Student Entrepreneurs Club",
  "Hawaii Undergraduate Initiative",
  "Hawaii Women Lawyers Student Organization"
];

// Patterns that indicate rows to skip (just for safety)
const skipPatterns = [
  "section",
  "originally",
  "through our",
  "this shall",
  "we represent",
  "the council's",
  "mission"
];

// Helper function to find or create a category
async function findOrCreateCategory(categoryName) {
  if (!categoryName) return null;
  
  // Normalize the category name
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
  
  // If no category found, create it
  if (!category) {
    category = await prisma.category.create({
      data: { name: normalizedName },
    });
    console.log(`Created new category: "${normalizedName}"`);
  }
  
  return category;
}

// Helper function to check if a row should be imported
function shouldImportRow(clubName, rowIndex) {
  // Skip if no club name
  if (!clubName || clubName.trim().length === 0) {
    return false;
  }
  
  // Always include important clubs
  if (importantClubs.some(name => 
    clubName.toLowerCase().includes(name.toLowerCase()) || 
    name.toLowerCase().includes(clubName.toLowerCase())
  )) {
    return true;
  }
  
  // Skip rows with patterns that indicate non-club rows
  const lowerName = clubName.toLowerCase();
  if (skipPatterns.some(pattern => lowerName.includes(pattern))) {
    return false;
  }
  
  // Skip very short names that are likely incomplete
  if (clubName.length < 4) {
    return false;
  }
  
  return true;
}

async function importClubsFromSheet() {
  console.log('Starting clean import of clubs from Google Sheet...');
  
  try {
    // First, get existing clubs from database for comparison
    const existingClubs = await prisma.club.findMany();
    const existingClubNames = existingClubs.map(c => c.name);
    
    console.log(`Found ${existingClubs.length} existing clubs in database`);
    
    // Fetch the CSV data
    console.log(`Fetching data from: ${publishedSheetUrl}`);
    const response = await axios.get(publishedSheetUrl);
    const csvData = response.data;
    
    // Parse the CSV data
    const lines = csvData.split('\n');
    console.log(`Found ${lines.length} lines in the CSV`);
    
    // Find the header row (should be around row 7-8)
    let headerRow = -1;
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      if (lines[i].includes('Name of Organization') || 
          lines[i].includes('Type') || 
          lines[i].includes('Main Contact Person')) {
        headerRow = i;
        break;
      }
    }
    
    if (headerRow === -1) {
      console.error('Could not find header row in the CSV');
      return;
    }
    
    console.log(`Found header row at line ${headerRow + 1}`);
    
    // Parse headers
    const headers = lines[headerRow].split(',').map(h => h.trim().replace(/^"(.+)"$/, '$1'));
    
    // Find column indexes
    const nameIndex = headers.findIndex(h => h.includes('Name of Organization'));
    const typeIndex = headers.findIndex(h => h.includes('Type'));
    const contactNameIndex = headers.findIndex(h => h.includes('Main Contact Person'));
    const contactEmailIndex = headers.findIndex(h => h.includes('Contact Person Email'));
    const purposeIndex = headers.findIndex(h => h.includes('purpose') || h === 'G');
    
    if (nameIndex === -1) {
      console.error('Could not find "Name of Organization" column');
      return;
    }
    
    console.log(`Club name column index: ${nameIndex}`);
    console.log(`Club type column index: ${typeIndex}`);
    console.log(`Contact name column index: ${contactNameIndex}`);
    console.log(`Contact email column index: ${contactEmailIndex}`);
    console.log(`Purpose column index: ${purposeIndex}`);
    
    // Start from row 9 (which should be the first club row)
    const startingRow = headerRow + 1;
    
    // Counters for stats
    let importCount = 0;
    let updateCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    // Process each row
    for (let i = startingRow; i < lines.length; i++) {
      // Skip empty lines
      if (!lines[i].trim()) {
        continue;
      }
      
      // Parse CSV line handling quoted fields with commas correctly
      let row = [];
      let inQuote = false;
      let field = '';
      
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          row.push(field);
          field = '';
        } else {
          field += char;
        }
      }
      
      // Add the last field
      row.push(field);
      
      // Get club data
      const clubName = row[nameIndex]?.replace(/^"(.+)"$/, '$1').trim();
      const categoryName = row[typeIndex]?.replace(/^"(.+)"$/, '$1').trim();
      const contactName = contactNameIndex !== -1 ? row[contactNameIndex]?.replace(/^"(.+)"$/, '$1').trim() : null;
      const contactEmail = contactEmailIndex !== -1 ? row[contactEmailIndex]?.replace(/^"(.+)"$/, '$1').trim() : null;
      
      // For purpose, try to find it in the expected column
      let purpose = '';
      if (purposeIndex !== -1 && row[purposeIndex]) {
        purpose = row[purposeIndex]?.replace(/^"(.+)"$/, '$1').trim();
      }
      
      // Check if we should import this row
      if (!shouldImportRow(clubName, i)) {
        console.log(`Skipping row ${i+1}: "${clubName || '[empty]'}"`);
        skipCount++;
        continue;
      }
      
      // Check if a club with this name already exists
      const clubExists = existingClubNames.some(name => name.toLowerCase() === clubName.toLowerCase());
      
      // Ensure we have a purpose (use default if missing)
      if (!purpose) {
        purpose = `The purpose of ${clubName} is to provide students with opportunities to engage in activities related to ${categoryName || 'their interests'}.`;
        console.log(`Using default purpose for "${clubName}"`);
      }
      
      try {
        // Find or create the category
        let category = null;
        if (categoryName) {
          category = await findOrCreateCategory(categoryName);
        }
        
        // Special case for ROC - don't override existing purpose
        if (clubName === "ROC" && clubExists) {
          console.log(`Skipping update for ROC to preserve purpose`);
          continue;
        }
        
        // Create or update the club
        const club = await prisma.club.upsert({
          where: { name: clubName },
          update: {
            // For existing clubs, only update contact info
            primaryContactName: contactName || undefined,
            contactEmail: contactEmail || undefined,
            // Only update category if we have one
            categoryDescription: categoryName || undefined
          },
          create: {
            name: clubName,
            purpose,
            categoryDescription: categoryName || null,
            primaryContactName: contactName || null,
            contactEmail: contactEmail || null,
            status: ContentStatus.APPROVED, // Default status for imported clubs
          },
        });
        
        // Create category association if needed
        if (category) {
          // Check if the club already has this category
          const existingAssoc = await prisma.clubCategory.findFirst({
            where: {
              clubId: club.id,
              categoryId: category.id
            }
          });
          
          if (!existingAssoc) {
            await prisma.clubCategory.create({
              data: {
                clubId: club.id,
                categoryId: category.id
              }
            });
          }
        }
        
        if (clubExists) {
          console.log(`Updated club: "${clubName}"`);
          updateCount++;
        } else {
          console.log(`Imported club: "${clubName}"`);
          importCount++;
        }
      } catch (error) {
        console.error(`Error with club "${clubName}":`, error.message);
        errorCount++;
      }
    }
    
    console.log('\nImport complete:');
    console.log(`- ${importCount} new clubs imported`);
    console.log(`- ${updateCount} existing clubs updated`);
    console.log(`- ${skipCount} rows skipped`);
    console.log(`- ${errorCount} errors encountered`);
    
  } catch (error) {
    console.error('Error fetching or processing data:', error.message);
  }
}

// Run the function
importClubsFromSheet()
  .catch(error => {
    console.error('Error during import process:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 