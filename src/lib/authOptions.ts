/* eslint-disable arrow-body-style */
import { prisma } from '@/lib/prisma';
import { compare } from 'bcrypt';
import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },

  // Configure providers
  providers: [
    // Google Provider Configuration (Requires ENV Variables & GCP Setup)
    // Uncomment and configure when ready
    /*
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    */

    // Credentials Provider (Email/Username + Password)
    CredentialsProvider({
      name: 'UH Email or Username',
      // Define fields for the login form
      credentials: {
        login: {
          label: '@hawaii.edu Email or Username',
          type: 'text',
          placeholder: 'user@hawaii.edu / username',
        },
        password: { label: 'Password', type: 'password' },
      },
      // Logic to authorize the user based on credentials
      async authorize(credentials) {
        if (!credentials?.login || !credentials.password) {
          console.log('Missing credentials');
          return null;
        }

        const { login, password: inputPassword } = credentials;

        // Try finding user by email OR username
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: login },
              { username: login },
            ],
          },
        });

        // User not found
        if (!user) {
          console.log('User not found for login:', login);
          return null;
        }

        // Check if user's email is @hawaii.edu
        if (!isHawaiiEmail(user.email)) {
          console.log('Credentials login attempt for non-hawaii email:', user.email);
          // Return null to deny login. You might want a specific error code/message later.
          // throw new Error("Access restricted to @hawaii.edu emails."); // Alt: throw error
          return null;
        }

        // Check if user has a password set (might be OAuth only user)
        if (!user.password) {
          console.log('User found but has no password set (likely OAuth user):', login);
          // You might want specific handling here - e.g., prompt to link account or deny
          return null; // Deny login if password doesn't exist
        }

        // Check if the provided password matches the stored hash
        const isPasswordValid = await compare(inputPassword, user.password);

        if (!isPasswordValid) {
          console.log('Invalid password for user:', login);
          return null;
        }

        console.log('Credentials valid for user:', login);
        // Return the user object expected by NextAuth
        // Important: Only return necessary, non-sensitive fields
        // The adapter handles the full user creation/linking
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          // We'll add role, isAdmin, etc. in the JWT callback
        };
      },
    }),
  ],

  // Define custom pages if needed (optional)
  pages: {
    signIn: '/auth/signin', // Use your custom sign-in page path
    // signOut: '/auth/signout',
    // error: '/auth/error', // Error code passed in query string as ?error=
    // verifyRequest: '/auth/verify-request', // Used for email verification sending page
    // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out to disable)
    // We handle new user flow via onboardingComplete flag instead
  },

  // Callbacks are crucial for customizing JWT and Session
  callbacks: {
    // Called when a JWT is created (signing in) or updated (session accessed)
    async jwt({ token, user /* , account, profile, isNewUser */ }) {
      // `user` parameter is only passed on initial sign-in
      // Add relevant user data from DB to the token
      if (user) {
        // eslint-disable-next-line no-param-reassign
        token.id = user.id; // Persist the user ID from the provider/authorize response
        // Fetch full user details from DB
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, isAdmin: true, onboardingComplete: true },
        });
        if (dbUser) {
          // eslint-disable-next-line no-param-reassign
          token.role = dbUser.role;
          // eslint-disable-next-line no-param-reassign
          token.isAdmin = dbUser.isAdmin;
          // eslint-disable-next-line no-param-reassign
          token.onboardingComplete = dbUser.onboardingComplete;
        }
      }
      return token;
    },

    // Called when a session is checked
    // The `token` object comes from the `jwt` callback
    async session({ session, token }) {
      // eslint-disable-next-line no-param-reassign
      if (token && session.user) {
        // eslint-disable-next-line no-param-reassign
        session.user.id = token.id;
        // eslint-disable-next-line no-param-reassign
        session.user.role = token.role;
        // eslint-disable-next-line no-param-reassign
        session.user.isAdmin = token.isAdmin;
        // eslint-disable-next-line no-param-reassign
        session.user.onboardingComplete = token.onboardingComplete;
      }
      return session;
    },

    // ---> ADDED: signIn callback for domain check, especially for OAuth providers <---
    async signIn({ user, account, profile }) {
      // Check applies to all providers, but primarily useful for OAuth
      // For credentials, the check is also done in authorize, but doesn't hurt to double-check here.
      let userEmail: string | null | undefined = null;

      if (account?.provider === 'google' && profile) {
        userEmail = profile.email;
      } else if (user) {
        userEmail = user.email;
      }
      // Add checks for other providers if you add them later

      if (!userEmail) {
        console.log('Could not determine email during sign-in callback');
        return false; // Prevent sign-in if email is missing
      }

      if (isHawaiiEmail(userEmail)) {
        console.log('Email check passed during sign-in:', userEmail);
        return true; // Allow sign-in
      }
      console.log('Sign-in denied by callback: Email is not @hawaii.edu:', userEmail);
      // You can redirect to an error page or return false to show a generic error
      // Example redirect: return '/auth/error?error=InvalidEmailDomain';
      return false; // Prevent sign-in
    },
    // ---> END ADDED signIn callback <---
  },

  // Add secret (required for JWT strategy and production)
  secret: process.env.NEXTAUTH_SECRET,

  // Enable debug messages in development (optional)
  debug: process.env.NODE_ENV === 'development',
};

// No need to export prisma from here, import it where needed
// export { prisma }; // Remove if it existed

export default authOptions;
