import type { DefaultSession, DefaultUser } from 'next-auth';

// Extend the built-in session types
declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user?: {
      id: string; // Add the user ID
      isAdmin?: boolean; // Add the isAdmin flag
    } & DefaultSession['user']; // Keep the default properties
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * available in the `jwt` and `session` callbacks, etc.
   * Add the properties here if you want them available directly on the User type.
   */
  interface User extends DefaultUser {
    isAdmin?: boolean; // Add isAdmin flag to the base User type if needed elsewhere
  }
}

// Extend the JWT type if you need to augment it directly (often not needed if session callback handles it)
// declare module 'next-auth/jwt' {
//   interface JWT {
//     id: string;
//     isAdmin?: boolean;
//   }
// }
