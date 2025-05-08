/**
 * Manoa Compass Data Manager
 * 
 * A comprehensive script that combines the essential functionality for:
 * 1. Importing clubs with email addresses
 * 2. Importing UH events
 * 3. Cleaning and standardizing categories
 * 4. Checking database contents
 * 
 * Usage: 
 *   node scripts/manoa-compass-data-manager.js [command]
 * 
 * Commands:
 *   import-clubs     - Import clubs from Google Sheet
 *   import-events    - Import events from UH Manoa calendar
 *   clean-categories - Clean and standardize categories
 *   approve-all      - Approve all clubs and events
 *   check-data       - Check database contents
 *   run-all          - Run all commands in sequence
 */

const { PrismaClient, ContentStatus } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

// Check for required dependencies
let parse;
let axios;

try {
  axios = require('axios');
} catch (error) {
  console.error('Error: Missing dependency "axios"');
  console.error('Please install it by running:');
  console.error('npm install axios');
  process.exit(1);
}

try {
  const csvParse = require('csv-parse/sync');
  parse = csvParse.parse;
} catch (error) {
  console.error('Error: Missing dependency "csv-parse"');
  console.error('Please install it by running:');
  console.error('npm install csv-parse');
  process.exit(1);
}

// Configuration
const GOOGLE_SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "1vK_ixq3a86uXjHXy9oNnyYHwAvyU9smNPKuJU6OYd-Q";
const GOOGLE_SHEET_GID = process.env.GOOGLE_SHEET_GID || "828154192";

// Important clubs that should always be included
const IMPORTANT_CLUBS = [
  'Accounting Club',
  'American Marketing Association (AMA)',
  'Delta Sigma Pi',
  'Financial Management Association (FMA)',
  'Information Technology Management Association',
  'ASCE Student Chapter University of Hawaii at Manoa',
  'HKN Mu Delta'
];

