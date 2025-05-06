/**
 * Script to properly extract and update event descriptions from UH Manoa calendar pages
 * Each event will have its own description from its specific event page
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
 * Extract a proper description from an individual event page
 * @param {string} url - The URL of the event page
 * @returns {Promise<string>} The extracted description
 */
async function getEventDescription(url) {
  try {
    console.log(`Getting description from: ${url}`);
    
    // Fetch the event page
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Content extraction strategy:
    // 1. Look for main content in the td.content-main element
    const contentMain = $('td.content-main');
    
    // Create a clean text representation of the content
    let descriptionText = '';
    
    if (contentMain.length) {
      // Clone to avoid modifying the original
      const clone = contentMain.clone();
      
      // Remove scripts and styles
      clone.find('script, style').remove();
      
      // Extract text from the main content area
      descriptionText = clone.text().trim();
    }
    
    // 2. Get event details from the details table
    const details = {
      'Event Type': '',
      'Sponsor': '',
      'Location': '',
      'Contact': '',
      'Time': '',
      'Date': ''
    };
    
    // Look for cells with these labels
    for (const label of Object.keys(details)) {
      $(`td:contains("${label}:")`).each((i, el) => {
        const nextCell = $(el).next('td');
        if (nextCell.length) {
          details[label] = nextCell.text().trim();
        }
      });
    }
    
    // Format the complete description
    let formattedDescription = '';
    
    // Add event description
    if (descriptionText) {
      // Clean up the text
      formattedDescription += descriptionText
        .replace(/\s{2,}/g, ' ')       // Replace multiple spaces with a single space
        .replace(/\n{2,}/g, '\n\n')    // Replace multiple newlines with double newlines
        .trim();
      
      formattedDescription += '\n\n';
    }
    
    // Add event details section if we have any details
    const filteredDetails = Object.entries(details).filter(([_, value]) => value);
    
    if (filteredDetails.length > 0) {
      formattedDescription += '------- Event Details -------\n';
      
      for (const [key, value] of filteredDetails) {
        formattedDescription += `${key}: ${value}\n`;
      }
      
      formattedDescription += '\n';
    }
    
    // Add source link
    formattedDescription += `For more information, visit: ${url}`;
    
    return formattedDescription;
  } catch (error) {
    console.error(`Error extracting description from ${url}:`, error.message);
    return `Unable to retrieve description. For more information, visit: ${url}`;
  }
}

/**
 * Update the description for a single event
 * @param {Object} event - The event object to update
 * @returns {Promise<boolean>} Success status
 */
async function updateEventDescription(event) {
  try {
    if (!event.eventUrl) {
      console.log(`⚠️ Event "${event.title}" has no URL. Skipping.`);
      return false;
    }
    
    // Get the description from the event page
    const description = await getEventDescription(event.eventUrl);
    
    // Update the event in the database
    await prisma.event.update({
      where: { id: event.id },
      data: { description }
    });
    
    console.log(`✅ Updated description for "${event.title}"`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating "${event.title}":`, error.message);
    return false;
  }
}

/**
 * Main function to update all event descriptions
 */
async function fixAllEventDescriptions() {
  try {
    console.log('Starting to update event descriptions...');
    
    // Get all events with URLs
    const events = await prisma.event.findMany({
      where: {
        eventUrl: {
          not: null
        }
      }
    });
    
    console.log(`Found ${events.length} events with URLs`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Process each event one by one
    for (const event of events) {
      console.log(`\nProcessing [${events.indexOf(event) + 1}/${events.length}]: "${event.title}"`);
      
      // Update the event description
      const success = await updateEventDescription(event);
      
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Print summary
    console.log('\n--- Summary ---');
    console.log(`Total events: ${events.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Failed to update: ${failCount}`);
    
  } catch (error) {
    console.error('Error updating event descriptions:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the main function
fixAllEventDescriptions(); 