/**
 * Script to fix event times from the UH Manoa calendar
 * 
 * This script fixes issues with event times from the UH Manoa calendar:
 * 1. Corrects events that show 12:00am as a default time when no time was specified
 * 2. Ensures dates match the UH Manoa calendar format
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEventTimes() {
  console.log('Starting to fix event times...');
  
  // Get all events from UH Manoa
  const events = await prisma.event.findMany({
    where: {
      // Look for events with UH Manoa in organizer or with UH Manoa calendar URLs
      OR: [
        { organizerSponsor: { contains: 'University of Hawaii' } },
        { eventUrl: { contains: 'hawaii.edu/calendar' } },
        { eventPageUrl: { contains: 'hawaii.edu/calendar' } }
      ]
    }
  });
  
  console.log(`Found ${events.length} UH Manoa events to process`);
  
  let updatedCount = 0;
  let correctCount = 0;
  let errorCount = 0;
  
  for (const event of events) {
    try {
      // Check if the event starts at midnight (likely a default time)
      const startDate = new Date(event.startDateTime);
      const needsTimeUpdate = startDate.getHours() === 0 && startDate.getMinutes() === 0;
      
      // Only update events with midnight times which are likely placeholders
      if (needsTimeUpdate) {
        // Set a default time of 9:00 AM if no specific time was provided
        // (This matches most UH events without specific times)
        startDate.setHours(9, 0, 0);
        
        // Check if there's an end date that's also at midnight
        let endDate = null;
        if (event.endDateTime) {
          endDate = new Date(event.endDateTime);
          if (endDate.getHours() === 0 && endDate.getMinutes() === 0) {
            // If end date is midnight of the same day, use start date + 1 hour
            if (endDate.toDateString() === startDate.toDateString()) {
              endDate = new Date(startDate);
              endDate.setHours(startDate.getHours() + 1);
            } else {
              // If end date is midnight of a different day, set it to 5:00 PM
              endDate.setHours(17, 0, 0);
            }
          }
        }
        
        // Update the event with fixed times
        await prisma.event.update({
          where: { id: event.id },
          data: {
            startDateTime: startDate,
            endDateTime: endDate
          }
        });
        
        console.log(`✅ Updated event "${event.title}" with new times: ${startDate.toLocaleString()}`);
        updatedCount++;
      } else {
        correctCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing event "${event.title}": ${error.message}`);
      errorCount++;
    }
  }
  
  // Summary
  console.log('\n--- Summary ---');
  console.log(`Events processed: ${events.length}`);
  console.log(`Events updated with fixed times: ${updatedCount}`);
  console.log(`Events with correct times: ${correctCount}`);
  console.log(`Errors: ${errorCount}`);
}

async function main() {
  try {
    await fixEventTimes();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 