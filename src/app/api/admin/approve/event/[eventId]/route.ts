/* eslint-disable import/prefer-default-export, @typescript-eslint/naming-convention */
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
// Rename import to avoid conflict with default export name
import nextAuthOptionsConfig from '@/lib/authOptions';

// Utility to check if user is admin
async function isAdminUser() {
  const session = (await getServerSession(nextAuthOptionsConfig)) as Session;
  return session?.user?.isAdmin === true;
}

// POST /api/admin/approve/event/[eventId]
// Approves a pending event submission.
// eslint-disable-next-line import/prefer-default-export
export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  // ensure we have a typed session
  const session = (await getServerSession(nextAuthOptionsConfig)) as Session;

  // must be logged in and an admin
  if (!session?.user?.email || session.user.isAdmin !== true) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { eventId } = params;
  // TODO: Implement logic to update event status to APPROVED
  // TODO: Trigger LLM classification if needed
  console.log(`TODO: Approve event with ID: ${eventId}`);

  return NextResponse.json(
    { message: 'Event approved (placeholder)' },
    { status: 200 }
  );
}

// Maybe add DELETE for rejecting?
