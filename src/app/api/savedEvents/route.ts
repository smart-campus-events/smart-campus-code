/* eslint-disable import/prefer-default-export */
import nextAuthOptionsConfig from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // 1) ensure user is signed in
  const session = await getServerSession(nextAuthOptionsConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  // 2) load all of their RSVPs, including event details
  const rsvps = await prisma.rSVP.findMany({
    where: { userId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startDateTime: true,
          location: true,
        },
      },
    },
  });

  // 3) flatten to just the event info
  const events = rsvps.map((r) => ({
    id: r.event.id,
    title: r.event.title,
    startDateTime: r.event.startDateTime.toISOString(),
    location: r.event.location || '',
  }));

  return NextResponse.json(events);
}
