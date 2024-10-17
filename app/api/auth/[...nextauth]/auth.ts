// auth.ts
import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      role?: string; // Role ekledik
      username?: string; // Username ekledik
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: string; // Role ekledik
    username?: string; // Username ekledik
  }
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { role: true },
        });
        if (dbUser && dbUser.role) {
          token.role = dbUser.role.name.toLowerCase();
        }
        token.id = user.id;
      }
      if (account && profile && profile.email) {
        token.username = profile.email.split('@')[0];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (!user || !profile || !account) return false;

      try {
        const headersList = headers();
        const ipAddress =
          headersList.get('x-forwarded-for') ||
          headersList.get('x-real-ip') ||
          'Unknown';

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email ?? '' },
          include: { accounts: true, role: true },
        });

        if (existingUser) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              lastLogin: new Date(),
              name: profile.name ?? existingUser.name,
              image: user.image ?? existingUser.image,
              username: profile.email
                ? profile.email.split('@')[0]
                : (existingUser?.username ?? 'default-username'),
              ipAddress: ipAddress,
            },
          });

          if (
            !existingUser.accounts.some(
              (acc) => acc.provider === account.provider
            )
          ) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type || 'oauth',
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            });
          }
        } else {
          const defaultRole = await prisma.role.findFirst({
            where: { name: 'user' },
          });

          if (!defaultRole) {
            throw new Error('Default role not found');
          }

          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name!,
              image: user.image,
              username: profile.email
                ? profile.email.split('@')[0]
                : 'default-username',
              ipAddress: ipAddress,
              roleId: defaultRole.id,
              accounts: {
                create: {
                  type: account.type || 'oauth',
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
            },
          });
        }

        return true;
      } catch (error) {
        console.error('Error during sign in:', error);
        return false;
      }
    },
  },
};
