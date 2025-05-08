const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Count total events
    const eventCount = await prisma.event.count();
    console.log(`Total events in database: ${eventCount}`);
    
    // Get events with their categories
    const events = await prisma.event.findMany({
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    
    console.log('\nEvents with their details:');
    events.forEach(event => {
      console.log(`- ${event.title} (Status: ${event.status})`);
      console.log(`  Start date: ${event.startDateTime}`);
      console.log(`  Categories: ${event.categories.map(c => c.category.name).join(', ') || 'None'}`);
      console.log('');
    });
    
    // Check approved events
    const approvedEvents = await prisma.event.count({
      where: {
        status: 'APPROVED'
      }
    });
    console.log(`Approved events: ${approvedEvents}`);
    
    // Check pending events
    const pendingEvents = await prisma.event.count({
      where: {
        status: 'PENDING'
      }
    });
    console.log(`Pending events: ${pendingEvents}`);
    
    // Check future events
    const futureEvents = await prisma.event.count({
      where: {
        startDateTime: {
          gte: new Date()
        }
      }
    });
    console.log(`Future events: ${futureEvents}`);
    
    // Check past events
    const pastEvents = await prisma.event.count({
      where: {
        startDateTime: {
          lt: new Date()
        }
      }
    });
    console.log(`Past events: ${pastEvents}`);
    
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 