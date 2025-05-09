import { NextResponse } from 'next/server';
import { ContentStatus } from '@prisma/client';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import nextAuthOptionsConfig from '@/lib/authOptions';

// Utility to check if user is admin
async function isAdminUser(): Promise<boolean> {
  const session = (await getServerSession(nextAuthOptionsConfig)) as Session;
  return session?.user?.isAdmin === true;
}

// Validate if the provided status is a valid ContentStatus enum value or 'ALL'
function isValidFilterStatus(status: any): status is ContentStatus | 'ALL' {
  return status === 'ALL' || Object.values(ContentStatus).includes(status);
}

function isValidContentStatus(status: any): status is ContentStatus {
  return Object.values(ContentStatus).includes(status);
}

function isValidAttendanceType(attendanceType: any): boolean {
  const validAttendanceTypes = ['IN_PERSON', 'VIRTUAL', 'HYBRID'];
  return validAttendanceTypes.includes(attendanceType);
}

// GET /api/admin/events
// Fetches a list of events, optionally filtered by status.
// eslint-disable-next-line import/prefer-default-export
export async function GET(request: Request) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status') as string | null;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10); // Default limit 10

  const skip = (page - 1) * limit;

  let whereClause: any = {}; // Prisma WhereInput

  if (statusFilter && isValidFilterStatus(statusFilter) && statusFilter !== 'ALL') {
    whereClause = { status: statusFilter as ContentStatus };
  } else if (statusFilter && !isValidFilterStatus(statusFilter)) {
    return NextResponse.json({ message: 'Invalid status filter value.' }, { status: 400 });
  }
  // If 'ALL' or no filter, whereClause remains empty {}

  try {
    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true, // Include description
        status: true,
        createdAt: true,
        organizerClub: { select: { name: true } }, // Include host club name if relation exists
      },
    });

    // Get total count for pagination
    const totalEvents = await prisma.event.count({ where: whereClause });

    return NextResponse.json(
      {
        data: events,
        pagination: {
          page,
          limit,
          totalItems: totalEvents,
          totalPages: Math.ceil(totalEvents / limit),
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Failed to fetch admin events list:', error);
    return NextResponse.json({ message: 'Failed to fetch events', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // --- Basic Validation ---
    if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
      return NextResponse.json({ message: 'Event title is required.' }, { status: 400 });
    }
    if (!body.startDateTime || Number.isNaN(Date.parse(body.startDateTime))) {
      return NextResponse.json({ message: 'Valid start date/time is required.' }, { status: 400 });
    }
    if (body.endDateTime && Number.isNaN(Date.parse(body.endDateTime))) {
      return NextResponse.json({ message: 'Invalid end date/time provided.' }, { status: 400 });
    }
    if (body.endDateTime && new Date(body.startDateTime) > new Date(body.endDateTime)) {
      return NextResponse.json({ message: 'End date/time cannot be before start date/time.' }, { status: 400 });
    }
    if (!body.attendanceType || !isValidAttendanceType(body.attendanceType)) {
      return NextResponse.json({ message: 'Valid attendance type is required.' }, { status: 400 });
    }
    if (!body.status || !isValidContentStatus(body.status)) {
      return NextResponse.json({ message: 'Valid status is required.' }, { status: 400 });
    }
    // Add more validation as needed (URLs, emails, etc.)
    // -----------------------

    const {
      categories: categoryIds, // Expecting an array of category IDs
      organizerClubId,
      ...eventData // Rest of the event fields
    } = body;

    const createData: any = {
      ...eventData,
      startDateTime: new Date(eventData.startDateTime), // Ensure it's a Date object
      endDateTime: eventData.endDateTime ? new Date(eventData.endDateTime) : null,
      // Prisma handles optional fields being undefined/null
    };

    // Handle Category Connections (Many-to-Many)
    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      createData.categories = {
        create: categoryIds.map((id: string) => ({
          category: { connect: { id } },
        })),
      };
    }

    // Handle Organizer Club Connection (One-to-Many)
    if (organizerClubId && typeof organizerClubId === 'string') {
      createData.organizerClub = {
        connect: { id: organizerClubId },
      };
    }

    const newEvent = await prisma.event.create({
      data: createData,
      include: { // Include relations in the response if needed
        categories: { include: { category: true } },
        organizerClub: true,
      },
    });

    console.log(`Admin created event ${newEvent.id}`);
    return NextResponse.json(newEvent, { status: 201 }); // 201 Created
  } catch (error: any) {
    console.error('Failed to create event:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    // Add check for Prisma unique constraint errors if needed
    return NextResponse.json({ message: 'Failed to create event', error: error.message }, { status: 500 });
  }
}
