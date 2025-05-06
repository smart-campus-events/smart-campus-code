/**
 * Script to move all events to the current month (May 2025)
 * This will make all events visible in the frontend by setting them in the near future
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

async function moveEventsToCurrentMonth() {
  console.log('Starting to move events to the current month...');
  
  // Get the current date in UTC
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Get all events
  const events = await prisma.event.findMany({
    orderBy: {
      startDateTime: 'asc'
    }
  });
  
  console.log(`Found ${events.length} events to process`);
  console.log(`Moving events to ${currentMonth + 1}/${currentYear}`);
  
  let updatedCount = 0;
  
  // Process each event
  for (const event of events) {
    const startDate = new Date(event.startDateTime);
    const oldStartDate = new Date(startDate);
    
    // Set the month and year to current month/year while keeping the day and time
    startDate.setFullYear(currentYear);
    startDate.setMonth(currentMonth);
    
    // Ensure the date is not in the past (set to at least tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (startDate < tomorrow) {
      startDate.setDate(tomorrow.getDate() + Math.floor(Math.random() * 20)); // Random day in the next 20 days
    }
    
    let endDate = null;
    if (event.endDateTime) {
      endDate = new Date(event.endDateTime);
      const oldEndDate = new Date(endDate);
      
      // Calculate the duration of the event (difference between start and end)
      const duration = oldEndDate.getTime() - oldStartDate.getTime();
      
      // Set the new end date by adding the same duration to the new start date
      endDate = new Date(startDate.getTime() + duration);
    }
    
    // Update the event with the new dates
    await prisma.event.update({
      where: { id: event.id },
      data: { 
        startDateTime: startDate,
        endDateTime: endDate
      }
    });
    
    console.log(`✅ Moved event "${event.title}" from ${oldStartDate.toLocaleString()} to ${startDate.toLocaleString()}`);
    updatedCount++;
  }
  
  // Summary
  console.log('\n--- Summary ---');
  console.log(`Total events processed: ${events.length}`);
  console.log(`Events moved to current month: ${updatedCount}`);
}

async function main() {
  try {
    await moveEventsToCurrentMonth();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 