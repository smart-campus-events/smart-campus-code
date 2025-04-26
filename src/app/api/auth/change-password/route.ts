import nextAuthOptionsConfig from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcrypt';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

const SALT_ROUNDS = 10; // Consistent salt rounds

// Extend Session type inline to include user.id
type SessionWithId = Session & { user: Session['user'] & { id: string } };

// eslint-disable-next-line import/prefer-default-export
export async function POST(request: Request) {
  // inline-cast to SessionWithId so TS knows user.id exists
  const session = (await getServerSession(nextAuthOptionsConfig)) as SessionWithId;
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await request.json();

    // Basic validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) { // Example minimum length validation
      return NextResponse.json(
        { message: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Get current user from DB
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.password) {
      // User not found or doesn't have a password set (e.g., OAuth user)
      return NextResponse.json(
        { message: 'User not found or password not set' },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      // Return 403 Forbidden for incorrect password
      return NextResponse.json(
        { message: 'Incorrect current password' },
        { status: 403 }
      );
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update the user's password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: newPasswordHash },
    });

    return NextResponse.json(
      { message: 'Password changed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to change password:', error);
    // Distinguish between JSON parsing errors and others
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: 'Invalid request body' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to change password' },
      { status: 500 }
    );
  }
}
