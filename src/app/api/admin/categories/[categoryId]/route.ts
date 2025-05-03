// src/app/api/admin/categories/[categoryId]/route.ts
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { Prisma } from '@prisma/client';
import nextAuthOptionsConfig from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

// Utility to check if user is admin
async function isAdminUser(): Promise<boolean> {
  const session = (await getServerSession(nextAuthOptionsConfig)) as Session;
  return session?.user?.isAdmin === true;
}

// --- DELETE Handler (Delete Category with Safety Check) ---
/* eslint-disable no-underscore-dangle */
// eslint-disable-next-line import/prefer-default-export
export async function DELETE(
  request: Request, // Added request parameter
  { params: { categoryId } }: { params: { categoryId: string } },
) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!categoryId) {
    return NextResponse.json({ message: 'Category ID is required.' }, { status: 400 });
  }

  try {
    // *** SAFETY CHECK: Ensure category is not linked before deleting ***
    const linkedItems = await prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        _count: { // Use _count to efficiently check relations
          select: {
            clubs: true,
            events: true,
            userInterests: true,
          },
        },
      },
    });

    if (!linkedItems) {
      return NextResponse.json({ message: 'Category not found.' }, { status: 404 });
    }

    const inUse = linkedItems._count.clubs > 0 || linkedItems._count.events > 0 || linkedItems._count.userInterests > 0;

    if (inUse) {
      console.warn(`Admin attempted to delete category ${categoryId} which is still in use.`);
      // Construct a more detailed message
      const details = [];
      if (linkedItems._count.clubs > 0) details.push(`${linkedItems._count.clubs} clubs`);
      if (linkedItems._count.events > 0) details.push(`${linkedItems._count.events} events`);
      if (linkedItems._count.userInterests > 0) details.push(`${linkedItems._count.userInterests} user interests`);

      return NextResponse.json({
        message: `Cannot delete category: It is linked to ${details.join(', ')}.`,
      }, { status: 409 }); // 409 Conflict - Cannot delete due to dependencies
    }
    // *********************************************************************

    // If not in use, proceed with deletion
    await prisma.category.delete({
      where: { id: categoryId },
    });

    console.log(`Admin deleted category ${categoryId}`);
    return new Response(null, { status: 204 }); // 204 No Content
  } catch (error: any) {
    console.error(`Failed to delete category ${categoryId}:`, error);
    // Handle 'Record to delete not found' error (P2025) - Although checked above, good practice
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ message: 'Category not found during delete attempt.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to delete category', error: error.message }, { status: 500 });
  }
}

// No PATCH handler needed as editing is excluded
