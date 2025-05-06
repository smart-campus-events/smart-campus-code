/**
 * Script to remove text fragments that were accidentally imported as clubs
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Patterns or indicators of fake clubs (partial fragments from the spreadsheet)
const fragmentPatterns = [
  // Fragments that start with these words/phrases
  { startsWith: "To encourage", lengthLessThan: 100 },
  { startsWith: "We aim", lengthLessThan: 100 },
  { startsWith: "To provide", lengthLessThan: 100 },
  { startsWith: "To promote", lengthLessThan: 100 },
  { startsWith: "To foster", lengthLessThan: 100 },
  { startsWith: "Section", lengthLessThan: 100 },
  { startsWith: "Mission", lengthLessThan: 30 },
  { startsWith: "academics", lengthLessThan: 30 },
  { startsWith: "Originally", lengthLessThan: 50 },
  { startsWith: "Through our", lengthLessThan: 100 },
  { startsWith: "This shall", lengthLessThan: 100 },
  { startsWith: "We represent", lengthLessThan: 100 },
  { startsWith: "students and", lengthLessThan: 200 },
  { startsWith: "of students", lengthLessThan: 100 },
  { startsWith: "to fostering", lengthLessThan: 200 },
  { startsWith: "The council", lengthLessThan: 100 },
  { startsWith: "patients and", lengthLessThan: 100 },
  { startsWith: "increase awareness", lengthLessThan: 100 },
  
  // Fragments that are suspiciously short
  { maxLength: 15 },
  
  // Special cases of known text fragments
  { exactClubName: "Stole Society" },
  { exactClubName: "The Hawaii Pickleball Club at University of Hawaii Manoa" },
  { exactClubName: "Young Skal" },
  
  // Fragments that are likely parts of a purpose description
  { containsPhrase: " to establish", lengthLessThan: 100 },
  { containsPhrase: "FLSA also aims", lengthLessThan: 100 },
  { containsPhrase: "Other ELS activities", lengthLessThan: 100 },
  { containsPhrase: "ELS welcomes", lengthLessThan: 200 },
  { containsPhrase: "their communities through", lengthLessThan: 100 },
  { containsPhrase: "SPARK establishes", lengthLessThan: 100 },
  
  // Specifically check for clubs with names that start with bullet points, numbers or dashes
  { startsWith: "➤", lengthLessThan: 200 },
  { startsWith: "•", lengthLessThan: 200 },
  { startsWith: "- ", lengthLessThan: 200 },
  { startsWith: "–", lengthLessThan: 100 },
  { startsWith: "1.", lengthLessThan: 100 },
  { startsWith: "2.", lengthLessThan: 100 },
  { startsWith: "3.", lengthLessThan: 100 },
  { startsWith: "4.", lengthLessThan: 100 },
  { startsWith: "5.", lengthLessThan: 100 },
  { startsWith: "A.", lengthLessThan: 100 },
  { startsWith: "B.", lengthLessThan: 100 },
  { startsWith: "C.", lengthLessThan: 100 },
  { startsWith: "D.", lengthLessThan: 100 },
  { startsWith: "E.", lengthLessThan: 100 },
  { startsWith: "F.", lengthLessThan: 100 },
  { startsWith: "G.", lengthLessThan: 100 },
  { startsWith: "H.", lengthLessThan: 100 },
];

// Legitimate club names that might be mistakenly flagged
const legitimateClubs = [
  "SPARK (Service Passion Advocacy Responsibility Kindness)",
  "MRUH",
  "ROC"
];

async function removeFakeClubs() {
  console.log('Starting fake club removal process...');
  
  // Get all clubs from the database
  const allClubs = await prisma.club.findMany({
    include: {
      categories: {
        include: {
          category: true
        }
      }
    }
  });
  
  console.log(`Found ${allClubs.length} total clubs in the database`);
  const clubsToRemove = [];
  
  // Filter for potential fake clubs
  for (const club of allClubs) {
    // Skip any club in the legitimate clubs list
    if (legitimateClubs.includes(club.name)) {
      console.log(`Keeping known legitimate club: "${club.name}"`);
      continue;
    }
    
    // Check against all pattern rules
    for (const pattern of fragmentPatterns) {
      let isMatch = false;
      
      if (pattern.maxLength && club.name.length <= pattern.maxLength) {
        isMatch = true;
      }
      
      if (pattern.startsWith && club.name.startsWith(pattern.startsWith)) {
        if (!pattern.lengthLessThan || club.name.length < pattern.lengthLessThan) {
          isMatch = true;
        }
      }
      
      if (pattern.exactClubName && club.name === pattern.exactClubName) {
        isMatch = true;
      }
      
      if (pattern.containsPhrase && club.name.includes(pattern.containsPhrase)) {
        if (!pattern.lengthLessThan || club.name.length < pattern.lengthLessThan) {
          isMatch = true;
        }
      }
      
      // If any rule matched, add to removal list
      if (isMatch) {
        clubsToRemove.push(club);
        console.log(`Identified potential fake club: "${club.name}"`);
        break;
      }
    }
  }
  
  console.log(`\nFound ${clubsToRemove.length} potential fake clubs`);
  
  // Ask for confirmation before deleting
  if (clubsToRemove.length === 0) {
    console.log('No fake clubs found. Nothing to remove.');
    return;
  }
  
  console.log('\nProceeding with deletion:');
  
  // Delete each fake club
  let successCount = 0;
  for (const club of clubsToRemove) {
    try {
      // First delete all category associations
      await prisma.clubCategory.deleteMany({
        where: {
          clubId: club.id
        }
      });
      
      // Then delete the club itself
      await prisma.club.delete({
        where: {
          id: club.id
        }
      });
      
      console.log(`Successfully deleted fake club: "${club.name}"`);
      successCount++;
    } catch (error) {
      console.error(`Error deleting club "${club.name}":`, error.message);
    }
  }
  
  console.log(`\nRemoval complete. Deleted ${successCount} fake clubs.`);
}

// Run the function
removeFakeClubs()
  .catch(error => {
    console.error('Error during fake club removal:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 