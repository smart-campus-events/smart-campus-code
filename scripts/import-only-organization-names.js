/**
 * Script to import only clubs that are directly listed under the "Name of Organization" column
 * This ensures we get only legitimate club names, not text fragments
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

async function importClubsFromSheet() {
  console.log('Starting clean import of clubs from the Name of Organization column only...');
  
  try {
    // First clear out all existing clubs and categories
    console.log('Clearing existing clubs and category associations...');
    
    // Delete all ClubCategory associations
    await prisma.clubCategory.deleteMany({});
    console.log('All club category associations deleted');
    
    // Delete all Clubs 
    await prisma.club.deleteMany({});
    console.log('All clubs deleted');
    
    // Fetch the CSV data
    console.log(`Fetching data from: ${publishedSheetUrl}`);
    const response = await axios.get(publishedSheetUrl);
    const csvData = response.data;
    
    // Parse the CSV data
    const lines = csvData.split('\n');
    console.log(`Found ${lines.length} lines in the CSV`);
    
    // Find the header row (should be around row 7-8)
    let headerRow = -1;
    for (let i = 0; i < Math.min(20, lines.length); i++) {
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
    const contactEmailIndex = headers.findIndex(h => h.includes('Contact Person Email')) !== -1 ? 
      headers.findIndex(h => h.includes('Contact Person Email')) : 
      headers.findIndex(h => h.includes('Contact Email'));
    const purposeIndex = headers.findIndex(h => h.includes('Purpose') || h.includes('purpose'));
    
    if (nameIndex === -1) {
      console.error('Could not find "Name of Organization" column');
      return;
    }
    
    console.log(`Club name column index: ${nameIndex}`);
    console.log(`Club type column index: ${typeIndex}`);
    console.log(`Contact name column index: ${contactNameIndex}`);
    console.log(`Contact email column index: ${contactEmailIndex}`);
    console.log(`Purpose column index: ${purposeIndex}`);
    
    // Track what we've seen to avoid duplicates
    const seenClubNames = new Set();
    
    // Counters for stats
    let importCount = 0;
    let skipCount = 0;
    let emptyCount = 0;
    let errorCount = 0;
    
    // Process each row, starting from the header row + 1
    for (let i = headerRow + 1; i < lines.length; i++) {
      // Skip empty lines
      if (!lines[i].trim()) {
        emptyCount++;
        continue;
      }
      
      // Parse CSV line handling quoted fields with commas correctly
      const row = [];
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
      let clubName = row[nameIndex]?.replace(/^"(.+)"$/, '$1').trim();
      const categoryName = typeIndex !== -1 && row.length > typeIndex ? row[typeIndex]?.replace(/^"(.+)"$/, '$1').trim() : null;
      const contactName = contactNameIndex !== -1 && row.length > contactNameIndex ? row[contactNameIndex]?.replace(/^"(.+)"$/, '$1').trim() : null;
      const contactEmail = contactEmailIndex !== -1 && row.length > contactEmailIndex ? row[contactEmailIndex]?.replace(/^"(.+)"$/, '$1').trim() : null;
      
      // Get purpose if available
      let purpose = '';
      if (purposeIndex !== -1 && row.length > purposeIndex && row[purposeIndex]) {
        purpose = row[purposeIndex]?.replace(/^"(.+)"$/, '$1').trim();
      }
      
      // Skip if no club name or it's too short (likely not a real club name)
      if (!clubName || clubName.length < 4) {
        if (clubName) {
          console.log(`Skipping row ${i+1}: "${clubName}" (too short)`);
        } else {
          console.log(`Skipping row ${i+1}: [empty name]`);
        }
        skipCount++;
        continue;
      }
      
      // Skip if we've already seen this club
      if (seenClubNames.has(clubName.toLowerCase())) {
        console.log(`Skipping duplicate: "${clubName}"`);
        skipCount++;
        continue;
      }
      
      // Skip rows that seem to be fragments or descriptions
      if (clubName.startsWith('- ') || 
          clubName.startsWith('➤') || 
          clubName.startsWith('•') || 
          clubName.startsWith('1.') ||
          clubName.startsWith('2.') ||
          clubName.startsWith('Section') ||
          clubName.startsWith('Our ') ||
          clubName.startsWith('To ') ||
          clubName.toLowerCase().includes('this shall') ||
          clubName.toLowerCase().includes('through our') ||
          clubName.toLowerCase().includes('mission')) {
        console.log(`Skipping fragment: "${clubName}"`);
        skipCount++;
        continue;
      }
      
      // Track that we've seen this club
      seenClubNames.add(clubName.toLowerCase());
      
      // Ensure we have a purpose (use default if missing)
      if (!purpose || purpose.length < 10) {
        purpose = `The purpose of ${clubName} is to provide students with opportunities to engage in activities related to ${categoryName || 'their interests'}.`;
        console.log(`Using default purpose for "${clubName}"`);
      }
      
      try {
        // Find or create the category
        let category = null;
        if (categoryName) {
          category = await findOrCreateCategory(categoryName);
        }
        
        // Create the club
        const club = await prisma.club.create({
          data: {
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
          await prisma.clubCategory.create({
            data: {
              clubId: club.id,
              categoryId: category.id
            }
          });
        }
        
        console.log(`Imported club: "${clubName}"`);
        importCount++;
      } catch (error) {
        console.error(`Error importing club "${clubName}":`, error.message);
        errorCount++;
      }
    }
    
    // Now add any important clubs that might have been missed
    console.log('\nChecking for missing important clubs...');
    for (const importantClubName of importantClubs) {
      try {
        // Check if this important club was imported
        if (!seenClubNames.has(importantClubName.toLowerCase())) {
          console.log(`Adding important club: "${importantClubName}"`);
          
          // Find category
          const categoryName = "Academic/Professional"; // Default
          const category = await findOrCreateCategory(categoryName);
          
          // Create the club
          const club = await prisma.club.create({
            data: {
              name: importantClubName,
              purpose: `The purpose of ${importantClubName} is to provide students with opportunities to engage in academic and professional development activities.`,
              categoryDescription: categoryName,
              status: ContentStatus.APPROVED,
            },
          });
          
          // Create category association
          await prisma.clubCategory.create({
            data: {
              clubId: club.id,
              categoryId: category.id
            }
          });
          
          console.log(`Successfully added important club: "${importantClubName}"`);
          importCount++;
        }
      } catch (error) {
        console.error(`Error adding important club "${importantClubName}":`, error.message);
        errorCount++;
      }
    }
    
    console.log('\nImport complete:');
    console.log(`- ${importCount} clubs imported`);
    console.log(`- ${skipCount} rows skipped`);
    console.log(`- ${emptyCount} empty rows`);
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