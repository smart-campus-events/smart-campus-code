/**
 * Script to clean up the scripts directory by deleting unnecessary scripts
 * 
 * This script:
 * 1. Keeps only essential scripts in the main scripts directory
 * 2. Permanently deletes all other scripts to save storage space
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SCRIPTS_DIR = path.join(__dirname);

// List of essential scripts to keep in main directory
const ESSENTIAL_SCRIPTS = [
  'manoa-compass-data-manager.js',
  'delete-unnecessary-scripts.js',
  'README.md'
];

console.log('=== CLEANING UP SCRIPTS DIRECTORY ===');

// Get all files in the scripts directory
try {
  const files = fs.readdirSync(SCRIPTS_DIR);
  
  let deletedCount = 0;
  let keptCount = 0;
  
  for (const file of files) {
    const filePath = path.join(SCRIPTS_DIR, file);
    
    // Skip directories 
    const isDirectory = fs.statSync(filePath).isDirectory();
    if (isDirectory) {
      console.log(`Processing directory: ${file}`);
      
      // For directories, delete all files inside it
      try {
        const subFiles = fs.readdirSync(filePath);
        let subDeletedCount = 0;
        
        for (const subFile of subFiles) {
          const subFilePath = path.join(filePath, subFile);
          
          // Skip subdirectories
          if (fs.statSync(subFilePath).isDirectory()) {
            continue;
          }
          
          // Delete the file
          fs.unlinkSync(subFilePath);
          subDeletedCount++;
        }
        
        // Delete the now-empty directory
        fs.rmdirSync(filePath);
        console.log(`Deleted directory ${file} and its ${subDeletedCount} files`);
        deletedCount += subDeletedCount + 1;
      } catch (subError) {
        console.error(`Error processing subdirectory ${file}: ${subError.message}`);
      }
      
      continue;
    }
    
    // Skip essential scripts
    if (ESSENTIAL_SCRIPTS.includes(file)) {
      console.log(`Keeping essential script: ${file}`);
      keptCount++;
      continue;
    }
    
    // Delete the file
    try {
      fs.unlinkSync(filePath);
      console.log(`Deleted: ${file}`);
      deletedCount++;
    } catch (deleteError) {
      console.error(`Error deleting ${file}: ${deleteError.message}`);
    }
  }
  
  console.log(`\nCleanup complete!`);
  console.log(`- Deleted ${deletedCount} files/directories`);
  console.log(`- Kept ${keptCount} essential scripts`);
  
  // Create a new README.md with information about the scripts
  const readmePath = path.join(SCRIPTS_DIR, 'README.md');
  const readmeContent = `# Manoa Compass Scripts

This directory contains the essential scripts for the Manoa Compass application.

## Main Script

The primary script \`manoa-compass-data-manager.js\` combines all the essential functionality for:

1. **Importing Clubs**: Imports clubs from Google Sheets with email addresses
2. **Importing Events**: Imports events from UH Manoa calendar
3. **Cleaning Categories**: Standardizes categories for clubs and events
4. **Approving Content**: Approves all clubs and events
5. **Checking Data**: Verifies database contents

## Usage

To use the main script:

\`\`\`bash
node scripts/manoa-compass-data-manager.js [command]
\`\`\`

Available commands:
- \`import-clubs\`: Import clubs from Google Sheet
- \`import-events\`: Import events from UH Manoa calendar
- \`clean-categories\`: Clean and standardize categories
- \`approve-all\`: Approve all clubs and events
- \`check-data\`: Check database contents
- \`run-all\`: Run all commands in sequence
`;

  fs.writeFileSync(readmePath, readmeContent);
  console.log('Created new README.md');
  
} catch (error) {
  console.error(`Error cleaning up scripts: ${error}`);
  process.exit(1);
} 