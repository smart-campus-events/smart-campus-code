import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ContentStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
/* eslint-disable max-len */

export const dynamic = 'force-dynamic';

// GET /api/clubs/[id] - Get details for a specific club
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  try {
    const club = await prisma.club.findUnique({
      where: { id },
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
        hostedEvents: {
          where: {
            startDateTime: { gte: new Date() }, // Only future events
            status: ContentStatus.APPROVED,
          },
          orderBy: { startDateTime: 'asc' },
          take: 5, // Limit number of displayed events
        },
        _count: {
          select: {
            favoritedBy: true,
            hostedEvents: true,
          },
        },
      },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // For non-approved clubs, only allow access for admin or the submitter
    if (club.status !== ContentStatus.APPROVED) {
      const session = await getServerSession(); // TODO: Pass authOptions if needed
      const userEmail = session?.user?.email;
      const user = userEmail ? await prisma.user.findUnique({ where: { email: userEmail }, select: { id: true, isAdmin: true } }) : null;

      if (!user || (!user.isAdmin && user.id !== club.submittedByUserId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(club);
  } catch (error) {
    console.error(`Error fetching club ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch club' },
      { status: 500 },
    );
  }
}

// PUT /api/clubs/[id] - Update a specific club (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const session = await getServerSession(); // TODO: Pass authOptions if needed

  // 1. Authorization: Check if user is admin
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true },
  });
  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const data = await request.json();
    const {
      name,
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
      status, // Allow admin to change status (e.g., approve pending)
      categoryIds,
    } = data;

    // Validate status if provided
    if (status && !Object.values(ContentStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // Check if the club exists
    const existingClub = await prisma.club.findUnique({
      where: { id },
      // Include categories to disconnect them later if needed
      include: { categories: true },
    });
    if (!existingClub) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Prevent changing name if it conflicts with another existing club
    if (name && name !== existingClub.name) {
      const conflictClub = await prisma.club.findUnique({ where: { name } });
      if (conflictClub && conflictClub.id !== id) {
        return NextResponse.json({ error: 'Another club with this name already exists' }, { status: 409 });
      }
    }

    // Prepare category updates using connect/disconnect or set
    const categoryUpdateOperations: Prisma.ClubCategoryUncheckedUpdateManyWithoutClubNestedInput = {};
    if (categoryIds !== undefined) { // Only update categories if categoryIds is explicitly provided (can be empty array)
      categoryUpdateOperations.set = categoryIds.map((categoryId: string) => ({
        clubId: id, // Explicitly provide clubId for the relation
        categoryId,
      }));
    }

    // Prepare data for update, excluding categoryIds field itself
    const updateData: Prisma.ClubUpdateInput = {
      name,
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
      categories: categoryUpdateOperations,
    };

    // Update the club
    const updatedClub = await prisma.club.update({
      where: { id },
      data: updateData,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json(updatedClub);
  } catch (error) {
    console.error(`Error updating club ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Update failed due to a conflict (e.g., duplicate name)' }, { status: 409 });
    }
    return NextResponse.json(
      { error: 'Failed to update club' },
      { status: 500 },
    );
  }
}

// DELETE /api/clubs/[id] - Delete a specific club (Admin only)
export async function DELETE(
  request: NextRequest, // request is unused but required by Next.js route handler signature
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const session = await getServerSession(); // TODO: Pass authOptions if needed

  // 1. Authorization: Check if user is admin
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true },
  });
  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    // Check if the club exists before attempting delete
    const existingClub = await prisma.club.findUnique({ where: { id } });
    if (!existingClub) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Delete the club
    // Note: Related ClubCategory entries are automatically deleted due to onDelete: Cascade in schema
    await prisma.club.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Club deleted successfully' }, { status: 200 }); // Use 200 or 204 (No Content)
  } catch (error) {
    console.error(`Error deleting club ${id}:`, error);
    // Handle potential errors, e.g., if related records prevent deletion unexpectedly
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2014: The change you are trying to make would violate the required relation between models
      // P2003: Foreign key constraint failed on the field... (e.g., trying to delete a club with existing events)
      if (error.code === 'P2014' || error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Cannot delete club, it might be associated with other records (e.g., events).' },
          { status: 409 }, // Conflict status
        );
      }
    }
    return NextResponse.json(
      { error: 'Failed to delete club' },
      { status: 500 },
    );
  }
}
