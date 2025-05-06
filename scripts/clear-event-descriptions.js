/**
 * Script to clear descriptions for events that don't have a valid UH Manoa URL
 * 
 * This ensures we don't show placeholder or incorrect descriptions for events.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDescriptions() {
  console.log('Starting to clear descriptions for events without UH Manoa URLs...');
  
  // Get all events that are not from UH Manoa calendar
  const events = await prisma.event.findMany({
    where: {
      AND: [
        {
          OR: [
            { eventUrl: null },
            { eventUrl: { not: { contains: 'hawaii.edu/calendar' } } },
          ]
        },
        {
          OR: [
            { eventPageUrl: null },
            { eventPageUrl: { not: { contains: 'hawaii.edu/calendar' } } },
          ]
        }
      ]
    }
  });
  
  console.log(`Found ${events.length} events without UH Manoa URLs`);
  
  let clearedCount = 0;
  let alreadyClearedCount = 0;
  
  // Process each event
  for (const event of events) {
    if (!event.description || event.description.trim() === '') {
      console.log(`✓ Event "${event.title}" already has no description.`);
      alreadyClearedCount++;
      continue;
    }
    
    // Clear the description
    await prisma.event.update({
      where: { id: event.id },
      data: { description: '' }
    });
    
    console.log(`🧹 Cleared description for "${event.title}" (was ${event.description.length} chars)`);
    clearedCount++;
  }
  
  // Summary
  console.log('\n--- Summary ---');
  console.log(`Total events without UH Manoa URLs: ${events.length}`);
  console.log(`Descriptions cleared: ${clearedCount}`);
  console.log(`Events already without descriptions: ${alreadyClearedCount}`);
}

async function main() {
  try {
    await clearDescriptions();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 