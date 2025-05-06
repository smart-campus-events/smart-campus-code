/**
 * Script to add sample clubs directly to the database
 */

const { PrismaClient, ContentStatus } = require('@prisma/client');
const prisma = new PrismaClient();

// Sample clubs data based on info from the UH Manoa clubs spreadsheet
const sampleClubs = [
  {
    name: "Hawaii Student Entrepreneurs Club",
    purpose: "Inspire and grow students' entrepreneurial mindset. All of our members will learn how to start a business, meet established entrepreneurs, and learn about various entrepreneurial topics.",
    categoryDescription: "Academic/Professional",
    primaryContactName: "Jazmyne Faith Viloria",
    contactEmail: "jazmynef@hawaii.edu",
    status: ContentStatus.APPROVED
  },
  {
    name: "Hawaii Undergraduate Initiative",
    purpose: "HUI RIO strives to build a community and support system for current Hawaiʻi Undergraduate Initiative students, alumni, and friends by providing resources, academic services, social, and community activities needed to ensure that students continue to have a college going attitude.",
    categoryDescription: "Ethnic/Cultural",
    primaryContactName: "Jasmine Ko",
    contactEmail: "jqko@hawaii.edu",
    status: ContentStatus.APPROVED
  },
  {
    name: "Hawaii Women Lawyers Student Organization",
    purpose: "Hawaii Women Lawyers Student Organization (\"HWLSO\") allows students from the William S. Richardson School of Law to participate in their meetings and events as a way for students to network, learn about events in the legal field, and to expose them to educational talks, some of which they will assist in organizing. These students are called HWL Student Representatives. The HWLSO goal is to create a community of law students advocating, supporting, and contributing to the advancement of women in this profession.",
    categoryDescription: "Academic/Professional",
    primaryContactName: "Sophia Koo",
    contactEmail: "skoo4@hawaii.edu",
    status: ContentStatus.APPROVED
  },
  {
    name: "Hawai'i Society for Epistemic Innovation, Integrative Studies, and Transformative Research (IMUA)",
    purpose: "The Hawai'i Society for Epistemic Innovation, Integrative Studies, and Transformative Researchy (IMUA Labs) is a program of inquiry in a genuinely participatory action research mode to investigate the intellectual matrix of Hawaiʻi and understand what critical cognitive resources need to be cultivated and delivered through various public-education and social-learning vehicles to support a deep liberatory and systemic ecosocial transformation, consistent with a just sustainability transition in this day and age of complexity and change.",
    categoryDescription: "Academic/Professional",
    primaryContactName: "Travis Idol",
    contactEmail: "idol@hawaii.edu",
    status: ContentStatus.APPROVED
  },
  {
    name: "Hawaii Streams and Ecosystems Club",
    purpose: "The purpose of the Hawaii Streams and Ecosystems Organization is to educate, understand, and continuously explore streams throughout Hawaii. We hope to gain and spread more knowledge about the biological and cultural importance of Hawaii's streams and the benefits they provide, and promote awareness as to why stream conservation is vital in Hawaii.",
    categoryDescription: "Academic/Professional",
    primaryContactName: "Jaimie Hijii",
    contactEmail: "hijiij@hawaii.edu",
    status: ContentStatus.APPROVED
  }
];

// Categories to create
const categories = [
  "Academic/Professional",
  "Ethnic/Cultural",
  "Honorary",
  "Recreational",
  "Religious",
  "Service",
  "Sports"
];

async function createCategories() {
  console.log('Creating categories...');
  for (const categoryName of categories) {
    // Check if category already exists
    const existing = await prisma.category.findFirst({
      where: {
        name: {
          equals: categoryName,
          mode: 'insensitive'
        }
      }
    });
    
    if (!existing) {
      await prisma.category.create({
        data: { name: categoryName }
      });
      console.log(`Created category: ${categoryName}`);
    } else {
      console.log(`Category already exists: ${categoryName}`);
    }
  }
}

async function addSampleClubs() {
  console.log('Starting to add sample clubs...');
  
  // Create categories first
  await createCategories();
  
  let addedCount = 0;
  let skippedCount = 0;
  
  for (const clubData of sampleClubs) {
    try {
      // Check if club already exists
      const existingClub = await prisma.club.findUnique({
        where: { name: clubData.name }
      });
      
      if (existingClub) {
        console.log(`Club already exists: ${clubData.name}`);
        skippedCount++;
        continue;
      }
      
      // Find category by name
      let category = null;
      if (clubData.categoryDescription) {
        category = await prisma.category.findFirst({
          where: {
            name: {
              equals: clubData.categoryDescription,
              mode: 'insensitive'
            }
          }
        });
        
        if (!category) {
          console.log(`Creating missing category: ${clubData.categoryDescription}`);
          category = await prisma.category.create({
            data: { name: clubData.categoryDescription }
          });
        }
      }
      
      // Create the club
      const club = await prisma.club.create({
        data: {
          name: clubData.name,
          purpose: clubData.purpose,
          categoryDescription: clubData.categoryDescription,
          primaryContactName: clubData.primaryContactName,
          contactEmail: clubData.contactEmail,
          status: clubData.status
        }
      });
      
      // Create the club-category association if we found a category
      if (category) {
        await prisma.clubCategory.create({
          data: {
            clubId: club.id,
            categoryId: category.id
          }
        });
        console.log(`Associated club "${clubData.name}" with category "${category.name}"`);
      }
      
      console.log(`Added club: ${clubData.name}`);
      addedCount++;
    } catch (error) {
      console.error(`Error adding club "${clubData.name}":`, error.message);
    }
  }
  
  console.log(`\nAdded ${addedCount} clubs`);
  console.log(`Skipped ${skippedCount} existing clubs`);
}

// Run the function
addSampleClubs()
  .catch(err => {
    console.error('Error:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 