import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Import prisma client
import { JobType, JobStatus } from '@prisma/client'; // Import enums

import nextAuthOptionsConfig from '@/lib/authOptions';

// Utility to check if user is admin (keep this)
async function isAdminUser() {
  const session = (await getServerSession(nextAuthOptionsConfig)) as Session;
  return session?.user?.isAdmin === true;
}

// POST /api/admin/import/events
// Schedules the event scraping job.
// eslint-disable-next-line import/prefer-default-export
export async function POST(/* request: Request */) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  console.log('Admin request to schedule event import job...');

  try {
    // Check if a job of this type is already pending or running to avoid duplicates
    const existingJob = await prisma.job.findFirst({
      where: {
        type: JobType.EVENT_SCRAPE,
        status: { in: [JobStatus.PENDING, JobStatus.RUNNING] },
      },
    });

    if (existingJob) {
      console.log('Event scrape job already pending or running.');
      return NextResponse.json(
        {
          message: `An event scraping job is already
          ${existingJob.status.toLowerCase()}. Please wait for it to complete.`,
          jobId: existingJob.id,
        },
        { status: 409 }, // 409 Conflict
      );
    }

    // Create a new job record
    const job = await prisma.job.create({
      data: {
        type: JobType.EVENT_SCRAPE,
        status: JobStatus.PENDING,
        // payload: { someData: 'if needed' } // Add payload if necessary
      },
    });

    console.log(`Event scrape job scheduled successfully with ID: ${job.id}`);
    // Return 202 Accepted status code
    return NextResponse.json(
      { message: 'Event scraping job scheduled successfully.', jobId: job.id },
      { status: 202 },
    );
  } catch (error: any) {
    console.error('Failed to schedule event scrape job:', error);
    return NextResponse.json(
      { message: 'Failed to schedule event scraping job.', error: error.message },
      { status: 500 },
    );
  }
}
