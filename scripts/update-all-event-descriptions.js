/**
 * Script to update all event descriptions with content from the UH Manoa calendar
 * This extracts descriptions directly from each event's webpage
 */

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Load environment variables
try {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  console.log('Loaded environment variables from:', path.resolve(__dirname, '../.env'));
} catch (err) {
  console.warn('Could not load .env file:', err);
}

const prisma = new PrismaClient();

/**
 * Extracts a comprehensive description from an event's webpage
 * @param {string} url - The event page URL
 * @returns {Promise<string>} The extracted description
 */
async function extractFullEventDescription(url) {
  try {
    console.log(`Fetching content from ${url}`);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Extract the event title
    const title = $('h1').first().text().trim();
    
    // Extract main content - this is the actual event description
    let mainContent = '';
    const contentMain = $('td.content-main');
    if (contentMain.length) {
      mainContent = contentMain.text().trim();
    }
    
    // Extract event details
    const details = {};
    
    // Common detail fields to look for
    const detailFields = [
      'Event Type', 'Sponsor', 'Contact', 'Location', 
      'Date', 'Time', 'Email', 'Phone', 'Cost'
    ];
    
    // Function to extract a detail field if it exists
    const extractField = (field) => {
      const cell = $(`td:contains("${field}:")`);
      if (cell.length) {
        const value = cell.next('td').text().trim();
        if (value) {
          details[field] = value;
        }
      }
    };
    
    // Extract each field
    detailFields.forEach(extractField);
    
    // Format the complete description
    let formattedDescription = '';
    
    // Add title if available and not already in the content
    if (title && !mainContent.includes(title)) {
      formattedDescription += `${title}\n\n`;
    }
    
    // Add main content
    if (mainContent) {
      formattedDescription += `${mainContent}\n\n`;
    }
    
    // Add event details section
    if (Object.keys(details).length > 0) {
      formattedDescription += `------ Event Details ------\n`;
      
      for (const [key, value] of Object.entries(details)) {
        formattedDescription += `${key}: ${value}\n`;
      }
      
      formattedDescription += '\n';
    }
    
    // Add source link
    formattedDescription += `For more information, visit: ${url}`;
    
    return formattedDescription;
  } catch (error) {
    console.error(`Error extracting description from ${url}:`, error);
    return `Could not retrieve detailed description. For more information, visit: ${url}`;
  }
}

/**
 * Updates descriptions for all events in the database
 */
async function updateAllEventDescriptions() {
  console.log('Starting to update all event descriptions...');
  
  // Get all events that have an eventUrl
  const events = await prisma.event.findMany({
    where: {
      eventUrl: {
        not: null
      }
    }
  });
  
  console.log(`Found ${events.length} events with URLs to process`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  // Process each event
  for (const event of events) {
    try {
      console.log(`\nProcessing event "${event.title}"`);
      
      // Extract the description from the event URL
      const description = await extractFullEventDescription(event.eventUrl);
      
      // Update the event with the new description
      await prisma.event.update({
        where: { id: event.id },
        data: { description }
      });
      
      console.log(`✅ Updated description for event "${event.title}"`);
      updatedCount++;
    } catch (error) {
      console.error(`❌ Error updating description for event "${event.title}":`, error);
      errorCount++;
    }
  }
  
  // Print summary
  console.log('\n--- Summary ---');
  console.log(`Total events processed: ${events.length}`);
  console.log(`Events updated successfully: ${updatedCount}`);
  console.log(`Events with errors: ${errorCount}`);
}

async function main() {
  try {
    await updateAllEventDescriptions();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 