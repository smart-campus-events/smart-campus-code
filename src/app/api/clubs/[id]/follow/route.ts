// app/api/clubs/[id]/follow/route.ts

import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
/* eslint-disable max-len */

// GET the list of clubs this user follows
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clubs = await prisma.user
    .findUnique({ where: { id: session.user.id } })
    .followedClubs({ orderBy: { name: 'asc' } });

  return NextResponse.json(clubs);
}

// POST to follow a club
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      followedClubs: { connect: { id: params.id } },
    },
  });

  return NextResponse.json({ success: true });
}

// DELETE to unfollow a club
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      followedClubs: { disconnect: { id: params.id } },
    },
  });

  return NextResponse.json({ success: true });
}
