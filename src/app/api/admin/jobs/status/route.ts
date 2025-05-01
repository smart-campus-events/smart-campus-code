import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import nextAuthOptionsConfig from '@/lib/authOptions';

// Utility to check if user is admin
async function isAdminUser() {
  const session = (await getServerSession(nextAuthOptionsConfig)) as Session;
  return session?.user?.isAdmin === true;
}

// GET /api/admin/jobs/status
// Fetches the status of recent jobs for the admin dashboard.
// eslint-disable-next-line import/prefer-default-export
export async function GET() {
  if (!(await isAdminUser())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' }, // Get the most recent jobs first
      take: 10, // Limit to the last 10 jobs, adjust as needed
      select: { // Select only the fields needed for display
        id: true,
        type: true,
        status: true,
        createdAt: true,
        startedAt: true,
        endedAt: true,
        result: true, // Include result for error messages
      },
    });

    return NextResponse.json(jobs, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch job statuses:', error);
    return NextResponse.json(
      { message: 'Failed to fetch job statuses.', error: error.message },
      { status: 500 },
    );
  }
}
