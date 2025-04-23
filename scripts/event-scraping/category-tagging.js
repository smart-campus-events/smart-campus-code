/**
 * Script to automatically tag events in a PostgreSQL database using Prisma and the Gemini API.
 * (JavaScript Version with Retry Logic)
 *
 * Prerequisites:
 * 1. Node.js and npm/yarn installed.
 * 2. Prisma installed and configured (`schema.prisma`, `npx prisma generate`).
 * 3. `.env` file in the project root with `GEMINI_API_KEY` and `DATABASE_URL`.
 * 4. Dependencies installed: `npm install @google/generative-ai dotenv @prisma/client`
 *
 * How to Run:
 * 1. Execute the script directly using Node.js: `node path/to/your/script/tagEvents.js` (adjust path as needed)
 */

// Using require for CommonJS modules
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

// --- Configuration ---

// Load environment variables from .env file located relative to the script's location
// Adjust the path depth ('../../.env') if your script location or project structure differs.
try {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Common location if script is in src/scripts
  console.log('Loaded environment variables from:', path.resolve(__dirname, '../../.env'));
} catch (err) {
  console.warn('Could not load .env file. Ensure it exists at the project root.', err);
}

// Initialize Prisma Client
const prisma = new PrismaClient();

// Gemini API Configuration
const { GEMINI_API_KEY } = process.env;
if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY not found in environment variables.');
  console.error('Ensure it is set in your .env file at the project root.');
  process.exit(1); // Exit if API key is missing
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// Define the Gemini model to use
const geminiModelName = 'gemini-1.5-flash';
const geminiModel = genAI.getGenerativeModel({
  model: geminiModelName,
  // Optional: Configure safety settings
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ],
});

console.log(`Using Gemini model: ${geminiModelName}`);

// --- Helper Functions ---

/**
 * Creates a promise that resolves after a specified number of milliseconds.
 * Used for rate limiting API calls and retry delays.
 * @param {number} ms - The number of milliseconds to wait.
 * @returns {Promise<void>} A promise that resolves when the time is up.
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Database Functions (using Prisma) ---

/**
 * Fetches a batch of events from the database that have NULL or empty 'category_tags'.
 * @param {number} limit - The maximum number of events to fetch in this batch.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of events needing tags.
 */
async function fetchUntaggedEvents(limit) {
  console.log(`Fetching up to ${limit} untagged events...`);
  try {
    const events = await prisma.event.findMany({
      where: {
        // Find events where category_tags is null OR an empty string
        OR: [
          { category_tags: null },
          { category_tags: '' },
        ],
      },
      select: { // Select only the fields needed for generating tags
        event_id: true,
        title: true,
        description: true,
        organizer_sponsor: true,
        location: true,
      },
      take: limit, // Apply the batch limit
      orderBy: { // Optional: process older events first
        created_at: 'asc',
      },
    });
    console.log(`Fetched ${events.length} events.`);
    return events;
  } catch (error) {
    console.error('Error fetching untagged events from database:', error);
    return []; // Return empty array on error
  }
}

/**
 * Updates the 'category_tags' for a specific event in the database.
 * @param {string} eventId - The unique ID of the event to update.
 * @param {string} tags - The comma-separated string of tags to set.
 * @returns {Promise<boolean>} A promise that resolves to true if the update was successful, false otherwise.
 */
async function updateEventTags(eventId, tags) {
  try {
    await prisma.event.update({
      where: { event_id: eventId },
      data: {
        category_tags: tags,
        // 'updated_at' is automatically handled by Prisma via @updatedAt in schema.prisma
      },
    });
    // console.log(`Successfully updated tags for event_id: ${eventId}`);
    return true;
  } catch (error) {
    console.error(`Error updating tags in database for event_id ${eventId}:`, error);
    return false; // Indicate failure
  }
}

// --- Gemini Tagging Function ---

/**
 * Generates category tags for a given event using the configured Gemini model.
 * Includes retry logic for API errors (e.g., rate limits).
 * @param {object} event - The event data (subset) to generate tags for.
 * @returns {Promise<string | null>} A promise that resolves to a comma-separated string of tags, or null if generation fails after retries.
 */
