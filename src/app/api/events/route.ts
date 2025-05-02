import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { AttendanceType, ContentStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// GET /api/events - Get a list of events with optional filtering
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const categoryId = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const sort = searchParams.get('sort') || 'Date: Soonest';
  const skip = (page - 1) * limit;

  try {
    // Define the where clause with explicit type
    const where: Prisma.EventWhereInput = {
      status: ContentStatus.APPROVED,
      ...(query ? {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { organizerSponsor: { contains: query, mode: 'insensitive' } },
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

    // Define orderBy based on sort parameter
    let orderBy: Prisma.EventOrderByWithRelationInput = {};
    
    switch (sort) {
      case 'Date: Soonest':
        orderBy = { startDateTime: 'asc' };
        break;
      case 'Date: Latest':
        orderBy = { startDateTime: 'desc' };
        break;
      case 'A-Z':
        orderBy = { title: 'asc' };
        break;
      case 'Z-A':
        orderBy = { title: 'desc' };
        break;
      default:
        orderBy = { startDateTime: 'asc' };
    }

    // Execute the query with pagination using the prisma instance
    const events = await prisma.event.findMany({
      where,
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
      orderBy,
      skip,
      take: limit,
    });

    // Get total count for pagination using the prisma instance
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
      organizerClubId,
      categoryIds,
    } = data;

    // Validate required fields
    if (!title || !startDateTime) {
      return NextResponse.json(
        { error: 'Title and startDateTime are required' },
        { status: 400 },
      );
    }

    // Check for valid attendance type
    if (attendanceType && !Object.values(AttendanceType).includes(attendanceType)) {
      return NextResponse.json(
        { error: 'Invalid attendance type' },
        { status: 400 },
      );
    }

    // Handle date validation
    const startDate = new Date(startDateTime);
    let endDate = endDateTime ? new Date(endDateTime) : null;

    if (endDate && startDate > endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 },
      );
    }

    // Get user ID from session using the prisma instance
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
    const categoryConnections = categoryIds && categoryIds.length > 0
      ? categoryIds.map((categoryId: string) => ({
        categoryId,
      }))
      : [];

    // Create the event using the prisma instance
    const event = await prisma.event.create({
      data: {
        title,
        startDateTime: startDate,
        endDateTime: endDate,
        allDay: allDay || false,
        description,
        costAdmission,
        attendanceType: attendanceType || AttendanceType.IN_PERSON,
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
        organizerClubId,
        categories: {
          create: categoryConnections,
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
      // Handle specific error cases if needed
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 },
    );
  }
} 