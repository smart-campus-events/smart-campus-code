/**
 * Script to approve all events in the database
 * This will make all events visible on the frontend
 */

const { PrismaClient, ContentStatus } = require('@prisma/client');
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

async function approveAllEvents() {
  console.log('Starting to approve all events...');
  
  // Get all events
  const events = await prisma.event.findMany();
  
  console.log(`Found ${events.length} events to process`);
  
  let approvedCount = 0;
  let alreadyApprovedCount = 0;
  
  // Process each event
  for (const event of events) {
    if (event.status === ContentStatus.APPROVED) {
      console.log(`✓ Event "${event.title}" is already approved.`);
      alreadyApprovedCount++;
      continue;
    }
    
    // Approve the event
    await prisma.event.update({
      where: { id: event.id },
      data: { status: ContentStatus.APPROVED }
    });
    
    console.log(`✅ Approved event "${event.title}"`);
    approvedCount++;
  }
  
  // Summary
  console.log('\n--- Summary ---');
  console.log(`Total events processed: ${events.length}`);
  console.log(`Events newly approved: ${approvedCount}`);
  console.log(`Events already approved: ${alreadyApprovedCount}`);
}

async function main() {
  try {
    await approveAllEvents();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 