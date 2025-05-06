/**
 * Script to extract detailed descriptions from the original UH Manoa event links
 * and update our events with these descriptions
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
 * Extracts the full description from an event page
 * @param {string} url - URL of the event page
 * @returns {Promise<string>} Full event description
 */
async function extractEventDescription(url) {
  try {
    console.log(`Fetching description from ${url}`);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    let description = '';
    
    // Main event description is in the content-main td
    const mainContent = $('td.content-main').first();
    if (mainContent.length) {
      // Get the text content, preserving paragraph breaks
      mainContent.find('p, div, br').each((i, el) => {
        const text = $(el).text().trim();
        if (text) {
          description += text + '\n\n';
        }
      });
      
      // If the above didn't work well, just get all text
      if (!description) {
        description = mainContent.text().trim();
      }
    }
    
    // Look for event details table
    let eventDetails = '';
    
    // Event type
    const eventType = $('td:contains("Event Type:")').next('td').text().trim();
    if (eventType) {
      eventDetails += `Event Type: ${eventType}\n`;
    }
    
    // Sponsor
    const sponsor = $('td:contains("Sponsor:")').next('td').text().trim();
    if (sponsor) {
      eventDetails += `Sponsor: ${sponsor}\n`;
    }
    
    // Contact
    const contact = $('td:contains("Contact:")').next('td').text().trim();
    if (contact) {
      eventDetails += `Contact: ${contact}\n`;
    }
    
    // Location
    const location = $('td:contains("Location:")').next('td').text().trim();
    if (location) {
      eventDetails += `Location: ${location}\n`;
    }
    
    // Combine the description and event details
    let fullDescription = description.trim();
    
    if (eventDetails) {
      fullDescription += '\n\n------ Event Details ------\n' + eventDetails;
    }
    
    // Add the original link
    fullDescription += `\n\nFor more information, visit: ${url}`;
    
    return fullDescription;
  } catch (error) {
    console.error(`Error extracting description from ${url}:`, error);
    return `Unable to extract description. For more information, visit: ${url}`;
  }
}

/**
 * Updates event descriptions with detailed content from original sources
 */
async function updateEventDescriptions() {
  console.log('Starting to update event descriptions from original sources...');
  
  // Get all events with eventUrl set
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
      if (!event.eventUrl) {
        console.log(`⚠️ Event "${event.title}" has no eventUrl set. Skipping.`);
        continue;
      }
      
      console.log(`Processing event "${event.title}"`);
      
      // Extract the full description from the event page
      const fullDescription = await extractEventDescription(event.eventUrl);
      
      if (fullDescription) {
        // Update the event with the detailed description
        await prisma.event.update({
          where: { id: event.id },
          data: {
            description: fullDescription
          }
        });
        
        console.log(`✅ Updated description for event "${event.title}"`);
        updatedCount++;
      } else {
        console.log(`⚠️ No description found for event "${event.title}"`);
        errorCount++;
      }
    } catch (error) {
      console.error(`Error processing event "${event.title}":`, error);
      errorCount++;
    }
  }
  
  // Summary
  console.log('\n--- Summary ---');
  console.log(`Total events processed: ${events.length}`);
  console.log(`Events with updated descriptions: ${updatedCount}`);
  console.log(`Events with errors: ${errorCount}`);
}

async function main() {
  try {
    await updateEventDescriptions();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 