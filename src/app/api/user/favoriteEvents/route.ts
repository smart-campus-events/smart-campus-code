import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

// Type for session with user ID
type SessionWithId = Session & { user: Session['user'] & { id: string } };

// GET /api/user/favoriteEvents - Get all events favorited by the current user
export async function GET(_request: NextRequest) {
  // TEMPORARILY SKIPPING AUTHENTICATION
  // Get user session and verify authentication
  // const session = await getServerSession(nextAuthOptionsConfig) as SessionWithId;
  // if (!session?.user?.id) {
  //   return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  // }
  // const userId = session.user.id;

  // Use localStorage-based favorites (client-side storage)
  // For the API, just return an empty array since we'll handle favorites in the frontend

  try {
    // Return favorite event IDs (will be stored in browser localStorage in frontend)
    // In a real implementation, this would fetch from the database
    return NextResponse.json({ favoriteEventIds: [] });
  } catch (error) {
    console.error('Error fetching user favorite events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorite events' },
      { status: 500 },
    );
  }
}
