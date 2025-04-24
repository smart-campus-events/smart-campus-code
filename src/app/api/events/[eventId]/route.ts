import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import nextAuthOptionsConfig from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { ContentStatus } from '@prisma/client';

interface EventParams {
  params: {
    eventId: string;
  }
}

// GET /api/events/[eventId]
// Fetches a single event by ID.
export async function GET(request: Request, { params }: EventParams) {
  const { eventId } = params;

  if (!eventId) {
    return NextResponse.json({ message: 'Event ID is required' }, { status: 400 });
  }

  try {
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        organizerClub: true,
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            rsvps: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    // If event is pending, only allow the submitter or admins to see it
    if (event.status === ContentStatus.PENDING) {
      const session = await getServerSession(nextAuthOptionsConfig);
      const userId = session?.user?.id;
      const isAdmin = session?.user?.isAdmin || false;

      if (!userId || (userId !== event.submittedByUserId && !isAdmin)) {
        return NextResponse.json({ message: 'Event not found or not approved' }, { status: 404 });
      }
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error(`Failed to fetch event ${eventId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch event' }, { status: 500 });
  }
}

// PUT /api/events/[eventId]
// Updates an existing event.
export async function PUT(request: Request, { params }: EventParams) {
  const { eventId } = params;
  const session = await getServerSession(nextAuthOptionsConfig);

  // Check authentication
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get existing event to check permissions
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        categories: true,
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    // Check if user has permission to edit
    const isAdmin = session.user.isAdmin || false;
    const isSubmitter = existingEvent.submittedByUserId === session.user.id;

    if (!isAdmin && !isSubmitter) {
      return NextResponse.json({ message: 'Unauthorized to edit this event' }, { status: 403 });
    }

    const data = await request.json();

    // Simple validation
    if (data.title !== undefined && (data.title === '' || data.title.length < 3)) {
      return NextResponse.json({
        message: 'Title must be at least 3 characters long',
      }, { status: 400 });
    }

    // Update event with validated data
    await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.startDateTime && { startDateTime: new Date(data.startDateTime) }),
        ...(data.endDateTime && { endDateTime: new Date(data.endDateTime) }),
        ...(data.endDateTime === null && { endDateTime: null }),
        ...(data.attendanceType !== undefined && { attendanceType: data.attendanceType }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.locationVirtualUrl !== undefined && { locationVirtualUrl: data.locationVirtualUrl }),
        ...(data.contactName !== undefined && { contactName: data.contactName }),
        ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
        ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
        ...(data.eventUrl !== undefined && { eventUrl: data.eventUrl }),
        ...(data.eventPageUrl !== undefined && { eventPageUrl: data.eventPageUrl }),
        ...(data.organizerClubId !== undefined && { organizerClubId: data.organizerClubId }),
        // Only admins can change status
        ...(isAdmin && data.status && { status: data.status }),
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    // Update categories if provided
    if (data.categoryIds) {
      // Delete existing category connections
      await prisma.eventCategory.deleteMany({
        where: { eventId },
      });

      // Add new categories - create all categories in a single operation to avoid await in loop
      await Promise.all(
        data.categoryIds.map((categoryId: string) => prisma.eventCategory.create({
          data: {
            eventId,
            categoryId,
          },
        })),
      );
    }

    // Fetch the updated event with fresh category data
    const refreshedEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        organizerClub: true,
      },
    });

    return NextResponse.json(refreshedEvent);
  } catch (error) {
    console.error(`Failed to update event ${eventId}:`, error);
    return NextResponse.json({ message: 'Failed to update event' }, { status: 500 });
  }
}

// DELETE /api/events/[eventId]
// Deletes an event.
export async function DELETE(request: Request, { params }: EventParams) {
  const { eventId } = params;
  const session = await getServerSession(nextAuthOptionsConfig);

  // Check authentication
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get existing event to check permissions
    const existingEvent = await prisma.event.findUnique({ where: { id: eventId } });

    if (!existingEvent) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    // Check if user has permission to delete
    const isAdmin = session.user.isAdmin || false;
    const isSubmitter = existingEvent.submittedByUserId === session.user.id;

    if (!isAdmin && !isSubmitter) {
      return NextResponse.json({ message: 'Unauthorized to delete this event' }, { status: 403 });
    }

    // Delete related EventCategory records first
    await prisma.eventCategory.deleteMany({
      where: { eventId },
    });

    // Delete RSVPs
    await prisma.rSVP.deleteMany({
      where: { eventId },
    });

    // Delete the event
    await prisma.event.delete({
      where: { id: eventId },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(`Failed to delete event ${eventId}:`, error);
    return NextResponse.json({ message: 'Failed to delete event' }, { status: 500 });
  }
}
