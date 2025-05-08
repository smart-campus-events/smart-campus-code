/**
 * Script to automatically categorize clubs in a PostgreSQL database using Prisma and the Gemini API,
 * linking them to existing Category records via the ClubCategory join table.
 *
 * Prerequisites:
 * 1. Node.js and npm/yarn installed.
 * 2. Prisma installed and configured (`schema.prisma` reflecting the Club, Category, and ClubCategory models, `npx prisma generate`).
 * 3. Database populated with the allowed Categories.
 * 4. `.env` file in the project root with `GEMINI_API_KEY` and `DATABASE_URL`.
 * 5. Dependencies installed: `npm install @google/generative-ai dotenv @prisma/client`
 *
 * How to Run:
 * 1. Ensure your database has the Category records populated first.
 * 2. Execute the script directly using Node.js: `node path/to/your/script/club-category-tagging.js` (adjust path as needed)
 */

// Using require for CommonJS modules
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

// --- Configuration ---

// Load environment variables (assuming .env is at the project root relative to CWD)
// If running the script from within the 'scripts' folder, adjust the path.
try {
  // Adjust path if script is not run from project root
  // Example: dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  dotenv.config(); // Assumes .env is in the current working directory or its parent
  console.log('Attempted to load environment variables.');
} catch (err) {
  console.warn('Could not load .env file. Ensure it exists and contains GEMINI_API_KEY and DATABASE_URL.', err);
}

// Initialize Prisma Client
const prisma = new PrismaClient();

// --- !!! IMPORTANT: Ensure these categories exist in your Category table !!! ---
const allowedCategories = [
  'Academic', 'Arts & Music', 'Community Service', 'Cultural',
  'Environmental', 'Gaming', 'Health & Wellness', 'Hobbies',
  'Outdoors & Recreation', 'Political', 'Professional Development',
  'Religious & Spiritual', 'Social', 'Sports', 'Technology',
];
const allowedCategoriesSet = new Set(allowedCategories); // For efficient lookup

// Gemini API Configuration
const { GEMINI_API_KEY } = process.env;
if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY not found in environment variables.');
  console.error('Ensure it is set in your .env file.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModelName = 'gemini-1.5-flash'; // Or your preferred model
const geminiModel = genAI.getGenerativeModel({
  model: geminiModelName,
  // Safety settings adjusted from event tagging script if needed
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ],
});

console.log(`Using Gemini model: ${geminiModelName}`);
console.log(`Allowed categories: ${allowedCategories.join(', ')}`);

// --- Helper Functions ---

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Database Functions (using Prisma & Club Schema) ---

/**
 * Fetches a batch of clubs from the database that have no linked categories.
 * @param {number} limit - The maximum number of clubs to fetch.
 * @returns {Promise<Array<object>>} A promise resolving to an array of clubs needing categorization.
 */
async function fetchUncategorizedClubs(limit) {
  console.log(`Fetching up to ${limit} clubs with no categories linked...`);
  try {
    const clubs = await prisma.club.findMany({
      where: {
        // Find clubs where the relation 'categories' is empty
        categories: {
          none: {}, // Checks if there are no related ClubCategory records
        },
        // Add other conditions if needed, e.g., only process APPROVED clubs
        // status: 'APPROVED',
      },
      select: { // Select fields needed for generating tags and the club ID
        id: true,
        name: true,
        purpose: true,
        categoryDescription: true, // Existing category info if available
      },
      take: limit,
      orderBy: {
        createdAt: 'asc', // Process older clubs first
      },
    });
    console.log(`Fetched ${clubs.length} clubs.`);
    return clubs;
  } catch (error) {
    console.error('Error fetching uncategorized clubs from database:', error);
    return [];
  }
}

/**
 * Links a club to categories based on the generated tags.
 * @param {string} clubId - The unique ID of the club to update.
 * @param {string[]} categoryNames - An array of validated category names.
 * @returns {Promise<boolean>} A promise resolving to true if successful, false otherwise.
 */
