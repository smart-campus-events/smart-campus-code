// pages/api/auth/signup.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import sendVerificationEmail from '../../../lib/mail';
import { prisma } from '../../../lib/prisma'; // or your DB client

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password } = req.body;

  // 1) check if user exists
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(400).json({ message: 'Email already in use' });

  // 2) hash password
  const hashed = await hash(password, 12);

  // 3) create user with verified=false
  const token = uuidv4();
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      verified: false,
      verifyToken: token,
      verifyTokenExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h
    },
  });

  // 4) send email
  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify?token=${token}`;
  await sendVerificationEmail(email, verifyUrl);

  return res.status(200).json({ message: 'Signup OK, email sent' });
}
