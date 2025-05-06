/**
 * Script to properly extract and update event descriptions from UH Manoa calendar pages
 * Enhanced with debug features to diagnose the description issue
 */

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

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
 * @returns {Promise<Object>} The extracted description and HTML
 */
async function getEventDescription(url) {
  try {
    console.log(`Getting description from: ${url}`);
    
    // Fetch the event page
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Sample part of HTML for debugging
    const htmlSample = html.substring(0, 500) + '...';
    console.log('\nHTML Sample:');
    console.log(htmlSample);
    
    // Dump the HTML to a file for debugging
    const eventId = url.match(/(\d+)\.html/)?.[1] || 'unknown';
    fs.writeFileSync(`event_${eventId}_debug.html`, html);
    console.log(`Saved HTML to event_${eventId}_debug.html`);
    
    // Look for specific content sections
    console.log('\nExamining page structure:');
    console.log('td.content-main found:', $('td.content-main').length > 0);
    console.log('div.event-description found:', $('div.event-description').length > 0);
    console.log('div.node__content found:', $('div.node__content').length > 0);
    
    // Content extraction strategy:
    let mainContent = '';
    
    // Try different selectors until we find content
    if ($('div.event-description').length > 0) {
      console.log('Using event-description div');
      mainContent = $('div.event-description').text().trim();
    } else if ($('td.content-main').length > 0) {
      console.log('Using content-main td');
      mainContent = $('td.content-main').text().trim();
    } else if ($('div.node__content').length > 0) {
      console.log('Using node__content div');
      mainContent = $('div.node__content').text().trim();
    } else {
      // As a fallback, try to get content from the body
      console.log('Fallback: using body content');
      $('body').find('script, style, header, footer, nav').remove();
      mainContent = $('body').text().trim()
        .replace(/\s{2,}/g, ' ')
        .slice(0, 1000); // Limit fallback content
    }
    
    console.log('\nExtracted main content sample:');
    console.log(mainContent.substring(0, 200) + '...');
    
    // Event details
    const details = {};
    
    // Try to find event details table
    $('table.event-table tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const key = $(cells[0]).text().trim().replace(':', '');
        const value = $(cells[1]).text().trim();
        if (key && value) {
          details[key] = value;
          console.log(`Found detail: ${key} = ${value}`);
        }
      }
    });
    
    // Format the complete description
    let formattedDescription = '';
    
    // Add main content
    if (mainContent) {
      formattedDescription += mainContent
        .replace(/\s{2,}/g, ' ')
        .replace(/\n{2,}/g, '\n\n')
        .trim();
      
      formattedDescription += '\n\n';
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
    
    console.log('\nFinal description sample:');
    console.log(formattedDescription.substring(0, 200) + '...');
    
    return {
      description: formattedDescription,
      rawHtml: html
    };
  } catch (error) {
    console.error(`Error extracting description from ${url}:`, error.message);
    return {
      description: `Unable to retrieve description. For more information, visit: ${url}`,
      error: error.message
    };
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
    const { description } = await getEventDescription(event.eventUrl);
    
    console.log(`\nDescription length: ${description.length} characters`);
    console.log(`Updating database for event ID: ${event.id}`);
    
    // Update the event in the database
    const result = await prisma.event.update({
      where: { id: event.id },
      data: { description: description }
    });
    
    console.log(`Database update result:`, result.id ? 'Success' : 'Failed');
    
    // Double-check the update
    const verifyEvent = await prisma.event.findUnique({
      where: { id: event.id },
      select: { description: true }
    });
    
    console.log(`Verification - description in DB:`, 
      verifyEvent?.description?.substring(0, 100) + '...');
    
    console.log(`✅ Updated description for "${event.title}"`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating "${event.title}":`, error);
    return false;
  }
}

/**
 * Main function to update event descriptions
 */
async function fixEventDescriptions() {
  try {
    console.log('Starting to debug event descriptions...');
    
    // Let's just try one event first for debugging
    const events = await prisma.event.findMany({
      where: {
        eventUrl: {
          not: null
        },
        title: {
          contains: "Talk by James Zarsadiaz" // Just focus on one event for debugging
        }
      },
      take: 1
    });
    
    console.log(`Found ${events.length} test events`);
    
    if (events.length === 0) {
      console.log('No test events found. Trying general event query...');
      
      const allEvents = await prisma.event.findMany({
        where: {
          eventUrl: {
            not: null
          }
        },
        take: 1
      });
      
      if (allEvents.length > 0) {
        console.log(`Found a general event: ${allEvents[0].title}`);
        await updateEventDescription(allEvents[0]);
      } else {
        console.log('No events with URLs found in the database.');
      }
      
      return;
    }
    
    // Process the test event
    await updateEventDescription(events[0]);
    
  } catch (error) {
    console.error('Error updating event descriptions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the main function
fixEventDescriptions(); 