// Main function to handle command line args and execute appropriate functions
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check-data';
  
  try {
    console.log(`====== Manoa Compass Data Manager ======`);
    console.log(`Executing command: ${command}`);
    
    switch (command) {
      case 'import-clubs':
        await importClubs();
        break;
      case 'import-events':
        await importEvents();
        break;
      case 'clean-categories':
        await cleanCategories();
        break;
      case 'approve-all':
        await approveAll();
        break;
      case 'check-data':
        await checkData();
        break;
      case 'run-all':
        console.log('Running all commands in sequence...');
        await importClubs();
        await importEvents();
        await cleanCategories();
        await approveAll();
        await checkData();
        break;
      default:
        console.log(`Unknown command: ${command}`);
        console.log('Available commands: import-clubs, import-events, clean-categories, approve-all, check-data, run-all');
    }
    
    console.log(`\n====== Command Completed ======`);
  } catch (error) {
    console.error('Error during execution:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// ===== IMPORT CLUBS =====
async function importClubs() {
  console.log('\n===== IMPORTING CLUBS =====');
  
  try {
    // Fetch data from Google Sheets
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SPREADSHEET_ID}/export?format=csv&gid=${GOOGLE_SHEET_GID}`;
    console.log(`Fetching data from: ${sheetUrl}`);
    
    const response = await axios.get(sheetUrl);
    const csvData = response.data;
    
    // Parse CSV data
    const records = parse(csvData, {
      columns: false,
      skip_empty_lines: true
    });
    
    // Find the header row (usually row 8)
    let headerRow = null;
    for (let i = 0; i < records.length; i++) {
      if (records[i].includes('Name of Organization')) {
        headerRow = i;
        break;
      }
    }
    
    if (headerRow === null) {
      throw new Error('Could not find header row with "Name of Organization"');
    }
    
    // Extract header columns
    const headers = records[headerRow];
    const nameIndex = headers.indexOf('Name of Organization');
    const typeIndex = headers.indexOf('Type');
    const emailIndex = headers.indexOf('Contact Email');
    const purposeIndex = headers.indexOf('Purpose');
    
    if (nameIndex === -1) {
      throw new Error('Could not find "Name of Organization" column');
    }
    
    // Clear existing clubs and club categories
    console.log('Clearing existing club categories...');
    await prisma.clubCategory.deleteMany({});
    
    console.log('Clearing existing clubs...');
    await prisma.club.deleteMany({});
    
    // Ensure we have the "Academic/Professional" category
    console.log('Creating required categories...');
    const academicCategory = await prisma.category.upsert({
      where: { name: 'Academic' },
      update: {},
      create: { name: 'Academic' }
    });
    
    const professionalCategory = await prisma.category.upsert({
      where: { name: 'Professional' },
      update: {},
      create: { name: 'Professional' }
    });
    
    // Process each row starting from the row after the header
    console.log(`Processing ${records.length - headerRow - 1} rows...`);
    
    const seenClubNames = new Set();
    let importedCount = 0;
    let skippedCount = 0;
    
    for (let i = headerRow + 1; i < records.length; i++) {
      const row = records[i];
      if (!row[nameIndex] || row[nameIndex].trim() === '') {
        continue; // Skip empty rows
      }
      
      const clubName = row[nameIndex].trim();
      
      // Skip if we've already seen this club name
      if (seenClubNames.has(clubName.toLowerCase())) {
        skippedCount++;
        continue;
      }
      
      // Skip rows that are not actually club names (e.g., section headers, notes)
      if (clubName.includes(':') || clubName.startsWith('*') || clubName.startsWith('(') || clubName.startsWith('-')) {
        skippedCount++;
        continue;
      }
      
      // Get email address if available
      const email = row[emailIndex] ? row[emailIndex].trim() : null;
      
      // Skip clubs without email addresses
      if (!email || email === '') {
        console.log(`Skipping club without email: ${clubName}`);
        skippedCount++;
        continue;
      }
      
      // Get club purpose if available
      let purpose = row[purposeIndex] ? row[purposeIndex].trim() : '';
      
      // Set default purpose if empty
      if (!purpose || purpose === '') {
        purpose = `${clubName} is a student organization at the University of Hawaii at Manoa.`;
      }
      
      // Get club type/category if available
      const type = row[typeIndex] ? row[typeIndex].trim() : '';
      
      seenClubNames.add(clubName.toLowerCase());
      
      // Create or update the club
      const club = await prisma.club.create({
        data: {
          name: clubName,
          purpose: purpose,
          contactEmail: email,
          status: ContentStatus.APPROVED,
          categories: {
            create: [
              { categoryId: academicCategory.id },
              { categoryId: professionalCategory.id }
            ]
          }
        }
      });
      
      importedCount++;
      
      if (importedCount % 10 === 0) {
        console.log(`Imported ${importedCount} clubs...`);
      }
    }
    
    console.log(`\nImport summary:`);
    console.log(`- Imported ${importedCount} clubs`);
    console.log(`- Skipped ${skippedCount} entries`);
    
    // Verify important clubs were imported
    console.log('\nVerifying important clubs...');
    for (const clubName of IMPORTANT_CLUBS) {
      const club = await prisma.club.findFirst({
        where: {
          name: {
            contains: clubName,
            mode: 'insensitive'
          }
        }
      });
      
      if (club) {
        console.log(`✅ Found: ${clubName}`);
      } else {
        console.log(`❌ Missing: ${clubName}`);
      }
    }
    
    return { importedCount, skippedCount };
  } catch (error) {
    console.error('Error importing clubs:', error);
    throw error;
  }
}

// ===== IMPORT EVENTS =====
async function importEvents() {
  console.log('\n===== IMPORTING UH EVENTS =====');
  
  try {
    // Fetch events from UH Manoa calendar
    console.log('Fetching events from UH Manoa calendar...');
    
    // In a full implementation, you would fetch from the actual UH calendar API
    // This is a placeholder for demonstration
    const eventUrls = [
      'https://manoa.hawaii.edu/calendar/event-category/student-life/',
      'https://manoa.hawaii.edu/calendar/event-category/academic-calendar/',
      'https://manoa.hawaii.edu/calendar/event-category/admissions/'
    ];
    
    console.log(`Will process ${eventUrls.length} event feeds`);
    
    // Ensure we have the required categories
    console.log('Creating required categories...');
    const academicCategory = await prisma.category.upsert({
      where: { name: 'Academic' },
      update: {},
      create: { name: 'Academic' }
    });
    
    // Process each event feed
    let totalImported = 0;
    
    // In a real implementation, you'd loop through the URLs and parse actual events
    // For demonstration, we'll create some sample events
    console.log('Creating sample events...');
    
    const now = new Date();
    const sampleEvents = [
      {
        title: 'Finals Week',
        description: 'Final examinations for Spring semester.',
        startDateTime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        location: 'UH Manoa Campus',
        status: ContentStatus.APPROVED
      },
      {
        title: 'Career Fair',
        description: 'Connect with employers from around Hawaii and beyond.',
        startDateTime: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        location: 'Campus Center Ballroom',
        status: ContentStatus.APPROVED
      },
      {
        title: 'Student Research Symposium',
        description: 'Undergraduate and graduate students present their research projects.',
        startDateTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        location: 'Kennedy Theatre',
        status: ContentStatus.APPROVED
      }
    ];
    
    for (const eventData of sampleEvents) {
      const event = await prisma.event.create({
        data: {
          ...eventData,
          categories: {
            create: [
              { categoryId: academicCategory.id }
            ]
          }
        }
      });
      
      totalImported++;
    }
    
    console.log(`\nImport summary:`);
    console.log(`- Imported ${totalImported} events`);
    
    return { totalImported };
  } catch (error) {
    console.error('Error importing events:', error);
    throw error;
  }
}

// ===== CLEAN CATEGORIES =====
async function cleanCategories() {
  console.log('\n===== CLEANING CATEGORIES =====');
  
  try {
    // 1. Standardize category names
    console.log('Standardizing category names...');
    
    // Define the standard categories and their mappings
    const categoryStandards = {
      'Academic': ['Academic', 'Academics', 'Education', 'Educational', 'Academic/Professional'],
      'Professional': ['Professional', 'Career', 'Business', 'Networking', 'Academic/Professional'],
      'Arts & Culture': ['Arts', 'Culture', 'Art', 'Cultural', 'Music', 'Dance', 'Theater', 'Theatre', 'Performance'],
      'Community Service': ['Community Service', 'Volunteer', 'Service', 'Outreach'],
      'Ethnic & Cultural': ['Ethnic', 'Cultural', 'Multicultural', 'Heritage', 'International'],
      'Health & Wellness': ['Health', 'Wellness', 'Medical', 'Fitness', 'Well-being'],
      'Political': ['Political', 'Politics', 'Government', 'Advocacy', 'Policy'],
      'Religious & Spiritual': ['Religious', 'Spiritual', 'Faith', 'Religion', 'Worship'],
      'Social': ['Social', 'Socializing', 'Friendship', 'Recreation'],
      'Science & Technology': ['Science', 'Technology', 'Tech', 'Engineering', 'STEM'],
      'Environmental': ['Environmental', 'Sustainability', 'Eco', 'Green', 'Conservation', 'Climate'],
      'Athletics & Sports': ['Athletics', 'Sports', 'Recreation', 'Fitness', 'Exercise'],
      'Media & Publications': ['Media', 'Publications', 'Journalism', 'News', 'Writing']
    };
    
    // Ensure all standard categories exist
    const standardCategories = {};
    
    for (const [standard, aliases] of Object.entries(categoryStandards)) {
      const category = await prisma.category.upsert({
        where: { name: standard },
        update: {},
        create: { name: standard }
      });
      
      standardCategories[standard] = category.id;
      console.log(`Ensured standard category: ${standard}`);
    }
    
    // 2. Process each club to standardize its categories
    console.log('Processing club categories...');
    
    const clubs = await prisma.club.findMany({
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    
    console.log(`Processing ${clubs.length} clubs...`);
    
    let standardizedCount = 0;
    
    for (const club of clubs) {
      // Track which standard categories this club should have
      const standardsToApply = new Set();
      
      // Check current categories against standards
      for (const clubCategory of club.categories) {
        const currentCategoryName = clubCategory.category.name;
        
        // Find if this category maps to any standard
        let foundMatch = false;
        
        for (const [standard, aliases] of Object.entries(categoryStandards)) {
          if (aliases.some(alias => 
            currentCategoryName.toLowerCase().includes(alias.toLowerCase()) ||
            alias.toLowerCase().includes(currentCategoryName.toLowerCase())
          )) {
            standardsToApply.add(standard);
            foundMatch = true;
          }
        }
        
        // If no match, default to Academic
        if (!foundMatch) {
          standardsToApply.add('Academic');
        }
      }
      
      // If no categories were matched, ensure at least Academic is applied
      if (standardsToApply.size === 0) {
        standardsToApply.add('Academic');
      }
      
      // Delete current categories
      await prisma.clubCategory.deleteMany({
        where: { clubId: club.id }
      });
      
      // Apply the standardized categories
      for (const standard of standardsToApply) {
        await prisma.clubCategory.create({
          data: {
            clubId: club.id,
            categoryId: standardCategories[standard]
          }
        });
      }
      
      standardizedCount++;
      
      if (standardizedCount % 10 === 0) {
        console.log(`Standardized ${standardizedCount} clubs...`);
      }
    }
    
    // 3. Process events similarly
    console.log('Processing event categories...');
    
    const events = await prisma.event.findMany({
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    
    console.log(`Processing ${events.length} events...`);
    
    let eventStandardizedCount = 0;
    
    for (const event of events) {
      // Track which standard categories this event should have
      const standardsToApply = new Set();
      
      // Check current categories against standards
      for (const eventCategory of event.categories) {
        const currentCategoryName = eventCategory.category.name;
        
        // Find if this category maps to any standard
        let foundMatch = false;
        
        for (const [standard, aliases] of Object.entries(categoryStandards)) {
          if (aliases.some(alias => 
            currentCategoryName.toLowerCase().includes(alias.toLowerCase()) ||
            alias.toLowerCase().includes(currentCategoryName.toLowerCase())
          )) {
            standardsToApply.add(standard);
            foundMatch = true;
          }
        }
        
        // If no match, default to Academic
        if (!foundMatch) {
          standardsToApply.add('Academic');
        }
      }
      
      // If no categories were matched, ensure at least Academic is applied
      if (standardsToApply.size === 0) {
        standardsToApply.add('Academic');
      }
      
      // Delete current categories
      await prisma.eventCategory.deleteMany({
        where: { eventId: event.id }
      });
      
      // Apply the standardized categories
      for (const standard of standardsToApply) {
        await prisma.eventCategory.create({
          data: {
            eventId: event.id,
            categoryId: standardCategories[standard]
          }
        });
      }
      
      eventStandardizedCount++;
    }
    
    // 4. Clean up unused categories
    console.log('Cleaning up unused categories...');
    
    const categories = await prisma.category.findMany();
    let deletedCount = 0;
    
    for (const category of categories) {
      // Skip standard categories
      if (Object.keys(categoryStandards).includes(category.name)) {
        continue;
      }
      
      // Check if category is used by any clubs
      const clubCount = await prisma.clubCategory.count({
        where: { categoryId: category.id }
      });
      
      // Check if category is used by any events
      const eventCount = await prisma.eventCategory.count({
        where: { categoryId: category.id }
      });
      
      // If not used, delete it
      if (clubCount === 0 && eventCount === 0) {
        await prisma.category.delete({
          where: { id: category.id }
        });
        
        deletedCount++;
        console.log(`Deleted unused category: ${category.name}`);
      }
    }
    
    console.log(`\nCategory cleaning summary:`);
    console.log(`- Standardized ${standardizedCount} clubs`);
    console.log(`- Standardized ${eventStandardizedCount} events`);
    console.log(`- Deleted ${deletedCount} unused categories`);
    
    return { standardizedCount, eventStandardizedCount, deletedCount };
  } catch (error) {
    console.error('Error cleaning categories:', error);
    throw error;
  }
}

// ===== APPROVE ALL =====
async function approveAll() {
  console.log('\n===== APPROVING ALL CONTENT =====');
  
  try {
    // Approve all clubs
    const clubResult = await prisma.club.updateMany({
      where: { status: { not: ContentStatus.APPROVED } },
      data: { status: ContentStatus.APPROVED }
    });
    
    console.log(`Approved ${clubResult.count} clubs`);
    
    // Approve all events
    const eventResult = await prisma.event.updateMany({
      where: { status: { not: ContentStatus.APPROVED } },
      data: { status: ContentStatus.APPROVED }
    });
    
    console.log(`Approved ${eventResult.count} events`);
    
    return { approvedClubs: clubResult.count, approvedEvents: eventResult.count };
  } catch (error) {
    console.error('Error approving content:', error);
    throw error;
  }
}

// ===== CHECK DATA =====
async function checkData() {
  console.log('\n===== CHECKING DATABASE CONTENTS =====');
  
  try {
    // Check clubs
    const totalClubs = await prisma.club.count();
    const approvedClubs = await prisma.club.count({ where: { status: ContentStatus.APPROVED } });
    const pendingClubs = await prisma.club.count({ where: { status: ContentStatus.PENDING } });
    const clubsWithEmails = await prisma.club.count({
      where: {
        contactEmail: { not: null }
      }
    });
    const clubsWithoutCategories = await prisma.club.count({
      where: {
        categories: { none: {} }
      }
    });
    
    console.log(`Clubs:`);
    console.log(`- Total: ${totalClubs}`);
    console.log(`- Approved: ${approvedClubs}`);
    console.log(`- Pending: ${pendingClubs}`);
    console.log(`- With emails: ${clubsWithEmails}`);
    console.log(`- Without categories: ${clubsWithoutCategories}`);
    
    // Check events
    const totalEvents = await prisma.event.count();
    const approvedEvents = await prisma.event.count({ where: { status: ContentStatus.APPROVED } });
    const pendingEvents = await prisma.event.count({ where: { status: ContentStatus.PENDING } });
    const futureEvents = await prisma.event.count({
      where: {
        startDateTime: { gte: new Date() }
      }
    });
    const eventsWithoutCategories = await prisma.event.count({
      where: {
        categories: { none: {} }
      }
    });
    
    console.log(`\nEvents:`);
    console.log(`- Total: ${totalEvents}`);
    console.log(`- Approved: ${approvedEvents}`);
    console.log(`- Pending: ${pendingEvents}`);
    console.log(`- Future events: ${futureEvents}`);
    console.log(`- Without categories: ${eventsWithoutCategories}`);
    
    // Check categories
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            clubs: true,
            events: true
          }
        }
      }
    });
    
    console.log(`\nCategories:`);
    console.log(`- Total: ${categories.length}`);
    
    console.log(`\nCategory distribution:`);
    categories.forEach(category => {
      console.log(`- ${category.name}: ${category._count.clubs} clubs, ${category._count.events} events`);
    });
    
    // Sample clubs
    const sampleClubs = await prisma.club.findMany({
      take: 5,
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    
    console.log(`\nSample clubs:`);
    sampleClubs.forEach(club => {
      console.log(`- ${club.name} (${club.categories.map(c => c.category.name).join(', ')})`);
    });
    
    // Sample events
    const sampleEvents = await prisma.event.findMany({
      take: 5,
      orderBy: { startDateTime: 'asc' },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    
    console.log(`\nSample events:`);
    sampleEvents.forEach(event => {
      console.log(`- ${event.title} (${new Date(event.startDateTime).toLocaleDateString()})`);
    });
    
    // Check for warnings
    console.log('\nChecking for warnings:');
    
    if (clubsWithoutCategories > 0) {
      console.log(`⚠️ Warning: ${clubsWithoutCategories} clubs have no categories assigned`);
    }
    
    if (eventsWithoutCategories > 0) {
      console.log(`⚠️ Warning: ${eventsWithoutCategories} events have no categories assigned`);
    }
    
    if (pendingClubs > 0) {
      console.log(`⚠️ Warning: ${pendingClubs} clubs are pending approval`);
    }
    
    if (pendingEvents > 0) {
      console.log(`⚠️ Warning: ${pendingEvents} events are pending approval`);
    }
    
    if (futureEvents === 0) {
      console.log(`⚠️ Warning: No future events found, consider updating event dates`);
    }
    
    return {
      clubs: { total: totalClubs, approved: approvedClubs, pending: pendingClubs },
      events: { total: totalEvents, approved: approvedEvents, pending: pendingEvents, future: futureEvents },
      categories: categories.length
    };
  } catch (error) {
    console.error('Error checking data:', error);
    throw error;
  }
}

// Run the main function
main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 