/* eslint-disable import/prefer-default-export, @typescript-eslint/naming-convention */
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// ================= GET ==================

export async function GET() {
  const session = await getServerSession(authOptions) as Session;

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        major: true,
        graduationYear: true,
        interests: {
          select: { category: { select: { id: true, name: true } } },
        },
        age_range: true,
        origin: true,
        housingStatus: true,
        comfortLevel: true,
        about_me: true,
        emailNotifications: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const interests = user.interests.map((ui) => ({
      id: ui.category.id,
      name: ui.category.name,
    }));

    return NextResponse.json({ ...user, interests });
  } catch (err: any) {
    console.error('❌ GET /api/profileapi/profile error:', err);
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 },
    );
  }
}

// ================= PATCH ==================

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions) as Session;

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch (parseErr) {
    console.error('❌ PATCH /api/profileapi/profile: invalid JSON', parseErr);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('🛠️ PATCH /api/profileapi/profile body:', body);

  const {
    firstName,
    lastName,
    major,
    interests,
    age_range,
    origin,
    housing_status,
    comfort_level,
    about_me,
  } = body;

  const updateData: any = {};

  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (major) updateData.major = major;
  if (age_range) updateData.age_range = age_range;
  if (origin) updateData.origin = origin;
  if (housing_status) updateData.housingStatus = housing_status;
  if (typeof comfort_level !== 'undefined') updateData.comfortLevel = comfort_level;
  if (typeof about_me !== 'undefined') updateData.about_me = about_me;

  if (Array.isArray(interests)) {
    if (interests.length > 0) {
      updateData.interests = {
        deleteMany: {},
        create: interests.map((name: string) => ({
          category: {
            connectOrCreate: {
              where: { name },
              create: { name },
            },
          },
        })),
      };
    } else {
      console.warn('⚠️ Interests provided but empty array, skipping interests update.');
    }
  }

  if (Object.keys(updateData).length === 0) {
    console.error('🚨 PATCH /api/profileapi/profile: No valid fields to update.');
    return NextResponse.json(
      { error: 'No valid fields provided to update.' },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
      include: {
        interests: { include: { category: true } },
      },
    });

    const flattenedInterests = updated.interests.map((ui) => ({
      id: ui.category.id,
      name: ui.category.name,
    }));

    return NextResponse.json({
      firstName: updated.firstName,
      lastName: updated.lastName,
      major: updated.major,
      interests: flattenedInterests,
      age_range: updated.age_range,
      origin: updated.origin,
      housingStatus: updated.housingStatus,
      comfortLevel: updated.comfortLevel,
      about_me: updated.about_me,
    });
  } catch (err: any) {
    console.error('❌ PATCH /api/profileapi/profile update error:', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}
