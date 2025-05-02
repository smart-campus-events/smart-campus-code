import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { AttendanceType, ContentStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// GET /api/events/[eventId] - Get details for a specific event
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } },
) {
  const { eventId } = params;

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organizerClub: true,
        _count: {
          select: {
            rsvps: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // For non-approved events, only allow access for admin or the submitter
    if (event.status !== ContentStatus.APPROVED) {
      const session = await getServerSession();
      const userEmail = session?.user?.email;
      const user = userEmail ? await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true, isAdmin: true },
      }) : null;

      if (!user || (!user.isAdmin && user.id !== event.submittedByUserId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error(`Error fetching event ${eventId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 },
    );
  }
}

// PUT /api/events/[eventId] - Update a specific event (Admin or submitter only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { eventId: string } },
) {
  const { eventId } = params;
  const session = await getServerSession();

  // 1. Authentication check
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        categories: true,
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // 2. Authorization: Check if user is admin or the submitter
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, isAdmin: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only allow admin or the original submitter to update
    if (!user.isAdmin && user.id !== existingEvent.submittedByUserId) {
      return NextResponse.json({ error: 'Forbidden: Only admins or the event creator can update this event' }, { status: 403 });
    }

    const data = await request.json();
    const {
      title,
      startDateTime,
      endDateTime,
      allDay,
      description,
      costAdmission,
      attendanceType,
      location,
      locationVirtualUrl,
      organizerSponsor,
      contactName,
      contactEmail,
      contactPhone,
      eventUrl,
      eventPageUrl,
      status,
      organizerClubId,
      categoryIds,
    } = data;

    // Validate status if provided
    if (status && !Object.values(ContentStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // Validate attendance type if provided
    if (attendanceType && !Object.values(AttendanceType).includes(attendanceType)) {
      return NextResponse.json({ error: 'Invalid attendance type value' }, { status: 400 });
    }

    // Date validation
    let startDate;
    let endDate;

    if (startDateTime) {
      startDate = new Date(startDateTime);
    }

    if (endDateTime) {
      endDate = new Date(endDateTime);
    } else if (endDateTime === null) {
      endDate = null; // Explicitly set to null to remove end date
    }

    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }

    // Prepare category updates if categoryIds is provided
    const categoryUpdateOperations: Prisma.EventCategoryUncheckedUpdateManyWithoutEventNestedInput = {};
    if (categoryIds !== undefined) {
      categoryUpdateOperations.set = categoryIds.map((categoryId: string) => ({
        eventId,
        categoryId,
      }));
    }

    // Prepare data for update, including only defined fields
    const updateData: Prisma.EventUpdateInput = {
      ...(title !== undefined && { title }),
      ...(startDate !== undefined && { startDateTime: startDate }),
      ...(endDate !== undefined && { endDateTime: endDate }),
      ...(allDay !== undefined && { allDay }),
      ...(description !== undefined && { description }),
      ...(costAdmission !== undefined && { costAdmission }),
      ...(attendanceType !== undefined && { attendanceType }),
      ...(location !== undefined && { location }),
      ...(locationVirtualUrl !== undefined && { locationVirtualUrl }),
      ...(organizerSponsor !== undefined && { organizerSponsor }),
      ...(contactName !== undefined && { contactName }),
      ...(contactEmail !== undefined && { contactEmail }),
      ...(contactPhone !== undefined && { contactPhone }),
      ...(eventUrl !== undefined && { eventUrl }),
      ...(eventPageUrl !== undefined && { eventPageUrl }),
      // Only allow admins to change status
      ...(status !== undefined && user.isAdmin ? { status } : {}),
      ...(organizerClubId !== undefined && { organizerClub: { connect: { id: organizerClubId } } }),
      ...(categoryIds !== undefined ? { categories: categoryUpdateOperations } : {}),
    };

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        organizerClub: true,
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error(`Error updating event ${eventId}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 },
    );
  }
}

// DELETE /api/events/[eventId] - Delete a specific event (Admin or submitter only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } },
) {
  const { eventId } = params;
  const session = await getServerSession();

  // 1. Authentication check
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // 2. Authorization: Check if user is admin or the submitter
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, isAdmin: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only allow admin or the original submitter to delete
    if (!user.isAdmin && user.id !== existingEvent.submittedByUserId) {
      return NextResponse.json({ error: 'Forbidden: Only admins or the event creator can delete this event' }, { status: 403 });
    }

    // Delete the event
    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error(`Error deleting event ${eventId}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 },
    );
  }
}
