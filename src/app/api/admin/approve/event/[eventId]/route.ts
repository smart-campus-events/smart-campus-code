/* eslint-disable import/prefer-default-export, @typescript-eslint/naming-convention */
import nextAuthOptionsConfig from '@/lib/authOptions';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// Utility to check if user is admin
async function isAdminUser(): Promise<boolean> {
  const session = (await getServerSession(nextAuthOptionsConfig)) as Session;
  return Boolean(session?.user?.email && session.user.isAdmin);
}

// POST /api/admin/approve/event/[eventId]
// Approves a pending event submission.
export async function POST(
  request: Request,
  { params: { eventId } }: { params: { eventId: string } },
) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // TODO: Implement logic to update event status to APPROVED
  // TODO: Trigger LLM classification if needed
  console.log(`Approving event with ID: ${eventId}`);

  return NextResponse.json(
    { message: 'Event approved' },
    { status: 200 },
  );
}

// (When you add a DELETE for rejecting, just reuse isAdminUser there too.)
