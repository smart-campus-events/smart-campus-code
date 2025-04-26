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
  id: string;
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
      const enhancedToken = token as EnhancedToken;
      if (session.user && enhancedToken.id) {
        const sessionUser: SessionUser = {
          ...session.user,
          id: enhancedToken.id,
          isAdmin: enhancedToken.isAdmin,
        };
        return {
          ...session,
          user: sessionUser,
        };
      }
      return session;
    },
    jwt: ({ token, user }: { token: JWT; user?: NextAuthUser & { isAdmin?: boolean } }): JWT | Promise<JWT> => {
      const enhancedToken = token as EnhancedToken;

      if (user) {
        enhancedToken.id = user.id;
        enhancedToken.isAdmin = user.isAdmin;
      }

      return enhancedToken;
    },
  },
  secret: process.env.NEXTAUTH_SECRET!,
};

export default authOptions;
