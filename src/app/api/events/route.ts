import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ContentStatus, Prisma, AttendanceType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// GET /api/events - Get a list of events with optional filtering
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const categoryIds = searchParams.getAll('category');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '1000', 10);
  const sort = searchParams.get('sort') || 'date-asc';
  const skip = (page - 1) * limit;
  const pastEvents = searchParams.get('pastEvents') === 'true';
  const attendanceType = searchParams.get('attendanceType') || null;

  try {
    // Current date for filtering upcoming vs past events
    const currentDate = new Date();

    // Define the where clause with explicit type
    const where: Prisma.EventWhereInput = {
      status: ContentStatus.APPROVED,
      ...(query ? {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
          { organizerSponsor: { contains: query, mode: 'insensitive' } },
        ],
      } : {}),
      ...(categoryIds.length > 0 ? {
        categories: {
          some: {
            categoryId: {
              in: categoryIds,
            },
          },
        },
      } : {}),
      ...(pastEvents 
        ? { startDateTime: { lt: currentDate } }  // Past events
        : { startDateTime: { gte: currentDate } } // Upcoming events (default)
      ),
      ...(attendanceType ? {
        attendanceType: attendanceType as AttendanceType,
      } : {}),
    };

    // Determine sort options based on sort parameter
    let orderBy: Prisma.EventOrderByWithRelationInput;
    
    switch (sort) {
      case 'date-desc':
        orderBy = { startDateTime: 'desc' };
        break;
      case 'title-asc':
        orderBy = { title: 'asc' };
        break;
      case 'title-desc':
        orderBy = { title: 'desc' };
        break;
      case 'date-asc':
      default:
        orderBy = { startDateTime: 'asc' };
        break;
    }

    // Execute the query with pagination
    const events = await prisma.event.findMany({
      where,
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
      orderBy,
      skip,
      take: limit,
    });

    // Get total count for pagination
    const total = await prisma.event.count({ where });

    return NextResponse.json({
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 },
    );
  }
}

// POST /api/events - Create a new event (requires authentication)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    // Check if user is authenticated
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const data = await request.json();

    const {
      title,
      startDateTime,
      endDateTime,
      allDay,
      description,
      attendanceType,
      location,
      locationVirtualUrl,
      organizerSponsor,
      contactName,
      contactPhone,
      contactEmail,
      eventUrl,
      eventPageUrl,
      categoryIds,
      organizerClubId,
    } = data;

    // Validate required fields
    if (!title || !startDateTime) {
      return NextResponse.json(
        { error: 'Title and start date/time are required' },
        { status: 400 },
      );
    }

    // Get user ID from session
    const userEmail = session.user.email;
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, isAdmin: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    // Determine status based on user role
    const status = user.isAdmin ? ContentStatus.APPROVED : ContentStatus.PENDING;

    // Prepare category connections
    const categoryConnectOrCreate = categoryIds && categoryIds.length > 0
      ? categoryIds.map((categoryId: string) => ({
        categoryId,
      }))
      : [];

    // Create the event
    const event = await prisma.event.create({
      data: {
        title,
        startDateTime: new Date(startDateTime),
        endDateTime: endDateTime ? new Date(endDateTime) : null,
        allDay: allDay || false,
        description,
        attendanceType: attendanceType || AttendanceType.IN_PERSON,
        location,
        locationVirtualUrl,
        organizerSponsor,
        contactName,
        contactPhone,
        contactEmail,
        eventUrl,
        eventPageUrl,
        status,
        submittedByUserId: user.id,
        ...(organizerClubId ? { organizerClubId } : {}),
        categories: {
          create: categoryConnectOrCreate,
        },
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        organizerClub: true,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    // Handle potential Prisma errors more gracefully
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'This event may already exist.' },
          { status: 409 },
        );
      }
    }
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 },
    );
  }
}
