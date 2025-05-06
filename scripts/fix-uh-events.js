/**
 * Script to fix UH Manoa events and their categories
 */

const { PrismaClient, ContentStatus, AttendanceType } = require('@prisma/client');
const prisma = new PrismaClient();

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
 * Get available categories from the database
 */
async function getCategories() {
  console.log('Getting available categories...');
  const categories = await prisma.category.findMany();
  
  // Create a map for easy lookup
  const categoryMap = {};
  for (const category of categories) {
    categoryMap[category.name] = category;
  }
  
  return categoryMap;
}

/**
 * Fix UH Manoa events that have missing or incorrect data
 */
async function fixUhEvents() {
  try {
    console.log('Looking for UH Manoa calendar events...');
    
    // Find all UH Manoa events
    let uhEvents = await prisma.event.findMany({
      where: {
        OR: [
          { eventUrl: { contains: 'hawaii.edu/calendar' } },
          { organizerSponsor: { contains: 'University of Hawaii' } }
        ]
      },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    
    console.log(`Found ${uhEvents.length} UH Manoa events`);
    
    // Get category mapping
    const categoryMap = await getCategories();
    
    // Make sure required categories exist
    for (const ourCategory of Object.values(CATEGORY_MAPPING)) {
      if (!categoryMap[ourCategory]) {
        console.log(`Creating category: ${ourCategory}`);
        const newCategory = await prisma.category.create({
          data: { name: ourCategory }
        });
        categoryMap[ourCategory] = newCategory;
      }
    }
    
    // Events that are just numbers are page URLs, not real events
    const numericTitleEvents = uhEvents.filter(event => /^\d+$/.test(event.title));
    if (numericTitleEvents.length > 0) {
      console.log(`Found ${numericTitleEvents.length} events with numeric titles to delete`);
      
      for (const event of numericTitleEvents) {
        console.log(`Deleting event: ${event.title}`);
        
        // First delete categories
        if (event.categories && event.categories.length > 0) {
          await prisma.eventCategory.deleteMany({
            where: { eventId: event.id }
          });
        }
        
        // Then delete the event
        await prisma.event.delete({
          where: { id: event.id }
        });
      }
      
      // Get updated list of UH events after deleting bad ones
      uhEvents = await prisma.event.findMany({
        where: {
          OR: [
            { eventUrl: { contains: 'hawaii.edu/calendar' } },
            { organizerSponsor: { contains: 'University of Hawaii' } }
          ]
        },
        include: {
          categories: {
            include: {
              category: true
            }
          }
        }
      });
      
      console.log(`After cleanup: ${uhEvents.length} UH Manoa events remain`);
    }
    
    // Fix events with missing categories
    const eventsToFix = uhEvents.filter(event => event.categories.length === 0);
    console.log(`Found ${eventsToFix.length} UH events missing categories`);
    
    let fixedCount = 0;
    
    for (const event of eventsToFix) {
      console.log(`Fixing event: ${event.title}`);
      
      // Assign default category (Academic) to events without a category
      const defaultCategory = categoryMap[CATEGORY_MAPPING['Default']];
      
      if (defaultCategory) {
        // Add default category
        await prisma.eventCategory.create({
          data: {
            eventId: event.id,
            categoryId: defaultCategory.id
          }
        });
        
        fixedCount++;
      }
    }
    
    console.log(`\nSummary:`);
    console.log(`- Total UH events processed: ${uhEvents.length}`);
    console.log(`- Events with missing categories fixed: ${fixedCount}`);
    console.log(`Done!`);
    
  } catch (error) {
    console.error('Error fixing UH events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixUhEvents(); 