async function linkClubToCategories(clubId, categoryNames) {
  if (!categoryNames || categoryNames.length === 0) {
    console.warn(`[Club ID: ${clubId}] No valid category names provided for linking.`);
    return false;
  }

  try {
    // 1. Find the Category records corresponding to the names
    const categoriesToLink = await prisma.category.findMany({
      where: {
        name: {
          in: categoryNames,
        },
      },
      select: { id: true, name: true }, // Select ID for linking
    });

    const foundCategoryNames = categoriesToLink.map(c => c.name);
    const notFoundNames = categoryNames.filter(name => !foundCategoryNames.includes(name));

    if (notFoundNames.length > 0) {
      console.warn(`[Club ID: ${clubId}] Could not find Category records for: ${notFoundNames.join(', ')}. Linking only found categories.`);
    }

    if (categoriesToLink.length === 0) {
      console.error(`[Club ID: ${clubId}] Error: None of the suggested categories (${categoryNames.join(', ')}) were found in the Category table.`);
      return false;
    }

    const categoryIdsToLink = categoriesToLink.map(c => c.id);

    // 2. Update the club to create the links in the ClubCategory join table
    await prisma.club.update({
      where: { id: clubId },
      data: {
        categories: { // Target the Club.categories relation (ClubCategory[])
          createMany: { // Create multiple join table records efficiently
            data: categoryIdsToLink.map(catId => ({
              categoryId: catId, // Provide the foreign key for the Category side
              // Prisma infers the clubId from the 'where' clause
            })),
            skipDuplicates: true, // Avoid errors if a link somehow already exists
          },
        },
        // Optionally, update a 'lastCategorizedAt' timestamp if you add one
        // lastCategorizedAt: new Date(),
      },
    });

    console.log(`[Club ID: ${clubId}] Successfully linked to categories: ${foundCategoryNames.join(', ')}`);
    return true;
  } catch (error) {
    console.error(`[Club ID: ${clubId}] Error linking club to categories:`, error);
    return false;
  }
}

// --- Gemini Tagging Function (Adapted for Clubs) ---

/**
 * Generates category tags for a club using Gemini, constrained to the allowed list.
 * Tries to select ALL relevant tags from the list.
 * @param {object} club - The club data (id, name, purpose, categoryDescription).
 * @returns {Promise<string[] | null>} A promise resolving to an array of valid category names, or null on failure.
 */
async function generateTagsWithGemini(club) {
  const name = club.name ?? '';
  let purpose = club.purpose ?? '';
  const categoryDescription = club.categoryDescription ?? ''; // Use existing field

  // Optional: Truncate long descriptions/purposes if necessary
  const maxPurposeLength = 1000;
  if (purpose.length > maxPurposeLength) {
    purpose = `${purpose.substring(0, maxPurposeLength)}...`;
  }

  // --- MODIFIED PROMPT ---
  const prompt = `
  Analyze the following university club information. Your goal is to select ALL relevant category tags that describe the club's focus, ONLY from the provided list below.
  Consider the club's name, its stated purpose, and any existing category description. Prioritize the most specific and relevant tags.
  
  Allowed Categories:
  ${allowedCategories.join(', ')}
  
  Club Details:
  Name: ${name}
  Purpose: ${purpose}
  Existing Category Info (if any): ${categoryDescription}
  
  Select ALL applicable tags from the 'Allowed Categories' list above that fit this club.
  Return the selected tags separated only by commas (e.g., Tag1,Tag2,Tag3). Do NOT include any explanation or tags not in the list.
  Selected Tags:
  `;
    // --- END MODIFIED PROMPT ---

  let attempt = 1;
  const maxAttempts = 2; // Retry once on failure
  const retryDelay = 5000; // 5 seconds

  while (attempt <= maxAttempts) {
    try {
      // console.log(`--- Sending Prompt (Attempt ${attempt}) for Club ID: ${club.id} ---`);
      // console.log(prompt); // Uncomment for debugging the prompt

      const result = await geminiModel.generateContent(prompt);
      const { response } = result;

      if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content) {
        console.warn(`Warning: Gemini response empty or blocked (Attempt ${attempt}) for Club ID: ${club.id}.`);
        if (response?.promptFeedback?.blockReason) {
          console.warn(` -> Block Reason: ${response.promptFeedback.blockReason}`);
        } else if (response?.candidates?.[0]?.finishReason) {
          console.warn(` -> Finish Reason: ${response.candidates[0].finishReason}`);
          // Handle specific finish reasons if needed, e.g., SAFETY
        }
        // Consider logging the full response for debugging if issues persist
        // console.debug("Full Gemini Response:", JSON.stringify(response, null, 2));
        if (attempt < maxAttempts) {
          await sleep(retryDelay * attempt); // Exponential backoff might be better
          attempt++;
          continue;
        }
        return null; // Failed after retries or blocked
      }

      // Access text correctly based on typical Gemini Node.js SDK structure
      const tagsText = response.candidates[0].content.parts[0]?.text?.trim();

      if (!tagsText) {
        console.warn(`Warning: Gemini response structure issue or empty text (Attempt ${attempt}) for club ID: ${club.id}. Raw response candidate:`, JSON.stringify(response.candidates[0]));
        if (attempt < maxAttempts) {
          await sleep(retryDelay * attempt);
          attempt++;
          continue;
        }
        return null;
      }

      // Clean the raw response text
      let cleanedTagsText = tagsText.replace(/[`"']/g, ''); // Remove quotes
      cleanedTagsText = cleanedTagsText.replace(/^[^\w]+|[^\w]+$/g, ''); // Remove leading/trailing non-word chars

      const suggestedTags = cleanedTagsText.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0); // Filter out empty strings

      // Filter against the allowed categories set
      let validTags = suggestedTags.filter(tag => allowedCategoriesSet.has(tag));

      // Ensure uniqueness (in case Gemini repeats a tag)
      validTags = [...new Set(validTags)];

      // --- REMOVED LINE ---
      // validTags = validTags.slice(0, 3); // Limit to 3 tags <-- This line is removed
      // --- END REMOVED LINE ---

      if (validTags.length === 0) {
        console.warn(`Warning: Gemini response didn't contain valid allowed tags (Attempt ${attempt}) for club ID: ${club.id}. Raw response: "${tagsText}", Cleaned: "${cleanedTagsText}"`);
        // Don't retry here unless the response was clearly malformed/empty earlier
        return null; // No valid tags found in the response
      }

      console.log(`[Club ID: ${club.id}] Gemini suggested & validated tags: ${validTags.join(', ')}`);
      return validTags; // Return the array of valid tag names
    } catch (error) {
      console.error(`Error calling Gemini API (Attempt ${attempt}) for club ID ${club.id}:`, error);
      if (attempt === maxAttempts) {
        console.error(` -> Max attempts reached for club ${club.id}. Giving up.`);
        return null;
      }
      console.warn(` -> Waiting ${retryDelay / 1000} seconds before retrying...`);
      await sleep(retryDelay);
      attempt++;
    }
  }
  console.error(`Exited retry loop unexpectedly for club ${club.id}.`);
  return null;
}

