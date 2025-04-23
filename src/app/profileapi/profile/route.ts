// src/app/profileapi/profile/route.ts

import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // 1) Verify session
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // 2) Fetch user profile + interests
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      name: true,
      first_name: true,
      email: true,
      major: true,
      avatar_url: true,
      interests: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // 3) Return profile JSON
  return NextResponse.json(user, { status: 200 });
}

export async function PATCH(req: Request) {
  // 1) Verify session
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // 2) Parse request body, defaulting interests to []
  const {
    major,
    interests = [],
    graduation_year,
    origin,
    housing_status,
    comfort_level,
  }: {
    major?: string;
    interests?: string[];
    graduation_year?: number;
    origin?: string;
    housing_status?: string;
    comfort_level?: number;
  } = await req.json();

  // 3) Build up data object
  const dataToUpdate: any = {};

  if (major !== undefined) {
    dataToUpdate.major = major;
  }

  if (interests.length > 0) {
    // Upsert each interest → get back its id
    const upserted = await Promise.all(
      interests.map((name) =>
        prisma.interest.upsert({
          where: { name },
          update: {},
          create: { name },
          select: { id: true },
        })
      )
    );
    dataToUpdate.interests = {
      set: upserted.map((i) => ({ id: i.id })),
    };
  }

  if (graduation_year !== undefined) {
    dataToUpdate.graduation_year = graduation_year;
  }
  if (origin !== undefined) {
    dataToUpdate.origin = origin;
  }
  if (housing_status !== undefined) {
    dataToUpdate.housing_status = housing_status;
  }
  if (comfort_level !== undefined) {
    dataToUpdate.comfort_level = comfort_level;
  }

  try {
    // 4) Apply update
    await prisma.user.update({
      where: { email: session.user.email },
      data: dataToUpdate,
    });

    // 5) Return empty JSON on success so client can call res.json()
    return NextResponse.json({}, { status: 200 });
  } catch (err: any) {
    console.error('Profile PATCH Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
