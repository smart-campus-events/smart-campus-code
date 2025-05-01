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
