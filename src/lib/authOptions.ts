/* eslint-disable arrow-body-style */
import { prisma } from '@/lib/prisma';
import { compare } from 'bcrypt';
import type { NextAuthOptions, User as NextAuthUser, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

interface SessionUser extends NextAuthUser {
  id: string;
  isAdmin?: boolean;
}

interface EnhancedToken extends JWT {
  id?: string; // Make id optional initially
  isAdmin?: boolean;
}

const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          scope: 'openid email profile',
        },
      },
      async profile(profile) {
        const dbUser = await prisma.user.findUnique({
          where: { email: profile.email },
        });
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          isAdmin: dbUser?.isAdmin ?? false,
        };
      },
    }),
    CredentialsProvider({
      name: 'Email and Password',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'john@foo.com',
        },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        if (!credentials?.email || !credentials.password) {
          return null;
        }
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });
        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
          isAdmin: user.isAdmin,
        } as NextAuthUser;
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    //   error: '/auth/error',
    //   verifyRequest: '/auth/verify-request',
    //   newUser: '/auth/new-user'
  },
  callbacks: {
    session: ({ session, token }: { session: Session; token: JWT }): Session => {
      console.log('--- Session Callback ---'); // DEBUG
      console.log('Token:', JSON.stringify(token, null, 2)); // DEBUG
      const enhancedToken = token as EnhancedToken; // Keep your EnhancedToken type or similar
      if (session.user && enhancedToken.id) {
        // Explicitly type session.user to allow adding properties
        const sessionUser = session.user as SessionUser;
        sessionUser.id = enhancedToken.id;
        sessionUser.isAdmin = enhancedToken.isAdmin; // Transfer from token

        // console.log("User being added to session:", JSON.stringify(sessionUser, null, 2)); // DEBUG
        console.log('Final Session Object:', JSON.stringify(session, null, 2)); // DEBUG
        return session; // Return the modified session
      }
      console.log('Session unmodified.'); // DEBUG
      return session;
    },
    jwt: ({
      token,
      user,
    }: {
      token: JWT;
      user?: (NextAuthUser & { isAdmin?: boolean });
    }): JWT | Promise<JWT> => {
      console.log('--- JWT Callback ---'); // DEBUG
      // Log only on initial sign in when user object is present
      if (user) {
        console.log('User object present (sign-in):', JSON.stringify(user, null, 2)); // DEBUG
        const enhancedToken = token as EnhancedToken;
        enhancedToken.id = user.id;
        enhancedToken.isAdmin = user.isAdmin; // Assign isAdmin from user obj
        console.log('Token after adding user data:', JSON.stringify(enhancedToken, null, 2)); // DEBUG
        return enhancedToken;
      }
      // console.log("Token (no user obj):", JSON.stringify(token, null, 2)); // DEBUG: Can be noisy
      return token; // Return previous token if no user object (session validation)
    },
  },
  secret: process.env.NEXTAUTH_SECRET!,
};

export default authOptions;

// Removed duplicate declaration of EnhancedToken
