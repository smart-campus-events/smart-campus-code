const fs = require('fs');
const path = require('path');

/**
 * Script to clean up unnecessary script files from the project
 * This removes redundant, empty, or no-longer-needed script files
 */

console.log('Starting cleanup of unnecessary script files...');

// Files to remove
const filesToRemove = [
  // Empty or near-empty scripts
  './scripts/add-missing-clubs.js',
  './scripts/fix-club-descriptions.js',
  './scripts/fix-club-purposes.js',
  
  // Temporary test/debug scripts
  './scripts/check-event-description.js',
  './scripts/check-event.js',
  './scripts/check-event-urls.js',
  './scripts/check-missing-clubs.js',
  './scripts/check-sheet-data.js',
  './scripts/get-james-event.js',
  './scripts/fix-event-descriptions-debug.js',
  './scripts/fix-zarsadiaz-event.js',
  './scripts/test-sheets-access.js',
  './scripts/updated-event-descriptions.js',
  
  // One-time data migration scripts (already used)
  './scripts/add-sample-clubs.js',
  './scripts/add-sample-events.js',
  './scripts/remove-sample-events.js',
  './scripts/remove-fake-clubs.js',
  './scripts/cleanup-fragment-clubs.js',
  './scripts/restore-legitimate-clubs.js',
  
  // Redundant club import scripts (keeping only import-clubs-from-row9.js as the most up-to-date one)
  './scripts/import-clubs-from-csv.js',
  './scripts/import-clubs-from-json-credentials.js',
  './scripts/import-clubs-row8.js',
  './scripts/import-clubs-with-google-api.js',
  './scripts/import-clubs.js',
  './scripts/import-from-sheets.js',
  './scripts/import-full-clubs.js',
  './scripts/fetch-clubs-from-published-sheet.js',
  './scripts/import-complete-clubs-only.js',
  './scripts/import-only-organization-names.js',
  
  // Redundant event description scripts (keeping only update-event-descriptions.js)
  './scripts/extract-better-descriptions.js',
  './scripts/extract-focused-descriptions.js',
  './scripts/update-all-event-descriptions.js',
  './scripts/fetch-event-descriptions.js',
  './scripts/fix-description-directly.js',
  './scripts/fix-event-descriptions.js',
  './scripts/reset-event-descriptions.js',
  
  // One-time cleanup scripts (already used)
  './scripts/clean-club-categories.js',
  './scripts/remove-text-fragments.js',
  
  // One-time event fixes (already used)
  './scripts/fix-event-dates.js', 
  './scripts/fix-event-display-times.js',
  './scripts/fix-event-times.js',
  './scripts/fix-hawaii-timezone.js',
  './scripts/fix-uh-events.js',
  './scripts/update-zarsadiaz-description.js',
  './scripts/move-events-to-current-month.js',
  './scripts/correct-event-dates.js',
  './scripts/diversify-event-categories.js',
  './scripts/clear-event-descriptions.js',
  
  // Old redundant scripts in the main scripts directory
  './scripts/update-club-categories.js',
  './scripts/update-club-purposes.js',
  './scripts/update-event-links.js',
  './scripts/sync-with-uh-calendar.js'
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

// Print summary
console.log('\nCleanup completed:');
console.log(`- ${successCount} script files successfully deleted`);
console.log(`- ${skippedCount} files skipped (not found)`);
console.log(`- ${failCount} files failed to delete`); 