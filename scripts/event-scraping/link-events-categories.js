import { PrismaClient } from '@prisma/client';

/**
 * Links a single event to its categories based on the categoryTags string.
 *
 * @param {PrismaClient} prisma - The Prisma client instance.
 * @param {string} eventId - The ID of the event to process.
 * @returns {Promise<object|null>} - The updated event object or null if not found/no tags.
 * @throws {Error} - Throws an error if database operations fail.
 */
async function linkEventToCategories(prisma, eventId) {
  console.log(`Processing event ID: ${eventId}`);

  try {
    // 1. Fetch the event and its categoryTags
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, categoryTags: true }, // Only select necessary fields
    });

    if (!event) {
      console.warn(`Event with ID ${eventId} not found.`);
      return null;
    }

    if (!event.categoryTags || event.categoryTags.trim() === '') {
      console.log(`Event ${eventId} has no categoryTags to process.`);
      return event; // Return the event as is, nothing to link
    }

    // 2. Parse the categoryTags string into an array of names
    const categoryNames = event.categoryTags
      .split(',')
      .map(tag => tag.trim()) // Remove leading/trailing whitespace
      .filter(Boolean); // Remove empty strings if there are double commas ,,

    if (categoryNames.length === 0) {
      console.log(`Event ${eventId} categoryTags resulted in no valid names after parsing.`);
      return event;
    }

    console.log(`Event ${eventId}: Found category names: ${categoryNames.join(', ')}`);

    // 3. Find the corresponding Category records in the database
    const foundCategories = await prisma.category.findMany({
      where: {
        name: {
          in: categoryNames, // Find categories whose names are in our list
        },
      },
      select: { id: true, name: true }, // Select ID for linking and name for logging
    });

    if (foundCategories.length === 0) {
      console.warn(`Event ${eventId}: No matching categories found in the database for tags: ${categoryNames.join(', ')}.`);
      return event; // Return the original event data fetched earlier if needed
    }

    // Log which categories were found vs. requested
    const foundCategoryNames = foundCategories.map(c => c.name);
    console.log(`Event ${eventId}: Matched categories in DB: ${foundCategoryNames.join(', ')}`);
    const notFoundNames = categoryNames.filter(name => !foundCategoryNames.includes(name));
    if (notFoundNames.length > 0) {
      console.warn(`Event ${eventId}: Could not find categories named: ${notFoundNames.join(', ')}`);
    }

    // 4. Prepare the data for creating links (EventCategory records)
    // Get just the IDs of the categories to link
    const categoryIdsToLink = foundCategories.map(category => category.id);

    // 5. Update the event: Use createMany to add entries to the EventCategory join table
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        categories: { // This targets the Event.categories relation (EventCategory[])
          createMany: { // Create multiple join table records
            data: categoryIdsToLink.map(catId => ({
              // We only need to provide the foreign key for the *other* side (Category)
              // Prisma knows the eventId from the 'where' clause of the update.
              categoryId: catId,
            })),
            skipDuplicates: true, // VERY IMPORTANT: Prevents errors if the link already exists
          },
        },
        // Optional: Clear the old categoryTags field now that it's relational?
        // categoryTags: null,
      },
      include: { // Keep the include to verify the result
        categories: { // Include the EventCategory join records
          include: {
            category: true, // From EventCategory, include the actual Category data
          },
        },
      },
    });

    console.log(`Event ${eventId}: Successfully created/ensured links for ${categoryIdsToLink.length} categories.`);
    return updatedEvent;
  } catch (error) {
    console.error(`Error processing event ID ${eventId}:`, error);
    // Re-throw the error if you want the main function to handle it (e.g., stop execution)
    // throw error;
    return null; // Or return null to indicate failure for this specific event
  }
}

/**
   * Iterates through all events and links them to their categories.
   *
   * @param {PrismaClient} prisma - The Prisma client instance.
   */
async function linkAllEventsToCategories(prisma) {
  console.log('Starting process to link all events to categories...');
  let processedCount = 0;
  let successCount = 0;
  let skippedCount = 0; // Count events without tags or not found
  let errorCount = 0;

  try {
    // Fetch IDs of all events that have a non-null/non-empty categoryTags field
    // This is more efficient than fetching all event data at once.
    const eventsToProcess = await prisma.event.findMany({
      where: {
        categoryTags: {
          not: null, // Ensure the field exists
          // Optionally add: not: '' if empty strings are common and should be skipped early
        },
        // You might want to add other filters, e.g., only process events
        // that haven't been processed before, or only PENDING/APPROVED ones.
        // status: 'APPROVED'
      },
      select: {
        id: true, // Only fetch the ID
      },
    });

    console.log(`Found ${eventsToProcess.length} events with categoryTags to process.`);

    // Process events sequentially. For large numbers, consider batching
    // or parallel processing with caution (e.g., using Promise.all with a concurrency limit).
    for (const eventRef of eventsToProcess) {
      processedCount++;
      console.log(`\n--- Processing event ${processedCount} of ${eventsToProcess.length} ---`);
      const result = await linkEventToCategories(prisma, eventRef.id);
      if (result) {
        // Check if linking actually happened vs just returning the event because it had no tags
        if (result.categories && result.categories.length > 0) {
          successCount++;
        } else {
          skippedCount++; // Counted as processed but no links were made (e.g., no tags)
        }
      } else {
        errorCount++; // linkEventToCategories returned null indicating an error or event not found
      }
    }

    console.log('\n--- Linking Process Summary ---');
    console.log(`Total events checked: ${processedCount}`);
    console.log(`Events successfully linked/updated: ${successCount}`);
    console.log(`Events skipped (no tags, tags not found, etc.): ${skippedCount + (processedCount - successCount - errorCount)}`); // Adjust skip count
    console.log(`Events failed due to errors: ${errorCount}`);
    console.log('------------------------------');
  } catch (error) {
    console.error('An error occurred during the main linking process:', error);
  } finally {
    // Optional: Disconnect Prisma client if this script is standalone
    // await prisma.$disconnect();
  }
}

// --- Example Usage ---
// Make sure to replace with your actual Prisma client instance

async function main() {
  const prisma = new PrismaClient();
  try {
    await linkAllEventsToCategories(prisma);
  } catch (e) {
    console.error('Script failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();