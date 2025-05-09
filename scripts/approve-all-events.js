/**
 * Script to automatically approve all events in the database
 * 
 * This script sets all events with PENDING status to APPROVED status
 * 
 * How to run:
 * node scripts/approve-all-events.js
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables for direct script execution
if (process.argv[1].includes('approve-all-events.js')) {
  dotenv.config();
}

// Use a passed Prisma client if available (for API calls),
// otherwise create a new one (for direct script execution)
async function approveAllEvents(prismaClient) {
  const prisma = prismaClient || new PrismaClient();
  console.log('Starting script to approve all events...');
  
  try {
    // Get count of pending events
    const pendingCount = await prisma.event.count({
      where: {
        status: 'PENDING'
      }
    });
    
    console.log(`Found ${pendingCount} pending events to approve.`);
    
    if (pendingCount === 0) {
      console.log('No pending events found. Exiting.');
      if (!prismaClient) await prisma.$disconnect(); // Disconnect only if locally created
      return 0;
    }
    
    // Update all pending events to approved
    const result = await prisma.event.updateMany({
      where: {
        status: 'PENDING'
      },
      data: {
        status: 'APPROVED'
      }
    });
    
    console.log(`Successfully approved ${result.count} events!`);
    return result.count; // Return count for API usage
  } catch (error) {
    console.error('Error approving events:', error);
    throw error; // Re-throw for API error handling
  } finally {
    if (!prismaClient) {
      await prisma.$disconnect();
    }
    console.log('approveAllEvents function execution completed.');
  }
}

// Run the script directly if called from command line
if (process.argv[1].includes('approve-all-events.js')) {
  approveAllEvents()
    .then(count => {
      console.log(`Direct script execution: Approved ${count} events.`);
    })
    .catch(error => {
      console.error('Direct script execution failed:', error);
      process.exit(1);
    });
}

// Export for API use
export { approveAllEvents }; 