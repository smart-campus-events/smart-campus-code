/**
 * Script to check if the eventUrl and eventPageUrl fields are correctly set for UH Manoa events.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEventUrls() {
  console.log('Checking event URLs for UH Manoa events...');
  
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
    },
    take: 5 // Just take a few as examples
  });

  console.log(`Found ${events.length} UH Manoa events to check.\n`);

  // Display the events
  events.forEach((event, index) => {
    console.log(`--- Event ${index + 1}: ${event.title} ---`);
    console.log(`ID: ${event.id}`);
    console.log(`Organizer: ${event.organizerSponsor}`);
    console.log(`Start Date: ${event.startDateTime}`);
    console.log(`Event URL: ${event.eventUrl || 'None'}`);
    console.log(`Event Page URL: ${event.eventPageUrl || 'None'}`);
    console.log('');
  });
}

async function main() {
  try {
    await checkEventUrls();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 