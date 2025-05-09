import nextAuthOptionsConfig from '@/lib/authOptions';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma'; // Assuming prisma might be needed for validation

export const dynamic = 'force-dynamic';

// Extend Session type inline to include user.id
type SessionWithId = Session & { user: Session['user'] & { id: string } };

// POST /api/user/interests
// Saves or updates the interests for the logged-in user.
// eslint-disable-next-line import/prefer-default-export
export async function POST(request: Request) {
  // TODO:
  // 1. Get session and verify user is logged in.
  // 2. Parse the request body (expecting an array of category IDs).
  // 3. Validate the category IDs.
  // 4. Use Prisma transaction to:
  //    a. Delete existing UserInterest records for this user.
  //    b. Create new UserInterest records for the submitted category IDs.
  // 5. Update the user's `onboardingComplete` status to true.
  // 6. Handle errors.
  // 7. Return success response.

  // 1. Get session and verify user is logged in.
  const session = (await getServerSession(nextAuthOptionsConfig)) as SessionWithId;
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Placeholder implementation
  try {
    // 2. Parse the request body (expecting an array of category IDs).
    const body = await request.json();
    const categoryIds = body.categoryIds as string[]; // Basic type assertion

    // 3. Validate the category IDs.
    if (!Array.isArray(categoryIds)) {
      return NextResponse.json(
        { message: 'Invalid input: categoryIds must be an array' },
        { status: 400 },
      );
    }

    // 4. Use Prisma transaction to:
    //    a. Delete existing UserInterest records for this user.
    //    b. Create new UserInterest records for the submitted category IDs.
    // 5. Update the user's `onboardingComplete` status to true.
    // --- Start Transaction --- (Example, needs proper implementation)
    // await prisma.$transaction(async (tx) => {
    //   await tx.userInterest.deleteMany({ where: { userId: session.user.id } });
    //   await tx.userInterest.createMany({
    //     data: categoryIds.map(catId => ({ userId: session.user.id, categoryId: catId }))
    //   });
    //   await tx.user.update({ where: { id: session.user.id }, data: { onboardingComplete: true } });
    // });
    // --- End Transaction ---

    console.log(`TODO: Save interests for user ${session.user.id}:`, categoryIds);
    // TODO: Implement the actual transaction logic

    // 7. Return success response.
    return NextResponse.json(
      { message: 'Interests saved successfully (placeholder)' },
      { status: 200 },
    );
  } catch (error) {
    // 6. Handle errors.
    console.error('Failed to save user interests:', error);
    return NextResponse.json(
      { message: 'Failed to save interests' },
      { status: 500 },
    );
  }
}
