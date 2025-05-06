/**
 * Script to fix event times accounting for Hawaii's time zone
 * 
 * This script:
 * 1. Adjusts times to properly account for Hawaii Standard Time (HST, UTC-10:00)
 * 2. Ensures displayed times match what's shown on the UH Manoa calendar
 * 3. Updates the database to store proper timezone-aware times
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Hawaii is UTC-10:00 (10 hours behind UTC)
const HAWAII_OFFSET = -10 * 60 * 60 * 1000; // 10 hours in milliseconds

/**
 * Converts a UTC date to Hawaii time
 */
function toHawaiiTime(utcDate) {
  const date = new Date(utcDate);
  // Get UTC time in milliseconds
  const utcTime = date.getTime();
  // Convert to Hawaii time
  const hawaiiTime = new Date(utcTime + HAWAII_OFFSET);
  return hawaiiTime;
}

/**
 * Converts a Hawaii time to UTC for storage
 */
function toUTC(hawaiiDate) {
  const date = new Date(hawaiiDate);
  // Get Hawaii time in milliseconds
  const hawaiiTime = date.getTime();
  // Convert to UTC
  const utcTime = new Date(hawaiiTime - HAWAII_OFFSET);
  return utcTime;
}

/**
 * Creates a date in Hawaii time zone
 */
function createHawaiiDate(year, month, day, hour = 0, minute = 0) {
  // Create date in local time
  const localDate = new Date(year, month, day, hour, minute);
  // Convert to UTC for storage
  return toUTC(localDate);
}

async function fixHawaiiTimezone() {
  console.log('Starting to fix event times for Hawaii timezone...');
  
  // Get all events from UH Manoa
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { organizerSponsor: { contains: 'University of Hawaii' } },
        { eventUrl: { contains: 'hawaii.edu/calendar' } },
        { eventPageUrl: { contains: 'hawaii.edu/calendar' } }
      ]
    }
  });
  
  console.log(`Found ${events.length} UH Manoa events to process`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const event of events) {
    try {
      // Check current time in database (UTC)
      const currentStartTime = new Date(event.startDateTime);
      
      // Convert to Hawaii time for display/checking
      const hawaiiStartTime = toHawaiiTime(currentStartTime);
      
      console.log(`Event: "${event.title}"`);
      console.log(`  Current DB time (UTC): ${currentStartTime.toISOString()}`);
      console.log(`  Hawaii time: ${hawaiiStartTime.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' })}`);
      
      // Parse the time from the title if it contains a time
      let newHour = 9; // Default to 9am HST
      let newMinute = 0;
      
      // Extract time from title if it exists
      // Check for patterns like "9:00 a.m. Ceremony" or "3:30 p.m. Ceremony"
      const timePattern = /(\d+):(\d+)\s*(a\.m\.|p\.m\.|am|pm)/i;
      const match = event.title.match(timePattern);
      
      if (match) {
        const hour = parseInt(match[1]);
        const minute = parseInt(match[2]);
        const ampm = match[3].toLowerCase();
        
        // Convert to 24-hour format
        if ((ampm === 'p.m.' || ampm === 'pm') && hour < 12) {
          newHour = hour + 12;
        } else if ((ampm === 'a.m.' || ampm === 'am') && hour === 12) {
          newHour = 0;
        } else {
          newHour = hour;
        }
        
        newMinute = minute;
        console.log(`  Extracted time from title: ${hour}:${minute} ${ampm} → ${newHour}:${newMinute}`);
      } else {
        // If no time in title, check for keywords
        const titleLower = event.title.toLowerCase();
        const hasEveningKeywords = titleLower.includes('evening') || 
                                  titleLower.includes('concert') || 
                                  titleLower.includes('night');
        
        const hasSocialKeywords = titleLower.includes('social') || 
                                 titleLower.includes('mixer') || 
                                 titleLower.includes('pau hana');
        
        if (hasEveningKeywords) {
          newHour = 19; // 7pm HST
          console.log(`  Using evening time: 7:00 PM HST based on keywords`);
        } else if (hasSocialKeywords) {
          newHour = 18; // 6pm HST
          console.log(`  Using social event time: 6:00 PM HST based on keywords`);
        } else {
          console.log(`  Using default time: 9:00 AM HST`);
        }
      }
      
      // Create new Hawaii date with extracted or default time
      const hawaiiDate = new Date(hawaiiStartTime);
      hawaiiDate.setHours(newHour, newMinute, 0);
      
      // Convert Hawaii time to UTC for storage
      const newUTCDate = toUTC(hawaiiDate);
      
      // Create end time 1-2 hours later
      const endHawaiiDate = new Date(hawaiiDate);
      endHawaiiDate.setHours(hawaiiDate.getHours() + 2);
      const newUTCEndDate = toUTC(endHawaiiDate);
      
      console.log(`  New Hawaii time: ${hawaiiDate.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' })}`);
      console.log(`  New DB time (UTC): ${newUTCDate.toISOString()}`);
      
      // Update the event with fixed times
      await prisma.event.update({
        where: { id: event.id },
        data: {
          startDateTime: newUTCDate,
          endDateTime: newUTCEndDate
        }
      });
      
      console.log(`✅ Updated event "${event.title}" with correct Hawaii time`);
      updatedCount++;
    } catch (error) {
      console.error(`❌ Error processing event "${event.title}": ${error.message}`);
      errorCount++;
    }
  }
  
  // Summary
  console.log('\n--- Summary ---');
  console.log(`Events processed: ${events.length}`);
  console.log(`Events updated with Hawaii timezone: ${updatedCount}`);
  console.log(`Errors: ${errorCount}`);
  
  console.log('\n--- Frontend Display ---');
  console.log('To ensure proper display of Hawaii times, update the formatEventDate function in src/app/events/page.tsx:');
  console.log(`
  const formatEventDate = (event: Event) => {
    try {
      // Use this to display in Hawaii time
      const options = { timeZone: 'Pacific/Honolulu' };
      
      const start = new Date(event.startDateTime);
      const end = event.endDateTime ? new Date(event.endDateTime) : null;
      
      // Check if time is midnight (likely a default/placeholder)
      const hawaiiStart = new Date(start.toLocaleString('en-US', options));
      const isMidnight = hawaiiStart.getHours() === 0 && hawaiiStart.getMinutes() === 0;
      
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
}

async function main() {
  try {
    await fixHawaiiTimezone();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 