// db.js
// Configures and exports the Prisma Client instance and database operations.

import { PrismaClient } from '@prisma/client';
import { isValid as isDateValid } from 'date-fns'; // Needed for validation before saving

// Instantiate Prisma Client
export const prisma = new PrismaClient();

/**
 * Saves event data to the database using Prisma upsert.
 * @param {object} eventData - The structured event data from parsing.
 * @returns {Promise<void>}
 */
export async function saveEvent(eventData) {
  if (!eventData || !eventData.event_id) {
    console.error('Invalid event data passed to saveEvent');
    return;
  }

  // Ensure date fields are valid Date objects or null for Prisma
  const dataToSave = {
    ...eventData, // Spread incoming data
    // Convert ISO strings back to Date objects or null
    start_datetime: eventData.start_datetime ? new Date(eventData.start_datetime) : null,
    end_datetime: eventData.end_datetime ? new Date(eventData.end_datetime) : null,
    // Overwrite last_scraped_at with the current time just before saving
    last_scraped_at: new Date(),
  };

  // Validate dates before attempting to save
  if (dataToSave.start_datetime && !isDateValid(dataToSave.start_datetime)) {
    console.error(`[${eventData.event_id}] Invalid start_datetime before saving. Setting to null.`);
    // Set to null to avoid DB error, maybe log or handle differently
    dataToSave.start_datetime = null;
  }
  if (dataToSave.end_datetime && !isDateValid(dataToSave.end_datetime)) {
    console.warn(`[${eventData.event_id}] Invalid end_datetime before saving. Setting to null.`);
    dataToSave.end_datetime = null;
  }
  // Ensure boolean is correct type
  dataToSave.all_day = Boolean(dataToSave.all_day);

  try {
    const event = await prisma.event.upsert({
      where: {
        event_id: dataToSave.event_id, // Unique identifier
      },
      update: {
        ...dataToSave, // Spread all fields for update
        // updated_at is handled automatically by @updatedAt
      },
      create: {
        ...dataToSave, // Spread all fields for creation
        // created_at is handled automatically by @default(now())
      },
    });
    console.log(`[${event.event_id}] Successfully upserted event: ${event.title}`);
  } catch (error) {
    console.error(`[${eventData.event_id}] Error upserting event:`, error);
    // Consider more specific error handling (e.g., constraint violations)
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
