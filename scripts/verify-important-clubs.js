/**
 * Script to verify that specific important clubs are in the database
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// List of important clubs to verify
const clubsToVerify = [
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

async function verifyClubs() {
  console.log('Verifying important clubs in the database...\n');
  
  let foundCount = 0;
  let missingCount = 0;
  
  for (const clubName of clubsToVerify) {
    try {
      // Find the club by name
      const club = await prisma.club.findFirst({
        where: {
          name: {
            contains: clubName,
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
      
      if (club) {
        console.log(`✅ FOUND: "${club.name}"`);
        console.log(`   Purpose: ${club.purpose.substring(0, 100)}${club.purpose.length > 100 ? '...' : ''}`);
        console.log(`   Category: ${club.categoryDescription}`);
        console.log(`   Categories: ${club.categories.map(c => c.category.name).join(', ') || 'None'}`);
        console.log('');
        foundCount++;
      } else {
        console.log(`❌ MISSING: "${clubName}"`);
        missingCount++;
      }
    } catch (error) {
      console.error(`Error checking club "${clubName}":`, error.message);
    }
  }
  
  console.log(`\nVerification complete: ${foundCount} clubs found, ${missingCount} clubs missing.`);
}

// Run the function
verifyClubs()
  .catch(error => {
    console.error('Error during verification:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 