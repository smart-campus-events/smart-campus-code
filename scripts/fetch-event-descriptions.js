/**
 * Script to fetch and update event descriptions from UH Manoa calendar event URLs
 * 
 * This script attempts to scrape descriptions from UH Manoa event pages and
 * updates our database events with that information, using the official event page URL as contact information.
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const cheerio = require('cheerio');
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

/**
 * Fetches the event description from a UH Manoa calendar event page
 * @param {string} eventUrl - The URL of the event page
 * @returns {Promise<{description: string, contactEmail: string}>} - The description and contact info
 */
async function fetchEventDescription(eventUrl) {
  try {
    if (!eventUrl || !eventUrl.includes('hawaii.edu/calendar')) {
      return { description: '', contactEmail: '' };
    }

    console.log(`Fetching description from: ${eventUrl}`);
    const response = await axios.get(eventUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    // We'll try various selectors that might contain the event description
    const selectors = [
      '.event-description',
      '.description',
      '.event-detail-content',
      '.event-details',
      '.field-body',
      '.content-main',
      '.event-content',
      '#event-description'
    ];
    
    let description = '';
    
    // Try to find the description using our selectors
    for (const selector of selectors) {
      const el = $(selector);
      if (el.length) {
        const text = el.text().trim();
        if (text && text.length > description.length) {
          description = text;
        }
      }
    }
    
    // If still no description, try to get any content from the page
    if (!description) {
      // Try to find div that has the word 'description' in its ID or class
      $('div[id*="description"], div[class*="description"]').each(function() {
        const text = $(this).text().trim();
        if (text && text.length > description.length) {
          description = text;
        }
      });
    }
    
    // If still no description, try to get any paragraph
    if (!description) {
      // Look for the main content area and get paragraphs
      const mainContent = $('.main-content, .content, main, article').first();
      if (mainContent.length) {
        const paragraphs = [];
        mainContent.find('p').each(function() {
          const text = $(this).text().trim();
          if (text) {
            paragraphs.push(text);
          }
        });
        description = paragraphs.join('\n\n');
      }
    }
    
    // Prepare the final description
    let finalDescription = description;
    
    // Clean up the description (remove excessive whitespace)
    finalDescription = finalDescription.replace(/\s+/g, ' ').trim();
    
    // Limit description length to 300 characters + ellipsis to keep it concise
    if (finalDescription.length > 300) {
      finalDescription = finalDescription.substring(0, 300) + '...';
    }
    
    // Add "For more information" to the description
    if (finalDescription) {
      finalDescription += `\n\nFor more information, visit the official UH Manoa event page.`;
    }
    
    // Store the event URL as the contactEmail field
    // This is not ideal but we need to use existing fields in the schema
    const contactEmail = eventUrl;
    
    return { 
      description: finalDescription || '',
      contactEmail: contactEmail
    };
  } catch (error) {
    console.error(`Error fetching description from ${eventUrl}:`, error.message);
    return { 
      description: '',
      contactEmail: eventUrl
    };
  }
}

/**
 * Updates the descriptions of all UH Manoa events in our database
 * @param {boolean} forceUpdate - Whether to update all events even if they already have descriptions
 */
async function updateEventDescriptions(forceUpdate = false) {
  console.log('Starting to fetch event descriptions from UH Manoa calendar...');
  
  try {
    // Get all events with a UH Manoa URL
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { eventUrl: { contains: 'hawaii.edu/calendar' } },
          { eventPageUrl: { contains: 'hawaii.edu/calendar' } }
        ]
      }
    });
    
    console.log(`Found ${events.length} UH Manoa events to process`);
    
    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;
    
    // Process each event
    for (const event of events) {
      const url = event.eventUrl || event.eventPageUrl;
      
      if (!url) {
        console.log(`⚠️ Event "${event.title}" has no URL to fetch a description from.`);
        skippedCount++;
        continue;
      }
      
      // Always process events when forceUpdate is true
      if (!forceUpdate && event.description) {
        console.log(`✓ Event "${event.title}" already has a description. Skipping due to !forceUpdate.`);
        skippedCount++;
        continue;
      }
      
      // Fetch the description and contact info
      const { description, contactEmail } = await fetchEventDescription(url);
      
      // Update the event with the fetched description and contact info
      await prisma.event.update({
        where: { id: event.id },
        data: { 
          description: description,
          contactEmail: contactEmail
        }
      });
      
      if (description) {
        console.log(`✅ Updated description and contact for "${event.title}" (${description.length} chars)`);
        successCount++;
      } else {
        console.log(`ℹ️ Set contact info only for "${event.title}"`);
        failureCount++;
      }
      
      // Add a small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log('\n--- Summary ---');
    console.log(`Total events processed: ${events.length}`);
    console.log(`Descriptions successfully fetched: ${successCount}`);
    console.log(`Failed to fetch descriptions: ${failureCount}`);
    console.log(`Events skipped: ${skippedCount}`);
  } catch (error) {
    console.error('Error processing events:', error);
  }
}

async function main() {
  try {
    // Pass true to force update all events
    await updateEventDescriptions(true);
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 