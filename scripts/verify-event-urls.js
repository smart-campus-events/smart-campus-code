/**
 * Script to verify that all UH Manoa events have the correct eventUrl format
 * with a valid link to the UH Manoa calendar system.
 * 
 * This script:
 * 1. Identifies events from the UH Manoa calendar
 * 2. Verifies their eventUrl and eventPageUrl fields are valid
 * 3. Reports on any issues found
 * 4. Optionally fixes invalid URLs
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// The accepted base URL formats for UH Manoa calendar events
const UH_MANOA_CALENDAR_BASE_URLS = [
  'https://manoa.hawaii.edu/calendar/',
  'https://www.hawaii.edu/calendar/manoa/'
];

const SIMULATE = false; // Set to false to actually update the database

async function verifyEventUrls() {
  console.log('Verifying event URLs for UH Manoa events...');
  
  // Find all events that are from UH Manoa calendar (based on organizerSponsor)
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { organizerSponsor: { contains: 'University of Hawaii' } },
        { organizerSponsor: { contains: 'UH Manoa' } },
        { organizerSponsor: { contains: 'University of Hawaiʻi' } }
      ]
    },
    select: {
      id: true,
      title: true,
      startDateTime: true,
      organizerSponsor: true,
      eventUrl: true,
      eventPageUrl: true
    }
  });

  console.log(`Found ${events.length} UH Manoa events to verify.`);

  let validUrls = 0;
  let invalidUrls = 0;
  let fixedUrls = 0;
  let errorEvents = 0;

  for (const event of events) {
    try {
      // Check if eventUrl exists and is valid
      let isValid = true;
      let needsUpdate = false;
      const updates = {};
      
      // Validate eventUrl
      const eventUrlIsValid = event.eventUrl && 
        UH_MANOA_CALENDAR_BASE_URLS.some(baseUrl => event.eventUrl.startsWith(baseUrl));
      
      if (!event.eventUrl) {
        console.log(`⚠️ [${event.id}] "${event.title}" is missing eventUrl`);
        isValid = false;
        needsUpdate = true;
        
        // Generate a fallback URL using the UH Manoa calendar base + date
        const date = new Date(event.startDateTime);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        updates.eventUrl = `${UH_MANOA_CALENDAR_BASE_URLS[0]}?date=${year}-${month}`;
      } else if (!eventUrlIsValid) {
        console.log(`⚠️ [${event.id}] "${event.title}" has eventUrl not matching expected patterns: ${event.eventUrl}`);
        isValid = false;
        // We don't automatically update if the URL doesn't match patterns
      }
      
      // Validate or fix eventPageUrl based on eventUrl
      if (!event.eventPageUrl && event.eventUrl) {
        console.log(`⚠️ [${event.id}] "${event.title}" is missing eventPageUrl`);
        isValid = false;
        needsUpdate = true;
        
        // If the eventUrl contains a specific event ID, use that as the eventPageUrl
        if (event.eventUrl.includes('?et_id=') || event.eventUrl.includes('&et_id=')) {
          updates.eventPageUrl = event.eventUrl;
        } else {
          // Check if we can extract event ID from the URL format
          const match = event.eventUrl.match(/\/(\d+)\.html/);
          if (match && match[1]) {
            const eventNumber = match[1];
            // Extract et_id from URL if available
            const etIdMatch = event.eventUrl.match(/et_id=(\d+)/);
            const etId = etIdMatch ? etIdMatch[1] : '';
            
            if (etId) {
              updates.eventPageUrl = event.eventUrl;
            } else {
              // Without an et_id, best we can do is use the event number
              updates.eventPageUrl = event.eventUrl;
            }
          } else {
            // Fallback: just use eventUrl as eventPageUrl
            updates.eventPageUrl = event.eventUrl;
          }
        }
      }
      
      // Update the event if needed
      if (needsUpdate && Object.keys(updates).length > 0) {
        console.log(`📝 Updates for "${event.title}":`, updates);
        
        if (!SIMULATE) {
          await prisma.event.update({
            where: { id: event.id },
            data: updates
          });
          console.log(`✅ Fixed: "${event.title}"`);
          fixedUrls++;
        } else {
          console.log(`🔍 [SIMULATION] Would fix: "${event.title}"`);
        }
      }
      
      if (isValid) {
        validUrls++;
      } else {
        invalidUrls++;
      }
    } catch (error) {
      console.error(`❌ Error processing event "${event.title}":`, error);
      errorEvents++;
    }
  }
  
  // Summary
  console.log('\n--- Summary ---');
  console.log(`Total UH Manoa events: ${events.length}`);
  console.log(`Events with valid URLs: ${validUrls}`);
  console.log(`Events with invalid URLs: ${invalidUrls}`);
  console.log(`Events with fixed URLs: ${SIMULATE ? 0 : fixedUrls} ${SIMULATE ? '(simulation)' : ''}`);
  console.log(`Events with errors: ${errorEvents}`);
}

async function main() {
  try {
    await verifyEventUrls();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 