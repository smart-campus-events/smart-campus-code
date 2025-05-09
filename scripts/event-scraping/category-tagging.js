/**
 * Script to automatically tag events in a PostgreSQL database using Prisma and the Gemini API,
 * saving a comma-separated string of allowed tags into the 'categoryTags' field.
 * (JavaScript Version with Retry Logic and Category Validation)
 *
 * Prerequisites:
 * 1. Node.js and npm/yarn installed.
 * 2. Prisma installed and configured (`schema.prisma` including the 'categoryTags' field, `npx prisma generate`).
 * 3. `.env` file in the project root with `GEMINI_API_KEY` and `DATABASE_URL`.
 * 4. Dependencies installed: `npm install @google/generative-ai dotenv @prisma/client`
 *
 * How to Run:
 * 1. Execute the script directly using Node.js: `node path/to/your/script/category-tagging.js` (adjust path as needed)
 */

// Using require for CommonJS modules
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

// --- Configuration ---

// Load environment variables
try {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Assuming .env is two levels up from script location
  console.log('Loaded environment variables from:', path.resolve(__dirname, '../../.env'));
} catch (err) {
  console.warn('Could not load .env file. Ensure it exists at the project root.', err);
}

// Initialize Prisma Client
const prisma = new PrismaClient();

// --- Allowed Categories will be fetched from the DB ---
let allowedCategories = [];
let allowedCategoriesSet = new Set();

// Gemini API Configuration
const { GEMINI_API_KEY } = process.env;
if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY not found in environment variables.');
  console.error('Ensure it is set in your .env file at the project root.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModelName = 'gemini-1.5-flash'; // Or your preferred model
const geminiModel = genAI.getGenerativeModel({
  model: geminiModelName,
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ],
});

console.log(`Using Gemini model: ${geminiModelName}`);

// --- Helper Functions ---

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Database Functions (using Prisma & Updated Schema - targeting 'categoryTags' field) ---

async function fetchUntaggedEvents(limit) {
  console.log(`Workspaceing up to ${limit} events with missing 'categoryTags'...`);
  try {
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { categoryTags: null },
          { categoryTags: '' },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        organizerSponsor: true,
        location: true,
      },
      take: limit,
      orderBy: {
        createdAt: 'asc',
      },
    });
    console.log(`Workspaceed ${events.length} events.`);
    return events;
  } catch (error) {
    console.error('Error fetching untagged events from database:', error);
    return [];
  }
}

async function updateEventTags(eventId, tagsString) {
  try {
    await prisma.event.update({
      where: { id: eventId },
      data: {
        categoryTags: tagsString,
      },
    });
    return true;
  } catch (error) {
    console.error(`Error updating categoryTags in database for event ID ${eventId}:`, error);
    return false;
  }
}

// --- Gemini Tagging Function (Updated for Allowed List & String Output) ---

