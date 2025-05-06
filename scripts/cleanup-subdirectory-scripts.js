const fs = require('fs');
const path = require('path');

/**
 * Script to clean up unnecessary script files from subdirectories
 * This removes empty or redundant script files from club-scraping and event-scraping
 */

console.log('Starting cleanup of unnecessary subdirectory script files...');

// Files to remove
const filesToRemove = [
  // Empty files in club-scraping
  './scripts/club-scraping/import-rio-data.js',
  './scripts/club-scraping/rio-mapping.js',
  
  // Old event-scraping files that are no longer used (if we've moved to a different approach)
  // We'll keep these for now since they might still be useful, but they can be commented out if needed
  // './scripts/event-scraping/category-tagging.js',
  // './scripts/event-scraping/db.js',
  // './scripts/event-scraping/fetch.js',
  // './scripts/event-scraping/link-events-categories.js',
  // './scripts/event-scraping/parse.js',
  // './scripts/event-scraping/scrape.js',
];

// Count successful and failed deletions
let successCount = 0;
let failCount = 0;
let skippedCount = 0;

// Process each file
filesToRemove.forEach(filePath => {
  const fullPath = path.resolve(__dirname, '..', filePath);
  
  try {
    // Check if file exists
    if (fs.existsSync(fullPath)) {
      // Check if file is empty
      const stats = fs.statSync(fullPath);
      if (stats.size === 0) {
        // Delete the file
        fs.unlinkSync(fullPath);
        console.log(`✅ Deleted empty file: ${filePath}`);
        successCount++;
      } else {
        // If file is not empty, check if we still want to delete it
        if (filePath.includes('import-rio-data.js') || filePath.includes('rio-mapping.js')) {
          fs.unlinkSync(fullPath);
          console.log(`✅ Deleted file: ${filePath}`);
          successCount++;
        } else {
          console.log(`⚠️ File is not empty, skipping: ${filePath}`);
          skippedCount++;
        }
      }
    } else {
      console.log(`⚠️ File not found: ${filePath}`);
      skippedCount++;
    }
  } catch (error) {
    console.error(`❌ Error deleting ${filePath}: ${error.message}`);
    failCount++;
  }
});

// Check if subdirectories are empty and remove them if they are
const subdirectories = [
  './scripts/club-scraping',
  './scripts/event-scraping'
];

subdirectories.forEach(dirPath => {
  const fullPath = path.resolve(__dirname, '..', dirPath);
  
  try {
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath);
      if (files.length === 0) {
        fs.rmdirSync(fullPath);
        console.log(`✅ Removed empty directory: ${dirPath}`);
      } else {
        console.log(`Directory still contains ${files.length} files: ${dirPath}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error checking directory ${dirPath}: ${error.message}`);
  }
});

// Print summary
console.log('\nCleanup completed:');
console.log(`- ${successCount} script files successfully deleted`);
console.log(`- ${skippedCount} files skipped (not found or not empty)`);
console.log(`- ${failCount} files failed to delete`); 