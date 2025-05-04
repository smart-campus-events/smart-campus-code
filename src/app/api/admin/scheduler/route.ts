import { NextResponse } from 'next/server';
import { JobType, JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// --- Security: Protect this endpoint ---
// Use the same secret as the worker.
const SCHEDULER_SECRET = process.env.WORKER_SECRET; // Reuse the worker secret

// Function to schedule a job if not already pending/running
async function scheduleJobIfNotExists(jobType: JobType): Promise<string> {
  const existingJob = await prisma.job.findFirst({
    where: {
      type: jobType,
      status: { in: [JobStatus.PENDING, JobStatus.RUNNING] },
    },
  });

  if (existingJob) {
    const message = `${jobType} job already ${existingJob.status.toLowerCase()}. Skipping automatic schedule.`;
    console.log(message);
    return message;
  }

  const job = await prisma.job.create({
    data: {
      type: jobType,
      status: JobStatus.PENDING,
    },
  });
  const message = `Successfully scheduled ${jobType} job with ID: ${job.id}`;
  console.log(message);
  return message;
}

// POST /api/admin/scheduler (or GET, depends on cron preference)
// Creates the daily PENDING jobs for event and club scraping.
// eslint-disable-next-line import/prefer-default-export
export async function POST(request: Request) {
  // --- Security Check ---
  const authorization = request.headers.get('Authorization');
  if (!SCHEDULER_SECRET || authorization !== `Bearer ${SCHEDULER_SECRET}`) {
    console.warn('Scheduler endpoint called without valid secret.');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  // --------------------

  console.log('Daily scheduler triggered...');
  const results = [];
  let hasError = false;

  try {
    // Schedule Event Scrape
    results.push(await scheduleJobIfNotExists(JobType.EVENT_SCRAPE));

    // Schedule Club Scrape
    results.push(await scheduleJobIfNotExists(JobType.CLUB_SCRAPE));
  } catch (error: any) {
    console.error('Error during daily scheduling:', error);
    results.push(`Scheduling failed: ${error.message}`);
    hasError = true;
  }

  console.log('Daily scheduling finished.');
  return NextResponse.json(
    {
      message: `Daily scheduling finished. ${hasError ? 'Errors occurred.' : 'All tasks scheduled successfully.'}`,
      details: results,
    },
    { status: hasError ? 500 : 200 },
  );
}

// You might want GET as well if your scheduler uses GET
export async function GET(request: Request) {
  // Reuse POST logic or adapt if needed
  return POST(request);
}
