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

// GET /api/admin/clubs
// Fetches a list of clubs, optionally filtered by status.
// eslint-disable-next-line import/prefer-default-export
export async function GET(request: Request) {
  // Keep admin check if you only want admins to see this list for the form
  // If the dropdown should be available more widely, remove or adjust this check.
  if (!(await isAdminUser())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const statusFilter = searchParams.get('status') as string | null;
  const minimal = searchParams.get('minimal') === 'true'; // Check for minimal flag
  const page = parseInt(searchParams.get('page') || '1', 10);
  // Limit higher if minimal=true to likely get all clubs in one go for dropdown
  const limit = parseInt(searchParams.get('limit') || (minimal ? '500' : '10'), 10);

  const skip = (page - 1) * limit;
  let whereClause: any = {};

  // --- Add filter for APPROVED if minimal=true for dropdown? ---
  // Only list approved clubs as potential hosts?
  if (minimal) {
    whereClause = { status: ContentStatus.APPROVED }; // Only fetch approved clubs
  } else if (statusFilter && isValidFilterStatus(statusFilter) && statusFilter !== 'ALL') {
    whereClause = { status: statusFilter as ContentStatus };
  } else if (statusFilter && !isValidFilterStatus(statusFilter)) {
    return NextResponse.json({ message: 'Invalid status filter value.' }, { status: 400 });
  }
  // --------------------------------------------------------------

  try {
    // Define select object based on 'minimal' flag
    const selectClause = minimal
      ? { id: true, name: true } // Only ID and Name for dropdowns
      : { // Full details for the manage table
        id: true,
        name: true,
        purpose: true,
        status: true,
        createdAt: true,
        contactEmail: true,
      };

    const clubs = await prisma.club.findMany({
      where: whereClause,
      // Order by name if minimal, otherwise by createdAt
      orderBy: minimal ? { name: 'asc' } : { createdAt: 'desc' },
      skip: minimal ? 0 : skip, // Don't skip if minimal (get all)
      take: limit,
      select: selectClause,
    });

    // Don't need pagination info if minimal=true
    if (minimal) {
      return NextResponse.json({ data: clubs }, { status: 200 });
    }

    // Full response with pagination for the table view
    const totalClubs = await prisma.club.count({ where: whereClause });
    return NextResponse.json(
      {
        data: clubs,
        pagination: {
          page,
          limit,
          totalItems: totalClubs,
          totalPages: Math.ceil(totalClubs / limit),
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Failed to fetch admin clubs list:', error);
    return NextResponse.json({ message: 'Failed to fetch clubs', error: error.message }, { status: 500 });
  }
}
