import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/categories
// Fetches the list of all available categories.
// eslint-disable-next-line import/prefer-default-export
export async function GET(/* request: Request */) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json({ message: 'Failed to fetch categories' }, { status: 500 });
  }
}

// Optional: Add POST/PUT/DELETE for admin management if needed
