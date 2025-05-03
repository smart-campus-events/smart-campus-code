import { NextResponse } from 'next/server';
import { ContentStatus } from '@prisma/client'; // Import the enum
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import nextAuthOptionsConfig from '@/lib/authOptions';

// Utility to check if user is admin
async function isAdminUser(): Promise<boolean> {
  const session = (await getServerSession(nextAuthOptionsConfig)) as Session;
  return session?.user?.isAdmin === true;
}

// Validate if the provided status is a valid ContentStatus enum value
function isValidContentStatus(status: any): status is ContentStatus {
  return Object.values(ContentStatus).includes(status);
}

// PATCH /api/admin/clubs/[clubId]/status
// Updates the status of a specific club.
// eslint-disable-next-line import/prefer-default-export
export async function PATCH(
  request: Request,
  { params: { clubId } }: { params: { clubId: string } },
) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const newStatus = body.status as ContentStatus;

    if (!clubId) {
      return NextResponse.json({ message: 'Club ID is required' }, { status: 400 });
    }

    if (!newStatus || !isValidContentStatus(newStatus)) {
      return NextResponse.json(
        { message: 'Invalid or missing status provided. Must be one of: PENDING, APPROVED, REJECTED' },
        { status: 400 },
      );
    }

    // Check if club exists (optional but good practice)
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) {
      return NextResponse.json({ message: 'Club not found' }, { status: 404 });
    }

    // Update the club status
    const updatedClub = await prisma.club.update({
      where: { id: clubId },
      data: { status: newStatus },
    });

    console.log(`Admin updated club ${clubId} status to ${newStatus}`);
    return NextResponse.json(updatedClub, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to update status for club ${clubId}:`, error);
    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update club status', error: error.message }, { status: 500 });
  }
}
