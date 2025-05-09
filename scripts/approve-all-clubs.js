/**
 * Script to automatically approve all clubs in the database
 * 
 * This script sets all clubs with PENDING status to APPROVED status
 * 
 * How to run:
 * node scripts/approve-all-clubs.js
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables for direct script execution
if (process.argv[1].includes('approve-all-clubs.js')) {
  dotenv.config();
}

// Use a passed Prisma client if available (for API calls),
// otherwise create a new one (for direct script execution)
async function approveAllClubs(prismaClient) {
  const prisma = prismaClient || new PrismaClient();
  console.log('Starting script to approve all clubs...');
  
  try {
    const pendingCount = await prisma.club.count({
      where: { status: 'PENDING' },
    });
    
    console.log(`Found ${pendingCount} pending clubs to approve.`);
    
    if (pendingCount === 0) {
      console.log('No pending clubs found. Exiting.');
      if (!prismaClient) await prisma.$disconnect(); // Disconnect only if locally created
      return 0; // Consistent return type
    }
    
    const result = await prisma.club.updateMany({
      where: { status: 'PENDING' },
      data: { status: 'APPROVED' },
    });
    
    console.log(`Successfully approved ${result.count} clubs!`);
    return result.count;
  } catch (error) {
    console.error('Error approving clubs:', error);
    throw error;
  } finally {
    // Only disconnect if this function created the client
    if (!prismaClient) {
      await prisma.$disconnect();
    }
    // For API calls, the calling function will handle disconnection of the singleton
    console.log('approveAllClubs function execution completed.');
  }
}

// Run the script directly if called from command line
if (process.argv[1].includes('approve-all-clubs.js')) {
  approveAllClubs()
    .then(count => {
      console.log(`Direct script execution: Approved ${count} clubs.`);
    })
    .catch(error => {
      console.error('Direct script execution failed:', error);
      process.exit(1);
    });
}

export { approveAllClubs }; 