async function generateTagsWithGemini(event) {
  // 1. Prepare the input text for Gemini
  const title = event.title ?? '';
  let description = event.description ?? '';
  const organizer = event.organizer_sponsor ?? '';
  const location = event.location ?? '';

  // 2. Limit description length
  const maxDescLength = 1000;
  if (description.length > maxDescLength) {
    description = `${description.substring(0, maxDescLength)}...`;
  }

  // 3. Construct the prompt
  const prompt = `
Analyze the following event information and generate 1 to 3 relevant category tags, separated only by commas (e.g., Tag1,Tag2,Tag3).
Focus on the core topic, event type, or primary audience. Use concise, descriptive tags.
Examples of good tags: Workshop, Seminar, Arts & Culture, Technology, Career Fair, Sports, Community Service, Academic Lecture, Student Life, Health & Wellness, Music Performance, Sustainability, Diversity & Inclusion.
Avoid generic tags like 'Event', 'General', 'Meeting', or 'Information'.

Event Details:
Title: ${title}
Description: ${description}
Organizer/Sponsor: ${organizer}
Location: ${location}

Suggested Tags (1-3, comma-separated):
`;

  // 4. Call the Gemini API with retry logic
  let attempt = 1;
  const maxAttempts = 2; // Initial attempt + 1 retry
  const retryDelay = 10000; // 10 seconds wait before retry

  while (attempt <= maxAttempts) {
    try {
      // console.log(`--- Sending Prompt (Attempt ${attempt}) for Event ID: ${event.event_id} ---`);
      // console.log(prompt); // Uncomment for debugging prompt
      // console.log("---");

      const result = await geminiModel.generateContent(prompt);
      const { response } = result;

      // Check for safety blocks or lack of content (don't retry these)
      if (!response || !response.text) {
        console.warn(`Warning: Gemini response was empty or blocked (Attempt ${attempt}) for event_id: ${event.event_id}.`);
        if (response?.promptFeedback?.blockReason) {
          console.warn(` -> Block Reason: ${response.promptFeedback.blockReason}`);
          console.warn(` -> Safety Ratings: ${JSON.stringify(response.promptFeedback.safetyRatings)}`);
        }
        return null; // Exit function, no retry needed for this specific case
      }

      const tagsText = response.text().trim();

      // 5. Clean and format the successful response
      let cleanedTagsText = tagsText.replace(/[`"]/g, ''); // Remove backticks and quotes
      cleanedTagsText = cleanedTagsText.replace(/^[^\w]+|[^\w]+$/g, ''); // Remove leading/trailing non-word chars

      let tagsList = cleanedTagsText.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0); // Filter out empty tags

      tagsList = tagsList.slice(0, 3); // Limit to 3 tags

      if (tagsList.length === 0) {
        console.warn(`Warning: Gemini returned text, but no valid tags could be extracted (Attempt ${attempt}) for event_id: ${event.event_id}. Raw response: "${tagsText}"`);
        return null; // No valid tags extracted
      }

      const finalTags = tagsList.join(', '); // Join with comma and space

      // console.log(`Raw Gemini Response: "${tagsText}"`); // Uncomment for debugging
      // console.log(`Cleaned Tags: "${finalTags}"`);

      return finalTags; // Success! Return the tags
    } catch (error) {
      console.error(`Error calling Gemini API (Attempt ${attempt}) for event_id ${event.event_id}:`, error);

      // Check if it's the last attempt
      if (attempt === maxAttempts) {
        console.error(` -> Max attempts reached for event ${event.event_id}. Giving up on this event.`);
        return null; // Failed after retry
      }

      // Assume error might be rate-related or temporary, prepare for retry
      console.warn(` -> Possible rate limit or temporary API error. Waiting ${retryDelay / 1000} seconds before retrying...`);
      await sleep(retryDelay); // Wait before the next attempt
      attempt++; // Increment attempt counter and loop again
    }
  }
  // Fallback in case loop logic has issues (should not normally be reached)
  console.error(`Exited retry loop unexpectedly for event ${event.event_id}.`);
  return null;
}

// --- Main Execution Logic ---

/**
 * Main function to orchestrate the event tagging process.
 */
async function main() {
  console.log('Starting event tagging script (JavaScript version with Retry Logic)...');
  let totalEventsProcessed = 0;
  let totalEventsSuccessfullyTagged = 0;
  const batchSize = 50; // Process N events at a time
  const delayBetweenApiCalls = 4000; // 4 seconds delay between successful API calls

  try {
    while (true) {
      const untaggedEvents = await fetchUntaggedEvents(batchSize);

      if (untaggedEvents.length === 0) {
        console.log('No more untagged events found in the database.');
        break; // Exit loop if no events left
      }

      console.log(`\n--- Processing Batch of ${untaggedEvents.length} Events ---`);

      // Process each event in the current batch
      for (const event of untaggedEvents) {
        totalEventsProcessed++;
        console.log(`Processing Event ${totalEventsProcessed}: ID: ${event.event_id} | Title: ${event.title.substring(0, 50)}...`);

        // Generate tags using the function with retry logic
        const generatedTags = await generateTagsWithGemini(event);

        // If tags were successfully generated (even after retry), update the database
        if (generatedTags) {
          const updateSuccess = await updateEventTags(event.event_id, generatedTags);
          if (updateSuccess) {
            console.log(`  -> Successfully tagged as: "${generatedTags}"`);
            totalEventsSuccessfullyTagged++;
          } else {
            // Error message already logged in updateEventTags
            console.log('  -> Failed to update tags in DB.');
          }
        } else {
          // Failure message already logged in generateTagsWithGemini (after retries if applicable)
          console.log('  -> Failed to generate tags for this event.');
        }

        // Wait before processing the next event in the batch
        // This delay happens regardless of whether the API call succeeded or failed/retried
        // console.log(`Waiting ${delayBetweenApiCalls / 1000} seconds before next event...`); // Uncomment for verbose logging
        await sleep(delayBetweenApiCalls);
      } // End for loop (processing events in batch)

      console.log('--- Batch Complete ---');

      // If the number of events fetched was less than the batch size,
      // it implies we've processed the last available batch.
      if (untaggedEvents.length < batchSize) {
        console.log('Processed the last available batch of events.');
        break; // Exit the main while loop
      }
    } // End while loop (fetching batches)
  } catch (error) {
    // Catch any unexpected errors during the main loop (e.g., DB connection issues)
    console.error('An unexpected error occurred during the main processing loop:', error);
  } finally {
    // --- Final Summary and Cleanup ---
    console.log('\n--- Event Tagging Summary ---');
    console.log(`Total events checked/processed in this run: ${totalEventsProcessed}`);
    console.log(`Total events successfully tagged and updated: ${totalEventsSuccessfullyTagged}`);

    // Ensure the Prisma Client disconnects gracefully
    await prisma.$disconnect();
    console.log('Prisma client disconnected. Script finished.');
  }
}

// --- Script Entry Point ---
main()
  .catch((e) => {
    // Catch errors not handled within main's try/finally (e.g., initial DB connection)
    console.error('A critical error occurred:', e);
    process.exitCode = 1; // Indicate failure exit code
    // Attempt to disconnect Prisma even on critical failure
    prisma.$disconnect().catch(disconnectErr => {
      console.error('Error disconnecting Prisma client during critical failure:', disconnectErr);
    });
  });
