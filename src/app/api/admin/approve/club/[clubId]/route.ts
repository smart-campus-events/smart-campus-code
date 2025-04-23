import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import nextAuthOptionsConfig from '@/lib/authOptions';

// Utility to check if user is admin
async function isAdminUser() {
  const session = await getServerSession(nextAuthOptionsConfig);
  return session?.user?.isAdmin === true;
}

// POST /api/admin/approve/club/[clubId]
// Approves a pending club submission.
// eslint-disable-next-line import/prefer-default-export
export async function POST(request: Request, { params }: { params: { clubId: string } }) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { clubId } = params;
  // TODO: Implement logic to update club status to APPROVED
  // TODO: Trigger LLM classification if needed
  console.log(`TODO: Approve club with ID: ${clubId}`);
  return NextResponse.json({ message: 'Club approved (placeholder)' }, { status: 200 });
}

// Maybe add DELETE for rejecting?
