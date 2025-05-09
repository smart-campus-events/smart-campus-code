import { NextResponse } from 'next/server';
import { JobStatus, JobType } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { prisma } from '@/lib/prisma';

const execPromise = promisify(exec);

// Define script paths (same as before)
const projectRoot = process.cwd();
const eventScriptDir = path.join(projectRoot, 'scripts', 'event-scraping');
const eventScrapeScript = path.join(eventScriptDir, 'scrape.js');
const eventTaggingScript = path.join(eventScriptDir, 'category-tagging.js');
const eventLinkScript = path.join(eventScriptDir, 'link-events-categories.js');

const clubScriptDir = path.join(projectRoot, 'scripts', 'club-scraping');
const clubImportScriptPath = path.join(clubScriptDir, 'import-club-data.js');
const clubCategorizeScriptPath = path.join(clubScriptDir, 'club-categorizing.js');

// --- Security: Protect this endpoint ---
// This endpoint should not be publicly accessible.
// Use a secret key passed via header or query param.
// The scheduler (e.g., Vercel Cron) will send this secret.
const { WORKER_SECRET } = process.env; // Set this in your .env file!

// Helper function to run event scraping steps
async function runEventScraping() {
  console.log('Running Event Scrape step...');
  await execPromise(`node "${eventScrapeScript}"`);
  console.log('Running Event Tagging step...');
  await execPromise(`node "${eventTaggingScript}"`);
  console.log('Running Event Link step...');
  await execPromise(`node "${eventLinkScript}"`);
  console.log('Event scraping steps finished.');
}

// Helper function to run club scraping steps
async function runClubScraping() {
  console.log('Running Club Import step...');
  await execPromise(`node "${clubImportScriptPath}"`);
  console.log('Running Club Categorizing step...');
  await execPromise(`node "${clubCategorizeScriptPath}"`);
  console.log('Club scraping steps finished.');
}

// POST /api/admin/worker (or GET, depending on scheduler preference)
// This route processes one pending job at a time.
// eslint-disable-next-line import/prefer-default-export
export async function POST(request: Request) {
  // --- Security Check ---
  const incomingSecret = request.headers.get('x-vercel-cron-secret');
  if (!WORKER_SECRET || incomingSecret !== WORKER_SECRET) {
    console.warn('Worker endpoint called without valid secret.');
    return NextResponse.json({ message: 'Unauthorized',
      secretReceived: incomingSecret,
      secretExpected: WORKER_SECRET,
    }, { status: 401 });
  }

  // --------------------

  console.log('Worker checking for pending jobs...');
  let job = null;

  try {
    // Find the oldest PENDING job
    job = await prisma.job.findFirst({
      where: { status: JobStatus.PENDING },
      orderBy: { createdAt: 'asc' },
    });

    if (!job) {
      console.log('No pending jobs found.');
      return NextResponse.json({ message: 'No pending jobs' }, { status: 200 });
    }

    console.log(`Found pending job ${job.id} of type ${job.type}`);

    // Mark job as RUNNING
    job = await prisma.job.update({
      where: { id: job.id },
      data: { status: JobStatus.RUNNING, startedAt: new Date() },
    });

    let jobError = null;
    try {
      // Execute the correct script(s) based on job type
      if (job.type === JobType.EVENT_SCRAPE) {
        await runEventScraping();
      } else if (job.type === JobType.CLUB_SCRAPE) {
        await runClubScraping();
      } else {
        throw new Error(`Unknown job type: ${job.type}`);
      }

      // Mark job as COMPLETED if no errors
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.COMPLETED,
          endedAt: new Date(),
          result: { message: 'Successfully completed' },
        },
      });
      console.log(`Job ${job.id} completed successfully.`);
    } catch (error: any) {
      jobError = error; // Store error to handle after marking job as failed
    }

    // Mark job as FAILED if an error occurred
    if (jobError) {
      console.error(`Job ${job.id} failed:`, jobError);
      const errorMessage = jobError.stderr ? `${jobError.message}\nSTDERR: ${jobError.stderr}` : jobError.message;
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.FAILED,
          endedAt: new Date(),
          result: { error: errorMessage }, // Store error details
        },
      });
    }

    return NextResponse.json({ message: `Processed job 
      ${job.id}`,
    status: jobError ? 'failed' : 'completed' }, { status: 200 });
  } catch (error: any) {
    console.error('Worker encountered an unexpected error:', error);
    // If we managed to get a job ID, try to mark it as failed
    if (job && job.status === JobStatus.RUNNING) {
      try {
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: JobStatus.FAILED,
            endedAt: new Date(),
            result: { error: `Worker crashed: ${error.message}` },
          },
        });
      } catch (updateError) {
        console.error(`Failed to mark job ${job.id} as failed after worker crash:`, updateError);
      }
    }
    return NextResponse.json({ message: 'Worker error.', error: error.message }, { status: 500 });
  }
}

// You might want GET as well if your scheduler uses GET
export async function GET(request: Request) {
  // Reuse POST logic or adapt if needed
  return POST(request);
}
