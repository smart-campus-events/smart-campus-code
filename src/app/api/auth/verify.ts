// pages/api/auth/verify.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.body;
  const user = await prisma.user.findFirst({ where: { verifyToken: token } });
  if (!user) return res.status(400).json({ message: 'Invalid token' });
  if (user.verifyTokenExpiry < new Date()) return res.status(400).json({ message: 'Token expired' });

  await prisma.user.update({
    where: { id: user.id },
    data: { verified: true, verifyToken: null, verifyTokenExpiry: null },
  });

  res.status(200).json({ message: '✅ Email verified! You can now sign in.' });
}
