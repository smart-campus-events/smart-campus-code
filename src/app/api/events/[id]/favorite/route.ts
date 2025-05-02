import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import nextAuthOptionsConfig from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
// import type { Session } from 'next-auth';

// Type for session with user ID
// type SessionWithId = Session & { user: Session['user'] & { id: string } };

// POST /api/events/[id]/favorite - Add an event to user's favorites
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id: eventId } = params;

  // TEMPORARILY SKIPPING AUTHENTICATION
  // Get user session and verify authentication
  // const session = await getServerSession(nextAuthOptionsConfig) as SessionWithId;
  // if (!session?.user?.id) {
  //   return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  // }
  // const userId = session.user.id;

  // Temporary mock user ID for development
  // const userId = 'temp-user-id';

  try {
    // Check if the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // For now, we'll just return success without making actual database changes
    // since we're using a mock user
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: {
    //     favoriteEvents: {
    //       connect: { id: eventId },
    //     },
    //   },
    // });

    return NextResponse.json({ message: 'Event favorited successfully' });
  } catch (error) {
    console.error(`Error favoriting event ${eventId}:`, error);
    return NextResponse.json(
      { error: 'Failed to favorite event' },
      { status: 500 },
    );
  }
}

// DELETE /api/events/[id]/favorite - Remove an event from user's favorites
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id: eventId } = params;

  // TEMPORARILY SKIPPING AUTHENTICATION
  // Get user session and verify authentication
  // const session = await getServerSession(nextAuthOptionsConfig) as SessionWithId;
  // if (!session?.user?.id) {
  //   return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  // }
  // const userId = session.user.id;

  // Temporary mock user ID for development
  // const userId = 'temp-user-id';

  try {
    // Check if the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // For now, we'll just return success without making actual database changes
    // since we're using a mock user
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: {
    //     favoriteEvents: {
    //       disconnect: { id: eventId },
    //     },
    //   },
    // });

    return NextResponse.json({ message: 'Event unfavorited successfully' });
  } catch (error) {
    console.error(`Error unfavoriting event ${eventId}:`, error);
    return NextResponse.json(
      { error: 'Failed to unfavorite event' },
      { status: 500 },
    );
  }
}