// --- Main Execution Logic ---

async function main() {
  console.log('Starting club categorization script...');
  let totalClubsProcessed = 0;
  let totalClubsSuccessfullyCategorized = 0;
  let totalFailures = 0;
  const batchSize = 20; // Adjust batch size based on API rate limits and performance
  const delayBetweenApiCalls = 3000; // Delay in ms between Gemini calls (adjust based on quotas)

  try {
    // Pre-fetch all allowed category IDs for validation (optional but good practice)
    const existingCategoryIds = (await prisma.category.findMany({
      where: { name: { in: allowedCategories } },
      select: { id: true },
    })).map(c => c.id);
    if (existingCategoryIds.length !== allowedCategories.length) {
      console.warn("Warning: Not all 'allowedCategories' defined in the script were found in the database Category table. Ensure categories are seeded.");
    }

    while (true) {
      const uncategorizedClubs = await fetchUncategorizedClubs(batchSize);

      if (uncategorizedClubs.length === 0) {
        console.log('No more uncategorized clubs found.');
        break;
      }

      console.log(`\n--- Processing Batch of ${uncategorizedClubs.length} Clubs ---`);

      for (const club of uncategorizedClubs) {
        totalClubsProcessed++;
        console.log(`Processing Club ${totalClubsProcessed}: ID: ${club.id} | Name: ${club.name.substring(0, 60)}...`);

        // Returns an array of valid category names or null
        const generatedCategoryNames = await generateTagsWithGemini(club);

        if (generatedCategoryNames && generatedCategoryNames.length > 0) {
          // Link the club to the categories in the database
          const linkSuccess = await linkClubToCategories(club.id, generatedCategoryNames);
          if (linkSuccess) {
            totalClubsSuccessfullyCategorized++;
          } else {
            console.log(`  -> Failed to link categories in DB for club ${club.id}.`);
            totalFailures++;
          }
        } else {
          console.log(`  -> Failed to generate valid categories or Gemini returned none for club ${club.id}.`);
          totalFailures++;
          // Optionally, mark the club as 'failed categorization' to avoid retrying indefinitely
          // await prisma.club.update({ where: { id: club.id }, data: { status: 'CATEGORIZATION_FAILED' } }); // If you add such a status
        }

        // Respect rate limits
        await sleep(delayBetweenApiCalls);
      } // End for loop (batch processing)

      console.log('--- Batch Complete ---');

      if (uncategorizedClubs.length < batchSize) {
        console.log('Processed the last available batch of clubs.');
        break;
      }
    } // End while loop (fetching batches)
  } catch (error) {
    console.error('An unexpected error occurred during the main processing loop:', error);
  } finally {
    console.log('\n--- Club Categorization Summary ---');
    console.log(`Total clubs checked/processed: ${totalClubsProcessed}`);
    console.log(`Total clubs successfully categorized & linked: ${totalClubsSuccessfullyCategorized}`);
    console.log(`Total clubs failed (Gemini or DB update): ${totalFailures}`);

    await prisma.$disconnect();
    console.log('Prisma client disconnected. Script finished.');
  }
}

// --- Script Entry Point ---
main()
  .catch(async (e) => {
    console.error('A critical error occurred:', e);
    process.exitCode = 1;
    await prisma.$disconnect().catch(disconnectErr => {
      console.error('Error disconnecting Prisma client during critical failure:', disconnectErr);
    });
  });