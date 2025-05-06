const { PrismaClient } = require('@prisma/client');

/**
 * Script to list all clubs in the database alphabetically, grouped by first letter
 */
async function listAllClubs() {
  const prisma = new PrismaClient();
  try {
    // Fetch all clubs regardless of status
    const clubs = await prisma.club.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        purpose: true,
        status: true,
        categories: {
          select: {
            category: true
          }
        }
      },
    });

    console.log(`Total clubs in database: ${clubs.length}`);
    
    // Group clubs by first letter
    const groupedClubs = {};
    clubs.forEach(club => {
      const firstLetter = club.name.charAt(0).toUpperCase();
      if (!groupedClubs[firstLetter]) {
        groupedClubs[firstLetter] = [];
      }
      groupedClubs[firstLetter].push(club);
    });

    // Print clubs by letter group
    console.log('\nClubs grouped by first letter:');
    for (const letter in groupedClubs) {
      console.log(`\n--- ${letter} (${groupedClubs[letter].length} clubs) ---`);
      groupedClubs[letter].forEach(club => {
        const categories = club.categories.map(c => c.category.name).join(', ');
        console.log(`${club.name} (Status: ${club.status}, Categories: ${categories || 'None'})`);
      });
    }

    // Print letters with no clubs
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const missingLetters = [];
    for (let i = 0; i < alphabet.length; i++) {
      const letter = alphabet[i];
      if (!groupedClubs[letter]) {
        missingLetters.push(letter);
      }
    }
    
    if (missingLetters.length > 0) {
      console.log(`\nLetters with no clubs: ${missingLetters.join(', ')}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAllClubs(); 