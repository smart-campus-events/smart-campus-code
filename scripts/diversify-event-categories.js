/**
 * Script to diversify event categories
 * 
 * This script looks at event titles and descriptions and assigns additional
 * categories to events based on keywords and patterns.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Define category keywords mapping - refined to be more specific
const CATEGORY_KEYWORDS = {
  'Academic': ['oral', 'final', 'doctoral', 'seminar', 'lecture', 'phd', 'academic', 'education', 'research', 'study', 'professor', 'faculty', 'colloquium'],
  'Arts & Music': ['music', 'concert', 'art', 'performance', 'play', 'exhibit', 'theater', 'theatre', 'dance', 'ballet', 'orchestra', 'band', 'painting', 'sculpture'],
  'Health & Wellness': ['health', 'wellness', 'fitness', 'yoga', 'meditation', 'mindfulness', 'exercise', 'workout', 'nutrition', 'diet', 'mental health', 'healthcare'],
  'Professional Development': ['career', 'resume', 'job', 'professional', 'interview', 'networking', 'leadership', 'management', 'business', 'entrepreneurship', 'startup'],
  'Cultural & Ethnic': ['culture', 'cultural', 'ethnic', 'diversity', 'inclusion', 'heritage', 'tradition', 'international', 'global', 'asia', 'pacific', 'hawaiian', 'asian'],
  'Student Affairs': ['student', 'affairs', 'enrollment', 'administration'],
  'Community Service': ['service', 'volunteer', 'community', 'outreach', 'help', 'support', 'assistance'],
  'Outdoors & Recreation': ['outdoor', 'recreation', 'hike', 'trail', 'beach', 'nature', 'environment', 'park', 'ocean'],
  'Social': ['social', 'meetup', 'gathering', 'party', 'mixer', 'pau hana', 'potluck', 'lunch', 'dinner', 'breakfast'],
  'Technology': ['technology', 'computer', 'software', 'hardware', 'programming', 'code', 'developer', 'artificial intelligence', 'data science', 'computing', 'cybersecurity'],
};

async function resetCategorization() {
  // Get all events
  const events = await prisma.event.findMany();
  
  console.log(`Resetting categorization for ${events.length} events...`);
  
  let resetCount = 0;
  
  // Get Academic category ID
  const academicCategory = await prisma.category.findFirst({
    where: {
      name: 'Academic'
    }
  });
  
  if (!academicCategory) {
    console.error("Academic category not found!");
    return;
  }
  
  for (const event of events) {
    try {
      // Delete all category relationships for this event
      await prisma.eventCategory.deleteMany({
        where: {
          eventId: event.id
        }
      });
      
      // Re-add the Academic category
      await prisma.eventCategory.create({
        data: {
          eventId: event.id,
          categoryId: academicCategory.id
        }
      });
      
      resetCount++;
    } catch (error) {
      console.error(`Error resetting event "${event.title}": ${error.message}`);
    }
  }
  
  console.log(`Reset ${resetCount} events to have only the Academic category`);
}

async function diversifyEventCategories() {
  console.log('Starting to diversify event categories...');
  
  // Get all categories from the database
  const categoriesDb = await prisma.category.findMany();
  const categoriesMap = {};
  
  for (const category of categoriesDb) {
    categoriesMap[category.name] = category.id;
  }
  
  // Get all events from database
  const events = await prisma.event.findMany({
    include: {
      categories: {
        include: {
          category: true
        }
      }
    }
  });
  
  console.log(`Found ${events.length} events to process`);
  
  let updatedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  for (const event of events) {
    try {
      // Get existing category IDs for this event
      const existingCategoryIds = event.categories.map(ec => ec.categoryId);
      const existingCategoryNames = event.categories.map(ec => ec.category.name);
      
      // Skip events that already have more than one category
      if (existingCategoryIds.length > 1) {
        console.log(`Skipping event "${event.title}" - already has categories: ${existingCategoryNames.join(', ')}`);
        skippedCount++;
        continue;
      }
      
      // Get text to analyze (combine title and description)
      const textToAnalyze = [
        event.title,
        event.description,
        event.organizerSponsor
      ].filter(Boolean).join(' ').toLowerCase();
      
      // Detect categories based on keywords
      const matchedCategories = new Set(existingCategoryIds);
      let matchFound = false;
      const newCategoryNames = [];
      
      // This will store our matches with some details about strength
      const potentialMatches = [];
      
      for (const [categoryName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        // Skip if this category doesn't exist in our database
        if (!categoriesMap[categoryName]) {
          console.log(`Warning: Category "${categoryName}" not found in database`);
          continue;
        }
        
        // Skip Technology category unless there's a very strong match
        if (categoryName === 'Technology') {
          const strongTechKeywords = ['technology', 'computer', 'software', 'programming', 'code', 'developer', 'cybersecurity'];
          const hasTechMatch = strongTechKeywords.some(keyword => 
            textToAnalyze.includes(keyword.toLowerCase())
          );
          
          if (!hasTechMatch) continue;
        }
        
        // Check if any keyword matches
        let matchStrength = 0;
        for (const keyword of keywords) {
          if (textToAnalyze.includes(keyword.toLowerCase())) {
            matchStrength++;
          }
        }
        
        if (matchStrength > 0) {
          potentialMatches.push({
            categoryName,
            categoryId: categoriesMap[categoryName],
            strength: matchStrength
          });
        }
      }
      
      // Sort matches by strength and take up to 2 best matches
      potentialMatches.sort((a, b) => b.strength - a.strength);
      const bestMatches = potentialMatches.slice(0, 2);
      
      // Add to our matched categories set
      for (const match of bestMatches) {
        if (!existingCategoryIds.includes(match.categoryId)) {
          matchedCategories.add(match.categoryId);
          newCategoryNames.push(match.categoryName);
          matchFound = true;
        }
      }
      
      // Skip if no new categories were detected
      if (!matchFound) {
        console.log(`No new categories detected for "${event.title}"`);
        skippedCount++;
        continue;
      }
      
      // Calculate new categories to add
      const newCategories = Array.from(matchedCategories)
        .filter(id => !existingCategoryIds.includes(id));
      
      // Create new category connections
      console.log(`Updating event "${event.title}": adding new categories: ${newCategoryNames.join(', ')}`);
      
      for (const categoryId of newCategories) {
        await prisma.eventCategory.create({
          data: {
            eventId: event.id,
            categoryId: categoryId
          }
        });
      }
      
      console.log(`✅ Updated event "${event.title}" with categories: ${newCategoryNames.join(', ')}`);
      updatedCount++;
    } catch (error) {
      console.error(`❌ Error processing event "${event.title}": ${error.message}`);
      errorCount++;
    }
  }
  
  // Summary
  console.log('\n--- Summary ---');
  console.log(`Events processed: ${events.length}`);
  console.log(`Events updated with new categories: ${updatedCount}`);
  console.log(`Events skipped (already had multiple categories or no matches): ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
}

async function main() {
  try {
    // First reset all events to just Academic category
    await resetCategorization();
    
    // Then diversify with our new logic
    await diversifyEventCategories();
    
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 