/**
 * Script to assign all events to the Academic category
 * This ensures that all UH Manoa events have at least one category
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

async function assignAcademicCategory() {
  console.log('Starting to assign the Academic category to all events...');
  
  // Get all events
  const events = await prisma.event.findMany({
    include: {
      categories: true
    }
  });
  
  console.log(`Found ${events.length} events to process`);
  
  // Find or create Academic category
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
    console.log('Created Academic category with ID:', academicCategory.id);
  } else {
    console.log('Found existing Academic category with ID:', academicCategory.id);
  }
  
  let assignedCount = 0;
  let alreadyAssignedCount = 0;
  
  // Process each event
  for (const event of events) {
    // Check if event already has the Academic category
    const hasAcademicCategory = event.categories.some(
      category => category.categoryId === academicCategory.id
    );
    
    if (hasAcademicCategory) {
      console.log(`✓ Event "${event.title}" already has Academic category.`);
      alreadyAssignedCount++;
      continue;
    }
    
    // Assign Academic category to the event
    await prisma.eventCategory.create({
      data: {
        eventId: event.id,
        categoryId: academicCategory.id
      }
    });
    
    console.log(`✅ Assigned Academic category to "${event.title}"`);
    assignedCount++;
  }
  
  // Summary
  console.log('\n--- Summary ---');
  console.log(`Total events processed: ${events.length}`);
  console.log(`Events newly assigned to Academic category: ${assignedCount}`);
  console.log(`Events already assigned to Academic category: ${alreadyAssignedCount}`);
}

async function main() {
  try {
    await assignAcademicCategory();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 