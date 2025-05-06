/**
 * Script to extract better descriptions for all events
 * This uses a more robust approach to extract the full content from each event page
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
 * Extract description and details from an event page with more robust content extraction
 * @param {string} url - Event page URL
 * @returns {Promise<string>} Formatted description
 */
async function extractRobustDescription(url) {
  try {
    console.log(`Fetching content from ${url}`);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Extract event title
    const title = $('h1').first().text().trim();
    
    // Extract main content text more carefully
    let mainContent = '';
    const contentMain = $('td.content-main');
    
    if (contentMain.length) {
      // 1. Try to extract text from paragraphs
      const paragraphs = [];
      contentMain.find('p').each((i, el) => {
        const text = $(el).text().trim();
        if (text) paragraphs.push(text);
      });
      
      if (paragraphs.length > 0) {
        mainContent = paragraphs.join('\n\n');
      } else {
        // 2. If no paragraphs, try direct HTML to text conversion
        // Clone the content to avoid modifying the original
        const contentClone = contentMain.clone();
        
        // Remove unwanted elements
        contentClone.find('script, style, iframe').remove();
        
        // Get clean text content
        mainContent = contentClone.text().trim()
          .replace(/\s+/g, ' ')  // Normalize whitespace
          .replace(/\s*\n\s*/g, '\n\n');  // Fix newlines
      }
    }
    
    // Extract event metadata from tables
    const eventDetails = {};
    
    // Get data from event details table
    $('table tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const label = $(cells[0]).text().trim().replace(':', '');
        const value = $(cells[1]).text().trim();
        
        if (label && value && !label.includes('!--')) {
          eventDetails[label] = value;
        }
      }
    });
    
    // Alternative approach to find details
    if (Object.keys(eventDetails).length === 0) {
      $('td:contains(":")').each((i, el) => {
        const label = $(el).text().trim().replace(':', '');
        const nextCell = $(el).next('td');
        if (nextCell.length) {
          const value = nextCell.text().trim();
          if (label && value && !label.includes('<') && !label.includes('>')) {
            eventDetails[label] = value;
          }
        }
      });
    }
    
    // Build the formatted description
    let formattedDescription = '';
    
    // Include the title
    if (title) {
      formattedDescription += `${title}\n\n`;
    }
    
    // Include main content
    if (mainContent) {
      formattedDescription += `${mainContent}\n\n`;
    }
    
    // Add event details section
    if (Object.keys(eventDetails).length > 0) {
      formattedDescription += `------ Event Details ------\n`;
      
      for (const [key, value] of Object.entries(eventDetails)) {
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
 * Updates an event with a more detailed description
 * @param {Object} event - Event object from database
 */
async function updateEventWithBetterDescription(event) {
  try {
    console.log(`Processing event "${event.title}"`);
    
    if (!event.eventUrl) {
      console.log(`⚠️ Event "${event.title}" has no eventUrl. Skipping.`);
      return false;
    }
    
    // Extract better description
    const description = await extractRobustDescription(event.eventUrl);
    
    // Hard-coded minimum description length (to avoid empty descriptions)
    const MIN_DESCRIPTION_LENGTH = 100;
    
    if (description && description.length > MIN_DESCRIPTION_LENGTH) {
      // Update the event with the better description
      await prisma.event.update({
        where: { id: event.id },
        data: { description }
      });
      
      console.log(`✅ Updated description for "${event.title}"`);
      return true;
    } else {
      console.log(`⚠️ Description for "${event.title}" is too short or empty. Skipping.`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating "${event.title}":`, error);
    return false;
  }
}

/**
 * Main function to extract better descriptions for all events
 */
async function extractBetterDescriptions() {
  console.log('Starting to extract better descriptions for all events...');
  
  // Get all events with URLs
  const events = await prisma.event.findMany({
    where: {
      eventUrl: {
        not: null
      }
    }
  });
  
  console.log(`Found ${events.length} events with URLs to process`);
  
  let successCount = 0;
  let failCount = 0;
  
  // Process each event
  for (const event of events) {
    const success = await updateEventWithBetterDescription(event);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  // Print summary
  console.log('\n--- Summary ---');
  console.log(`Total events processed: ${events.length}`);
  console.log(`Successfully updated: ${successCount}`);
  console.log(`Failed to update: ${failCount}`);
}

async function main() {
  try {
    await extractBetterDescriptions();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 