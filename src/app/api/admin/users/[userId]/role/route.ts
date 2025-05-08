// src/app/api/admin/users/[userId]/role/route.ts
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import nextAuthOptionsConfig from '@/lib/authOptions';

// Utility to get current admin session (including ID)
async function getCurrentAdminSession(): Promise<(Session & { user: { id: string } }) | null> {
  const session = (await getServerSession(nextAuthOptionsConfig)) as Session & {
    user: { id: string; isAdmin?: boolean };
  };
  if (session?.user?.isAdmin === true && session.user.id) {
    return session;
  }
  return null;
}

// PATCH /api/admin/users/[userId]/role
// Updates the isAdmin status for a specific user.
// eslint-disable-next-line import/prefer-default-export
export async function PATCH(
  request: Request,
  { params: { userId } }: { params: { userId: string } },
) {
  const adminSession = await getCurrentAdminSession();

  if (!adminSession) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // --- Self-Modification Check ---
  if (adminSession.user.id === userId) {
    return NextResponse.json(
      { message: 'Admins cannot change their own admin status.' },
      { status: 403 },
    ); // 403 Forbidden
  }
  // -------------------------------

  try {
    const body = await request.json();
    const newIsAdminStatus = body.isAdmin;

    // Validate input
    if (typeof newIsAdminStatus !== 'boolean') {
      return NextResponse.json(
        { message: 'Invalid or missing isAdmin value (must be true or false).' },
        { status: 400 },
      );
    }

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
    }

    // Ensure user exists before trying to update
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ message: 'Target user not found.' }, { status: 404 });
    }

    // Update the user's isAdmin status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin: newIsAdminStatus },
      select: { // Only return necessary fields
        id: true,
        email: true,
        isAdmin: true,
      },
    });

    console.log(`Admin ${adminSession.user.email} updated isAdmin status for user ${userId} to ${newIsAdminStatus}`);
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to update admin role for user ${userId}:`, error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    // Handle Prisma 'Record to update not found' - though we check above
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Target user not found during update.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to update user admin status', error: error.message }, { status: 500 });
  }
}
