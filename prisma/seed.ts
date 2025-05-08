/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable no-trailing-spaces */
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Function to easily hash passwords
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function main() {
  console.log('Start seeding ...');

  try {
    // --- 1. Seed Categories ---
    console.log('Seeding Categories...');
    const categoriesData = [
      { name: 'Academic' },
      { name: 'Arts & Music' },
      { name: 'Community Service' },
      { name: 'Cultural' },
      { name: 'Environmental' },
      { name: 'Gaming' },
      { name: 'Health & Wellness' },
      { name: 'Hobbies' },
      { name: 'Outdoors & Recreation' },
      { name: 'Political' },
      { name: 'Professional Development' },
      { name: 'Religious & Spiritual' },
      { name: 'Social' },
      { name: 'Sports' },
      { name: 'Technology' },
    ];

    for (const catData of categoriesData) {
      await prisma.category.upsert({
        where: { name: catData.name },
        update: {}, // No updates needed if it exists
        create: catData,
      });
      console.log(`Upserted category: ${catData.name}`);
    }
    
    // --- 2. Seed Users ---
    console.log('Seeding Users...');
    const adminPassword = await hashPassword('AdminPass123!');
    const userPassword = await hashPassword('UserPass123!');

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@hawaii.edu' },
      update: { isAdmin: true },
      create: {
        email: 'admin@hawaii.edu',
        username: 'admin_uh',
        password: adminPassword,
        role: 'ADMIN',
        isAdmin: true,
        name: 'Admin User',
        onboardingComplete: true,
      },
    });
    console.log(`Upserted admin user: ${adminUser.email} (ID: ${adminUser.id})`);

    const regularUser1 = await prisma.user.upsert({
      where: { email: 'testuser1@hawaii.edu' },
      update: {},
      create: {
        email: 'testuser1@hawaii.edu',
        username: 'testuser1',
        password: userPassword,
        name: 'Test User One',
        onboardingComplete: false, // Needs onboarding
        major: 'Computer Science',
        graduationYear: 2025,
      },
    });
    console.log(`Upserted regular user: ${regularUser1.email} (ID: ${regularUser1.id})`);

    // Example Google User (no password)
    const googleUser = await prisma.user.upsert({
      where: { email: 'googleuser@gmail.com' },
      update: {},
      create: {
        email: 'googleuser@gmail.com',
        googleId: 'google-oauth-id-12345', // Example Google ID
        name: 'Google User Name',
        avatarUrl: 'https://lh3.googleusercontent.com/a/example-avatar-url', // Example avatar
        emailVerified: new Date(),
        onboardingComplete: true,
        major: 'Biology',
        graduationYear: 2026,
      },
    });
    console.log(`Upserted google user: ${googleUser.email} (ID: ${googleUser.id})`);
    
    // Get categories for user interests
    const techCategory = await prisma.category.findFirst({ where: { name: 'Technology' } });
    const gamingCategory = await prisma.category.findFirst({ where: { name: 'Gaming' } });
    const sportsCategory = await prisma.category.findFirst({ where: { name: 'Sports' } });
    const outdoorsCategory = await prisma.category.findFirst({ where: { name: 'Outdoors & Recreation' } });

    // --- 3. Seed User Interests ---
    console.log('Seeding User Interests...');
    if (techCategory) {
      await prisma.userInterest.upsert({
        where: { userId_categoryId: { userId: regularUser1.id, categoryId: techCategory.id } },
        update: {},
        create: { userId: regularUser1.id, categoryId: techCategory.id },
      });
    }
    if (gamingCategory) {
      await prisma.userInterest.upsert({
        where: { userId_categoryId: { userId: regularUser1.id, categoryId: gamingCategory.id } },
        update: {},
        create: { userId: regularUser1.id, categoryId: gamingCategory.id },
      });
    }
    // Mark regularUser1 as onboarded now that interests are added
    await prisma.user.update({ where: { id: regularUser1.id }, data: { onboardingComplete: true } });

    if (sportsCategory) {
      await prisma.userInterest.upsert({
        where: { userId_categoryId: { userId: googleUser.id, categoryId: sportsCategory.id } },
        update: {},
        create: { userId: googleUser.id, categoryId: sportsCategory.id },
      });
    }
    if (outdoorsCategory) {
      await prisma.userInterest.upsert({
        where: { userId_categoryId: { userId: googleUser.id, categoryId: outdoorsCategory.id } },
        update: {},
        create: { userId: googleUser.id, categoryId: outdoorsCategory.id },
      });
    }
    console.log('Finished seeding User Interests.');

    // --- 4. Seed Clubs ---
    console.log('Seeding Clubs...');
    const club1 = await prisma.club.upsert({
      where: { name: 'Computer Science Club' },
      update: { status: 'APPROVED' },
      create: {
        name: 'Computer Science Club',
        purpose: 'A club for computer science students to network, learn, and collaborate on projects.',
        contactEmail: 'cs@hawaii.edu',
        websiteUrl: 'https://example.com/csclub',
        status: 'APPROVED',
        submittedByUserId: adminUser.id,
      },
    });
    console.log(`Upserted club: ${club1.name} (ID: ${club1.id})`);

    const club2 = await prisma.club.upsert({
      where: { name: 'Outdoor Adventure Club' },
      update: { status: 'APPROVED' },
      create: {
        name: 'Outdoor Adventure Club',
        purpose: 'Organizes outdoor activities and adventures for students.',
        contactEmail: 'outdoor@hawaii.edu',
        status: 'APPROVED',
        submittedByUserId: adminUser.id,
      },
    });
    console.log(`Upserted club: ${club2.name} (ID: ${club2.id})`);

    // --- 5. Seed Club Categories ---
    console.log('Seeding Club Categories...');
    if (techCategory) {
      await prisma.clubCategory.upsert({
        where: { clubId_categoryId: { clubId: club1.id, categoryId: techCategory.id } },
        update: {},
        create: { clubId: club1.id, categoryId: techCategory.id },
      });
    }
    if (outdoorsCategory) {
      await prisma.clubCategory.upsert({
        where: { clubId_categoryId: { clubId: club2.id, categoryId: outdoorsCategory.id } },
        update: {},
        create: { clubId: club2.id, categoryId: outdoorsCategory.id },
      });
    }
    console.log('Finished seeding Club Categories.');

    // --- 6. Seed Events ---
    console.log('Seeding Events...');

    // Helper function to create dates relative to current date
    const daysFromNow = (days: number): Date => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date;
    };

    // Tech workshop event
    const event1 = await prisma.event.create({
      data: {
        title: 'Introduction to Web Development',
        description: 'Learn the basics of HTML, CSS, and JavaScript in this beginner-friendly workshop.',
        startDateTime: daysFromNow(7),
        endDateTime: daysFromNow(7),
        attendanceType: 'IN_PERSON',
        location: 'POST Building Room 318',
        organizerSponsor: 'Computer Science Club',
        contactEmail: 'cs@hawaii.edu',
        organizerClubId: club1.id,
        status: 'APPROVED',
        submittedByUserId: adminUser.id,
      },
    });
    console.log(`Created event: ${event1.title} (ID: ${event1.id})`);

    // Hiking event
    const event2 = await prisma.event.create({
      data: {
        title: 'Hiking: Manoa Falls Trail',
        description: 'Join us for a beginner-friendly hike to Manoa Falls. Meet at the trailhead. Bring water, good shoes, and sun protection!',
        startDateTime: daysFromNow(4),
        endDateTime: daysFromNow(4),
        attendanceType: 'IN_PERSON',
        location: 'Manoa Falls Trailhead',
        organizerSponsor: 'Outdoor Adventure Club',
        contactEmail: 'outdoor@hawaii.edu',
        organizerClubId: club2.id,
        status: 'APPROVED',
        submittedByUserId: adminUser.id,
      },
    });
    console.log(`Created event: ${event2.title} (ID: ${event2.id})`);

    // --- 7. Seed Event Categories ---
    console.log('Seeding Event Categories...');
    const academicCategory = await prisma.category.findFirst({ where: { name: 'Academic' } });
    
    if (techCategory && academicCategory) {
      // Web Dev workshop gets both Tech and Academic categories
      await prisma.eventCategory.create({
        data: { eventId: event1.id, categoryId: techCategory.id },
      });
      await prisma.eventCategory.create({
        data: { eventId: event1.id, categoryId: academicCategory.id },
      });
    }
    
    if (outdoorsCategory) {
      // Hiking event gets Outdoors category
      await prisma.eventCategory.create({
        data: { eventId: event2.id, categoryId: outdoorsCategory.id },
      });
    }
    console.log('Finished seeding Event Categories.');

    // --- 8. Seed RSVPs ---
    console.log('Seeding RSVPs...');
    // googleUser RSVPs to the hike
    await prisma.rSVP.upsert({
      where: { userId_eventId: { userId: googleUser.id, eventId: event2.id } },
      update: {},
      create: { userId: googleUser.id, eventId: event2.id },
    });
    // regularUser1 RSVPs to the Web Dev workshop
    await prisma.rSVP.upsert({
      where: { userId_eventId: { userId: regularUser1.id, eventId: event1.id } },
      update: {},
      create: { userId: regularUser1.id, eventId: event1.id },
    });
    console.log('Finished seeding RSVPs.');

    // --- 9. Seed Club Followers ---
    console.log('Seeding Club Followers...');
    // Google user follows Outdoor Adventure Club
    await prisma.user.update({
      where: { id: googleUser.id },
      data: {
        followedClubs: {
          connect: { id: club2.id },
        },
      },
    });
    
    // Regular user follows both clubs
    await prisma.user.update({
      where: { id: regularUser1.id },
      data: {
        followedClubs: {
          connect: [{ id: club1.id }, { id: club2.id }],
        },
      },
    });
    console.log('Finished seeding Club Followers.');

    console.log('Seeding finished successfully.');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Disconnecting Prisma Client...');
    await prisma.$disconnect();
  });