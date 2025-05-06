#!/usr/bin/env node

/**
 * Script to import clubs from Google Sheets
 * Usage: node scripts/import-clubs.js
 */

// Execute the club import script
require('./club-scraping/import-club-data.js');

console.log('Starting club import process...'); 