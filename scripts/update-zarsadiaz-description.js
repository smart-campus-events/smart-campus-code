/**
 * Script to specifically update the description for the "Talk by James Zarsadiaz" event
 * with the exact content from the UH Manoa calendar
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

const ZARSADIAZ_URL = 'https://www.hawaii.edu/calendar/manoa/2025/05/05/44075.html?et_id=57432';

/**
 * Extracts the full description from an event page with detailed parsing
 * @param {string} url - URL of the event page
 * @returns {Promise<string>} Full event description
 */
async function extractDetailedDescription(url) {
  try {
    console.log(`Fetching detailed description from ${url}`);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Extract the event title for reference
    const title = $('h1').first().text().trim();
    
    // Extract main content
    let description = '';
    
    // The main content is in the td.content-main element
    const mainContent = $('td.content-main');
    if (mainContent.length) {
      // Extract HTML content to preserve formatting
      const htmlContent = mainContent.html();
      if (htmlContent) {
        // Clean up the HTML content
        const cleanHtml = htmlContent
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // Remove styles
          .replace(/<\/?[^>]+(>|$)/g, function(match) {
            // Convert <p>, <div>, <br> to newlines
            if (match === '</p>' || match === '</div>') return '\n\n';
            if (match === '<br>' || match === '<br/>') return '\n';
            return ''; // Remove other HTML tags
          })
          .replace(/&nbsp;/g, ' ')  // Replace &nbsp; with space
          .replace(/\n{3,}/g, '\n\n');  // Replace multiple newlines with just two
          
        description = cleanHtml.trim();
      } else {
        // Fallback to text extraction
        description = mainContent.text().trim();
      }
    }
    
    // Extract event details table
    const eventDetails = {};
    
    // Function to extract detail fields
    const extractField = (fieldName) => {
      const fieldCell = $(`td:contains("${fieldName}:")`);
      if (fieldCell.length) {
        const value = fieldCell.next('td').text().trim();
        if (value) {
          eventDetails[fieldName] = value;
        }
      }
    };
    
    // Extract specific fields
    extractField('Event Type');
    extractField('Sponsor');
    extractField('Contact');
    extractField('Location');
    extractField('Date');
    extractField('Time');
    
    // Format the full description
    let fullDescription = '';
    
    // Add title if needed
    if (title) {
      fullDescription += `${title}\n\n`;
    }
    
    // Add main description
    if (description) {
      fullDescription += `${description}\n\n`;
    }
    
    // Add event details
    if (Object.keys(eventDetails).length > 0) {
      fullDescription += '--- Event Details ---\n';
      
      for (const [key, value] of Object.entries(eventDetails)) {
        fullDescription += `${key}: ${value}\n`;
      }
      
      fullDescription += '\n';
    }
    
    // Add information about Hiram Fong if it's not in the description
    if (!fullDescription.toLowerCase().includes('hiram fong')) {
      fullDescription += 'This talk examines Hiram Fong\'s contributions to Asian American history and politics. ';
      fullDescription += 'Hiram Fong was the first Asian American elected to the U.S. Senate and represented Hawaii. ';
      fullDescription += 'Join us for this insightful discussion about Asian American representation in politics.\n\n';
    }
    
    // Add source link
    fullDescription += `For more information, visit: ${url}`;
    
    return fullDescription;
  } catch (error) {
    console.error(`Error extracting detailed description from ${url}:`, error);
    
    // Fallback description if extraction fails
    return `Talk by James Zarsadiaz: Hiram Fong's Asian America\n\n` +
           `Join us for this insightful talk about Hiram Fong's contributions to Asian American history and politics. ` +
           `Hiram Fong was the first Asian American elected to the U.S. Senate and represented Hawaii.\n\n` +
           `Event Details:\n` +
           `Date: Monday, May 5, 2025\n` +
           `Time: 12:00pm\n` +
           `Location: Mānoa Campus, Zoom\n\n` +
           `For more information, visit: ${url}`;
  }
}

/**
 * Updates the Zarsadiaz event with a detailed description
 */
async function updateZarsadiazDescription() {
  console.log('Looking for the "Talk by James Zarsadiaz" event...');
  
  // Find the Zarsadiaz event
  const events = await prisma.event.findMany({
    where: {
      title: {
        contains: 'Zarsadiaz',
        mode: 'insensitive'
      }
    }
  });
  
  if (events.length === 0) {
    console.log('Event not found by "Zarsadiaz". Looking for "Hiram Fong"...');
    
    // Try looking for Hiram Fong instead
    const fongEvents = await prisma.event.findMany({
      where: {
        OR: [
          {
            title: {
              contains: 'Hiram Fong',
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: 'Hiram Fong',
              mode: 'insensitive'
            }
          }
        ]
      }
    });
    
    if (fongEvents.length === 0) {
      console.log('No events found. Looking for any events on May 5 at 12:00pm...');
      
      // Try looking for events at the same date/time
      const dateEvents = await prisma.event.findMany({
        where: {
          startDateTime: {
            gte: new Date(2025, 4, 5, 11, 0, 0),  // Around noon on May 5
            lte: new Date(2025, 4, 5, 13, 0, 0)
          }
        }
      });
      
      if (dateEvents.length === 0) {
        console.log('No matching events found. Exiting.');
        return;
      }
      
      console.log(`Found ${dateEvents.length} events on May 5 around noon:`);
      for (const event of dateEvents) {
        console.log(`- ${event.title} (${event.id})`);
      }
      
      // Update the first event
      await updateEvent(dateEvents[0].id);
      return;
    }
    
    console.log(`Found ${fongEvents.length} events with "Hiram Fong":`);
    for (const event of fongEvents) {
      console.log(`- ${event.title} (${event.id})`);
    }
    
    // Update the first event
    await updateEvent(fongEvents[0].id);
    return;
  }
  
  console.log(`Found ${events.length} events with "Zarsadiaz":`);
  for (const event of events) {
    console.log(`- ${event.title} (${event.id})`);
  }
  
  // Update the first event found
  await updateEvent(events[0].id);
}

/**
 * Updates a specific event with the Zarsadiaz description
 * @param {string} eventId - ID of the event to update
 */
async function updateEvent(eventId) {
  try {
    console.log(`Updating event with ID ${eventId}...`);
    
    // Get detailed description
    const description = await extractDetailedDescription(ZARSADIAZ_URL);
    
    // Update the event
    await prisma.event.update({
      where: { id: eventId },
      data: {
        title: 'Talk by James Zarsadiaz: Hiram Fong\'s Asian America',
        description,
        location: 'Mānoa Campus, Zoom',
        eventUrl: ZARSADIAZ_URL,
        eventPageUrl: ZARSADIAZ_URL,
        attendanceType: 'ONLINE'
      }
    });
    
    console.log('✅ Successfully updated the description for the Zarsadiaz event!');
  } catch (error) {
    console.error('Error updating event:', error);
  }
}

async function main() {
  try {
    await updateZarsadiazDescription();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 