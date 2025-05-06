/**
 * Script to clean up text fragments that were incorrectly imported as clubs
 * This will only keep clubs that match proper criteria from the spreadsheet
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// List of legitimate clubs to preserve (keep these even if they look like fragments)
const legitimateClubs = [
  "SPARK (Service Passion Advocacy Responsibility Kindness)",
  "ROC",
  "MRUH", 
  "Young Skal",
  "The Hawaii Pickleball Club at University of Hawaii Manoa",
  "Hawaii Society for Epistemic Innovation, Integrative Studies, and Transformative Research (IMUA)",
  "Hawaii Streams and Ecosystems Club",
  "Hawaii Student Entrepreneurs Club",
  "Hawaii Undergraduate Initiative",
  "Hawaii Women Lawyers Student Organization"
];

// Patterns to identify text fragments
const fragmentPatterns = [
  // Fragments that are clearly parts of longer text
  { contains: "through service opportunities" },
  { contains: "and established by the University policies" },
  { contains: "promote student businesses" },
  { contains: "and shape the future of student-led innovation" },
  { contains: "student entrepreneurs the tools" },
  { contains: "in today's marketplace" },
  { contains: "promote conversations around peace" },
  { contains: "we are committed to" },
  { contains: "Our Goals" },
  { contains: "Our Mission" },
  { contains: "Our Commitment" },
  { contains: "to build positive relationships" },
  { contains: "faculty and staff" },
  { contains: "development opportunities" },
  { contains: "Teacher's union" },
  { contains: "academic excellence and entrepreneurial growth" },
  { contains: "marketing team" },
  { contains: "we do have the ability to deny" },
  { contains: "and participates in" },
  { contains: "graduation and senior lūʻau" },
  { contains: "students with the opportunity" },
  { contains: "and turning off lights" },
  { contains: "regulations" },
  { contains: "make friends" },
  { contains: "sports" },
  { contains: "resource management" },
  { contains: "surgical oncology" },
  { contains: "will educate and inspire students" },
  { contains: "so the national organization needs" },
  { contains: "faculty" },
  { contains: "Chapter of SHRM" },
  { contains: "mindful that these issues" },
  { contains: "marginalized" },
  { contains: "students" },
  { contains: "and how they can incorporate" },
  { contains: "communities" },
  { contains: "skills" },
  { contains: "AAUW on the UHM campus" },
  { contains: "are working towards equity" },
  { contains: "tools necessary for women" },
  { contains: "pursue their education" },
  { contains: "external partners" },
  { contains: "careers" },
  { contains: "purpose of class activities" },
  { contains: "collaborative" },
  { contains: "medical students about rural health" },
  { contains: "opportunity for spiritual growth" },
  { contains: "Christians at UH" },
  
  // Fragments that are very short
  { maxLength: 40 },
  
  // Fragments that start with parts of sentences
  { startsWith: "to build positive" },
  { startsWith: "accomplished through" },
  { startsWith: "support among chapter" },
  { startsWith: "and managed by" },
  { startsWith: "promote the Vietnamese" },
  { startsWith: "presence. Marketing" },
  { startsWith: "health care" },
  { startsWith: "maximize opportunities" },
  { startsWith: "of personnel" },
  { startsWith: "students and Allies" },
  { startsWith: "their work on" },
  { startsWith: "valuable experience" },
  { startsWith: "and established" },
  { startsWith: "workshops/conferences" },
  { startsWith: "interests and curiosity" },
  { startsWith: "Future careers" },
];

// Check if a club matches any fragment pattern
function isTextFragment(club) {
  // Skip if club is in the legitimate clubs list
  if (legitimateClubs.some(name => club.name.includes(name) || name.includes(club.name))) {
    return false;
  }
  
  // Check against fragment patterns
  for (const pattern of fragmentPatterns) {
    if (pattern.contains && club.name.toLowerCase().includes(pattern.contains.toLowerCase())) {
      return true;
    }
    
    if (pattern.startsWith && club.name.toLowerCase().startsWith(pattern.startsWith.toLowerCase())) {
      return true;
    }
    
    if (pattern.maxLength && club.name.length <= pattern.maxLength) {
      return true;
    }
  }
  
  return false;
}

async function cleanupFragmentClubs() {
  console.log('Starting club fragment cleanup...');
  
  // Get all clubs from the database
  const allClubs = await prisma.club.findMany({
    include: {
      categories: true
    }
  });
  
  console.log(`Found ${allClubs.length} clubs in the database`);
  
  const fragmentsToRemove = [];
  
  // Find text fragments
  for (const club of allClubs) {
    if (isTextFragment(club)) {
      fragmentsToRemove.push(club);
    }
  }
  
  console.log(`\nFound ${fragmentsToRemove.length} potential text fragments to remove`);
  
  // Delete the text fragments
  let deletedCount = 0;
  
  for (const fragment of fragmentsToRemove) {
    try {
      // First delete all category associations
      if (fragment.categories.length > 0) {
        await prisma.clubCategory.deleteMany({
          where: {
            clubId: fragment.id
          }
        });
      }
      
      // Then delete the club itself
      await prisma.club.delete({
        where: {
          id: fragment.id
        }
      });
      
      console.log(`Removed text fragment: "${fragment.name}"`);
      deletedCount++;
    } catch (error) {
      console.error(`Error removing fragment "${fragment.name}":`, error.message);
    }
  }
  
  console.log(`\nCleanup complete. Removed ${deletedCount} text fragments.`);
}

// Run the cleanup
cleanupFragmentClubs()
  .catch(error => {
    console.error('Error during fragment cleanup:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 