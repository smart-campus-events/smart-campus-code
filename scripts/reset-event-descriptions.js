/**
 * Script to reset event descriptions to a minimal state
 * 
 * This script will clean up the event descriptions and contact information
 * to resolve any issues that might be causing 500 errors.
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

async function resetEventDescriptions() {
  console.log('Starting to reset event descriptions...');
  
  // Get all events
  const events = await prisma.event.findMany();
  
  console.log(`Found ${events.length} events to process`);
  
  let resetCount = 0;
  
  // Process each event
  for (const event of events) {
    // Keep only the URL as the description or empty string if no URL
    const eventUrl = event.eventUrl || event.eventPageUrl || '';
    const newDescription = eventUrl ? `View event details at: ${eventUrl}` : '';
    
    // Reset the event description and contact info
    await prisma.event.update({
      where: { id: event.id },
      data: { 
        description: newDescription,
        contactEmail: ''  // Clear contact email field
      }
    });
    
    console.log(`✅ Reset description for "${event.title}"`);
    resetCount++;
  }
  
  // Summary
  console.log('\n--- Summary ---');
  console.log(`Total events processed: ${events.length}`);
  console.log(`Events reset: ${resetCount}`);
}

async function main() {
  try {
    await resetEventDescriptions();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 