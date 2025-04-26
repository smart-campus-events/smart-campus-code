/* eslint-disable import/prefer-default-export, @typescript-eslint/naming-convention */
import authOptions from '@/lib/authOptions';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// Utility to check if user is admin
async function isAdminUser(): Promise<boolean> {
  const session = (await getServerSession(authOptions)) as Session;
  return session?.user?.isAdmin === true;
}

// POST /api/admin/approve/club/[clubId]
// Approves a pending club submission.
export async function POST(
  request: Request,
  { params: { clubId } }: { params: { clubId: string } },
) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // TODO: Implement logic to update club status to APPROVED
  // TODO: Trigger LLM classification if needed
  console.log(`Approving club with ID: ${clubId}`);

  return NextResponse.json(
    { message: 'Club approved' },
    { status: 200 },
  );
}

// (If you later add a DELETE for rejecting, you can do the same check there.)
