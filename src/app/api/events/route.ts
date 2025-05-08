import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Christian, if you get a merge conflict here and it is causing issues with the dashboard,
// just use your version of the file and I will adjust the dashboard to match.

// GET /api/events - Get a list of events with optional filtering
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const categoryId = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const skip = (page - 1) * limit;

  // Date filtering
  const startDate = searchParams.get('startDate')
    ? new Date(searchParams.get('startDate') as string)
    : new Date(); // Default to current date

  const endDate = searchParams.get('endDate')
    ? new Date(searchParams.get('endDate') as string)
    : null; // No end date by default

  try {
    // Define the where clause
    const where: any = {
      status: 'APPROVED', // ContentStatus.APPROVED as string
      startDateTime: {
        gte: startDate,
        ...(endDate ? { lte: endDate } : {}),
      },
      ...(query ? {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      } : {}),
      ...(categoryId ? {
        categories: {
          some: {
            categoryId,
          },
        },
      } : {}),
    };

    // Execute the query with pagination
    const events = await prisma.event.findMany({
      where,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        organizerClub: {
          select: {
            id: true,
            name: true,
          },
        },
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
      orderBy: {
        startDateTime: 'asc', // Sort by date ascending (soonest first)
      },
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
      description,
      attendanceType,
      location,
      locationVirtualUrl,
      organizerSponsor,
      contactName,
      contactEmail,
      contactPhone,
      eventUrl,
      eventPageUrl,
      organizerClubId,
      categoryIds,
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
    const status = user.isAdmin ? 'APPROVED' : 'PENDING';

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
        endDateTime: endDateTime ? new Date(endDateTime) : undefined,
        description,
        attendanceType: attendanceType || undefined,
        location,
        locationVirtualUrl,
        organizerSponsor,
        contactName,
        contactEmail,
        contactPhone,
        eventUrl,
        eventPageUrl,
        status,
        submittedByUserId: user.id,
        organizerClubId: organizerClubId || undefined,
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
    const err = error as any;
    if (err.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid reference (e.g., organizerClubId does not exist)' },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 },
    );
  }
}
