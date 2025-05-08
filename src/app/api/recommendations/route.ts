import nextAuthOptionsConfig from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
// Import Prisma utility types
import { Prisma } from '@prisma/client';

// Extend Session type inline to include user.id
type SessionWithId = Session & { user: Session['user'] & { id: string } };

// Define types based on Prisma query arguments
const clubArgs = {
  include: {
    categories: { select: { category: { select: { name: true } } } },
  },
};
type RecommendedClub = Prisma.ClubGetPayload<typeof clubArgs>;

const eventArgs = {
  include: {
    categories: { select: { category: { select: { name: true } } } },
    hostClub: { select: { name: true } },
  },
  orderBy: { startDateTime: 'asc' as const }, // Use 'as const' for stricter typing on orderBy
};
type RecommendedEvent = Prisma.EventGetPayload<typeof eventArgs>;

// GET /api/recommendations
// Fetches recommended clubs and events for the logged-in user.
// eslint-disable-next-line import/prefer-default-export
export async function GET(/* request: Request */) {
  // TODO:
  // 1. Get session and verify user is logged in.
  // 2. Get user's interest category IDs from UserInterest table.
  // 3. Query for APPROVED clubs matching user interests.
  //    - Exclude clubs user already follows?
  //    - Limit results.
  // 4. Query for upcoming APPROVED events matching user interests.
  //    - Exclude events user already RSVP'd to?
  //    - Limit results.
  // 5. Implement fallback logic if user has no interests or few matches (e.g., popular/new items).
  // 6. Return structured response { recommendedClubs: [...], recommendedEvents: [...] }.

  const session = (await getServerSession(nextAuthOptionsConfig)) as SessionWithId;
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  // Placeholder implementation
  try {
    // Step 1: Get User Interest IDs (Example)
    const userInterests = await prisma.userInterest.findMany({
      where: { userId },
      select: { categoryId: true },
    });
    const userInterestCategoryIds = userInterests.map(i => i.categoryId);

    // Explicitly type the arrays using types derived from args
    let recommendedClubs: RecommendedClub[] = [];
    let recommendedEvents: RecommendedEvent[] = [];

    if (userInterestCategoryIds.length > 0) {
      // Step 2: Find matching Clubs (Example)
      recommendedClubs = await prisma.club.findMany({
        where: {
          status: 'APPROVED',
          categories: { some: { categoryId: { in: userInterestCategoryIds } } },
          // Optional: favoritedBy: { none: { id: userId } }
        },
        include: clubArgs.include,
        take: 5, // Limit results
      });

      // Step 3: Find matching Events (Example)
      recommendedEvents = await prisma.event.findMany({
        where: {
          status: 'APPROVED',
          startDateTime: { gte: new Date() },
          categories: { some: { categoryId: { in: userInterestCategoryIds } } },
          rsvps: { none: { userId } },
          // Optional: rsvps: { none: { userId: userId } }
        },
        include: eventArgs.include,
        orderBy: eventArgs.orderBy,
        take: 5, // Limit results
      });
    } else {
      // TODO: Implement fallback logic for users with no interests
      // e.g., fetch most recent/popular clubs/events
      console.log('User has no interests, implementing fallback...');
    }

    return NextResponse.json({ recommendedClubs, recommendedEvents });
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
    return NextResponse.json({ message: 'Failed to fetch recommendations' }, { status: 500 });
  }
}
