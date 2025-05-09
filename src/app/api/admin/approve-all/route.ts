/* eslint-disable import/extensions */
/* eslint-disable import/prefer-default-export */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
// import { PrismaClient } from '@prisma/client'; // Remove direct import
import { prisma } from '@/lib/prisma'; // Import the singleton instance
import { approveAllEvents } from '../../../../../scripts/approve-all-events.js';
import { approveAllClubs } from '../../../../../scripts/approve-all-clubs.js';

// const prisma = new PrismaClient(); // Remove local instantiation

// Helper function to check if user is admin
async function isAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true, role: true },
  });

  return user?.isAdmin === true || user?.role === 'ADMIN';
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'You must be signed in to perform this action' },
        { status: 401 },
      );
    }

    // Get user from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    // Check if user is an admin
    const admin = await isAdmin(user.id);
    if (!admin) {
      return NextResponse.json(
        { error: 'Only admins can perform this action' },
        { status: 403 },
      );
    }

    // Parse request to determine what to approve
    const { type } = await request.json();

    if (!type || (type !== 'events' && type !== 'clubs')) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "events" or "clubs"' },
        { status: 400 },
      );
    }

    let count: number | undefined = 0;

    // Call appropriate function based on type
    if (type === 'events') {
      count = await approveAllEvents(prisma);
    } else if (type === 'clubs') {
      count = await approveAllClubs(prisma);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully approved ${count} ${type}`,
      count,
    });
  } catch (error) {
    console.error('Error in admin approval endpoint:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 },
    );
  } finally {
    // The singleton prisma instance should not be disconnected here,
    // as it's managed globally by src/lib/prisma.ts.
    // await prisma.$disconnect(); // DO NOT DISCONNECT THE SINGLETON HERE
  }
}
