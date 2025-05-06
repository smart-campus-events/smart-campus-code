/**
 * Script to verify and fix event categories
 * This ensures all events have at least one category assigned
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyEventCategories() {
  try {
    console.log('Verifying event categories...');
    
    // Get events with no categories
    const eventsWithoutCategories = await prisma.event.findMany({
      where: {
        categories: {
          none: {}
        }
      },
      select: {
        id: true,
        title: true
      }
    });
    
    console.log(`Found ${eventsWithoutCategories.length} events with no categories`);
    
    if (eventsWithoutCategories.length === 0) {
      console.log('All events have at least one category. No fixes needed.');
    } else {
      // Find or create an Academic category
      let academicCategory = await prisma.category.findFirst({
        where: {
          name: 'Academic'
        }
      });
      
      if (!academicCategory) {
        console.log('Creating Academic category...');
        academicCategory = await prisma.category.create({
          data: {
            name: 'Academic'
          }
        });
      }
      
      // Fix events missing categories
      let fixedCount = 0;
      
      for (const event of eventsWithoutCategories) {
        console.log(`Fixing event: ${event.title}`);
        
        await prisma.eventCategory.create({
          data: {
            eventId: event.id,
            categoryId: academicCategory.id
          }
        });
        
        fixedCount++;
      }
      
      console.log(`Fixed ${fixedCount} events by assigning the Academic category.`);
    }
    
    // Get category counts
    console.log('\nCategory distribution:');
    const categories = await prisma.$queryRaw`
      SELECT c.name, COUNT(ec."eventId") as count
      FROM "Category" c
      LEFT JOIN "EventCategory" ec ON c.id = ec."categoryId"
      GROUP BY c.name
      ORDER BY count DESC
    `;
    
    categories.forEach(cat => {
      console.log(`- ${cat.name}: ${cat.count} events`);
    });
    
    console.log('\nDone!');
    
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
verifyEventCategories(); 