import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ContentStatus, Prisma, AttendanceType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Helper function to avoid nested ternary
function getDateFilterString(showAllDates: boolean, isPastEvents: boolean): string {
  if (showAllDates) return 'ALL';
  if (isPastEvents) return 'PAST';
  return 'UPCOMING';
}

// GET /api/events - Get a list of events with optional filtering
export async function GET(request: Request) {
  console.log('API call to /api/events started');
  const { searchParams } = new URL(request.url);

  // Log the full request URL for debugging
  console.log('Request URL:', request.url);

  const query = searchParams.get('q') || '';
  const categoryIds = searchParams.getAll('category');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '1000', 10);
  const sort = searchParams.get('sort') || 'date-asc';
  const skip = (page - 1) * limit;
  const pastEvents = searchParams.get('pastEvents') === 'true';
  const attendanceType = searchParams.get('attendanceType') || null;

  // Add option to include all events regardless of status (for debugging)
  const includeAllStatuses = searchParams.get('allStatuses') === 'true';

  // Add option to show both past and future events
  const showAllDates = searchParams.get('allDates') === 'true';

  try {
    // Current date for filtering upcoming vs past events
    const currentDate = new Date();
    console.log('Current date for filtering:', currentDate);

    // Build where clause step by step for better debugging
    const where: Prisma.EventWhereInput = {};

    // Status filtering
    if (!includeAllStatuses) {
      where.status = ContentStatus.APPROVED;
    }
    console.log('Status filter applied:', where);

    // Search query
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
        { organizerSponsor: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Category filtering
    if (categoryIds.length > 0) {
      where.categories = {
        some: {
          categoryId: {
            in: categoryIds,
          },
        },
      };
      console.log('Category filter applied with categories:', categoryIds);
    }

    // Date filtering
    if (!showAllDates) {
      if (pastEvents) {
        where.startDateTime = { lt: currentDate }; // Past events
        console.log('Filtering for past events');
      } else {
        where.startDateTime = { gte: currentDate }; // Upcoming events (default)
        console.log('Filtering for upcoming events');
      }
    } else {
      console.log('Showing all dates (past and future)');
    }

    // Attendance type filtering
    if (attendanceType) {
      where.attendanceType = attendanceType as AttendanceType;
      console.log('Filtering by attendance type:', attendanceType);
    }

    console.log('Final where clause:', JSON.stringify(where, null, 2));

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

    console.log('Order by:', sort);

    // First, check if any events exist at all (without filters)
    const totalEventsInDB = await prisma.event.count();
    console.log('Total events in database (all statuses):', totalEventsInDB);

    if (totalEventsInDB === 0) {
      console.log('No events found in the database at all');
      return NextResponse.json({
        events: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
        debug: { databaseEmpty: true },
      });
    }

    // Now count with status filter only
    const approvedEventsCount = await prisma.event.count({
      where: { status: ContentStatus.APPROVED },
    });
    console.log('Approved events count:', approvedEventsCount);

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

    console.log(`Found ${events.length} events with all filters applied`);

    // Get total count for pagination
    const total = await prisma.event.count({ where });

    // Add status information for debugging
    const statusCounts = {
      APPROVED: await prisma.event.count({ where: { status: ContentStatus.APPROVED } }),
      PENDING: await prisma.event.count({ where: { status: ContentStatus.PENDING } }),
      REJECTED: await prisma.event.count({ where: { status: ContentStatus.REJECTED } }),
    };

    console.log('Status counts:', statusCounts);

    // Add additional debug info to help troubleshoot
    const debugInfo = {
      totalEvents: totalEventsInDB,
      statusCounts,
      appliedFilters: {
        status: !includeAllStatuses ? 'APPROVED' : 'ALL',
        dateFilter: getDateFilterString(showAllDates, pastEvents),
        categoriesApplied: categoryIds.length > 0,
        searchQueryApplied: !!query,
      },
    };

    return NextResponse.json({
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      debug: debugInfo,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch events',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

// POST /api/events - Create a new event (requires authentication)
export async function POST(request: Request) {
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
