import { NextResponse } from 'next/server';
import { ContentStatus } from '@prisma/client'; // Import the enum
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import nextAuthOptionsConfig from '@/lib/authOptions';

// Utility to check if user is admin
async function isAdminUser(): Promise<boolean> {
  const session = (await getServerSession(nextAuthOptionsConfig)) as Session;
  return session?.user?.isAdmin === true;
}

// Validate if the provided status is a valid ContentStatus enum value
function isValidContentStatus(status: any): status is ContentStatus {
  return Object.values(ContentStatus).includes(status);
}

// PATCH /api/admin/events/[eventId]/status
// Updates the status of a specific event.
// eslint-disable-next-line import/prefer-default-export
export async function PATCH(
  request: Request,
  { params: { eventId } }: { params: { eventId: string } },
) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const newStatus = body.status as ContentStatus;

    if (!eventId) {
      return NextResponse.json({ message: 'Event ID is required' }, { status: 400 });
    }

    if (!newStatus || !isValidContentStatus(newStatus)) {
      return NextResponse.json({ message: 'Invalid or missing status provided. Must be one of: PENDING, APPROVED, REJECTED' }, { status: 400 });
    }

    // Check if event exists (optional but good practice)
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    // Update the event status
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { status: newStatus },
    });

    console.log(`Admin updated event ${eventId} status to ${newStatus}`);
    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to update status for event ${eventId}:`, error);
    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update event status', error: error.message }, { status: 500 });
  }
}
