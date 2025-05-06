/**
 * Script to update events with exact dates, times, descriptions and categories from the UH Manoa calendar
 * This ensures our events precisely match the UH Manoa calendar
 */

const { PrismaClient, ContentStatus } = require('@prisma/client');
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

// Map of event types to categories (we'll expand this as we process events)
const eventTypeToCategory = {
  'Lecture': 'Academic',
  'Conference': 'Academic',
  'Seminar': 'Academic',
  'Workshop': 'Academic',
  'Final Oral': 'Academic',
  'Commencement': 'Academic',
  'Concert': 'Arts & Culture',
  'Performance': 'Arts & Culture',
  'Exhibition': 'Arts & Culture',
  'Art': 'Arts & Culture',
  'Music': 'Arts & Culture',
  'Dance': 'Arts & Culture',
  'Theater': 'Arts & Culture',
  'Film': 'Arts & Culture',
  'Meeting': 'Social',
  'Mixer': 'Social',
  'Celebration': 'Social',
  'Party': 'Social',
  'Social': 'Social',
  'Swap': 'Social',
  'Wellness': 'Health & Wellness',
  'Meditation': 'Health & Wellness',
  'Yoga': 'Health & Wellness',
  'Health': 'Health & Wellness',
  'Reset': 'Health & Wellness',
  'Sensory': 'Health & Wellness'
};

/**
 * Fetches calendar data from UH Manoa calendar page
 * @returns {Promise<Array>} Array of event data objects
 */
