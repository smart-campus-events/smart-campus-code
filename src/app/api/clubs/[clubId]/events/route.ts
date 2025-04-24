import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import nextAuthOptionsConfig from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { ContentStatus } from '@prisma/client';

interface ClubEventsParams {
  params: {
    clubId: string;
  }
}

// GET /api/clubs/[clubId]/events
// Fetches events hosted by a specific club.
export async function GET(request: Request, { params }: ClubEventsParams) {
  const { clubId } = params;
  const { searchParams } = new URL(request.url);

  // Parse filters
  const fromDate = searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined;
  const toDate = searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined;

  if (!clubId) {
    return NextResponse.json({ message: 'Club ID is required' }, { status: 400 });
  }

  try {
    // First, check if the club exists and is approved
    const club = await prisma.club.findUnique({
      where: {
        id: clubId,
        status: ContentStatus.APPROVED,
      },
    });

    if (!club) {
      return NextResponse.json({ message: 'Club not found or not approved' }, { status: 404 });
    }

    // Build the filter
    const filter: any = {
      organizerClubId: clubId,
      status: ContentStatus.APPROVED,
    };

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

    // Fetch events for this club
    const events = await prisma.event.findMany({
      where: filter,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
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
    console.error(`Failed to fetch events for club ${clubId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch club events' }, { status: 500 });
  }
}

// POST /api/clubs/[clubId]/events
// Creates a new event for a specific club.
export async function POST(request: Request, { params }: ClubEventsParams) {
  const { clubId } = params;
  const session = await getServerSession(nextAuthOptionsConfig);

  // Check authentication
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!clubId) {
    return NextResponse.json({ message: 'Club ID is required' }, { status: 400 });
  }

  try {
    // Check if the club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ message: 'Club not found' }, { status: 404 });
    }

    // Check if user has permission to add events to this club
    // For now: allow if user is admin, or if they submitted the club
    const isAdmin = session.user.isAdmin || false;
    const isClubSubmitter = club.submittedByUserId === session.user.id;

    if (!isAdmin && !isClubSubmitter) {
      return NextResponse.json({
        message: 'Unauthorized to add events to this club',
      }, { status: 403 });
    }

    // Parse request data
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

    // Set submission status (admin-created events are automatically approved)
    const status = isAdmin ? ContentStatus.APPROVED : ContentStatus.PENDING;

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
        organizerClubId: clubId, // Set the club ID from the URL
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
    console.error(`Failed to create event for club ${clubId}:`, error);
    return NextResponse.json({ message: 'Failed to create club event' }, { status: 500 });
  }
}
