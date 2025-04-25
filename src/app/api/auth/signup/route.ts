import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '@/lib/prisma.ts'; // Added .ts extension and reordered

// Basic validation schema
const signupSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  // Add other fields if needed, ensure they match frontend requirements
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input.', errors: validation.error.flatten().fieldErrors },
        { status: 400 }, // Added trailing comma
      );
    }

    const { email, password } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists.' },
        { status: 409 }, // Conflict, Added trailing comma
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds = 10

    // Create the new user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        // role: 'USER', // Prisma schema sets default, so this is optional
      },
    });

    // Don't send back the password hash
    // Renamed _ to unusedPassword
    const { password: unusedPassword, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      { message: 'User created successfully.', user: userWithoutPassword },
      { status: 201 }, // Created, Added trailing comma
    );
  } catch (error) {
    console.error('Signup API Error:', error);
    // Generic error for security
    return NextResponse.json(
      { message: 'An unexpected error occurred.' },
      { status: 500 }, // Added trailing comma
    );
  }
}