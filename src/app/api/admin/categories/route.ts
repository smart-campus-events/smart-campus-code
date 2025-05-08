// src/app/api/admin/categories/route.ts
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { Prisma } from '@prisma/client'; // Import Prisma namespace
import nextAuthOptionsConfig from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

// Utility to check if user is admin
async function isAdminUser(): Promise<boolean> {
  const session = (await getServerSession(nextAuthOptionsConfig)) as Session;
  return session?.user?.isAdmin === true;
}

// POST /api/admin/categories
// Creates a new category.
// eslint-disable-next-line import/prefer-default-export
export async function POST(request: Request) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const categoryName = body.name;

    if (!categoryName || typeof categoryName !== 'string' || categoryName.trim() === '') {
      return NextResponse.json({ message: 'Category name is required.' }, { status: 400 });
    }

    const newCategory = await prisma.category.create({
      data: {
        name: categoryName.trim(),
      },
    });

    console.log(`Admin created category ${newCategory.id} (${newCategory.name})`);
    return NextResponse.json(newCategory, { status: 201 }); // 201 Created
  } catch (error: any) {
    console.error('Failed to create category:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    // Handle unique constraint violation (P2002) for the name field
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const body = await request.json(); // Ensure body is defined here
      return NextResponse.json({
        message: `Category name "${body.name}" already exists.` }, { status: 409 }); // 409 Conflict
    }
    return NextResponse.json({ message: 'Failed to create category', error: error.message }, { status: 500 });
  }
}
