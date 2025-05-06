/**
 * Script to remove text fragments that were accidentally imported as clubs
 * This version is more precise and only targets known text fragments
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// List of known text fragments that are not actual clubs
const knownFragments = [
  // Text fragments starting with these patterns
  "Section 1.",
  "Section 2.",
  "The purpose of this organization",
  "To encourage members",
  "FLSA also aims",
  "ELS members",
  "Other ELS activities",
  "ELS welcomes",
  "- To offer leadership",
  "- To inspire and promote",
  "The Judo Team/Club does not offer",
  "The purpose of this organization shall also promote",
  "To foster and promote",
  "To cooperate with",
  "To disseminate professional",
  "➤To promote",
  "➤To instill",
  "➤To develop",
  "➤To help students",
  "➤To serve",
  "➤To encourage",
  "➤We",
  "➤Striving",
  "Our Mission and Motto",
  "To foster the future",
  
  // Exact fragments
  "students and how they can incorporate these principles into clinical medicine practice. The goals of this organization are helping students understand health at a population level",
  "Mission",
  "academics",
  "of students by providing a platform where their businesses and services can flourish.",
  "We aim to bridge the gap between academic learning and real-world experience",
  "student entrepreneurs the tools",
  "in today's marketplace. By alleviating some of the challenges that come with",
  "entrepreneurship",
  "also creating meaningful opportunities for them to network with affiliated business",
  "professionals and leaders. Through this support",
  "academic excellence and entrepreneurial growth",
  "excel in their studies but also gain invaluable industry connections and experience.",
  "(2) Our organization is unique in that it is entirely student-maintained",
  "showcasing the incredible talent of UH Manoa's students. Our platform is developed",
  "and managed by our dedicated team of Information and Computer Sciences (ICS)",
  "students",
  "their work on Haumāna Exchange",
  "skills",
  "future careers in the tech industry. Additionally",
  "of operations",
  "(3) Our marketing team plays an equally crucial role in our success",
  "promote student businesses",
  "presence. Marketing team members gain practical experience in digital marketing",
  "social media strategy",
  "sought after in today's job market. By working closely with student entrepreneurs and",
  "external partners",
  "careers.",
  "(4) Currently",
  "marketing team. As we grow",
  "students with the opportunity to contribute their skills and expertise while gaining",
  "valuable experience that complements their academic learning. Our vision is to build a",
  "collaborative",
  "entrepreneurs but also develops the next generation of business and tech leaders.",
  "(5) By building this dynamic platform",
  "the #1 discovery platform for student entrepreneurs at UH Manoa",
  "only develop their ventures but also shape the future of student-led innovation. Through",
  "collaboration",
  "us has the power to leave a lasting impact—both on campus and beyond.",
  "Promote student interest and further improves the quality of the Microbiology programs within the University of Hawaiʻi systems and at other institutions in the state.",
  "Promote and explain the benefits and value of HI-ASM membership to students",
  "Provide aid and professional development opportunities for students in Microbiology within the state in respects to academic curriculum",
  "Promote student",
  "communities.",
  "Originally",
  "Through our efforts",
  "This shall be my purpose that those who know me may esteem Alpha Gamma Delta for her attainments",
  "The organization was founded with the intention to allow students the opportunity to",
  "Stole Society",
  "Mānoa. Similar to the Hawai'i State Teacher's Association (the Hawai'i Teacher'sunion)",
  "development opportunities",
  "accomplished through service opportunities",
  "student-led organization within the College of Education at the University of Hawai'i at Mānoa. Similar to the Hawai'i State Teacher's Association (the Hawai'i",
  "Teacher's union)",
  "maximizing opportunities to connect with peers going into the teaching profession. This is accomplished through service opportunities",
  "workshops/conferences.",
  "medical students about rural health issues",
  
  // Fragments identified by unique part
  "Lambda Law Hawaiʻi seeks to increase awareness of LGBTQIA2S+ issues and legal strategies to address those issues by sponsoring campus-wide events",
  "Throughout the academic year",
  "Students of all genders and sexualities are welcome to join the WSRSL Lambda community.",
  "We are all about bringing people together through the fun and fast-paced sport of pickleball. We aim to create a chill and welcoming space where everyone",
  "increase awareness about the physician shortage in Hawaii and nationwide. To educate",
  "student-led organization within the College of Education at the University of Hawai'i at Mānoa. Similar to the Hawai'i State Teacher's Association",
  "1. To promote global friendship and understanding;",
  "2. To support new and continuing students in their educational objectives;",
  "3. To explores issues and places in Hawaii;",
  "4. To develop leadership among students;",
  "5. To have fun.",
  "We represent students to the department and college to discover resources and solutions that improve the graduate experiences and foster a sense of community.",
  "-To encourage all members of the UH Manoa Campus Community to become involved in solving food insecurity issues on campus.",
  "-To help remove the social stigma that goes along with being food insecure."
];

// Club names that are longer and look suspicious (likely text fragments)
const longSuspiciousNames = [
  "Stole Society is dedicated to the manufacturing of stoles for the graduating classes for the College of Tropical Agriculture and Human Resources (CTAHR) at the University of Hawaii at Mānoa. On occasion",
  "To develop friendship and common purpose between the students of the educational establishment",
  "The Hawaii Pickleball Club at University of Hawaii Manoa",
  "Young Skal",
];

async function removeTextFragments() {
  console.log('Starting removal of text fragments...');
  
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
  
  // Find clubs that match known fragments
  for (const club of allClubs) {
    // Check against known fragments
    let shouldRemove = false;
    
    // Check exact matches
    for (const fragment of knownFragments) {
      if (club.name === fragment || club.name.startsWith(fragment)) {
        shouldRemove = true;
        break;
      }
    }
    
    // Check longer suspicious names
    if (!shouldRemove) {
      for (const suspiciousName of longSuspiciousNames) {
        if (club.name === suspiciousName) {
          shouldRemove = true;
          break;
        }
      }
    }
    
    if (shouldRemove) {
      clubsToRemove.push(club);
      console.log(`Identified text fragment: "${club.name}"`);
    }
  }
  
  console.log(`\nFound ${clubsToRemove.length} text fragments`);
  
  // Exit if no fragments found
  if (clubsToRemove.length === 0) {
    console.log('No text fragments found. Nothing to remove.');
    return;
  }
  
  console.log('\nProceeding with deletion:');
  
  // Delete each fragment
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
      
      console.log(`Successfully deleted: "${club.name}"`);
      successCount++;
    } catch (error) {
      console.error(`Error deleting "${club.name}":`, error.message);
    }
  }
  
  console.log(`\nRemoval complete. Deleted ${successCount} text fragments.`);
}

// Run the function
removeTextFragments()
  .catch(error => {
    console.error('Error during text fragment removal:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 