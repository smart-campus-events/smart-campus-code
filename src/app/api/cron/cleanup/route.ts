import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function GET() {
  await prisma.user.deleteMany({
    where: { tokenExpiry: { lt: new Date() } },
  });
  return Response.json({ success: true });
}
