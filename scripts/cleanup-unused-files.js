const fs = require('fs');
const path = require('path');

/**
 * Script to clean up unnecessary files from the project
 * - Removes unused HTML files (mockPages and debug files)
 * - Removes empty or unused JavaScript files
 */

console.log('Starting cleanup of unnecessary files...');

// Files to remove
const filesToRemove = [
  // Root level files
  './event_44075_debug.html',
  './test-db.js',
  './update-clubs.js',
  
  // Mock HTML pages that aren't used
  './src/app/mockPages/clubs.html',
  './src/app/mockPages/editProfile.html',
  './src/app/mockPages/homePage.html',
  './src/app/mockPages/login1.html',
  './src/app/mockPages/login2.html',
  './src/app/mockPages/login3.html',
  './src/app/mockPages/login4.html',
  './src/app/mockPages/login5.html',
  './src/app/mockPages/profile.html',
  './src/app/mockPages/sampleClub.html',
  './src/app/mockPages/sampleEvent.html'
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
      // Delete the file
      fs.unlinkSync(fullPath);
      console.log(`✅ Deleted: ${filePath}`);
      successCount++;
    } else {
      console.log(`⚠️ File not found: ${filePath}`);
      skippedCount++;
    }
  } catch (error) {
    console.error(`❌ Error deleting ${filePath}: ${error.message}`);
    failCount++;
  }
});

// Try to remove the empty mockPages directory if it's now empty
try {
  const mockPagesDir = path.resolve(__dirname, '../src/app/mockPages');
  if (fs.existsSync(mockPagesDir)) {
    const files = fs.readdirSync(mockPagesDir);
    if (files.length === 0) {
      fs.rmdirSync(mockPagesDir);
      console.log('✅ Removed empty mockPages directory');
    } else {
      console.log(`⚠️ mockPages directory still contains ${files.length} files, not removing`);
    }
  }
} catch (error) {
  console.error(`❌ Error removing mockPages directory: ${error.message}`);
}

// Print summary
console.log('\nCleanup completed:');
console.log(`- ${successCount} files successfully deleted`);
console.log(`- ${skippedCount} files skipped (not found)`);
console.log(`- ${failCount} files failed to delete`); 