async function fetchCalendarEvents() {
  try {
    console.log('Fetching events from UH Manoa calendar...');
    const response = await axios.get('https://www.hawaii.edu/calendar/manoa/');
    const $ = cheerio.load(response.data);
    
    const events = [];
    
    // The calendar page has dates as headers followed by events
    let currentDate = '';
    
    // Process each row in the table
    $('table tr').each((i, row) => {
      const firstCell = $(row).find('td').first();
      
      // If the first cell is a date header
      if (firstCell.text().trim() && firstCell.attr('colspan')) {
        // Found a date header like "Monday, May 5"
        currentDate = firstCell.text().trim();
      } 
      // If we have a date and there are two cells (time and event)
      else if (currentDate && $(row).find('td').length >= 2) {
        const timeCell = $(row).find('td').eq(0);
        const eventCell = $(row).find('td').eq(1);
        
        // Only process rows that have times and events
        if (timeCell.text().trim() && eventCell.text().trim()) {
          const time = timeCell.text().trim();
          const eventLink = eventCell.find('a').first();
          const title = eventLink.text().trim();
          const url = eventLink.attr('href');
          const location = eventCell.text().split(title)[1]?.trim() || '';
          
          // Only add valid events
          if (title && url) {
            events.push({
              title,
              date: currentDate,
              time, 
              url: new URL(url, 'https://www.hawaii.edu').href,
              location
            });
          }
        }
      }
    });
    
    console.log(`Found ${events.length} events on the calendar`);
    return events;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
}

/**
 * Fetches event details from the event page
 * @param {string} url - URL of the event page
 * @returns {Promise<Object>} Event details
 */
async function fetchEventDetails(url) {
  try {
    console.log(`Fetching details for ${url}`);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Extract event details from the page
    let description = '';
    let category = '';
    let organizer = '';
    let contact = '';
    
    // Look for description content
    const eventContent = $('td.content-main').text().trim();
    if (eventContent) {
      description = eventContent;
    }
    
    // Look for category/event type
    const eventTypeText = $('td:contains("Event")').next('td').text().trim();
    if (eventTypeText) {
      category = eventTypeText;
    }
    
    // Look for sponsor/organizer
    const sponsorText = $('td:contains("Sponsor")').next('td').text().trim();
    if (sponsorText) {
      organizer = sponsorText;
    }
    
    // Look for contact info
    const contactText = $('td:contains("Contact")').next('td').text().trim();
    if (contactText) {
      contact = contactText;
    }
    
    return {
      description,
      category,
      organizer,
      contact,
      fullDetailsUrl: url
    };
  } catch (error) {
    console.error(`Error fetching event details from ${url}:`, error);
    return {
      description: '',
      category: '',
      organizer: '',
      contact: '',
      fullDetailsUrl: url
    };
  }
}

/**
 * Parses a date string and time string to a JS Date object
 * @param {string} dateStr - Date string like "Monday, May 5"
 * @param {string} timeStr - Time string like "9:00am"
 * @returns {Date} Date object
 */
function parseDateTime(dateStr, timeStr) {
  try {
    // Extract day, month, and day number from date string
    const dateParts = dateStr.match(/(\w+), (\w+) (\d+)/);
    if (!dateParts) throw new Error(`Could not parse date: ${dateStr}`);
    
    const month = dateParts[2];
    const day = parseInt(dateParts[3], 10);
    
    // Create a date object for this year (we'll set time next)
    const currentYear = new Date().getFullYear();
    const date = new Date(`${month} ${day}, ${currentYear}`);
    
    // Parse the time string (e.g., "9:00am", "12:00pm")
    const timeMatch = timeStr.match(/(\d+):(\d+)([ap]m)/i);
    if (!timeMatch) throw new Error(`Could not parse time: ${timeStr}`);
    
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const isPM = timeMatch[3].toLowerCase() === 'pm';
    
    // Convert to 24-hour format
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    
    // Set the time 
    date.setHours(hours, minutes, 0, 0);
    
    return date;
  } catch (error) {
    console.error(`Error parsing date and time: ${dateStr} ${timeStr}`, error);
    return new Date(); // Default to current date if we can't parse
  }
}

/**
 * Gets or creates a category by name
 * @param {string} name - Category name
 * @returns {Promise<Object>} Category object
 */
async function getOrCreateCategory(name) {
  try {
    // Try to find the category first
    let category = await prisma.category.findFirst({
      where: { name }
    });
    
    // If it doesn't exist, create it
    if (!category) {
      category = await prisma.category.create({
        data: { name }
      });
      console.log(`Created new category: ${name}`);
    }
    
    return category;
  } catch (error) {
    console.error(`Error getting or creating category ${name}:`, error);
    throw error;
  }
}

/**
 * Determines the best category for an event based on its details
 * @param {Object} eventDetails - Event details like title, description
 * @returns {Promise<string>} Category name
 */
async function determineBestCategory(eventDetails) {
  // Start with Academic as the default category
  let bestCategory = 'Academic';
  
  // Check the event title for category keywords
  Object.entries(eventTypeToCategory).forEach(([keyword, category]) => {
    if (eventDetails.title.includes(keyword) || 
        (eventDetails.description && eventDetails.description.includes(keyword))) {
      bestCategory = category;
    }
  });
  
  // Check specific event types
  if (eventDetails.category) {
    if (eventDetails.category.includes('Concert') || 
        eventDetails.category.includes('Music') ||
        eventDetails.category.includes('Art') ||
        eventDetails.category.includes('Dance') ||
        eventDetails.category.includes('Theatre')) {
      bestCategory = 'Arts & Culture';
    }
    else if (eventDetails.category.includes('Social') ||
             eventDetails.category.includes('Meeting') ||
             eventDetails.category.includes('Mixer')) {
      bestCategory = 'Social';
    }
    else if (eventDetails.category.includes('Health') ||
             eventDetails.category.includes('Wellness') ||
             eventDetails.category.includes('Yoga') ||
             eventDetails.category.includes('Meditation')) {
      bestCategory = 'Health & Wellness';
    }
  }
  
  // Special cases based on title
  if (eventDetails.title.includes('Commencement')) {
    bestCategory = 'Special Events';
  }
  else if (eventDetails.title.includes('Dance') ||
           eventDetails.title.includes('Concert') ||
           eventDetails.title.includes('Music') ||
           eventDetails.title.includes('Theatre')) {
    bestCategory = 'Arts & Culture';
  }
  else if (eventDetails.title.includes('Yoga') ||
           eventDetails.title.includes('Meditation') ||
           eventDetails.title.includes('Health') ||
           eventDetails.title.includes('Wellness') ||
           eventDetails.title.includes('Reset')) {
    bestCategory = 'Health & Wellness';
  }
  
  return bestCategory;
}

/**
 * Updates events with data from the UH Manoa calendar
 */
async function updateEvents() {
  console.log('Starting to update events from UH Manoa calendar...');
  
  // Fetch events from the calendar
  const calendarEvents = await fetchCalendarEvents();
  
  if (calendarEvents.length === 0) {
    console.log('No events found on the calendar. Exiting.');
    return;
  }
  
  // Get all events from our database
  const dbEvents = await prisma.event.findMany({
    include: {
      categories: {
        include: {
          category: true
        }
      }
    }
  });
  
  console.log(`Found ${dbEvents.length} events in our database`);
  
  let updatedCount = 0;
  let notFoundCount = 0;
  
  // Process each calendar event
  for (const calEvent of calendarEvents) {
    // Look for matching event in our database
    const matchingEvent = dbEvents.find(dbEvent => {
      // Match by title similarity (case insensitive)
      return dbEvent.title.toLowerCase().includes(calEvent.title.toLowerCase()) ||
             calEvent.title.toLowerCase().includes(dbEvent.title.toLowerCase());
    });
    
    if (matchingEvent) {
      console.log(`Processing event "${calEvent.title}"`);
      
      // Fetch detailed information from the event page
      const eventDetails = await fetchEventDetails(calEvent.url);
      
      // Parse the date and time
      const startDateTime = parseDateTime(calEvent.date, calEvent.time);
      
      // Create an end time 2 hours after start time for events that don't have an end time
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + 2);
      
      // Determine the best category for this event
      const categoryName = await determineBestCategory({
        ...eventDetails,
        title: calEvent.title
      });
      
      // Get or create the category
      const category = await getOrCreateCategory(categoryName);
      
      // Format the description with details from the event page
      let description = '';
      if (eventDetails.description) {
        description += eventDetails.description.trim() + '\n\n';
      }
      
      if (eventDetails.organizer) {
        description += `Organizer: ${eventDetails.organizer}\n`;
      }
      
      if (eventDetails.contact) {
        description += `Contact: ${eventDetails.contact}\n`;
      }
      
      description += `\nFor more information: ${eventDetails.fullDetailsUrl}`;
      
      // Update the event with the new information
      await prisma.event.update({
        where: { id: matchingEvent.id },
        data: {
          startDateTime,
          endDateTime,
          location: calEvent.location,
          description,
          eventUrl: calEvent.url,
          eventPageUrl: eventDetails.fullDetailsUrl,
          status: ContentStatus.APPROVED
        }
      });
      
      // Check if the event already has this category
      const hasCategory = matchingEvent.categories.some(
        cat => cat.category.name === categoryName
      );
      
      // If not, add the category
      if (!hasCategory) {
        // Remove the old Academic category if this is a different category
        if (categoryName !== 'Academic') {
          const academicCategory = matchingEvent.categories.find(
            cat => cat.category.name === 'Academic'
          );
          
          if (academicCategory) {
            await prisma.eventCategory.deleteMany({
              where: {
                eventId: matchingEvent.id,
                categoryId: academicCategory.categoryId
              }
            });
          }
        }
        
        // Add the new category
        await prisma.eventCategory.create({
          data: {
            eventId: matchingEvent.id,
            categoryId: category.id
          }
        });
      }
      
      console.log(`✅ Updated event "${calEvent.title}" with exact date, time, and description`);
      updatedCount++;
    } else {
      console.log(`⚠️ No matching event found for "${calEvent.title}" in our database`);
      notFoundCount++;
    }
  }
  
  // Summary
  console.log('\n--- Summary ---');
  console.log(`Total calendar events processed: ${calendarEvents.length}`);
  console.log(`Events updated with exact information: ${updatedCount}`);
  console.log(`Events not found in our database: ${notFoundCount}`);
}

async function main() {
  try {
    await updateEvents();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 