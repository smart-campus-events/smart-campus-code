/**
 * Script to directly check the full description of an event from the database
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

async function checkEventDescription() {
  try {
    // Get the first event as a sample
    const event = await prisma.event.findFirst({
      where: {
        title: "Talk by James Zarsadiaz: Hiram Fong's Asian America"
      }
    });

    if (!event) {
      console.log('No event found');
      return;
    }

    console.log('Event found:');
    console.log('Title:', event.title);
    console.log('Status:', event.status);
    console.log('Description full length:', event.description?.length || 0);
    console.log('\n--- First 1000 characters of description ---');
    console.log(event.description?.substring(0, 1000) || 'No description');
    console.log('\n--- Last 1000 characters of description ---');
    if (event.description && event.description.length > 1000) {
      console.log(event.description.substring(event.description.length - 1000));
    }

    // Get another event for comparison
    const secondEvent = await prisma.event.findFirst({
      where: {
        title: "Slice of PI-CASC"
      }
    });

    if (secondEvent) {
      console.log('\n\nSecond event:');
      console.log('Title:', secondEvent.title);
      console.log('Description full length:', secondEvent.description?.length || 0);
      console.log('\n--- First 1000 characters of description ---');
      console.log(secondEvent.description?.substring(0, 1000) || 'No description');
    }

  } catch (error) {
    console.error('Error checking event description:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
checkEventDescription(); 