/**
 * Script to extract focused event descriptions from UH Manoa calendar pages
 * Only targeting the actual event description, not the entire page content
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
 * Extract only the focused description from an event page
 * @param {string} url - The URL of the event page
 * @returns {Promise<string>} The extracted description
 */
async function getEventDescription(url) {
  try {
    // Fetch the event page
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Focus on extracting just the event description
    let description = '';
    
    // Look for the description specifically in known containers
    // First try: Look for "About the event" or similar sections
    const bodyText = $('body').text();
    const aboutMatch = bodyText.match(/About the (talk|event|presentation|seminar|workshop|course|lecture):([\s\S]+?)(\n\n|\r\n\r\n|For more information|Location:|Date:|Time:|$)/i);
    
    if (aboutMatch && aboutMatch[2]) {
      // We found a specific about section
      description = aboutMatch[2].trim();
    } else {
      // Try to find the main content container
      // UH Manoa calendar typically has content in specific places
      const contentSelector = 'div.event-description, div.content-area, main, td.content-main, div.node__content';
      const contentElement = $(contentSelector).first();
      
      if (contentElement.length) {
        // Clean the content element
        contentElement.find('script, style, header, footer, nav').remove();
        
        // Get just the first paragraph or two as the description
        const paragraphs = contentElement.find('p');
        if (paragraphs.length > 0) {
          // Get up to two paragraphs for the description
          const limit = Math.min(2, paragraphs.length);
          for (let i = 0; i < limit; i++) {
            const pText = $(paragraphs[i]).text().trim();
            if (pText && pText.length > 30) { // Only include substantial paragraphs
              description += pText + '\n\n';
            }
          }
        } else {
          // If no paragraphs found, get a short excerpt of the content
          description = contentElement.text()
            .replace(/\s{2,}/g, ' ')
            .trim()
            .substring(0, 300);
        }
      } else {
        // Last resort: Extract a focused portion from the beginning of the body
        // First remove common navigation elements
        $('header, nav, menu, .navbar, .navigation, .menu, .footer, footer').remove();
        
        // Get text and clean it up
        const bodyText = $('body').text()
          .replace(/\s{2,}/g, ' ')
          .trim();
        
        // Extract a focused portion (first 200-300 characters is usually the intro)
        description = bodyText.substring(0, 250);
      }
    }
    
    // Add a link to the original page for more information
    description = description.trim();
    
    // Add details only if we have a meaningful description
    if (description.length > 30) {
      // Try to extract event location
      let location = '';
      $('td:contains("Location:")').each(function() {
        const nextCell = $(this).next('td');
        if (nextCell.length) {
          location = nextCell.text().trim();
        }
      });
      
      // Try to extract event time
      let time = '';
      $('td:contains("Time:")').each(function() {
        const nextCell = $(this).next('td');
        if (nextCell.length) {
          time = nextCell.text().trim();
        }
      });
      
      // Add event details section if we have any details
      if (location || time) {
        description += '\n\n------- Event Details -------\n';
        if (location) description += `Location: ${location}\n`;
        if (time) description += `Time: ${time}\n`;
      }
    }
    
    // Add source link
    description += `\n\nFor more information, visit: ${url}`;
    
    return description;
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
    
    // Get the focused description from the event page
    const description = await getEventDescription(event.eventUrl);
    
    // Don't update if the description is too short
    if (description.length < 50) {
      console.log(`⚠️ Description for "${event.title}" is too short (${description.length} chars). Skipping.`);
      return false;
    }
    
    // Show a preview of the description
    const previewLength = Math.min(100, description.length);
    console.log(`Description preview: "${description.substring(0, previewLength)}..."`);
    
    // Update the event in the database
    await prisma.event.update({
      where: { id: event.id },
      data: { description }
    });
    
    console.log(`✅ Updated description for "${event.title}" (${description.length} chars)`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating "${event.title}":`, error.message);
    return false;
  }
}

/**
 * Main function to update all event descriptions
 */
async function extractFocusedDescriptions() {
  try {
    console.log('Starting to extract focused event descriptions...');
    
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
    
    // Process each event
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      console.log(`\nProcessing [${i + 1}/${events.length}]: "${event.title}"`);
      
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
extractFocusedDescriptions(); 