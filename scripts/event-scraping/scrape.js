// scrape.js
// Main orchestration script for the UH Manoa Event Scraper.

import dotenv from 'dotenv';
import fetchHtml from './fetch.js';
import { parseListPage, parseEventDetailPage } from './parse.js';
import { saveEvent, disconnectPrisma } from './db.js'; // Import disconnectPrisma

dotenv.config(); // Load .env file

// --- Configuration ---
const BASE_URL = 'https://www.hawaii.edu/calendar/manoa/';
// IMPORTANT: Be respectful - minimum delay between requests to the *same domain*.
const REQUEST_DELAY_MS = 3000; // 3 seconds

/**
 * Pauses execution for a specified duration.
 * @param {number} ms - Duration in milliseconds.
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Main Execution Logic ---

async function main() {
  console.log('Starting UH Manoa Event Scraper...');

  // 1. Fetch the main calendar page
  const listHtml = await fetchHtml(BASE_URL);
  if (!listHtml) {
    console.error('Failed to fetch the main calendar page. Exiting.');
    return; // Exit if the main page fails
  }

  // 2. Extract detail page URLs
  const eventsToProcess = parseListPage(listHtml);
  if (eventsToProcess.length === 0) {
    console.log('No event links found on the main page.');
    return; // Exit if no events found
  }
  console.log(`Found ${eventsToProcess.length} unique event links to process.`);

  // 3. Process each detail page URL sequentially
  let processedCount = 0;
  let errorCount = 0;
  for (const eventInfo of eventsToProcess) {
    console.log(`--- Processing Event ID: ${eventInfo.eventId} (${processedCount + 1}/${eventsToProcess.length}) ---`);
    await delay(REQUEST_DELAY_MS); // Apply rate limiting BEFORE the request

    const detailHtml = await fetchHtml(eventInfo.url);
    if (!detailHtml) {
      console.error(`[${eventInfo.eventId}] Failed to fetch detail page: ${eventInfo.url}. Skipping.`);
      errorCount++;
      continue; // Skip to the next event
    }

    try {
      // Parse the detail page content
      const eventData = parseEventDetailPage(detailHtml, eventInfo.url, eventInfo.eventId);

      if (eventData) {
        // Save the parsed data to the database
        await saveEvent(eventData);
      } else {
        // Parsing function already logs errors/warnings if it returns null
        console.warn(`[${eventInfo.eventId}] Parsing returned null. Skipping save for ${eventInfo.url}`);
        errorCount++;
      }
    } catch (parseOrSaveError) {
      // Catch any unexpected errors during parsing or saving
      console.error(`[${eventInfo.eventId}] Unhandled error during processing for ${eventInfo.url}:`, parseOrSaveError);
      errorCount++;
    }
    processedCount++;
  }

  console.log('--- Scraping Summary ---');
  console.log(`Total events found on list page: ${eventsToProcess.length}`);
  console.log(`Successfully processed (attempted parse & save): ${processedCount - errorCount}`);
  console.log(`Skipped or failed: ${errorCount}`);
  console.log('Scraping process finished.');
}

// --- Script Execution & Shutdown Handling ---

// Run the main function
main()
  .catch(async (e) => {
    // Catch unexpected errors in the main execution flow
    console.error('An fatal error occurred in the main process:', e);
    // Ensure disconnection even on catastrophic failure
    await disconnectPrisma();
    process.exit(1); // Exit with error code
  })
  .finally(async () => {
    // This block runs whether main() succeeds or fails
    console.log('Main process finished or encountered error. Disconnecting Prisma client...');
    await disconnectPrisma();
  });

// Handle graceful shutdown signals (Ctrl+C, termination)
async function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  await disconnectPrisma();
  process.exit(0); // Exit cleanly
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
