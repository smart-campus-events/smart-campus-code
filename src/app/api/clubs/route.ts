import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ContentStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma'; // Reverted: Removed .ts extension
/* eslint-disable max-len */

// GET /api/clubs - Get a list of clubs with optional filtering
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const categoryId = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const skip = (page - 1) * limit;

  try {
    // Define the where clause with explicit type
    const where: Prisma.ClubWhereInput = {
      status: ContentStatus.APPROVED,
      ...(query ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { purpose: { contains: query, mode: 'insensitive' } },
        ],
      } : {}),
      ...(categoryId ? {
        categories: {
          some: {
            categoryId,
          },
        },
      } : {}),
    };

    // Execute the query with pagination using the prisma instance
    const clubs = await prisma.club.findMany({
      where,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            favoritedBy: true,
            hostedEvents: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      skip,
      take: limit,
    });

    // Get total count for pagination using the prisma instance
    const total = await prisma.club.count({ where });

    return NextResponse.json({
      clubs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clubs' },
      { status: 500 },
    );
  }
}

// POST /api/clubs - Create a new club (requires authentication)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    // Check if user is authenticated
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const data = await request.json();

    const {
      name,
      logoUrl,
      purpose,
      primaryContactName,
      contactEmail,
      websiteUrl,
      instagramUrl,
      facebookUrl,
      twitterUrl,
      meetingTime,
      meetingLocation,
      joinInfo,
      categoryIds,
    } = data;

    // Validate required fields
    if (!name || !purpose) {
      return NextResponse.json(
        { error: 'Name and purpose are required' },
        { status: 400 },
      );
    }

    // Check for duplicate club name using the prisma instance
    const existingClub = await prisma.club.findUnique({
      where: { name },
    });

    if (existingClub) {
      return NextResponse.json(
        { error: 'A club with this name already exists' },
        { status: 409 },
      );
    }

    // Get user ID from session using the prisma instance
    const userEmail = session.user.email;
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, isAdmin: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    // Determine status based on user role
    const status = user.isAdmin ? ContentStatus.APPROVED : ContentStatus.PENDING;

    // Prepare category connections
    const categoryConnectOrCreate = categoryIds && categoryIds.length > 0
      ? categoryIds.map((categoryId: string) => ({
        categoryId,
      }))
      : [];

    // Create the club using the prisma instance
    const club = await prisma.club.create({
      data: {
        name,
        logoUrl,
        purpose,
        primaryContactName,
        contactEmail,
        websiteUrl,
        instagramUrl,
        facebookUrl,
        twitterUrl,
        meetingTime,
        meetingLocation,
        joinInfo,
        status,
        submittedByUserId: user.id,
        categories: {
          create: categoryConnectOrCreate,
        },
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json(club, { status: 201 });
  } catch (error) {
    console.error('Error creating club:', error);
    // Handle potential Prisma errors more gracefully
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Example: Unique constraint violation
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A club with this name might already exist.' },
          { status: 409 },
        );
      }
    }
    return NextResponse.json(
      { error: 'Failed to create club' },
      { status: 500 },
    );
  }
}
