import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/events/[id] - Get a single event by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  try {
    // Fetch the event with its related data
    const event = await prisma.event.findUnique({
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
        organizerClub: true,
        _count: {
          select: {
            rsvps: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error(`Error fetching event ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 },
    );
  }
} 