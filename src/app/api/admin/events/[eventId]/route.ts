import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { ContentStatus } from '@prisma/client'; // Ensure this is imported
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

function isValidAttendanceType(attendanceType: any): boolean {
  const validAttendanceTypes = ['IN_PERSON', 'VIRTUAL', 'HYBRID'];
  return validAttendanceTypes.includes(attendanceType);
}

// GET /api/admin/events/[eventId]
// Fetches details for a single event.
export async function GET(
  request: Request,
  { params: { eventId } }: { params: { eventId: string } },
) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!eventId) {
    return NextResponse.json({ message: 'Event ID is required' }, { status: 400 });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        categories: {
          select: {
            categoryId: true,
          },
        },
        organizerClub: {
          select: {
            id: true,
            name: true,
          },
        },
        // If you also fetch submittedBy info, handle it here
        // submittedBy: { select: { id: true, name: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    const eventToReturn: any = {
      ...event,
      categoryIds: event.categories.map(ec => ec.categoryId),
    };
    delete eventToReturn.categories;

    return NextResponse.json(eventToReturn, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to fetch event ${eventId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch event details', error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params: { eventId } }: { params: { eventId: string } },
) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!eventId) {
    return NextResponse.json({ message: 'Event ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();

    // --- Basic Validation ---
    if (body.title !== undefined && (typeof body.title !== 'string' || body.title.trim() === '')) {
      return NextResponse.json({ message: 'Event title cannot be empty if provided.' }, { status: 400 });
    }
    let start = null;
    if (body.startDateTime) {
      start = new Date(body.startDateTime);
      if (Number.isNaN(start.getTime())) {
        return NextResponse.json({ message: 'Invalid start date/time provided.' }, { status: 400 });
      }
    }
    let end = null;
    if (body.endDateTime) {
      end = new Date(body.endDateTime);
      if (Number.isNaN(end.getTime())) {
        return NextResponse.json({ message: 'Invalid end date/time provided.' }, { status: 400 });
      }
    }
    if (start && end && start > end) {
      return NextResponse.json({ message: 'End date/time cannot be before start date/time.' }, { status: 400 });
    }
    if (body.attendanceType && !isValidAttendanceType(body.attendanceType)) {
      return NextResponse.json({ message: 'Invalid attendance type provided.' }, { status: 400 });
    }
    if (body.status && !isValidContentStatus(body.status)) {
      return NextResponse.json({ message: 'Invalid status provided.' }, { status: 400 });
    }
    // -----------------------

    // Destructure fields from body.
    // Explicitly pull out fields that are handled specially (relations, or fields not to be updated).
    const {
      categoryIds, // For categories relation
      organizerClubId, // For organizerClub relation
      submittedByUserId, // Field to IGNORE during update
      submittedBy, // Relation object to IGNORE during update (if sent)
      // Potentially other fields like 'createdAt', 'updatedAt' if client sends them
      createdAt,
      updatedAt,
      ...otherEventData // The rest of the fields that are safe to update directly
    } = body;

    const updateData: any = {
      ...otherEventData, // Spread the safe, updatable fields
    };

    if (start) {
      updateData.startDateTime = start;
    }
    if (Object.hasOwn(body, 'endDateTime')) {
      updateData.endDateTime = end;
    }

    // --- Handle Category Updates (Many-to-Many) ---
    if (Array.isArray(categoryIds)) {
      updateData.categories = {
        deleteMany: {},
        create: categoryIds.map((id: string) => ({
          category: { connect: { id } },
        })),
      };
    }

    // --- Handle Organizer Club Updates (One-to-Many) ---
    if (Object.hasOwn(body, 'organizerClubId')) {
      if (organizerClubId && typeof organizerClubId === 'string' && organizerClubId !== 'none') {
        updateData.organizerClub = { connect: { id: organizerClubId } };
      } else {
        updateData.organizerClub = { disconnect: true };
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        categories: { include: { category: true } },
        organizerClub: true,
      },
    });

    console.log(`Admin updated event ${updatedEvent.id}`);
    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to update event ${eventId}:`, error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Event not found to update' }, { status: 404 });
    }
    if (error.clientVersion) {
      console.error('Prisma Error Details:', JSON.stringify(error, null, 2));
    }
    return NextResponse.json({ message: 'Failed to update event', error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params: { eventId } }: { params: { eventId: string } },
) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!eventId) {
    return NextResponse.json({ message: 'Event ID is required' }, { status: 400 });
  }

  try {
    await prisma.event.delete({
      where: { id: eventId },
    });

    console.log(`Admin deleted event ${eventId}`);
    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error(`Failed to delete event ${eventId}:`, error);
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Event not found to delete' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to delete event', error: error.message }, { status: 500 });
  }
}
