import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ContentStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/categories
// Fetches the list of all available categories with counts for clubs and/or events
// Optional query param: ?context=events or ?context=clubs
/* eslint-disable import/prefer-default-export, no-underscore-dangle */
export async function GET(request: NextRequest) {
  try {
    const context = request.nextUrl.searchParams.get('context');

    // Get categories with appropriate counts based on context
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            // Always include clubs count for backward compatibility
            clubs: {
              where: {
                club: {
                  status: ContentStatus.APPROVED,
                },
              },
            },
            // Also include events count
            events: {
              where: {
                event: {
                  status: ContentStatus.APPROVED,
                },
              },
            },
          },
        },
      },
    });

    // Format the response to include counts based on context
    const formattedCategories = categories.map(category => {
      // Determine which count to use as the primary count based on context
      const count = context === 'events'
        ? category._count.events
        : category._count.clubs;

      return {
        id: category.id,
        name: category.name,
        count,
        clubCount: category._count.clubs,
        eventCount: category._count.events,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      };
    });

    return NextResponse.json({
      categories: formattedCategories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 },
    );
  }
}

// Optional: Add POST/PUT/DELETE for admin management if needed
