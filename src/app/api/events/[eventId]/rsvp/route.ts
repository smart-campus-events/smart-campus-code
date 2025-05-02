import nextAuthOptionsConfig from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// Extend Session type inline to include user.id
type SessionWithId = Session & { user: Session['user'] & { id: string } };

interface RsvpParams {
  params: {
    eventId: string; // Event ID from the URL path
  }
}

// POST /api/events/[eventId]/rsvp
// Creates an RSVP for the logged-in user for the specified event.
export async function POST(request: Request, { params }: RsvpParams) {
  // TODO:
  // 1. Get session and verify user is logged in.
  // 2. Validate eventId parameter.
  // 3. Check if the event exists and is approved.
  // 4. Check if the event is in the future (optional, prevent RSVP to past events).
  // 5. Create the RSVP record.
  // 6. Handle potential errors (already RSVP'd, event not found, etc.).
  // 7. Return success response.

  const session = (await getServerSession(nextAuthOptionsConfig)) as SessionWithId;
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { eventId } = params;
  const userId = session.user.id;

  // Basic validation
  if (!eventId) {
    return NextResponse.json({ message: 'Event ID is required' }, { status: 400 });
  }

  // Placeholder implementation
  try {
    // Optional: Check if event exists and is valid for RSVP
    /* const event = await prisma.event.findUnique({
         where: { id: eventId, status: 'APPROVED', date: { gte: new Date() } }
       });
       if (!event) {
         return NextResponse.json({ message: 'Event not found or not valid for RSVP' }, { status: 404 });
       }
    */

    const newRsvp = await prisma.rSVP.create({
      data: {
        userId,
        eventId,
      },
    });
    return NextResponse.json(newRsvp, { status: 201 }); // Return created RSVP
  } catch (error) { // Explicitly type error
    // Handle potential unique constraint violation (already RSVP'd)
    if (error instanceof Error && (error as any).code === 'P2002') { // Prisma unique constraint violation code
      return NextResponse.json({ message: 'User already RSVP\'d to this event' }, { status: 409 }); // 409 Conflict
    }
    console.error(`Failed to create RSVP for event ${eventId}:`, error);
    return NextResponse.json({ message: 'Failed to RSVP' }, { status: 500 });
  }
}

// DELETE /api/events/[eventId]/rsvp
// Removes the logged-in user's RSVP for the specified event.
export async function DELETE(request: Request, { params }: RsvpParams) {
  // TODO:
  // 1. Get session and verify user is logged in.
  // 2. Validate eventId parameter.
  // 3. Delete the RSVP record.
  // 4. Handle cases where the RSVP doesn't exist.
  // 5. Return success response (often 204 No Content).

  const session = (await getServerSession(nextAuthOptionsConfig)) as SessionWithId;
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { eventId } = params;
  const userId = session.user.id;

  if (!eventId) {
    return NextResponse.json({ message: 'Event ID is required' }, { status: 400 });
  }

  // Placeholder implementation
  try {
    await prisma.rSVP.delete({
      where: {
        userId_eventId: { // Use the unique composite key
          userId,
          eventId,
        },
      },
    });
    return new Response(null, { status: 204 }); // 204 No Content
  } catch (error) {
    // Handle case where record to delete doesn't exist (P2025)
    if (error instanceof Error && (error as any).code === 'P2025') {
      return NextResponse.json({ message: 'RSVP not found' }, { status: 404 });
    }
    console.error(`Failed to delete RSVP for event ${eventId}:`, error);
    return NextResponse.json({ message: 'Failed to cancel RSVP' }, { status: 500 });
  }
}
