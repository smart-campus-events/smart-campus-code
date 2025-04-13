'use server';

import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { hash } from 'bcryptjs';
import VerificationEmail from '../../components/emails/verification-email';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function signUp(email: string, password: string) {
  // Validate email domain
  if (!email.endsWith('@hawaii.edu')) {
    return { error: 'Only @hawaii.edu emails allowed' };
  }

  // Check existing user
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: 'User already exists' };
  }

  // Create user with verification token
  const hashedPassword = await hash(password, 12);
  const verificationToken = crypto.randomUUID();

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      verificationToken,
      tokenExpiry: new Date(Date.now() + 3600000), // 1 hour expiry
    },
  });

  // Send verification email
  await resend.emails.send({
    from: '[email protected]',
    to: email,
    subject: 'Verify your email',
    react: VerificationEmail({
      verificationLink: `http://localhost:3000/api/verify-email?token=${verificationToken}`,
    }),
  });

  return { success: true };
}

export async function verifyToken(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      verificationToken: token,
      tokenExpiry: { gt: new Date() },
    },
  });

  if (!user) return { error: 'Invalid or expired token' };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
      tokenExpiry: null,
    },
  });

  return { success: true };
}
