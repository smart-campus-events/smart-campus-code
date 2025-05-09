import type { Session } from 'next-auth';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import nextAuthOptionsConfig from '@/lib/authOptions'; // Assuming this is your NextAuth config path

/**
 * Redirects to the sign-in page if the user session is not valid.
 */
export const loggedInProtectedPage = (session: Session | null) => {
  if (!session?.user) {
    redirect('/auth/signin');
  }
};

/**
 * Redirects to sign-in if not logged in.
 * Redirects to not-authorized if the logged-in user is not an ADMIN.
 */
export const adminProtectedPage = (session: Session | null) => {
  loggedInProtectedPage(session);
  if (session && !session.user?.isAdmin) {
    redirect('/not-authorized');
  }
};

// --- NEW FUNCTION FOR API ROUTE PROTECTION ---

interface ApiAuthCheckResult {
  authorized: boolean;
  response: NextResponse | null; // NextResponse to return if not authorized
  session: Session | null; // The session object if authorized
}

/**
 * Checks if the current session is an admin for API routes.
 * Returns an object indicating authorization status and a NextResponse for direct return if unauthorized.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export const protectApiRouteAsAdmin = async (request: Request): Promise<ApiAuthCheckResult> => {
  const session = await getServerSession(nextAuthOptionsConfig);

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json({ message: 'Unauthorized. Please sign in.' }, { status: 401 }),
      session: null,
    };
  }

  if (!session.user.isAdmin) {
    return {
      authorized: false,
      response: NextResponse.json({ message: 'Forbidden. Admin privileges required.' }, { status: 403 }),
      session,
    };
  }

  return {
    authorized: true,
    response: null,
    session, // Return the session for potential use in the API route
  };
};
