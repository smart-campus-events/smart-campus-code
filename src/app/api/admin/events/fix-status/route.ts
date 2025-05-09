import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { ContentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import nextAuthOptionsConfig from '@/lib/authOptions';

export const dynamic = 'force-dynamic';

// Utility to check if user is admin
async function isAdminUser(): Promise<boolean> {
  const session = (await getServerSession(nextAuthOptionsConfig)) as Session;
  return session?.user?.isAdmin === true;
}

// Approve all pending events
export async function POST(request: Request) {
  console.log('Fix event status endpoint called');

  // Check admin permissions
  if (!(await isAdminUser())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'check';

    // Only perform database checks first (dry run)
    if (action === 'check') {
      const pendingCount = await prisma.event.count({
        where: { status: ContentStatus.PENDING },
      });

      const approvedCount = await prisma.event.count({
        where: { status: ContentStatus.APPROVED },
      });

      const currentDate = new Date();
      const upcomingApprovedCount = await prisma.event.count({
        where: {
          status: ContentStatus.APPROVED,
          startDateTime: { gte: currentDate },
        },
      });

      return NextResponse.json({
        message: 'Database check completed',
        stats: {
          pendingCount,
          approvedCount,
          upcomingApprovedCount,
        },
      });
    }

    // Actually apply the fixes
    if (action === 'approve-all-pending') {
      // Update all pending events to approved
      const updateResult = await prisma.event.updateMany({
        where: { status: ContentStatus.PENDING },
        data: { status: ContentStatus.APPROVED },
      });

      return NextResponse.json({
        message: 'All pending events have been approved',
        updated: updateResult.count,
      });
    }

    return NextResponse.json({ message: 'Unknown action specified' }, { status: 400 });
  } catch (error) {
    console.error('Error fixing event status:', error);
    return NextResponse.json({
      message: 'Failed to fix event status',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
