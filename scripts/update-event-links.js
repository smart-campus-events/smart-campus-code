/**
 * Script to update event links to point to original UH Manoa calendar entries
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// UH Manoa calendar base URL
const UH_CALENDAR_BASE_URL = 'https://www.hawaii.edu/calendar/manoa/';

async function updateEventLinks() {
  try {
    console.log('Updating event links to UH Manoa calendar...');
    
    // Get all events from the database that came from UH Manoa calendar
    // Look for events with organizerSponsor containing "University of Hawaii"
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { organizerSponsor: { contains: 'University of Hawaii' } },
          { title: { contains: 'UH' } },
          { title: { contains: 'Final Oral' } },
          { location: { contains: 'Manoa Campus' } }
        ]
      }
    });
    
    console.log(`Found ${events.length} UH Manoa events to update`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process each event
    for (const event of events) {
      try {
        // Check if the event already has a valid URL
        if (event.eventUrl && event.eventUrl.includes('hawaii.edu/calendar')) {
          console.log(`Event already has valid URL: ${event.title}`);
          continue;
        }
        
        console.log(`Updating event: ${event.title}`);
        
        // Generate a URL to the event on UH Manoa calendar
        // If we don't have the exact reference, create a general one
        // Format: https://www.hawaii.edu/calendar/manoa/
        
        // Create a date string for the URL in format: YYYY/MM/DD
        const eventDate = new Date(event.startDateTime);
        const dateUrlPart = `${eventDate.getFullYear()}/${(eventDate.getMonth() + 1).toString().padStart(2, '0')}/${eventDate.getDate().toString().padStart(2, '0')}`;
        
        // Create the URL
        const newEventUrl = `${UH_CALENDAR_BASE_URL}${dateUrlPart}`;
        
        // Update the event
        await prisma.event.update({
          where: { id: event.id },
          data: {
            eventUrl: newEventUrl,
            // Also update the event page URL if it's not set
            eventPageUrl: !event.eventPageUrl ? newEventUrl : event.eventPageUrl
          }
        });
        
        console.log(`  Updated URL: ${newEventUrl}`);
        updatedCount++;
      } catch (error) {
        console.error(`Error updating event ${event.title}:`, error);
        errorCount++;
      }
    }
    
    console.log('\nSummary:');
    console.log(`- Total events processed: ${events.length}`);
    console.log(`- Events updated: ${updatedCount}`);
    console.log(`- Events already had valid URLs: ${events.length - updatedCount - errorCount}`);
    console.log(`- Errors: ${errorCount}`);
    console.log('Done!');
    
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateEventLinks(); 