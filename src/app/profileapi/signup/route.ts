/* eslint-disable import/prefer-default-export, @typescript-eslint/naming-convention */

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';

// POST /api/signup
export async function POST(req: Request) {
  try {
    const { email, password, first_name, last_name } = await req.json();

    // Validate input
    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'Email, password, first name, and last name are required.' },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'User already exists.' },
        { status: 400 },
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        first_name,
        last_name, // ✅ include this in the DB insert
      },
    });

    // Return success
    return NextResponse.json(
      { ok: true, user: { id: user.id, email: user.email } },
      { status: 201 },
    );
  } catch (err: any) {
    console.error('[Signup Error]', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 },
    );
  }
}
