/* eslint-disable import/prefer-default-export, @typescript-eslint/naming-convention */
import authOptions from '@/lib/authOptions';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// Utility to check if user is admin
async function isAdminUser() {
  const session = (await getServerSession(authOptions)) as Session;
  return session?.user?.isAdmin === true;
}

// POST /api/admin/approve/club/[clubId]
// Approves a pending club submission.
export async function POST(
  request: Request,
  { params }: { params: { clubId: string } }
) {
  // ensure we have a typed session
  const session = (await getServerSession(authOptions)) as Session;

  // must be logged in and an admin
  if (!session?.user?.email || session.user.isAdmin !== true) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { clubId } = params;
  // TODO: Implement logic to update club status to APPROVED
  // TODO: Trigger LLM classification if needed
  console.log(`TODO: Approve club with ID: ${clubId}`);

  return NextResponse.json(
    { message: 'Club approved (placeholder)' },
    { status: 200 }
  );
}

// Maybe add DELETE for rejecting?
