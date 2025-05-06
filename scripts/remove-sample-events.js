/**
 * Script to remove sample/placeholder events from the database
 * This will remove events that were added as placeholders or samples
 * but are not actual UH Manoa events.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// List of event titles that are known placeholders/samples
const SAMPLE_EVENT_TITLES = [
  'ACM Workshop: Intro to Git',
  'Board Game Night - Settlers of Catan',
  'Manoa Falls Trail Hike',
  'Hamilton Exam Hangout',
  'Midday Reset: Chair Yoga Stretch'
];

// Strings that indicate sample events
const SAMPLE_EVENT_KEYWORDS = [
  'sample',
  'test event',
  'placeholder',
  'demo'
];

// Check if a model exists in Prisma - helper function
async function checkIfModelExists(modelName) {
  try {
    // Check if the model exists in the Prisma client
    return Boolean(prisma[modelName]);
  } catch (error) {
    return false;
  }
}

async function removeSampleEvents() {
  console.log('Identifying and removing sample events from database...');
  
  // Find events that match our sample event criteria
  const eventsToRemove = await prisma.event.findMany({
    where: {
      OR: [
        // Events with exact titles from our list
        { title: { in: SAMPLE_EVENT_TITLES } },
        // Events with specific keywords in the title 
        ...SAMPLE_EVENT_KEYWORDS.map(keyword => ({ 
          title: { contains: keyword, mode: 'insensitive' } 
        })),
        // Events without an organizer that might be sample events
        { 
          AND: [
            { organizerSponsor: null },
            { organizerClubId: null }
          ] 
        }
      ]
    },
    select: {
      id: true,
      title: true,
      startDateTime: true,
      organizerSponsor: true
    }
  });

  console.log(`Found ${eventsToRemove.length} potential sample events to remove:`);
  
  // Display all events that will be removed
  eventsToRemove.forEach(event => {
    console.log(`- [${event.id}] "${event.title}" (${event.startDateTime})`);
  });

  // Double-check before deleting
  console.log('\nPreparing to delete these events and their related data...');
  
  let deletedCount = 0;
  let errorCount = 0;

  // Delete events one by one to properly handle relationships
  for (const event of eventsToRemove) {
    try {
      // First, delete event-category relationships
      try {
        const eventCategoryResult = await prisma.eventCategory.deleteMany({
          where: { eventId: event.id }
        });
        console.log(`  Deleted ${eventCategoryResult.count} category associations`);
      } catch (err) {
        console.log(`  Note: Could not delete category associations: ${err.message}`);
      }

      // Delete RSVPs for this event
      try {
        const rsvpResult = await prisma.RSVP.deleteMany({
          where: { eventId: event.id }
        });
        console.log(`  Deleted ${rsvpResult.count} RSVPs`);
      } catch (err) {
        console.log(`  Note: Could not delete RSVPs: ${err.message}`);
      }

      // Now delete the event itself
      await prisma.event.delete({
        where: { id: event.id }
      });

      console.log(`✅ Deleted event: "${event.title}"`);
      deletedCount++;
    } catch (error) {
      console.error(`❌ Error deleting event "${event.title}": ${error.message}`);
      errorCount++;
    }
  }
  
  // Summary
  console.log('\n--- Summary ---');
  console.log(`Events found: ${eventsToRemove.length}`);
  console.log(`Events successfully deleted: ${deletedCount}`);
  console.log(`Errors: ${errorCount}`);
}

async function main() {
  try {
    await removeSampleEvents();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 