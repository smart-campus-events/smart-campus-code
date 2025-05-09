import { NextResponse } from 'next/server';
import { ContentStatus } from '@prisma/client';
import { prisma, testDatabaseConnection } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/diagnostics - check database health and content
export async function GET() {
  console.log('Running API diagnostics...');

  try {
    // Step 1: Test basic database connection
    const connectionOk = await testDatabaseConnection();

    if (!connectionOk) {
      return NextResponse.json({
        status: 'error',
        message: 'Database connection failed',
        connectionTest: 'failed',
      }, { status: 500 });
    }

    // Step 2: Check if the database tables exist and contain data
    const diagnostics = {
      connection: 'ok',
      tables: {
        users: 0,
        categories: 0,
        clubs: 0,
        events: 0,
      },
      eventStats: {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        upcoming: 0,
        past: 0,
      },
      recentEvents: [] as any[],
    };

    // Count records in main tables
    try {
      diagnostics.tables.users = await prisma.user.count();
      diagnostics.tables.categories = await prisma.category.count();
      diagnostics.tables.clubs = await prisma.club.count();
      diagnostics.tables.events = await prisma.event.count();
    } catch (error) {
      console.error('Error counting records:', error);
      return NextResponse.json({
        status: 'error',
        message: 'Error counting records',
        error: String(error),
        diagnostics,
      }, { status: 500 });
    }

    // Get event status distribution
    try {
      diagnostics.eventStats.approved = await prisma.event.count({
        where: { status: ContentStatus.APPROVED },
      });

      diagnostics.eventStats.pending = await prisma.event.count({
        where: { status: ContentStatus.PENDING },
      });

      diagnostics.eventStats.rejected = await prisma.event.count({
        where: { status: ContentStatus.REJECTED },
      });

      // Count upcoming vs past events
      const currentDate = new Date();

      diagnostics.eventStats.upcoming = await prisma.event.count({
        where: {
          status: ContentStatus.APPROVED,
          startDateTime: { gte: currentDate },
        },
      });

      diagnostics.eventStats.past = await prisma.event.count({
        where: {
          status: ContentStatus.APPROVED,
          startDateTime: { lt: currentDate },
        },
      });

      diagnostics.eventStats.total = diagnostics.tables.events;
    } catch (error) {
      console.error('Error counting event stats:', error);
    }

    // Fetch a few recent events for examination
    try {
      const recentEvents = await prisma.event.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          startDateTime: true,
          createdAt: true,
        },
      });

      diagnostics.recentEvents = recentEvents;
    } catch (error) {
      console.error('Error fetching recent events:', error);
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Diagnostics completed successfully',
      diagnostics,
    });
  } catch (error) {
    console.error('Diagnostics error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Diagnostics failed',
      error: String(error),
    }, { status: 500 });
  }
}
