import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import nextAuthOptionsConfig from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

// GET /api/user/profile
// Retrieves profile information for the logged-in user.
// eslint-disable-next-line import/prefer-default-export
export async function GET(/* request: Request */) {
  // TODO:
  // 1. Get session and verify user is logged in.
  // 2. Fetch user data from DB, including relations like interests.
  // 3. Handle user not found.
  // 4. Return user profile data (excluding sensitive info like password).

  const session = await getServerSession(nextAuthOptionsConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Placeholder implementation
  try {
    const userProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { // Select only the necessary fields to return
        id: true,
        email: true,
        username: true,
        name: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        major: true,
        graduationYear: true,
        origin: true,
        housingStatus: true,
        comfortLevel: true,
        onboardingComplete: true,
        emailNotifications: true,
        role: true,
        isAdmin: true,
        createdAt: true,
        interests: { // Include selected interest categories
          select: {
            category: {
              select: { id: true, name: true },
            },
          },
        },
        // Exclude password, googleId, accounts, sessions etc.
      },
    });

    if (!userProfile) {
      return NextResponse.json({ message: 'User profile not found' }, { status: 404 });
    }

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return NextResponse.json({ message: 'Failed to fetch profile' }, { status: 500 });
  }
}

// Optional: Add PUT handler for updating profile if needed
