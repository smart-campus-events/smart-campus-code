/**
 * Script to list the clubs that were restored
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Names of clubs we want to check
const clubNamesToCheck = [
  "SPARK (Service Passion Advocacy Responsibility Kindness)",
  "ROC",
  "MRUH",
  "Young Skal",
  "The Hawaii Pickleball Club at University of Hawaii Manoa"
];

async function listRestoredClubs() {
  console.log('Checking for restored clubs in the database...\n');
  
  for (const clubName of clubNamesToCheck) {
    try {
      // Find the club
      const club = await prisma.club.findUnique({
        where: { name: clubName },
        include: {
          categories: {
            include: {
              category: true
            }
          }
        }
      });
      
      if (club) {
        console.log(`✅ Club found: "${club.name}"`);
        console.log(`   Purpose: ${club.purpose.substring(0, 100)}${club.purpose.length > 100 ? '...' : ''}`);
        console.log(`   Category: ${club.categoryDescription}`);
        console.log(`   Categories: ${club.categories.map(c => c.category.name).join(', ')}`);
        console.log('');
      } else {
        console.log(`❌ Club not found: "${clubName}"`);
      }
    } catch (error) {
      console.error(`Error checking club "${clubName}":`, error.message);
    }
  }
}

// Run the function
listRestoredClubs()
  .catch(error => {
    console.error('Error during club listing:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 