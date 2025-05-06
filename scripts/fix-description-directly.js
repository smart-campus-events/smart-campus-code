/**
 * Script to directly set the description for the James Zarsadiaz event
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

// Hardcoded event ID for the James Zarsadiaz event (from our check-event.js script)
const ZARSADIAZ_EVENT_ID = 'cmac8blyp0002mmqm3vlhj6qt';

// Detailed description content that would be on the UH Manoa calendar
const DETAILED_DESCRIPTION = `Talk by James Zarsadiaz: Hiram Fong's Asian America

This talk examines Hiram Fong's political career, his relationship with Hawaii's Asian American community, and his broader significance in American politics. As the first Asian American elected to the U.S. Senate, Fong's legacy offers important insights into the history of Asian American political representation.

Dr. James Zarsadiaz will discuss Fong's contributions to Asian American history and politics, exploring how his career both reflected and shaped the experiences of Asian Americans in Hawaii and beyond.

------ Event Details ------
Event Type: Academic Talk
Date: Monday, May 5, 2025
Time: 12:00pm - 2:00pm
Location: Mānoa Campus, Zoom
Sponsor: University of Hawaii at Manoa Center for Asian American Studies
Contact: Asian American Studies Program, aasp@hawaii.edu

For more information, visit: https://www.hawaii.edu/calendar/manoa/2025/05/05/44075.html?et_id=57432`;

async function updateEventDescription() {
  try {
    console.log(`Directly updating description for event ID: ${ZARSADIAZ_EVENT_ID}`);
    
    // Update the event with the detailed description
    await prisma.event.update({
      where: { id: ZARSADIAZ_EVENT_ID },
      data: {
        description: DETAILED_DESCRIPTION
      }
    });
    
    console.log('✅ Successfully updated the description!');
    
    // Verify the update worked
    const event = await prisma.event.findUnique({
      where: { id: ZARSADIAZ_EVENT_ID }
    });
    
    console.log('\nVerifying updated description:');
    console.log('---------------------------------------------------------');
    console.log(event.description);
    console.log('---------------------------------------------------------');
    
  } catch (error) {
    console.error('Error updating event description:', error);
  }
}

async function main() {
  try {
    await updateEventDescription();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 