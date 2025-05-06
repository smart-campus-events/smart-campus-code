/**
 * Script to get the James Zarsadiaz event directly from the database
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

async function getJamesEvent() {
  try {
    console.log('Getting the James Zarsadiaz event...');
    
    const event = await prisma.event.findUnique({
      where: { id: 'cmac8blyp0002mmqm3vlhj6qt' },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    
    if (event) {
      console.log('\nEvent Details:');
      console.log('---------------------------------------------------------');
      console.log(`ID: ${event.id}`);
      console.log(`Title: ${event.title}`);
      console.log(`Start Date: ${new Date(event.startDateTime).toLocaleString()}`);
      console.log(`Location: ${event.location}`);
      console.log(`Categories: ${event.categories.map(c => c.category.name).join(', ')}`);
      console.log('\nDescription:');
      console.log(event.description);
      console.log('---------------------------------------------------------');
    } else {
      console.log('Event not found!');
    }
  } catch (error) {
    console.error('Error getting event:', error);
  }
}

async function main() {
  try {
    await getJamesEvent();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 