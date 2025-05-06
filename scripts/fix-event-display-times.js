/**
 * Script to fix event display times for the frontend
 * 
 * This script modifies how event times are displayed in the frontend:
 * 1. Fixes events with 12:00am default times
 * 2. Updates event formatting to match UH Manoa calendar style
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * This function modifies how event times are formatted in the frontend components by:
 * 1. Updating the formatEventDate function in the UI code to only show time if it's not 12:00am
 * 2. Fixing existing events that have 12:00am as default times
 */
async function fixEventDisplayTimes() {
  console.log('Starting to fix event display times...');
  
  // Get all events
  const events = await prisma.event.findMany();
  
  console.log(`Found ${events.length} events to process`);
  
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
        // Set a default time that matches the type of event
        // For academic events, set to 9:00am
        // For evening events, set to 5:00pm
        // For social events, set to 6:00pm
        
        let newHour = 9; // Default to 9am
        
        // Check title and categories for hints about time
        const titleLower = event.title.toLowerCase();
        const hasEveningKeywords = titleLower.includes('evening') || 
                                   titleLower.includes('concert') || 
                                   titleLower.includes('night');
        
        const hasSocialKeywords = titleLower.includes('social') || 
                                  titleLower.includes('mixer') || 
                                  titleLower.includes('pau hana');
        
        if (hasEveningKeywords) {
          newHour = 19; // 7pm
        } else if (hasSocialKeywords) {
          newHour = 18; // 6pm
        }
        
        // Update the start time
        startDate.setHours(newHour, 0, 0);
        
        // If end time is also midnight, update it to be 1-2 hours after start
        let endDate = null;
        if (event.endDateTime) {
          endDate = new Date(event.endDateTime);
          if (endDate.getHours() === 0 && endDate.getMinutes() === 0) {
            // If it's the same day, set to 1-2 hours later
            if (endDate.toDateString() === startDate.toDateString()) {
              endDate = new Date(startDate);
              endDate.setHours(startDate.getHours() + (hasEveningKeywords ? 2 : 1));
            } else {
              // If it's a multi-day event, keep the end date but set a reasonable time
              endDate.setHours(newHour + 1, 0, 0);
            }
          }
        }
        
        // Update the event in the database
        await prisma.event.update({
          where: { id: event.id },
          data: {
            startDateTime: startDate,
            endDateTime: endDate
          }
        });
        
        console.log(`✅ Updated event "${event.title}" with intelligent time: ${startDate.toLocaleString()}`);
        updatedCount++;
      } else {
        correctCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing event "${event.title}": ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('\n--- Event Display Guide ---');
  console.log('To improve event time display in the frontend:');
  console.log('1. Update src/app/events/page.tsx - formatEventDate function to:');
  console.log(`
  const formatEventDate = (event: Event) => {
    try {
      const start = new Date(event.startDateTime);
      const end = event.endDateTime ? new Date(event.endDateTime) : null;
      
      // Check if time is midnight (likely a default/placeholder)
      const isMidnight = start.getHours() === 0 && start.getMinutes() === 0;
      
      // If midnight, only show the date
      if (isMidnight) {
        return format(start, 'MMM d, yyyy');
      }
      
      if (!end) {
        return format(start, 'MMM d, yyyy - h:mm a');
      }
      
      // Same day event
      if (start.toDateString() === end.toDateString()) {
        return \`\${format(start, 'MMM d, yyyy')} (\${format(start, 'h:mm a')} - \${format(end, 'h:mm a')})\`;
      }
      
      // Multi-day event
      return \`\${format(start, 'MMM d')} - \${format(end, 'MMM d, yyyy')}\`;
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'Date information unavailable';
    }
  };
  `);
  
  // Summary
  console.log('\n--- Summary ---');
  console.log(`Events processed: ${events.length}`);
  console.log(`Events updated with intelligent times: ${updatedCount}`);
  console.log(`Events with correct times: ${correctCount}`);
  console.log(`Errors: ${errorCount}`);
}

async function main() {
  try {
    await fixEventDisplayTimes();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 