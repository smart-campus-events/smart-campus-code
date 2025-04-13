export async function GET() {
  await prisma.user.deleteMany({
    where: { tokenExpiry: { lt: new Date() } },
  });
  return Response.json({ success: true });
}
