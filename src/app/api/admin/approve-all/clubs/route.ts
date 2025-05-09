/* eslint-disable import/prefer-default-export */
/* eslint-disable import/extensions */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { approveAllClubs } from '@/../scripts/approve-all-clubs.js'; // Adjusted path
import { protectApiRouteAsAdmin } from '@/lib/page-protection';

export async function POST(request: Request): Promise<NextResponse> {
  const authCheck = await protectApiRouteAsAdmin(request);
  if (!authCheck.authorized) {
    return authCheck.response!;
  }

  try {
    // Pass the singleton prisma client to the script function
    const count = await approveAllClubs(prisma);
    if (count === 0) {
      return NextResponse.json({ message: 'No pending clubs found to approve.', count }, { status: 200 });
    }
    return NextResponse.json({ message: `Successfully approved ${count} clubs.`, count }, { status: 200 });
  } catch (error: any) {
    console.error('[API] Error approving all clubs:', error);
    return NextResponse.json({ message: error.message || 'Failed to approve all clubs' }, { status: 500 });
  }
}
