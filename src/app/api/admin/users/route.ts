// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import nextAuthOptionsConfig from '@/lib/authOptions';

// Utility to check if user is admin
async function isAdminUser(): Promise<boolean> {
  const session = (await getServerSession(nextAuthOptionsConfig)) as Session;
  return session?.user?.isAdmin === true;
}

// GET /api/admin/users
// Fetches a paginated list of users for the admin dashboard.
// eslint-disable-next-line import/prefer-default-export
export async function GET(request: Request) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '15', 10); // Adjust limit as needed
  const searchQuery = searchParams.get('search') || ''; // Optional search query

  const skip = (page - 1) * limit;

  // Basic search filter (adjust fields as needed)
  const whereClause: any = searchQuery
    ? {
      OR: [
        { email: { contains: searchQuery, mode: 'insensitive' } },
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { firstName: { contains: searchQuery, mode: 'insensitive' } },
        { lastName: { contains: searchQuery, mode: 'insensitive' } },
      ],
    }
    : {};

  try {
    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }, // Or order by name/email
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        // Add any other fields useful for display context if needed
        // e.g., emailVerified: true
      },
    });

    // Get total count for pagination based on the same filter
    const totalUsers = await prisma.user.count({ where: whereClause });

    return NextResponse.json(
      {
        data: users,
        pagination: {
          page,
          limit,
          totalItems: totalUsers,
          totalPages: Math.ceil(totalUsers / limit),
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Failed to fetch admin users list:', error);
    return NextResponse.json({ message: 'Failed to fetch users', error: error.message }, { status: 500 });
  }
}
