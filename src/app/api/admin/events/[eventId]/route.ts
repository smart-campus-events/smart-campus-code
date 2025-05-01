import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import nextAuthOptionsConfig from '@/lib/authOptions';

// Utility to check if user is admin
async function isAdminUser(): Promise<boolean> {
  const session = (await getServerSession(nextAuthOptionsConfig)) as Session;
  return session?.user?.isAdmin === true;
}

// GET /api/admin/events/[eventId]
// Fetches details for a single event.
export async function GET(
  request: Request, // Added request parameter (standard practice)
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
        // Include related data needed for the edit form
        categories: { // Get the IDs of connected categories
          select: {
            categoryId: true,
          },
        },
        organizerClub: { // Get the ID and name of the connected club
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    // Simplify categories data before sending
    const simplifiedEvent = {
      ...event,
      categoryIds: event.categories.map(ec => ec.categoryId), // Create flat array of IDs
      // categories field is no longer needed in the response
    };
    delete (simplifiedEvent as any).categories;

    return NextResponse.json(simplifiedEvent, { status: 200 });
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

    // --- Basic Validation (similar to POST, but fields are optional) ---
    if (body.title !== undefined && (typeof body.title !== 'string' || body.title.trim() === '')) {
      return NextResponse.json({ message: 'Event title cannot be empty if provided.' }, { status: 400 });
    }
    if (body.startDateTime && isNaN(Date.parse(body.startDateTime))) {
      return NextResponse.json({ message: 'Invalid start date/time provided.' }, { status: 400 });
    }
    if (body.endDateTime && isNaN(Date.parse(body.endDateTime))) {
      return NextResponse.json({ message: 'Invalid end date/time provided.' }, { status: 400 });
    }
    // Ensure start/end dates are logical if both are provided
    const start = body.startDateTime ? new Date(body.startDateTime) : null;
    const end = body.endDateTime ? new Date(body.endDateTime) : null;
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

    const {
      categories: categoryIds, // Array of category IDs for the updated set
      organizerClubId, // The ID of the new organizer club, or null/undefined to remove
      ...eventData // Rest of the fields to update
    } = body;

    const updateData: any = {
      ...eventData,
      // Convert dates only if they are provided
      ...(start && { startDateTime: start }),
      ...(end && { endDateTime: end }),
      // If endDateTime is explicitly set to null/undefined in body, handle it
      ...(body.hasOwnProperty('endDateTime') && !end && { endDateTime: null }),
    };

    // --- Handle Category Updates (Many-to-Many) ---
    // This replaces all existing categories with the new set provided.
    if (Array.isArray(categoryIds)) {
      updateData.categories = {
        // First, delete existing relations for this event
        deleteMany: {},
        // Then, create new relations for the submitted IDs
        create: categoryIds.map((id: string) => ({
          category: { connect: { id } },
        })),
      };
    }
    // Note: If categoryIds is not in the body, categories won't be touched.
    // If categoryIds is an empty array [], all categories will be disconnected.

    // --- Handle Organizer Club Updates (One-to-Many) ---
    if (body.hasOwnProperty('organizerClubId')) { // Check if the key exists in the request
      if (organizerClubId && typeof organizerClubId === 'string') {
        // Connect to the new club
        updateData.organizerClub = { connect: { id: organizerClubId } };
      } else {
        // Disconnect if organizerClubId is null, undefined, or empty string
        updateData.organizerClub = { disconnect: true };
      }
    }
    // If organizerClubId is not in the body, the relation won't be touched.

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: { // Optional: return updated relations
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
    // Handle Prisma 'Record to update not found' error
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to update event', error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request, // Added request parameter
  { params: { eventId } }: { params: { eventId: string } },
) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!eventId) {
    return NextResponse.json({ message: 'Event ID is required' }, { status: 400 });
  }

  try {
    // Attempt to delete the event
    await prisma.event.delete({
      where: { id: eventId },
    });

    console.log(`Admin deleted event ${eventId}`);
    // Return 204 No Content for successful deletion
    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error(`Failed to delete event ${eventId}:`, error);
    // Handle Prisma 'Record to delete does not exist' error
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to delete event', error: error.message }, { status: 500 });
  }
}
