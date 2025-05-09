// Suggested modifications for scripts/event-scraping/scrape.js

// scrape.js
// Main orchestration script for the UH Manoa Event Scraper.

import dotenv from 'dotenv';
import fetchHtml from './fetch.js';
import { parseListPage, parseEventDetailPage } from './parse.js';
// Import the new function along with existing ones
import { saveEvent, removePastEvents, disconnectPrisma } from './db.js';

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
    await disconnectPrisma(); // Ensure disconnection on early exit
    return; // Exit if the main page fails
  }

  // 2. Extract detail page URLs
  const eventsToProcess = parseListPage(listHtml);
  if (eventsToProcess.length === 0) {
    console.log('No event links found on the main page.');
    await disconnectPrisma(); // Ensure disconnection on early exit
    return; // Exit if no events found
  }
  console.log(`Found ${eventsToProcess.length} unique event links to process.`);

  // 3. Process each detail page URL sequentially
  let processedCount = 0;
  let successCount = 0;
  let errorCount = 0;
  for (const eventInfo of eventsToProcess) {
    processedCount++;
    console.log(`--- Processing Event ID: ${eventInfo.eventId} (${processedCount}/${eventsToProcess.length}) ---`);
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
        successCount++; // Increment success only if saveEvent is called
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
  }

  console.log('\n--- Scraping Summary ---');
  console.log(`Total unique events found on list page: ${eventsToProcess.length}`);
  console.log(`Attempted processing (fetched & parsed): ${processedCount}`);
  console.log(`Successfully saved/updated: ${successCount}`);
  console.log(`Skipped or failed during fetch/parse/save: ${errorCount}`);

  // --- NEW STEP: Remove Past Events ---
  console.log('\n--- Starting Database Cleanup ---');
  try {
    await removePastEvents(); // Call the new function from db.js
  } catch (cleanupError) {
    console.error('An error occurred during the past events cleanup:', cleanupError);
  }
  console.log('--- Database Cleanup Finished ---');
  // --- END NEW STEP ---

  console.log('\nScraping and cleanup process finished.');
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
    await disconnectPrisma(); // Ensure prisma disconnect runs last
  });

// Handle graceful shutdown signals (Ctrl+C, termination)
// Ensure Prisma disconnects before exiting
async function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  // Allow main() to finish its current step if possible, then disconnect.
  // If immediate shutdown is needed, call disconnectPrisma directly.
  // Consider adding a flag to signal main() to stop early if needed.
  await disconnectPrisma();
  console.log('Prisma client disconnected during shutdown.');
  process.exit(0); // Exit cleanly
}

// Added check to prevent multiple listeners if script reloads (e.g., with nodemon)
if (!process.listenerCount('SIGINT')) {
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}
if (!process.listenerCount('SIGTERM')) {
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}
