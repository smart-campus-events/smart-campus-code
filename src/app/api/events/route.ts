import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import nextAuthOptionsConfig from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { ContentStatus } from '@prisma/client';

// GET /api/events
// Fetches a list of events, with optional filtering.
export async function GET(request: Request) {
  // Extract query parameters
  const { searchParams } = new URL(request.url);

  // Parse filters
  const organizerClubId = searchParams.get('organizerClubId');
  const categoryId = searchParams.get('categoryId');
  const fromDate = searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined;
  const toDate = searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined;
  const searchTerm = searchParams.get('q');
  const status = searchParams.get('status');

  // Build filter object
  const filter: any = {};

  // Only filter by status if 'all' is not specified
  if (status !== 'all') {
    filter.status = ContentStatus.APPROVED; // Only show approved events by default
  }

  if (organizerClubId) {
    filter.organizerClubId = organizerClubId;
  }

  if (fromDate) {
    filter.startDateTime = {
      ...(filter.startDateTime || {}),
      gte: fromDate,
    };
  }

  if (toDate) {
    filter.startDateTime = {
      ...(filter.startDateTime || {}),
      lte: toDate,
    };
  }

  if (searchTerm) {
    filter.OR = [
      { title: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  // Add category filter if provided
  let categoryFilter = {};
  if (categoryId) {
    categoryFilter = {
      categories: {
        some: {
          categoryId,
        },
      },
    };
  }

  try {
    const events = await prisma.event.findMany({
      where: {
        ...filter,
        ...categoryFilter,
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        organizerClub: true,
        _count: {
          select: {
            rsvps: true,
          },
        },
      },
      orderBy: {
        startDateTime: 'asc',
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return NextResponse.json({ message: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST /api/events
// Creates a new event.
export async function POST(request: Request) {
  const session = await getServerSession(nextAuthOptionsConfig);

  // Check authentication
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Simple validation
    if (!data.title || data.title.length < 3) {
      return NextResponse.json({
        message: 'Title is required and must be at least 3 characters long',
      }, { status: 400 });
    }

    if (!data.startDateTime) {
      return NextResponse.json({
        message: 'Start date and time is required',
      }, { status: 400 });
    }

    // Set submission status based on user role
    const status = session.user.isAdmin ? ContentStatus.APPROVED : ContentStatus.PENDING;

    // Create the event
    const newEvent = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        startDateTime: new Date(data.startDateTime),
        endDateTime: data.endDateTime ? new Date(data.endDateTime) : null,
        attendanceType: data.attendanceType,
        location: data.location,
        locationVirtualUrl: data.locationVirtualUrl,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        eventUrl: data.eventUrl,
        eventPageUrl: data.eventPageUrl,
        status,
        submittedByUserId: session.user.id,
        organizerClubId: data.organizerClubId,
        // Add categories if provided
        ...(data.categoryIds && {
          categories: {
            create: data.categoryIds.map((categoryId: string) => ({
              categoryId,
            })),
          },
        }),
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Failed to create event:', error);
    return NextResponse.json({ message: 'Failed to create event' }, { status: 500 });
  }
}
