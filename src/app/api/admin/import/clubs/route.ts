import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
// Rename import to avoid conflict with default export name
import nextAuthOptionsConfig from '@/lib/authOptions';

// Utility to check if user is admin
async function isAdminUser() {
  const session = await getServerSession(nextAuthOptionsConfig);
  return session?.user?.isAdmin === true;
}

// POST /api/admin/import/clubs
// Triggers the club scraping/import process.
// eslint-disable-next-line import/prefer-default-export
export async function POST(/* request: Request */) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  // TODO: Implement club scraping logic (call scraping service/function)
  // Consider making this asynchronous and returning 202 Accepted
  console.log('TODO: Trigger club import');
  return NextResponse.json({ message: 'Club import triggered (placeholder)' }, { status: 200 });
}
