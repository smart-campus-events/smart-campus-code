/**
 * Script to add sample events to the database
 */

const { PrismaClient, ContentStatus, AttendanceType } = require('@prisma/client');
const prisma = new PrismaClient();

// Sample events data
const sampleEvents = [
  {
    title: "Tech Startup Workshop",
    description: "Learn how to launch your own tech startup with guidance from successful entrepreneurs.",
    startDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    endDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours after start
    location: "Shidler College of Business, Room 101",
    attendanceType: AttendanceType.IN_PERSON,
    organizerSponsor: "UH Entrepreneurship Program",
    contactName: "John Smith",
    contactEmail: "jsmith@hawaii.edu",
    categories: ["Academic", "Leisure/Recreational"],
  },
  {
    title: "Hawaiian Culture Workshop",
    description: "Immerse yourself in Hawaiian culture through this interactive workshop featuring traditional practices and language.",
    startDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    endDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours after start
    location: "Hawaiian Studies Building",
    attendanceType: AttendanceType.IN_PERSON,
    organizerSponsor: "Hawaiian Studies Department",
    contactName: "Leilani Kealoha",
    contactEmail: "lkealoha@hawaii.edu",
    categories: ["Cultural & Ethnic"],
  },
  {
    title: "Virtual Career Fair",
    description: "Connect with employers hiring UH Manoa students and graduates. Prepare your resume and explore job opportunities.",
    startDateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    endDateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 6 hours after start
    location: "Online via Zoom",
    locationVirtualUrl: "https://hawaii.zoom.us/j/123456789",
    attendanceType: AttendanceType.ONLINE,
    organizerSponsor: "UH Manoa Career Center",
    contactName: "Michael Johnson",
    contactEmail: "mjohnson@hawaii.edu",
    categories: ["Academic", "Service"],
  },
  {
    title: "Rainbow Warriors Basketball Game",
    description: "Come support the UH Manoa men's basketball team in their game against UC Santa Barbara.",
    startDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    endDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000), // 2.5 hours after start
    location: "Stan Sheriff Center",
    attendanceType: AttendanceType.IN_PERSON,
    organizerSponsor: "UH Athletics",
    contactName: "Athletics Department",
    contactEmail: "athletics@hawaii.edu",
    categories: ["Sports"],
  },
  {
    title: "Environmental Sustainability Conference",
    description: "Join environmental experts and advocates to discuss strategies for a more sustainable future in Hawaii.",
    startDateTime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    endDateTime: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000), // 2 days event
    location: "Campus Center Ballroom",
    attendanceType: AttendanceType.HYBRID,
    locationVirtualUrl: "https://hawaii.zoom.us/j/987654321",
    organizerSponsor: "Office of Sustainability",
    contactName: "Sarah Green",
    contactEmail: "sgreen@hawaii.edu",
    categories: ["Academic", "Service"],
  },
  {
    title: "Volunteer Beach Cleanup",
    description: "Help keep our beaches clean! Join us for a community beach cleanup event at Ala Moana Beach Park.",
    startDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    endDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours after start
    location: "Ala Moana Beach Park",
    attendanceType: AttendanceType.IN_PERSON,
    organizerSponsor: "Sustainability Club",
    contactName: "David Wong",
    contactEmail: "dwong@hawaii.edu",
    categories: ["Service", "Leisure/Recreational"],
  },
  {
    title: "Polynesian Dance Workshop",
    description: "Learn traditional Polynesian dance techniques from experienced instructors.",
    startDateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago (past event)
    endDateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours after start
    location: "Kennedy Theatre",
    attendanceType: AttendanceType.IN_PERSON,
    organizerSponsor: "Department of Theatre and Dance",
    contactName: "Emma Patel",
    contactEmail: "epatel@hawaii.edu",
    categories: ["Cultural & Ethnic", "Leisure/Recreational"],
  },
  {
    title: "Cybersecurity Webinar",
    description: "Learn about the latest trends in cybersecurity and how to protect your digital assets.",
    startDateTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago (past event)
    endDateTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000), // 1.5 hours after start
    location: "Online via Microsoft Teams",
    locationVirtualUrl: "https://teams.microsoft.com/l/meetup-join/123456789",
    attendanceType: AttendanceType.ONLINE,
    organizerSponsor: "Information and Computer Sciences Department",
    contactName: "Robert Chen",
    contactEmail: "rchen@hawaii.edu",
    categories: ["Academic"],
  },
];

// Function to add an event to the database
async function addEvent(eventData) {
  try {
    // Get category IDs
    const categoryPromises = eventData.categories.map(async (categoryName) => {
      const category = await prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName },
      });
      return category.id;
    });
    
    const categoryIds = await Promise.all(categoryPromises);
    
    // Create the event
    const event = await prisma.event.create({
      data: {
        title: eventData.title,
        description: eventData.description,
        startDateTime: eventData.startDateTime,
        endDateTime: eventData.endDateTime,
        location: eventData.location,
        locationVirtualUrl: eventData.locationVirtualUrl || null,
        attendanceType: eventData.attendanceType,
        organizerSponsor: eventData.organizerSponsor,
        contactName: eventData.contactName,
        contactEmail: eventData.contactEmail,
        status: ContentStatus.APPROVED,
        categories: {
          create: categoryIds.map(categoryId => ({
            categoryId,
          })),
        },
      },
    });
    
    console.log(`Added event: ${eventData.title}`);
    return event;
  } catch (error) {
    console.error(`Error adding event ${eventData.title}:`, error);
    return null;
  }
}

// Main function
async function main() {
  console.log('Adding sample events to the database...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const eventData of sampleEvents) {
    const result = await addEvent(eventData);
    if (result) successCount++;
    else errorCount++;
  }
  
  console.log('\nSummary:');
  console.log(`- Events added successfully: ${successCount}`);
  console.log(`- Errors: ${errorCount}`);
  console.log('Done!');
}

// Run the script
main()
  .catch((e) => {
    console.error('Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 