// db.js
// Configures and exports the Prisma Client instance and database operations.

import { PrismaClient } from '@prisma/client';
import { isValid as isDateValid } from 'date-fns'; // Needed for validation before saving

// Instantiate Prisma Client
export const prisma = new PrismaClient();

/**
 * Saves event data to the database using Prisma upsert.
 * Aligned with the updated Event schema (camelCase fields).
 * @param {object} eventData - The structured event data from parsing (using camelCase keys).
 * @returns {Promise<void>}
 */
export async function saveEvent(eventData) {
  // Ensure eventData and the ID (mapped from et_id) exist
  if (!eventData || !eventData.id) {
    console.error('Invalid event data or missing ID passed to saveEvent');
    return;
  }

  // Prepare data for Prisma, ensuring correct types
  const dataToSave = {
    ...eventData, // Spread incoming data (should be camelCase now)
    // Convert valid ISO strings back to Date objects or null
    startDateTime: eventData.startDateTime ? new Date(eventData.startDateTime) : null,
    endDateTime: eventData.endDateTime ? new Date(eventData.endDateTime) : null,
    // Ensure boolean is correct type
    allDay: Boolean(eventData.allDay),
    // Overwrite lastScrapedAt with the current time just before saving
    lastScrapedAt: new Date(),
    // Remove categoryTags as it's now a relation 'categories'
    // Handling relations requires separate logic (e.g., connecting or creating categories)
    // categoryTags: undefined, // Or simply ensure it's not passed if using {...eventData}
  };
  // Explicitly delete the field if it might exist on eventData from parsing
  delete dataToSave.categoryTags;

  // Validate dates before attempting to save
  if (dataToSave.startDateTime && !isDateValid(dataToSave.startDateTime)) {
    console.error(`[${eventData.id}] Invalid startDateTime before saving. Setting to null.`);
    dataToSave.startDateTime = null;
  }
  if (dataToSave.endDateTime && !isDateValid(dataToSave.endDateTime)) {
    console.warn(`[${eventData.id}] Invalid endDateTime before saving. Setting to null.`);
    dataToSave.endDateTime = null;
  }

  try {
    const event = await prisma.event.upsert({
      where: {
        // Use 'id' as the primary key, mapped from the original 'et_id'
        id: dataToSave.id,
      },
      update: {
        ...dataToSave, // Spread all fields for update
        // updatedAt is handled automatically by @updatedAt
        // id should not be included in the update payload itself
        id: undefined,
      },
      create: {
        ...dataToSave, // Spread all fields for creation
        // createdAt handled by @default(now()), updatedAt by @updatedAt
      },
    });
    console.log(`[${event.id}] Successfully upserted event: ${event.title}`);
  } catch (error) {
    console.error(`[${eventData.id}] Error upserting event:`, error);
    // Consider more specific error handling
  }
}

/**
 * Disconnects the Prisma client.
 * @returns {Promise<void>}
 */
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
    console.log('Prisma client disconnected.');
  } catch (e) {
    console.error('Error disconnecting Prisma client:', e);
  }
}
