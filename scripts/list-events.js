/**
 * Script to list events from the database
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listEvents() {
  try {
    console.log('Fetching events from database...\n');
    
    // Get total count of events
    const totalCount = await prisma.event.count();
    console.log(`Total events in database: ${totalCount}\n`);
    
    // Get upcoming events, sorted by date
    const currentDate = new Date();
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startDateTime: {
          gte: currentDate
        }
      },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        startDateTime: 'asc'
      },
      take: 10
    });
    
    console.log(`Upcoming events (showing first 10 of ${upcomingEvents.length}):`);
    upcomingEvents.forEach((event, index) => {
      console.log(`\n[${index + 1}] ${event.title}`);
      console.log(`    Date: ${event.startDateTime.toLocaleString()}`);
      console.log(`    Location: ${event.location || 'Not specified'}`);
      console.log(`    Type: ${event.attendanceType}`);
      
      // List categories
      const categories = event.categories.map(ec => ec.category.name).join(', ');
      console.log(`    Categories: ${categories || 'None'}`);
      
      // Show description preview
      if (event.description) {
        const preview = event.description.length > 100 
          ? `${event.description.substring(0, 100)}...` 
          : event.description;
        console.log(`    Description: ${preview}`);
      }
    });
    
    // Get events by category
    console.log('\n\nEvents by Category:');

    try {
      // Use raw query to count events per category
      const categoryCounts = await prisma.$queryRaw`
        SELECT c.name, COUNT(ec."eventId") as count
        FROM "Category" c
        LEFT JOIN "EventCategory" ec ON c.id = ec."categoryId"
        GROUP BY c.name
        ORDER BY c.name ASC
      `;
      
      categoryCounts.forEach(row => {
        console.log(`${row.name}: ${row.count} events`);
      });
    } catch (error) {
      console.error('Error fetching category counts:', error);
    }
    
    // Check EventCategory table
    console.log('\n\nChecking EventCategory table:');
    const eventCategoryCount = await prisma.eventCategory.count();
    console.log(`Total event-category relationships: ${eventCategoryCount}`);

    // Get events from UH Manoa Calendar
    console.log('\n\nEvents from UH Manoa Calendar:');
    const uhEvents = await prisma.event.findMany({
      where: {
        eventUrl: {
          contains: 'hawaii.edu/calendar'
        }
      },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      },
      take: 5
    });

    console.log(`Total UH events: ${uhEvents.length}`);
    if (uhEvents.length > 0) {
      console.log('Sample UH Event details:');
      const sample = uhEvents[0];
      console.log(`Title: ${sample.title}`);
      console.log(`URL: ${sample.eventUrl}`);
      console.log(`Categories: ${sample.categories.map(ec => ec.category.name).join(', ') || 'None'}`);
    }
    
  } catch (error) {
    console.error('Error listing events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
listEvents(); 