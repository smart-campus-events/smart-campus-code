// src/app/api/admin/categories/[categoryId]/route.ts
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { Prisma } from '@prisma/client';
import nextAuthOptionsConfig from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

// Utility to check if user is admin (keep this)
async function isAdminUser(): Promise<boolean> {
  const session = (await getServerSession(nextAuthOptionsConfig)) as Session;
  return session?.user?.isAdmin === true;
}

// Keep the PATCH handler if you had it, or remove if sticking to add/delete only

// --- DELETE Handler (Deletes Category and its links) ---
// eslint-disable-next-line import/prefer-default-export
export async function DELETE(
  request: Request,
  { params: { categoryId } }: { params: { categoryId: string } },
) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!categoryId) {
    return NextResponse.json({ message: 'Category ID is required.' }, { status: 400 });
  }

  try {
    // Use a transaction to ensure atomicity: either everything succeeds or nothing changes.
    await prisma.$transaction(async (tx) => {
      // 1. Delete links from join tables first
      //    (These won't throw if no records match the categoryId)
      await tx.eventCategory.deleteMany({
        where: { categoryId },
      });
      await tx.clubCategory.deleteMany({
        where: { categoryId },
      });
      await tx.userInterest.deleteMany({
        where: { categoryId },
      });

      // 2. Now delete the category itself
      //    This might throw P2025 if the category was already deleted
      //    between the check and now, but the transaction handles rollback.
      await tx.category.delete({
        where: { id: categoryId },
      });
    });

    console.log(`Admin deleted category ${categoryId} and its associations.`);
    return new Response(null, { status: 204 }); // 204 No Content
  } catch (error: any) {
    console.error(`Failed to delete category ${categoryId}:`, error);
    // Handle 'Record to delete does not exist' error (P2025) more gracefully
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      // Check if the error message indicates the Category was not found
      // (Prisma error messages can sometimes be specific)
      // If the category delete failed, it implies it didn't exist.
      return NextResponse.json({ message: 'Category not found.' }, { status: 404 });
    }
    // Handle other potential errors during the transaction
    return NextResponse.json({ message: 'Failed to delete category', error: error.message }, { status: 500 });
  }
}

// Remember to remove the PATCH handler from this file if you only want Add/Delete functionality.
