/**
 * Script to fetch missing clubs from the UH Manoa Approved RIOs Google Sheet
 * and import them into the database
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

// List of club names that we specifically want to ensure are in the database
const importantClubsToImport = [
  "ROC", // Ensure proper purpose and category
  "Hawaii Society for Epistemic Innovation, Integrative Studies, and Transformative Research (IMUA)",
  "Hawaii Streams and Ecosystems Club",
  "Hawaii Student Entrepreneurs Club",
  "Hawaii Undergraduate Initiative",
  "Hawaii Women Lawyers Student Organization",
  // Add more clubs to look for here
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

// Check if a club is a text fragment that should be skipped
function isTextFragment(clubName, purpose) {
  // Skip very short names or purposes
  if (clubName.length < 3) return true;
  
  // Skip entries starting with common fragment indicators
  const fragmentStarts = [
    "Section", "To encourage", "To provide", "To promote", "We aim", 
    "To foster", "Mission", "academics", "Originally", "Through our",
    "This shall", "We represent", "students and", "of students", "to fostering",
    "The council", "patients and", "increase awareness", "➤", "•", "-", "–",
    "1.", "2.", "3.", "4.", "5.", "A.", "B.", "C.", "D."
  ];
  
  for (const start of fragmentStarts) {
    if (clubName.startsWith(start)) return true;
  }
  
  // Return false if it passes all checks
  return false;
}

async function fetchAndImportClubs() {
  console.log('Starting to fetch missing clubs from Google Sheet...');
  
  try {
    // Get existing clubs from the database for comparison
    const existingClubs = await prisma.club.findMany();
    const existingClubNames = existingClubs.map(c => c.name);
    
    console.log(`Found ${existingClubs.length} existing clubs in the database`);
    
    // Fetch the CSV data
    console.log(`Fetching data from: ${publishedSheetUrl}`);
    const response = await axios.get(publishedSheetUrl);
    const csvData = response.data;
    
    // Parse the CSV data
    const lines = csvData.split('\n');
    console.log(`Found ${lines.length} lines in the CSV`);
    
    // Find the header row
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
    const contactEmailIndex = headers.findIndex(h => h.includes('Contact Person'));
    const purposeIndex = headers.findIndex(h => h.includes('purpose') || h === 'G');
    
    if (nameIndex === -1) {
      console.error('Could not find "Name of Organization" column');
      return;
    }
    
    // Start from the row after the header
    const startRow = headerRow + 1;
    
    // Track progress
    let newCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let updatedCount = 0;
    
    // Process each row
    for (let i = startRow; i < lines.length; i++) {
      // Skip empty lines
      if (!lines[i].trim()) {
        continue;
      }
      
      // Parse row - handle quoted fields with commas
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
      
      // For purpose, try to find it in the expected column, otherwise use the manually specified index
      let purpose = '';
      if (purposeIndex !== -1) {
        purpose = row[purposeIndex]?.replace(/^"(.+)"$/, '$1').trim();
      } else if (row.length > 6) {
        purpose = row[6]?.replace(/^"(.+)"$/, '$1').trim(); // Column G
      }
      
      // Skip if no club name
      if (!clubName) {
        continue;
      }
      
      // Check if this is a text fragment to skip
      if (isTextFragment(clubName, purpose)) {
        console.log(`Skipping text fragment: "${clubName}"`);
        skippedCount++;
        continue;
      }
      
      // Skip if we already have this club (unless it's in our important list)
      const isImportant = importantClubsToImport.some(name => 
        clubName.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(clubName.toLowerCase())
      );
      
      const alreadyExists = existingClubNames.some(name => 
        name.toLowerCase() === clubName.toLowerCase()
      );
      
      if (alreadyExists && !isImportant) {
        console.log(`Club "${clubName}" already exists, skipping`);
        continue;
      }
      
      // Ensure purpose has content for legitimate clubs
      if (!purpose) {
        console.log(`Adding default purpose for "${clubName}"`);
        purpose = `The purpose of ${clubName} is to provide students with opportunities to engage in activities related to ${categoryName || 'their interests'}.`;
      }
      
      try {
        // Find or create category
        let category = null;
        if (categoryName) {
          category = await findOrCreateCategory(categoryName);
        }
        
        // Prepare club data
        const clubData = {
          name: clubName,
          purpose,
          categoryDescription: categoryName || null,
          primaryContactName: contactName || null,
          contactEmail: contactEmail || null,
          status: ContentStatus.APPROVED, // Default status for imported clubs
        };
        
        // Special case for ROC - don't override our carefully updated purpose
        if (clubName === "ROC" && alreadyExists) {
          console.log(`Skipping update for ROC to preserve existing purpose`);
          continue;
        }
        
        // Upsert the club (create if doesn't exist, update if it does)
        const club = await prisma.club.upsert({
          where: { name: clubName },
          update: alreadyExists ? { 
            // Only update contact info for existing clubs
            primaryContactName: contactName || undefined,
            contactEmail: contactEmail || undefined
          } : clubData,
          create: clubData,
        });
        
        // Create category association if category was found or created
        if (category) {
          // Check if club already has this category
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
        
        if (alreadyExists) {
          console.log(`Updated club: "${clubName}"`);
          updatedCount++;
        } else {
          console.log(`Imported new club: "${clubName}"`);
          newCount++;
        }
      } catch (error) {
        console.error(`Error importing club "${clubName}":`, error.message);
        errorCount++;
      }
    }
    
    console.log('\nImport complete:');
    console.log(`- ${newCount} new clubs imported`);
    console.log(`- ${updatedCount} existing clubs updated`);
    console.log(`- ${skippedCount} text fragments skipped`);
    console.log(`- ${errorCount} errors encountered`);
    
  } catch (error) {
    console.error('Error fetching or processing Google Sheet:', error.message);
  }
}

// Run the function
fetchAndImportClubs()
  .catch(error => {
    console.error('Error during import process:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 