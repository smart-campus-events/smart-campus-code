// prisma/seed.ts
import { PrismaClient, Role, ContentStatus, Category } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Function to easily hash passwords
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function main() {
  console.log('Start seeding ...');

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

  const createdCategories: Category[] = [];
  for (const catData of categoriesData) {
    const category = await prisma.category.upsert({
      where: { name: catData.name },
      update: {}, // No updates needed if it exists
      create: catData,
    });
    createdCategories.push(category);
    console.log(`Upserted category: ${category.name} (ID: ${category.id})`);
  }
  // Helper to find category ID by name
  const getCategoryId = (name: string) => createdCategories.find(c => c.name === name)?.id;

  // --- 2. Seed Users ---
  console.log('Seeding Users...');
  const adminPassword = await hashPassword('AdminPass123!');
  const userPassword = await hashPassword('UserPass123!');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hawaii.edu' },
    update: { role: Role.ADMIN, isAdmin: true },
    create: {
      email: 'admin@hawaii.edu',
      username: 'admin_uh',
      password: adminPassword,
      role: Role.ADMIN,
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

  // --- 3. Seed User Interests ---
  console.log('Seeding User Interests...');
  const techCategoryId = getCategoryId('Technology');
  const gamingCategoryId = getCategoryId('Gaming');
  const sportsCategoryId = getCategoryId('Sports');
  const outdoorsCategoryId = getCategoryId('Outdoors & Recreation');

  if (techCategoryId) {
    await prisma.userInterest.upsert({
      where: { userId_categoryId: { userId: regularUser1.id, categoryId: techCategoryId } },
      update: {}, create: { userId: regularUser1.id, categoryId: techCategoryId },
    });
  }
  if (gamingCategoryId) {
    await prisma.userInterest.upsert({
      where: { userId_categoryId: { userId: regularUser1.id, categoryId: gamingCategoryId } },
      update: {}, create: { userId: regularUser1.id, categoryId: gamingCategoryId },
    });
  }
  // Mark regularUser1 as onboarded now that interests are added
  await prisma.user.update({ where: { id: regularUser1.id }, data: { onboardingComplete: true } });

  if (sportsCategoryId) {
    await prisma.userInterest.upsert({
      where: { userId_categoryId: { userId: googleUser.id, categoryId: sportsCategoryId } },
      update: {}, create: { userId: googleUser.id, categoryId: sportsCategoryId },
    });
  }
  if (outdoorsCategoryId) {
    await prisma.userInterest.upsert({
      where: { userId_categoryId: { userId: googleUser.id, categoryId: outdoorsCategoryId } },
      update: {}, create: { userId: googleUser.id, categoryId: outdoorsCategoryId },
    });
  }
  console.log('Finished seeding User Interests.');

  // --- 4. Seed Clubs ---
  console.log('Seeding Clubs...');
  const club1 = await prisma.club.upsert({
    where: { name: 'ACM Manoa' },
    update: { status: ContentStatus.APPROVED }, // Ensure approved if exists
    create: {
      name: 'ACM Manoa',
      purpose: 'Association for Computing Machinery student chapter at UH Manoa. Focuses on technology workshops, networking, and projects.',
      contactEmail: 'acmmanoa@hawaii.edu',
      websiteUrl: 'https://acmmanoa.org',
      status: ContentStatus.APPROVED,
      submittedByUserId: adminUser.id, // Submitted by admin
    },
  });
  console.log(`Upserted club: ${club1.name} (ID: ${club1.id})`);

  const club2 = await prisma.club.upsert({
    where: { name: 'Hiking Club Manoa' },
    update: { status: ContentStatus.APPROVED },
    create: {
      name: 'Hiking Club Manoa',
      purpose: 'Organizes group hikes around Oahu for students of all skill levels.',
      contactEmail: 'hike@hawaii.edu',
      status: ContentStatus.APPROVED,
      submittedByUserId: adminUser.id,
    },
  });
  console.log(`Upserted club: ${club2.name} (ID: ${club2.id})`);

  const pendingClub = await prisma.club.upsert({
    where: { name: 'Manoa Board Gamers' },
    update: {}, // Don't change status if it exists
    create: {
      name: 'Manoa Board Gamers',
      purpose: 'A casual club for playing board games, card games, and RPGs.',
      contactEmail: 'gamer@hawaii.edu',
      status: ContentStatus.PENDING,
      submittedByUserId: regularUser1.id, // Submitted by regular user
    },
  });
  console.log(`Upserted PENDING club: ${pendingClub.name} (ID: ${pendingClub.id})`);

  // --- 5. Seed Club Categories ---
  console.log('Seeding Club Categories...');
  if (techCategoryId) {
    await prisma.clubCategory.upsert({
      where: { clubId_categoryId: { clubId: club1.id, categoryId: techCategoryId } },
      update: {}, create: { clubId: club1.id, categoryId: techCategoryId },
    });
  }
  if (outdoorsCategoryId) {
    await prisma.clubCategory.upsert({
      where: { clubId_categoryId: { clubId: club2.id, categoryId: outdoorsCategoryId } },
      update: {}, create: { clubId: club2.id, categoryId: outdoorsCategoryId },
    });
  }
  if (gamingCategoryId) {
    await prisma.clubCategory.upsert({
      where: { clubId_categoryId: { clubId: pendingClub.id, categoryId: gamingCategoryId } },
      update: {}, create: { clubId: pendingClub.id, categoryId: gamingCategoryId },
    });
  }
  console.log('Finished seeding Club Categories.');

  // --- 6. Seed Events ---
  console.log('Seeding Events...');
  const event1 = await prisma.event.create({
    data: {
      title: 'ACM Workshop: Intro to Git',
      description: 'Learn the basics of version control with Git and GitHub.',
      startDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      endDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
      location: 'POST Building 318B',
      organizerClubId: club1.id, // Hosted by ACM Manoa
      status: ContentStatus.APPROVED,
      submittedByUserId: adminUser.id,
    },
  });
  console.log(`Created event: ${event1.title} (ID: ${event1.id})`);

  const event2 = await prisma.event.create({
    data: {
      title: 'Manoa Falls Trail Hike',
      description: 'Join us for a refreshing hike to Manoa Falls! Meet at the trailhead.',
      startDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      location: 'Manoa Falls Trailhead',
      organizerClubId: club2.id, // Hosted by Hiking Club
      status: ContentStatus.APPROVED,
      submittedByUserId: adminUser.id,
    },
  });
  console.log(`Created event: ${event2.title} (ID: ${event2.id})`);

  const pendingEvent = await prisma.event.create({
    data: {
      title: 'Board Game Night - Settlers of Catan',
      description: 'Casual game night featuring Settlers of Catan.',
      startDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      location: 'Campus Center',
      status: ContentStatus.PENDING,
      submittedByUserId: regularUser1.id,
      // Not associated with a club yet, admin could add it
    },
  });
  console.log(`Created PENDING event: ${pendingEvent.title} (ID: ${pendingEvent.id})`);

  // --- 7. Seed Event Categories ---
  console.log('Seeding Event Categories...');
  if (techCategoryId) {
    await prisma.eventCategory.upsert({
      where: { eventId_categoryId: { eventId: event1.id, categoryId: techCategoryId } },
      update: {}, create: { eventId: event1.id, categoryId: techCategoryId },
    });
  }
  if (outdoorsCategoryId) {
    await prisma.eventCategory.upsert({
      where: { eventId_categoryId: { eventId: event2.id, categoryId: outdoorsCategoryId } },
      update: {}, create: { eventId: event2.id, categoryId: outdoorsCategoryId },
    });
  }
  if (gamingCategoryId) {
    await prisma.eventCategory.upsert({
      where: { eventId_categoryId: { eventId: pendingEvent.id, categoryId: gamingCategoryId } },
      update: {}, create: { eventId: pendingEvent.id, categoryId: gamingCategoryId },
    });
  }
  console.log('Finished seeding Event Categories.');

  // --- 8. Seed RSVPs ---
  console.log('Seeding RSVPs...');
  // googleUser RSVPs to the hike
  await prisma.rSVP.upsert({
    where: { userId_eventId: { userId: googleUser.id, eventId: event2.id } },
    update: {}, create: { userId: googleUser.id, eventId: event2.id },
  });
  // regularUser1 RSVPs to the Git workshop
  await prisma.rSVP.upsert({
    where: { userId_eventId: { userId: regularUser1.id, eventId: event1.id } },
    update: {}, create: { userId: regularUser1.id, eventId: event1.id },
  });
  console.log('Finished seeding RSVPs.');

  // --- 9. Seed Club Followers ---
  console.log('Seeding Club Followers...');
  // Use connect for many-to-many relation update
  await prisma.user.update({
    where: { id: googleUser.id },
    data: {
      followedClubs: {
        connect: { id: club2.id }, // Google user follows Hiking Club
      },
    },
  });
  await prisma.user.update({
    where: { id: regularUser1.id },
    data: {
      followedClubs: {
        connect: [{ id: club1.id }, { id: club2.id }], // Regular user follows ACM and Hiking
      },
    },
  });
  console.log('Finished seeding Club Followers.');

  console.log('Seeding finished successfully.');
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