async function generateTagsWithGemini(event) {
  const title = event.title ?? '';
  let description = event.description ?? '';
  const organizer = event.organizerSponsor ?? '';
  const location = event.location ?? '';

  const maxDescLength = 1000;
  if (description.length > maxDescLength) {
    description = `${description.substring(0, maxDescLength)}...`;
  }

  const prompt = `
Analyze the following event information. Your goal is to select all relevant category tags ONLY from the provided list below.
Return the selected tags separated only by commas (e.g., Tag1,Tag2,Tag3). Do NOT include any tags not in the list.

Allowed Categories:
${allowedCategories.join(', ')}

Event Details:
Title: ${title}
Description: ${description}
Organizer/Sponsor: ${organizer}
Location: ${location}

Selected Tags (1-3, comma-separated, strictly from the allowed list):
`;

  let attempt = 1;
  const maxAttempts = 2;
  const retryDelay = 10000;

  while (attempt <= maxAttempts) {
    try {
      const result = await geminiModel.generateContent(prompt);
      const { response } = result;

      if (!response || !response.text) {
        console.warn(`Warning: Gemini response empty/blocked (Attempt ${attempt}) for event ID: ${event.id}.`);
        if (response?.promptFeedback?.blockReason) {
          console.warn(` -> Block Reason: ${response.promptFeedback.blockReason}`);
        }
        // MODIFICATION: return null instead of retrying on empty/blocked response immediately
        // If you want to retry, remove the 'return null' and let the loop handle it.
        return null;
      }

      const tagsText = response.text().trim();
      let cleanedTagsText = tagsText.replace(/[\`"']/g, '');
      cleanedTagsText = cleanedTagsText.replace(/^[^\w]+|[^\w]+$/g, '');

      const suggestedTags = cleanedTagsText.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      let validTags = suggestedTags.filter(tag => allowedCategoriesSet.has(tag));
      validTags = validTags.slice(0, 3);

      if (validTags.length === 0) {
        console.warn(`Warning: Gemini response didn't contain valid allowed tags (Attempt ${attempt}) for event ID: ${event.id}. Raw response: "${tagsText}"`);
        // MODIFICATION: return null if no valid tags, don't retry from here
        return null;
      }

      const finalTagsString = validTags.join(', ');
      return finalTagsString;
    } catch (error) {
      console.error(`Error calling Gemini API (Attempt ${attempt}) for event ID ${event.id}:`, error);
      if (attempt === maxAttempts) {
        console.error(` -> Max attempts reached for event ${event.id}. Giving up.`);
        return null;
      }
      console.warn(` -> Waiting ${retryDelay / 1000} seconds before retrying...`);
      await sleep(retryDelay);
      attempt++;
    }
  }
  console.error(`Exited retry loop unexpectedly for event ${event.id}.`);
  return null;
}

// --- Main Execution Logic (Updated for String Tags) ---

async function main() {
  console.log('Starting event tagging script (Saving Allowed Tags as String)...');
  let totalEventsProcessed = 0;
  let totalEventsSuccessfullyTagged = 0;
  const batchSize = 50;
  const delayBetweenApiCalls = 4000;

  try {
    // Fetch categories from DB and initialize allowedCategories and allowedCategoriesSet
    const categoriesFromDB = await prisma.category.findMany({
      select: { name: true },
    });
    allowedCategories = categoriesFromDB.map(c => c.name);
    allowedCategoriesSet = new Set(allowedCategories);

    if (allowedCategories.length === 0) {
      console.error('No categories found in the database. Please ensure the Category table is populated. Exiting.');
      await prisma.$disconnect();
      process.exit(1);
    }
    console.log(`Dynamically loaded ${allowedCategories.length} allowed categories from the database: ${allowedCategories.join(', ')}`);

    while (true) {
      const untaggedEvents = await fetchUntaggedEvents(batchSize);

      if (untaggedEvents.length === 0) {
        console.log("No more events found with missing 'categoryTags'.");
        break;
      }

      console.log(`\n--- Processing Batch of ${untaggedEvents.length} Events ---`);

      for (const event of untaggedEvents) {
        totalEventsProcessed++;
        console.log(`Processing Event ${totalEventsProcessed}: ID: ${event.id} | Title: ${event.title.substring(0, 50)}...`);

        const generatedTagsString = await generateTagsWithGemini(event);

        if (generatedTagsString) {
          const updateSuccess = await updateEventTags(event.id, generatedTagsString);
          if (updateSuccess) {
            console.log(`  -> Successfully tagged as: "${generatedTagsString}"`);
            totalEventsSuccessfullyTagged++;
          } else {
            console.log(`  -> Failed to update categoryTags in DB for event ${event.id}.`);
          }
        } else {
          console.log(`  -> Failed to generate valid tags for event ${event.id}.`);
        }

        await sleep(delayBetweenApiCalls);
      }

      console.log('--- Batch Complete ---');

      if (untaggedEvents.length < batchSize) {
        console.log('Processed the last available batch of events.');
        break;
      }
    }
  } catch (error) {
    console.error('An unexpected error occurred during the main processing loop:', error);
  } finally {
    console.log('\n--- Event Tagging Summary ---');
    console.log(`Total events checked/processed: ${totalEventsProcessed}`);
    console.log(`Total events successfully tagged (categoryTags updated): ${totalEventsSuccessfullyTagged}`);

    await prisma.$disconnect();
    console.log('Prisma client disconnected. Script finished.');
  }
}

// --- Script Entry Point ---
main()
  .catch((e) => {
    console.error('A critical error occurred:', e);
    process.exitCode = 1;
    prisma.$disconnect().catch(disconnectErr => {
      console.error('Error disconnecting Prisma client during critical failure:', disconnectErr);
    });
  });
