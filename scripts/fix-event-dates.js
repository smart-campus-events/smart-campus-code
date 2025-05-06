/**
 * Script to fix event dates in the database
 * This script shifts event dates from 2025 to current year
 * so they appear on the frontend as upcoming events
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEventDates() {
  try {
    console.log('Fixing event dates...');
    
    // Get all events from the database
    const events = await prisma.event.findMany({
      where: {
        // Looking for events in 2025 which need to be shifted to current year
        startDateTime: {
          gte: new Date('2025-01-01')
        }
      }
    });
    
    console.log(`Found ${events.length} events with future dates to fix`);
    
    if (events.length === 0) {
      console.log('No events need fixing.');
      return;
    }
    
    // Current date for calculations
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process each event
    for (const event of events) {
      try {
        console.log(`Processing event: ${event.title}`);
        
        // Get the original dates
        const originalStart = new Date(event.startDateTime);
        const originalEnd = event.endDateTime ? new Date(event.endDateTime) : null;
        
        // Calculate how many days from now the event should be
        // For simplicity, distribute events across the next 30 days
        const daysToAdd = Math.floor(Math.random() * 30) + 1;
        
        // Create new dates for this year
        const newStartDate = new Date(currentDate);
        newStartDate.setDate(currentDate.getDate() + daysToAdd);
        
        // Set hours/minutes from original date
        newStartDate.setHours(
          originalStart.getHours(),
          originalStart.getMinutes(), 
          originalStart.getSeconds()
        );
        
        // Calculate new end date (if exists)
        let newEndDate = null;
        if (originalEnd) {
          // Maintain the same duration between start and end
          const durationMs = originalEnd.getTime() - originalStart.getTime();
          newEndDate = new Date(newStartDate.getTime() + durationMs);
        }
        
        // Update the event
        await prisma.event.update({
          where: { id: event.id },
          data: {
            startDateTime: newStartDate,
            endDateTime: newEndDate,
            // Ensure it's approved so it shows up
            status: "APPROVED"
          }
        });
        
        console.log(`  Updated: ${originalStart.toISOString()} -> ${newStartDate.toISOString()}`);
        updatedCount++;
      } catch (error) {
        console.error(`Error updating event ${event.title}:`, error);
        errorCount++;
      }
    }
    
    console.log('\nSummary:');
    console.log(`- Total events processed: ${events.length}`);
    console.log(`- Events updated: ${updatedCount}`);
    console.log(`- Errors: ${errorCount}`);
    console.log('Done!');
    
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixEventDates(); 