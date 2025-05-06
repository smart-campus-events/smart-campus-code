/**
 * Script to import events from University of Hawaii at Manoa calendar.
 * This script scrapes event data from https://www.hawaii.edu/calendar/manoa
 * and imports them into our database.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { PrismaClient, ContentStatus, AttendanceType } = require('@prisma/client');

const prisma = new PrismaClient();

// URL of the UH Manoa calendar
const CALENDAR_URL = 'https://www.hawaii.edu/calendar/manoa';

// Category mapping from UH event types to our local categories
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
  'Lecture': 'Academic'
};

// Helper function to determine event attendance type
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

// Helper function to extract date and time information
function parseEventDateTime(dateTimeText) {
  try {
    // Example formats:
    // "May 5, 2025 - 9:00am"
    // "May 5, 2025 (9:00am - 11:00am)"
    // "May 5 - May 10, 2025"
    
    let startDateTime = null;
    let endDateTime = null;
    let allDay = false;
    
    // Check for all-day or multi-day event format
    if (dateTimeText.includes(' - ') && !dateTimeText.includes('(')) {
      // Could be a multi-day event
      const parts = dateTimeText.split(' - ');
      
      if (parts[0].includes(',')) {
        // Single day with time range: "May 5, 2025 - 9:00am"
        const datePart = parts[0].trim();
        const timePart = parts[1].trim();
        
        startDateTime = new Date(`${datePart} ${timePart}`);
        // No end time provided, set default duration of 1 hour
        endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + 1);
      } else {
        // Multi-day: "May 5 - May 10, 2025"
        if (parts[1].includes(',')) {
          const startDateRaw = parts[0].trim();
          const endDateRaw = parts[1].trim();
          
          // If start date doesn't have year, borrow from end date
          const endYear = endDateRaw.split(', ')[1];
          const startDate = startDateRaw.includes(',') ? startDateRaw : `${startDateRaw}, ${endYear}`;
          
          startDateTime = new Date(`${startDate} 00:00:00`);
          endDateTime = new Date(`${endDateRaw} 23:59:59`);
          allDay = true;
        }
      }
    } else if (dateTimeText.includes('(') && dateTimeText.includes(')')) {
      // Single day with time range: "May 5, 2025 (9:00am - 11:00am)"
      const datePart = dateTimeText.split('(')[0].trim();
      const timeRange = dateTimeText.split('(')[1].replace(')', '').trim();
      const [startTime, endTime] = timeRange.split(' - ');
      
      startDateTime = new Date(`${datePart} ${startTime}`);
      endDateTime = new Date(`${datePart} ${endTime}`);
    } else {
      // Just a date: "May 5, 2025"
      startDateTime = new Date(`${dateTimeText} 00:00:00`);
      endDateTime = new Date(`${dateTimeText} 23:59:59`);
      allDay = true;
    }
    
    return { startDateTime, endDateTime, allDay };
  } catch (error) {
    console.error(`Error parsing date/time: ${dateTimeText}`, error);
    return { startDateTime: new Date(), endDateTime: null, allDay: false };
  }
}

// Main scraping function
async function scrapeEvents() {
  try {
    console.log(`Fetching events from ${CALENDAR_URL}...`);
    const { data } = await axios.get(CALENDAR_URL);
    const $ = cheerio.load(data);
    
    const events = [];
    const tables = $('table');
    
    tables.each((_, table) => {
      // Extract the date from the previous heading if available
      let eventDate = '';
      const prevHeading = $(table).prev('h3');
      if (prevHeading.length) {
        eventDate = prevHeading.text().trim();
      }
      
      // Process each row in the table
      $(table).find('tr').each((_, row) => {
        const columns = $(row).find('td');
        
        if (columns.length >= 2) {
          const time = $(columns[0]).text().trim();
          const eventElement = $(columns[1]).find('a');
          
          if (eventElement.length) {
            const title = eventElement.text().trim();
            const eventUrl = eventElement.attr('href');
            
            events.push({
              title,
              url: eventUrl,
              date: eventDate,
              time
            });
          }
        }
      });
    });
    
    console.log(`Found ${events.length} events. Fetching details...`);
    
    // Fetch detailed info for each event
    const allEventDetails = [];
    
    for (const [index, event] of events.entries()) {
      try {
        if (!event.url) continue;
        
        console.log(`Fetching details for event ${index + 1}/${events.length}: ${event.title}`);
        
        // Construct full URL if needed
        const fullUrl = event.url.startsWith('http') 
          ? event.url 
          : `https://www.hawaii.edu${event.url}`;
        
        const { data: eventPage } = await axios.get(fullUrl);
        const $event = cheerio.load(eventPage);
        
        // Extract event details
        let description = '';
        let location = '';
        let organizerSponsor = '';
        let categories = [];
        let contactName = '';
        let contactEmail = '';
        let eventPageUrl = '';
        
        // Extract the event details block
        const eventDetailsSection = $event('.event-detail');
        
        // Description
        const descriptionSection = eventDetailsSection.find('div:contains("Description:")').next();
        if (descriptionSection.length) {
          description = descriptionSection.text().trim();
        }
        
        // Location
        const locationSection = eventDetailsSection.find('div:contains("Location:")').next();
        if (locationSection.length) {
          location = locationSection.text().trim();
        }
        
        // Organizer/Sponsor
        const sponsorSection = eventDetailsSection.find('div:contains("Sponsor:")').next();
        if (sponsorSection.length) {
          organizerSponsor = sponsorSection.text().trim();
        }
        
        // Categories/Tags
        const categorySection = eventDetailsSection.find('div:contains("Categories:")').next();
        if (categorySection.length) {
          const categoryText = categorySection.text().trim();
          categories = categoryText.split(',').map(cat => cat.trim());
        }
        
        // Contact Info
        const contactSection = eventDetailsSection.find('div:contains("Contact:")');
        if (contactSection.length) {
          const contactText = contactSection.next().text().trim();
          // Try to extract name and email
          const emailMatch = contactText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
          if (emailMatch) {
            contactEmail = emailMatch[0];
            contactName = contactText.replace(contactEmail, '').trim();
          } else {
            contactName = contactText;
          }
        }
        
        // More info URL
        const moreInfoSection = eventDetailsSection.find('div:contains("More Info:")').next().find('a');
        if (moreInfoSection.length) {
          eventPageUrl = moreInfoSection.attr('href');
        }
        
        // Parse date and time
        const { startDateTime, endDateTime, allDay } = parseEventDateTime(`${event.date} ${event.time}`);
        
        // Determine attendance type
        const attendanceType = determineAttendanceType(location);
        
        // Add to event details array
        allEventDetails.push({
          title: event.title,
          startDateTime,
          endDateTime,
          allDay,
          description,
          location,
          locationVirtualUrl: attendanceType === AttendanceType.ONLINE ? location : null,
          attendanceType,
          organizerSponsor,
          contactName,
          contactEmail,
          eventUrl: fullUrl,
          eventPageUrl,
          categories,
        });
        
        // Wait a short time between requests to avoid overloading the server
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error fetching details for event: ${event.title}`, error.message);
      }
    }
    
    console.log(`Successfully gathered details for ${allEventDetails.length} events.`);
    return allEventDetails;
  } catch (error) {
    console.error('Error scraping events:', error);
    throw error;
  }
}

// Save events to database
async function saveEvents(events) {
  console.log('Saving events to database...');
  
  // Get existing categories from database or create new ones
  const categoryNames = new Set();
  events.forEach(event => {
    event.categories.forEach(cat => {
      const mappedCategory = CATEGORY_MAPPING[cat] || cat;
      categoryNames.add(mappedCategory);
    });
  });
  
  // Make sure all our categories exist in the database
  const dbCategories = {};
  for (const categoryName of categoryNames) {
    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });
    dbCategories[categoryName] = category;
  }
  
  let createdCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  
  // Process each event
  for (const [index, event] of events.entries()) {
    try {
      console.log(`Processing event ${index + 1}/${events.length}: ${event.title}`);
      
      // Map raw category names to our internal categories
      const categoryIds = event.categories
        .map(cat => CATEGORY_MAPPING[cat] || cat)
        .filter(catName => dbCategories[catName])
        .map(catName => dbCategories[catName].id);
      
      // Check for existing event with the same title and date
      const existingEvent = await prisma.event.findFirst({
        where: {
          OR: [
            { eventUrl: event.eventUrl },
            {
              AND: [
                { title: event.title },
                { startDateTime: event.startDateTime },
              ],
            },
          ],
        },
      });
      
      if (existingEvent) {
        // Update existing event
        await prisma.event.update({
          where: { id: existingEvent.id },
          data: {
            title: event.title,
            startDateTime: event.startDateTime,
            endDateTime: event.endDateTime,
            allDay: event.allDay,
            description: event.description,
            location: event.location,
            locationVirtualUrl: event.locationVirtualUrl,
            attendanceType: event.attendanceType,
            organizerSponsor: event.organizerSponsor,
            contactName: event.contactName,
            contactEmail: event.contactEmail,
            eventUrl: event.eventUrl,
            eventPageUrl: event.eventPageUrl,
            lastScrapedAt: new Date(),
            status: ContentStatus.APPROVED,
            // Remove existing categories and add new ones
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
            startDateTime: event.startDateTime,
            endDateTime: event.endDateTime,
            allDay: event.allDay,
            description: event.description,
            location: event.location,
            locationVirtualUrl: event.locationVirtualUrl,
            attendanceType: event.attendanceType,
            organizerSponsor: event.organizerSponsor,
            contactName: event.contactName,
            contactEmail: event.contactEmail,
            eventUrl: event.eventUrl,
            eventPageUrl: event.eventPageUrl,
            lastScrapedAt: new Date(),
            status: ContentStatus.APPROVED,
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
      console.error(`Error saving event: ${event.title}`, error);
      errorCount++;
    }
  }
  
  return { createdCount, updatedCount, errorCount };
}

// Main function
async function main() {
  try {
    const events = await scrapeEvents();
    const result = await saveEvents(events);
    
    console.log('\nImport summary:');
    console.log(`- Total events processed: ${events.length}`);
    console.log(`- New events created: ${result.createdCount}`);
    console.log(`- Existing events updated: ${result.updatedCount}`);
    console.log(`- Errors: ${result.errorCount}`);
    console.log('Import completed successfully.');
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main(); 