/**
 * Script to properly extract and update event descriptions from UH Manoa calendar pages
 * Using the improved method that works based on our debugging
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
    // Fetch the event page
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Improved extraction logic - using a more robust approach
    // Strip scripts and styles to clean the content
    $('script, style, meta, link').remove();
    
    let title = '';
    let mainContent = '';
    let eventDetails = '';
    
    // Try to get the title and details
    title = $('h1, h2').filter(function() {
      return $(this).text().trim().length > 0;
    }).first().text().trim();
    
    // Look for the event description - it's typically after "About the talk:" or similar text
    const bodyText = $('body').text();
    
    // Extract descriptions with regex for common patterns
    const aboutMatch = bodyText.match(/About the (talk|event|presentation):([\s\S]+?)(\n\n|\r\n\r\n|$)/i);
    if (aboutMatch) {
      mainContent = aboutMatch[2].trim();
    } else {
      // If no specific about section, try to get any substantial text block
      // First remove navigation and header content
      $('header, nav, .navbar, .menu, .footer, footer').remove();
      
      // Get the main content area text
      mainContent = $('body').text()
        .replace(/\s{2,}/g, ' ')
        .trim();
      
      // Limit to a reasonable length if it's too long
      if (mainContent.length > 1500) {
        mainContent = mainContent.substring(0, 1500) + '...';
      }
    }
    
    // Try to extract event details like location, time, date
    // These typically appear in specific sections
    const locationMatch = bodyText.match(/location:?\s*([^\n]+)/i);
    const timeMatch = bodyText.match(/time:?\s*([^\n]+)/i);
    const dateMatch = bodyText.match(/date:?\s*([^\n]+)/i);
    
    const details = {};
    if (title) details.Title = title;
    if (locationMatch) details.Location = locationMatch[1].trim();
    if (timeMatch) details.Time = timeMatch[1].trim();
    if (dateMatch) details.Date = dateMatch[1].trim();
    
    // Format the complete description
    let formattedDescription = '';
    
    // Add main content
    if (mainContent) {
      formattedDescription += mainContent + '\n\n';
    }
    
    // Add event details
    if (Object.keys(details).length > 0) {
      formattedDescription += '------- Event Details -------\n';
      
      for (const [key, value] of Object.entries(details)) {
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
    
    // Don't update if the description is too short
    if (description.length < 50) {
      console.log(`⚠️ Description for "${event.title}" is too short (${description.length} chars). Skipping.`);
      return false;
    }
    
    // Update the event in the database
    await prisma.event.update({
      where: { id: event.id },
      data: { description }
    });
    
    // Verify the update
    const verifyEvent = await prisma.event.findUnique({
      where: { id: event.id },
      select: { description: true }
    });
    
    if (verifyEvent?.description?.length === description.length) {
      console.log(`✅ Updated description for "${event.title}" (${description.length} chars)`);
      return true;
    } else {
      console.log(`⚠️ Verification failed for "${event.title}". Expected: ${description.length}, Got: ${verifyEvent?.description?.length}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating "${event.title}":`, error.message);
    return false;
  }
}

/**
 * Main function to update all event descriptions
 */
async function updateAllEventDescriptions() {
  try {
    console.log('Starting to update all event descriptions...');
    
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
updateAllEventDescriptions(); 