/**
 * Script to import events from UH Manoa Calendar
 * Data source: https://www.hawaii.edu/calendar/manoa
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { PrismaClient, ContentStatus, AttendanceType } = require('@prisma/client');

const prisma = new PrismaClient();

// URL of the UH Manoa calendar
const CALENDAR_URL = 'https://www.hawaii.edu/calendar/manoa';

// Category mapping for UH events to our local categories
const CATEGORY_MAPPING = {
  'Academic': 'Academic',
  'Arts & Culture': 'Cultural & Ethnic',
  'Athletics': 'Sports',
  'Community': 'Service',
  'Conference': 'Academic',
  'Misc': 'Leisure/Recreational',
  'Research': 'Academic',
  'Seminar': 'Academic',
  'Student Affairs': 'Leisure/Recreational',
  'Workshop': 'Leisure/Recreational',
  'Meeting': 'Leisure/Recreational',
  'Special Event': 'Leisure/Recreational',
  'Exhibition': 'Cultural & Ethnic',
  'Concert': 'Leisure/Recreational',
  'Lecture': 'Academic',
  // Default mapping for unknown categories
  'Default': 'Academic'
};

/**
 * Extract date from a string like "Monday, May 5"
 * and convert it to a full date with year
 */
function parseDate(dateText, year = new Date().getFullYear()) {
  try {
    // Remove day of week if present
    const dateWithoutDay = dateText.includes(',') ? 
      dateText.split(',')[1].trim() : 
      dateText.trim();
    
    // Construct full date string
    return `${dateWithoutDay}, ${year}`;
  } catch (error) {
    console.error('Error parsing date:', dateText, error);
    return null;
  }
}

/**
 * Parse time string like "9:00am" to 24-hour format
 */
