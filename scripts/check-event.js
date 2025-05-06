/**
 * Script to check the James Zarsadiaz event directly in the database
 */

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
try {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  console.log('Loaded environment variables from:', path.resolve(__dirname, '../.env'));
} catch (err) {
  console.warn('Could not load .env file:', err);
}

const prisma = new PrismaClient();

async function checkEvent() {
  console.log('Looking for events with "James", "Zarsadiaz", "Hiram", or "Fong" in the title or description...');
  
  // Find all events with keywords in title or description
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { title: { contains: 'James', mode: 'insensitive' } },
        { title: { contains: 'Zarsadiaz', mode: 'insensitive' } },
        { title: { contains: 'Hiram', mode: 'insensitive' } },
        { title: { contains: 'Fong', mode: 'insensitive' } },
        { title: { contains: 'Asian America', mode: 'insensitive' } },
        { description: { contains: 'James', mode: 'insensitive' } },
        { description: { contains: 'Zarsadiaz', mode: 'insensitive' } },
        { description: { contains: 'Hiram', mode: 'insensitive' } },
        { description: { contains: 'Fong', mode: 'insensitive' } }
      ]
    },
    include: {
      categories: {
        include: {
          category: true
        }
      }
    }
  });
  
  console.log(`Found ${events.length} matching events:`);
  
  // Print each event
  for (const event of events) {
    console.log('\n==================================================');
    console.log(`ID: ${event.id}`);
    console.log(`Title: ${event.title}`);
    console.log(`Start: ${new Date(event.startDateTime).toLocaleString()}`);
    console.log(`End: ${event.endDateTime ? new Date(event.endDateTime).toLocaleString() : 'N/A'}`);
    console.log(`Location: ${event.location || 'N/A'}`);
    console.log(`Categories: ${event.categories.map(c => c.category.name).join(', ') || 'None'}`);
    console.log('Description:');
    console.log(event.description || 'No description');
    console.log(`Event URL: ${event.eventUrl || 'N/A'}`);
    console.log('==================================================\n');
  }
  
  // If no events found, check for any events on May 5, 2025 at noon
  if (events.length === 0) {
    console.log('No events found with keywords. Checking for events on May 5, 2025 around noon...');
    
    const dateEvents = await prisma.event.findMany({
      where: {
        startDateTime: {
          gte: new Date(2025, 4, 5, 0, 0, 0),   // May 5, 2025, start of day
          lt: new Date(2025, 4, 6, 0, 0, 0)     // May 6, 2025, start of day
        }
      },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    
    console.log(`Found ${dateEvents.length} events on May 5, 2025:`);
    
    // Print each event
    for (const event of dateEvents) {
      console.log('\n==================================================');
      console.log(`ID: ${event.id}`);
      console.log(`Title: ${event.title}`);
      console.log(`Start: ${new Date(event.startDateTime).toLocaleString()}`);
      console.log(`Categories: ${event.categories.map(c => c.category.name).join(', ') || 'None'}`);
      console.log(`Location: ${event.location || 'N/A'}`);
      console.log('==================================================\n');
    }
  }
}

async function main() {
  try {
    await checkEvent();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 