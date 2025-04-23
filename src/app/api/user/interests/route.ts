import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import nextAuthOptionsConfig from '@/lib/authOptions';
// import { prisma } from '@/lib/prisma'; // Assuming prisma might be needed for validation

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

  const session = await getServerSession(nextAuthOptionsConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Placeholder implementation
  try {
    const body = await request.json();
    const categoryIds = body.categoryIds as string[]; // Basic type assertion

    if (!Array.isArray(categoryIds)) {
      return NextResponse.json({ message: 'Invalid input: categoryIds must be an array' }, { status: 400 });
    }

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

    return NextResponse.json({ message: 'Interests saved successfully (placeholder)' }, { status: 200 });
  } catch (error) {
    console.error('Failed to save user interests:', error);
    return NextResponse.json({ message: 'Failed to save interests' }, { status: 500 });
  }
}
