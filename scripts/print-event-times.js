/**
 * Script to print event times to check the year and date range
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

async function printEventTimes() {
  console.log('Retrieving all events...');
  
  // Get all events ordered by start time
  const events = await prisma.event.findMany({
    orderBy: {
      startDateTime: 'asc'
    }
  });
  
  console.log(`Found ${events.length} events`);
  console.log('\nEvent Times:');
  console.log('==========================================================');
  
  // Print information for each event
  for (const event of events) {
    const startDate = new Date(event.startDateTime);
    const endDate = event.endDateTime ? new Date(event.endDateTime) : null;
    
    console.log(`"${event.title}"`);
    console.log(`  Start: ${startDate.toISOString()} (${startDate.toLocaleString()})`);
    if (endDate) {
      console.log(`  End:   ${endDate.toISOString()} (${endDate.toLocaleString()})`);
    }
    console.log(`  Year:  ${startDate.getFullYear()}`);
    console.log('----------------------------------------------------------');
  }
  
  // Get the current date in both local time and UTC
  const now = new Date();
  console.log('\nCurrent Time:');
  console.log(`  Local: ${now.toLocaleString()}`);
  console.log(`  UTC:   ${now.toISOString()}`);
  console.log(`  Year:  ${now.getFullYear()}`);
  
  // Count events by year
  const eventsByYear = {};
  for (const event of events) {
    const year = new Date(event.startDateTime).getFullYear();
    eventsByYear[year] = (eventsByYear[year] || 0) + 1;
  }
  
  console.log('\nEvents by Year:');
  for (const year in eventsByYear) {
    console.log(`  ${year}: ${eventsByYear[year]} events`);
  }
}

async function main() {
  try {
    await printEventTimes();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 