// src/app/api/events/[eventId]/rsvp/route.ts
import nextAuthOptionsConfig from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// Extend Session type inline to include user.id
type SessionWithId = Session & { user: Session['user'] & { id: string } };

interface RsvpParams {
  params: {
    eventId: string // from URL
  }
}

// POST /api/events/[eventId]/rsvp
export async function POST(request: Request, { params }: RsvpParams) {
  const session = (await getServerSession(nextAuthOptionsConfig)) as SessionWithId;
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { eventId } = params;

  // 2. Validate eventId
  if (!eventId || typeof eventId !== 'string') {
    return NextResponse.json({ message: 'Invalid event ID' }, { status: 400 });
  }

  try {
    // 3. Check event exists, is approved, and in the future
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        status: true,
        startDateTime: true,
      },
    });
    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }
    if (!['APPROVED', 'PENDING'].includes(event.status)) {
      return NextResponse.json({ message: 'Event is not open for RSVP' }, { status: 403 });
    }
    if (event.startDateTime <= new Date()) {
      return NextResponse.json({ message: 'Cannot RSVP to past events' }, { status: 400 });
    }

    // 5. Create the RSVP record
    const newRsvp = await prisma.rSVP.create({
      data: { userId, eventId },
    });
    return NextResponse.json(newRsvp, { status: 201 });
  } catch (error: any) {
    // 6. Handle unique constraint violation (already RSVP’d)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'You have already RSVPed to this event' },
        { status: 409 },
      );
    }
    console.error(`Failed to create RSVP for ${eventId}`, error);
    return NextResponse.json({ message: 'Failed to RSVP' }, { status: 500 });
  }
}

// DELETE /api/events/[eventId]/rsvp
export async function DELETE(request: Request, { params }: RsvpParams) {
  const session = (await getServerSession(nextAuthOptionsConfig)) as SessionWithId;
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { eventId } = params;

  if (!eventId || typeof eventId !== 'string') {
    return NextResponse.json({ message: 'Invalid event ID' }, { status: 400 });
  }

  try {
    // 3. Delete the RSVP record
    await prisma.rSVP.delete({
      where: { userId_eventId: { userId, eventId } },
    });
    // 5. Return 204 No Content on success
    return new Response(null, { status: 204 });
  } catch (error: any) {
    // 4. Handle case where RSVP doesn’t exist
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'RSVP not found' }, { status: 404 });
    }
    console.error(`Failed to delete RSVP for ${eventId}`, error);
    return NextResponse.json({ message: 'Failed to cancel RSVP' }, { status: 500 });
  }
}
