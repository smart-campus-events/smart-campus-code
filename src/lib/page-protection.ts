import type { Session } from 'next-auth';
import { redirect } from 'next/navigation';

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