function parseTime(timeText) {
  try {
    // Handle empty or null cases
    if (!timeText) return '00:00';
    
    // Check if timeText contains a colon (for time format like "9:00am")
    if (!timeText.includes(':')) {
      // If it's just a number without am/pm, assume it's an hour
      if (/^\d+$/.test(timeText)) {
        const hour = parseInt(timeText);
        return `${hour.toString().padStart(2, '0')}:00`;
      }
      
      // If it's a number with am/pm
      if (/^\d+(am|pm)$/i.test(timeText.replace(/\s+/g, ''))) {
        let hour = parseInt(timeText);
        const isPM = timeText.toLowerCase().includes('pm');
        if (isPM && hour < 12) hour += 12;
        if (!isPM && hour === 12) hour = 0;
        return `${hour.toString().padStart(2, '0')}:00`;
      }
      
      // Default fallback for unexpected formats
      return '00:00';
    }
    
    // Extract hours and minutes
    let [hours, minutesPart] = timeText.replace(/\s+/g, '').split(':');
    
    // Safety check for undefined minutesPart
    if (!minutesPart) {
      console.warn(`Malformed time format: ${timeText}`);
      return `${parseInt(hours).toString().padStart(2, '0')}:00`;
    }
    
    // Extract am/pm indicator
    const isPM = minutesPart.toLowerCase().includes('pm');
    const isAM = minutesPart.toLowerCase().includes('am');
    
    // Clean up minutes
    let minutes = minutesPart.replace(/[^0-9]/g, '');
    
    // Default to 00 if minutes is empty
    if (!minutes) minutes = '00';
    
    // Convert to 24 hour format if pm
    hours = parseInt(hours);
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    
    // Format with leading zeros
    return `${hours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  } catch (error) {
    console.error('Error parsing time:', timeText, error);
    return '00:00';
  }
}

/**
 * Determine the attendance type based on the location text
 */
function determineAttendanceType(locationText) {
  if (!locationText) {
    return AttendanceType.IN_PERSON;
  }
  
  const locationLower = locationText.toLowerCase();
  
  if (locationLower.includes('zoom') || 
      locationLower.includes('online') || 
      locationLower.includes('virtual') ||
      locationLower.includes('http')) {
    return AttendanceType.ONLINE;
  }
  
  if (locationLower.includes('hybrid')) {
    return AttendanceType.HYBRID;
  }
  
  return AttendanceType.IN_PERSON;
}

/**
 * Scrape events from the UH Manoa calendar
 */
async function scrapeEvents() {
  console.log(`Fetching events from ${CALENDAR_URL}...`);
  
  try {
    const { data } = await axios.get(CALENDAR_URL);
    const $ = cheerio.load(data);
    
    const events = [];
    let currentDate = '';
    
    // Extract the current year from any heading or use current year
    const pageYear = 2025; // Based on the calendar showing 2025 events
    
    // Look for tables which contain event listings
    $('table').each((_, table) => {
      // Try to find the date heading before this table
      const prevHeading = $(table).prev('h3');
      if (prevHeading.length) {
        currentDate = prevHeading.text().trim();
      }
      
      // Process each row in the table
      $(table).find('tr').each((_, row) => {
        const columns = $(row).find('td');
        
        if (columns.length >= 2) {
          const timeColumn = $(columns[0]);
          const eventColumn = $(columns[1]);
          
          const timeText = timeColumn.text().trim();
          const eventLink = eventColumn.find('a');
          
          if (eventLink.length) {
            const title = eventLink.text().trim();
            
            // Skip events with numeric-only titles (these are not real events)
            if (/^\d+$/.test(title)) {
              console.log(`Skipping numeric title: ${title}`);
              return;
            }
            
            const url = eventLink.attr('href');
            const fullUrl = url.startsWith('http') ? url : `https://www.hawaii.edu${url}`;
            
            // Get the event location if available (after the a tag)
            let location = '';
            const locationText = eventColumn.text().replace(title, '').trim();
            if (locationText) {
              // Text after comma usually contains location
              const parts = locationText.split(',');
              if (parts.length > 1) {
                location = parts.slice(1).join(',').trim();
              } else {
                location = locationText;
              }
            }
            
            // Determine attendance type from location
            const attendanceType = determineAttendanceType(location);
            
            // Parse date and time
            const dateString = parseDate(currentDate, pageYear);
            const timeString = parseTime(timeText);
            
            // Create a JavaScript Date object for the start time
            let startDateTime;
            try {
              // Format should be: May 5, 2025 09:00
              startDateTime = new Date(`${dateString} ${timeString}`);
              
              // Set a default end time (1 hour later)
              const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
              
              events.push({
                title,
                url: fullUrl,
                startDateTime,
                endDateTime,
                location,
                attendanceType,
                // Default to approved status
                status: ContentStatus.APPROVED,
                // Default category (will be updated with specifics later)
                categories: ['Academic'],
                organizerSponsor: 'University of Hawaii at Manoa'
              });
            } catch (error) {
              console.error(`Error creating date for event "${title}":`, error);
            }
          }
        }
      });
    });
    
    console.log(`Found ${events.length} events from the calendar page`);
    
    // Fetch additional details for each event
    const enrichedEvents = [];
    for (const [index, event] of events.entries()) {
      try {
        console.log(`Fetching details for event ${index + 1}/${events.length}: ${event.title}`);
        
        // Get event detail page
        const { data: eventPage } = await axios.get(event.url);
        const $event = cheerio.load(eventPage);
        
        let description = '';
        let categories = [];
        let contactName = '';
        let contactEmail = '';
        let organizerSponsor = '';
        
        // Extract description
        const descriptionElem = $event('.event-detail div:contains("Description:")').next();
        if (descriptionElem.length) {
          description = descriptionElem.text().trim();
        }
        
        // Extract categories
        const categoryElem = $event('.event-detail div:contains("Categories:")').next();
        if (categoryElem.length) {
          categories = categoryElem.text().split(',').map(c => c.trim());
        }
        
        // Map categories to our system
        const mappedCategories = categories.map(cat => CATEGORY_MAPPING[cat] || CATEGORY_MAPPING['Default']);
        
        // Extract sponsor
        const sponsorElem = $event('.event-detail div:contains("Sponsor:")').next();
        if (sponsorElem.length) {
          organizerSponsor = sponsorElem.text().trim();
        }
        
        // Extract contact info
        const contactElem = $event('.event-detail div:contains("Contact:")').next();
        if (contactElem.length) {
          const contactText = contactElem.text().trim();
          // Try to extract email from contact
          const emailMatch = contactText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
          if (emailMatch) {
            contactEmail = emailMatch[0];
            contactName = contactText.replace(contactEmail, '').trim();
          } else {
            contactName = contactText;
          }
        }
        
        // Add enriched data to the event
        enrichedEvents.push({
          ...event,
          description,
          categories: mappedCategories.length > 0 ? Array.from(new Set(mappedCategories)) : [CATEGORY_MAPPING['Default']],
          contactName,
          contactEmail,
          organizerSponsor: organizerSponsor || event.organizerSponsor
        });
        
        // Wait a bit between requests to avoid overloading the server
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Error fetching details for event ${event.title}:`, error.message);
        // Add the event with basic info even if details fail
        event.categories = [CATEGORY_MAPPING['Default']];
        enrichedEvents.push(event);
      }
    }
    
    console.log(`Successfully enriched ${enrichedEvents.length} events with details`);
    return enrichedEvents;
  } catch (error) {
    console.error('Error scraping events:', error);
    return [];
  }
}

/**
 * Save the scraped events to the database
 */
async function saveEvents(events) {
  let createdCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  
  console.log('Saving events to database...');
  
  // Ensure all categories exist in database
  const allCategories = new Set();
  events.forEach(event => {
    event.categories.forEach(category => {
      allCategories.add(category);
    });
  });
  
  // Map of category names to database objects
  const categoryMap = {};
  
  // Create or fetch all needed categories
  for (const categoryName of allCategories) {
    try {
      const category = await prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName },
      });
      categoryMap[categoryName] = category;
    } catch (error) {
      console.error(`Error upserting category ${categoryName}:`, error);
    }
  }
  
  // Process each event
  for (const [index, event] of events.entries()) {
    try {
      console.log(`Processing event ${index + 1}/${events.length}: ${event.title}`);
      
      // Look for an existing event with same URL or title+date
      const existingEvent = await prisma.event.findFirst({
        where: {
          OR: [
            { eventUrl: event.url },
            {
              AND: [
                { title: event.title },
                { 
                  startDateTime: {
                    // Look for events on same day (ignoring exact time)
                    gte: new Date(new Date(event.startDateTime).setHours(0, 0, 0, 0)),
                    lt: new Date(new Date(event.startDateTime).setHours(23, 59, 59, 999))
                  } 
                },
              ],
            },
          ],
        },
        include: {
          categories: true
        }
      });
      
      // Convert categories to category IDs
      const categoryIds = event.categories
        .filter(categoryName => categoryMap[categoryName])
        .map(categoryName => categoryMap[categoryName].id);
      
      if (existingEvent) {
        // Update existing event
        await prisma.event.update({
          where: { id: existingEvent.id },
          data: {
            title: event.title,
            description: event.description || existingEvent.description,
            startDateTime: event.startDateTime,
            endDateTime: event.endDateTime,
            location: event.location,
            attendanceType: event.attendanceType,
            organizerSponsor: event.organizerSponsor,
            contactName: event.contactName,
            contactEmail: event.contactEmail,
            eventUrl: event.url,
            lastScrapedAt: new Date(),
            // Update categories - first delete existing ones
            categories: {
              deleteMany: {},
              create: categoryIds.map(categoryId => ({
                categoryId,
              })),
            },
          },
        });
        updatedCount++;
      } else {
        // Create new event
        await prisma.event.create({
          data: {
            title: event.title,
            description: event.description || '',
            startDateTime: event.startDateTime,
            endDateTime: event.endDateTime,
            location: event.location,
            attendanceType: event.attendanceType,
            organizerSponsor: event.organizerSponsor,
            contactName: event.contactName,
            contactEmail: event.contactEmail,
            eventUrl: event.url,
            status: ContentStatus.APPROVED,
            lastScrapedAt: new Date(),
            categories: {
              create: categoryIds.map(categoryId => ({
                categoryId,
              })),
            },
          },
        });
        createdCount++;
      }
    } catch (error) {
      console.error(`Error saving event ${event.title}:`, error);
      errorCount++;
    }
  }
  
  return { createdCount, updatedCount, errorCount };
}

/**
 * Clean up any problematic UH Manoa events
 */
async function cleanupEvents() {
  console.log('Cleaning up any problematic events...');
  try {
    // Delete events with numeric-only titles (these are page URLs, not real events)
    const numericEvents = await prisma.event.findMany({
      where: {
        title: {
          equals: /^\d+$/
        }
      }
    });
    
    if (numericEvents.length > 0) {
      console.log(`Found ${numericEvents.length} events with numeric titles to delete`);
      
      for (const event of numericEvents) {
        console.log(`Deleting event: ${event.title}`);
        
        // First delete categories
        await prisma.eventCategory.deleteMany({
          where: { eventId: event.id }
        });
        
        // Then delete the event
        await prisma.event.delete({
          where: { id: event.id }
        });
      }
    }
    
    // Fix events with missing categories
    const eventsWithoutCategories = await prisma.event.findMany({
      where: {
        categories: {
          none: {}
        },
        eventUrl: {
          contains: 'hawaii.edu/calendar'
        }
      }
    });
    
    if (eventsWithoutCategories.length > 0) {
      console.log(`Found ${eventsWithoutCategories.length} UH Manoa events without categories`);
      
      // Get the Academic category
      const academicCategory = await prisma.category.findFirst({
        where: { name: 'Academic' }
      });
      
      if (academicCategory) {
        for (const event of eventsWithoutCategories) {
          console.log(`Adding Academic category to event: ${event.title}`);
          
          await prisma.eventCategory.create({
            data: {
              eventId: event.id,
              categoryId: academicCategory.id
            }
          });
        }
      }
    }
    
    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting UH Manoa calendar import...');
    
    // Scrape events from the website
    const events = await scrapeEvents();
    
    if (events.length === 0) {
      console.log('No events found to import.');
      return;
    }
    
    // Save the events to the database
    const result = await saveEvents(events);
    
    // Clean up any problematic events
    await cleanupEvents();
    
    // Print summary
    console.log('\nImport Summary:');
    console.log(`- Total events processed: ${events.length}`);
    console.log(`- New events created: ${result.createdCount}`);
    console.log(`- Existing events updated: ${result.updatedCount}`);
    console.log(`- Errors: ${result.errorCount}`);
    console.log('Import completed successfully!');
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main(); 