/**
 * Script to specifically fix the "Talk by James Zarsadiaz" event 
 * to ensure it has the correct date (May 5) and time (12:00pm)
 */

const { PrismaClient } = require('@prisma/client');
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

async function fixZarsadiazEvent() {
  console.log('Looking for "Talk by James Zarsadiaz" event...');
  
  // Search for event with "Zarsadiaz" in the title
  const events = await prisma.event.findMany({
    where: {
      title: {
        contains: 'Zarsadiaz',
        mode: 'insensitive'
      }
    },
    include: {
      categories: {
        include: {
          category: true
        }
      }
    }
  });
  
  if (events.length === 0) {
    console.log('No events found with "Zarsadiaz" in the title. Searching for events with "James" in the title...');
    
    // Try with a more general search for "James"
    const jamesEvents = await prisma.event.findMany({
      where: {
        title: {
          contains: 'James',
          mode: 'insensitive'
        }
      },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    
    if (jamesEvents.length === 0) {
      console.log('No events found with "James" in the title. Searching for events with "Talk" in the title...');
      
      // Try with a more general search for "Talk"
      const talkEvents = await prisma.event.findMany({
        where: {
          title: {
            contains: 'Talk',
            mode: 'insensitive'
          }
        }
      });
      
      if (talkEvents.length === 0) {
        console.log('No events found with "Talk" in the title. Creating the event...');
        
        // Create the event if it doesn't exist
        await createZarsadiazEvent();
        return;
      }
      
      console.log(`Found ${talkEvents.length} events with "Talk" in the title:`);
      talkEvents.forEach(event => {
        console.log(`- ${event.title} (${event.id})`);
      });
      
      // If there are events with "Talk", look for one that might be relevant
      const potentialMatch = talkEvents.find(event => 
        event.title.toLowerCase().includes('asian') || 
        event.title.toLowerCase().includes('america') ||
        event.description?.toLowerCase().includes('zarsadiaz') ||
        event.description?.toLowerCase().includes('hiram fong')
      );
      
      if (potentialMatch) {
        console.log('Found a potential match. Updating this event...');
        await updateEvent(potentialMatch.id);
        return;
      }
      
      // If still no suitable match, create a new event
      await createZarsadiazEvent();
      return;
    }
    
    console.log(`Found ${jamesEvents.length} events with "James" in the title:`);
    jamesEvents.forEach(event => {
      console.log(`- ${event.title} (${event.id})`);
    });
    
    // If there are events with "James", update the first one
    const eventToUpdate = jamesEvents[0];
    console.log(`Updating event "${eventToUpdate.title}" (${eventToUpdate.id})...`);
    await updateEvent(eventToUpdate.id);
  } else {
    console.log(`Found ${events.length} events with "Zarsadiaz" in the title:`);
    events.forEach(event => {
      console.log(`- ${event.title} (${event.id})`);
    });
    
    // Update the first matching event
    const eventToUpdate = events[0];
    console.log(`Updating event "${eventToUpdate.title}" (${eventToUpdate.id})...`);
    await updateEvent(eventToUpdate.id);
  }
}

async function updateEvent(eventId) {
  // Get the "Arts & Culture" category or create it if it doesn't exist
  let category = await prisma.category.findFirst({
    where: { name: 'Arts & Culture' }
  });
  
  if (!category) {
    category = await prisma.category.create({
      data: { name: 'Arts & Culture' }
    });
    console.log('Created "Arts & Culture" category');
  }
  
  // Set the correct date and time for May 5, 2025 at 12:00pm Hawaii time
  const date = new Date(2025, 4, 5, 12, 0, 0); // Month is 0-based, so 4 = May
  const endDate = new Date(date);
  endDate.setHours(endDate.getHours() + 2); // End time 2 hours later
  
  // Update the event with the correct information
  await prisma.event.update({
    where: { id: eventId },
    data: {
      title: 'Talk by James Zarsadiaz: Hiram Fong\'s Asian America',
      startDateTime: date,
      endDateTime: endDate,
      location: 'Mānoa Campus, Zoom',
      description: 'Event details for "Talk by James Zarsadiaz: Hiram Fong\'s Asian America" at UH Manoa.\n\n' +
                  'Join us for this insightful talk about Hiram Fong\'s contributions to Asian American history and politics.\n\n' +
                  'For more information, visit: https://www.hawaii.edu/calendar/manoa/2025/05/05/44075.html?et_id=57432',
      eventUrl: 'https://www.hawaii.edu/calendar/manoa/2025/05/05/44075.html?et_id=57432',
      attendanceType: 'ONLINE'
    }
  });
  
  // Check if the event already has the Arts & Culture category
  const eventCategories = await prisma.eventCategory.findMany({
    where: { eventId }
  });
  
  const hasArtsCategory = eventCategories.some(ec => ec.categoryId === category.id);
  
  // If not, remove the Academic category (if it exists) and add Arts & Culture
  if (!hasArtsCategory) {
    // Find Academic category
    const academicCategory = await prisma.category.findFirst({
      where: { name: 'Academic' }
    });
    
    if (academicCategory) {
      // Check if event has Academic category
      const hasAcademicCategory = eventCategories.some(ec => ec.categoryId === academicCategory.id);
      
      if (hasAcademicCategory) {
        // Remove Academic category
        await prisma.eventCategory.deleteMany({
          where: {
            eventId,
            categoryId: academicCategory.id
          }
        });
        console.log('Removed Academic category');
      }
    }
    
    // Add Arts & Culture category
    await prisma.eventCategory.create({
      data: {
        eventId,
        categoryId: category.id
      }
    });
    console.log('Added Arts & Culture category');
  }
  
  console.log('✅ Successfully updated the "Talk by James Zarsadiaz" event!');
}

async function createZarsadiazEvent() {
  // Get the "Arts & Culture" category or create it if it doesn't exist
  let category = await prisma.category.findFirst({
    where: { name: 'Arts & Culture' }
  });
  
  if (!category) {
    category = await prisma.category.create({
      data: { name: 'Arts & Culture' }
    });
    console.log('Created "Arts & Culture" category');
  }
  
  // Set the correct date and time for May 5, 2025 at 12:00pm Hawaii time
  const date = new Date(2025, 4, 5, 12, 0, 0); // Month is 0-based, so 4 = May
  const endDate = new Date(date);
  endDate.setHours(endDate.getHours() + 2); // End time 2 hours later
  
  // Create the event with the correct information
  const event = await prisma.event.create({
    data: {
      title: 'Talk by James Zarsadiaz: Hiram Fong\'s Asian America',
      startDateTime: date,
      endDateTime: endDate,
      allDay: false,
      description: 'Event details for "Talk by James Zarsadiaz: Hiram Fong\'s Asian America" at UH Manoa.\n\n' +
                  'Join us for this insightful talk about Hiram Fong\'s contributions to Asian American history and politics.\n\n' +
                  'For more information, visit: https://www.hawaii.edu/calendar/manoa/2025/05/05/44075.html?et_id=57432',
      attendanceType: 'ONLINE',
      location: 'Mānoa Campus, Zoom',
      organizerSponsor: 'University of Hawaii at Manoa',
      eventUrl: 'https://www.hawaii.edu/calendar/manoa/2025/05/05/44075.html?et_id=57432',
      status: 'APPROVED',
      lastScrapedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
  
  console.log(`Created new event with ID ${event.id}`);
  
  // Add the Arts & Culture category
  await prisma.eventCategory.create({
    data: {
      eventId: event.id,
      categoryId: category.id,
      assignedAt: new Date()
    }
  });
  
  console.log('✅ Successfully created the "Talk by James Zarsadiaz" event with Arts & Culture category!');
}

async function main() {
  try {
    await fixZarsadiazEvent();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 