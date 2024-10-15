import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.role = user.roleId;
        token.id = user.id;
      }
      if (account && profile) {
        token.username = profile.email?.split('@')[0];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (!user || !profile || !account) return false;

      try {
        const headersList = headers();
        const ipAddress = headersList.get('x-forwarded-for') || 
                          headersList.get('x-real-ip') || 
                          'Unknown';

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true },
        });

        if (existingUser) {
          // Kullanıcı zaten kayıtlı, gerekli güncellemeleri yap
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              lastLogin: new Date(),
              name: profile.name ?? existingUser.name,
              image: user.image ?? existingUser.image,
              username: profile.email?.split('@')[0] ?? existingUser.username,
              ipAddress: ipAddress,
            },
          });

          // Hesap kaydı yoksa ekle
          if (!existingUser.accounts.some(acc => acc.provider === account.provider)) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type || "oauth",
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            });
          }
        } else {
          // Yeni kullanıcı, tüm bilgileri ile kaydet
          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              name: profile.name,
              image: user.image,
              lastLogin: new Date(),
              username: profile.email?.split('@')[0],
              ipAddress: ipAddress,
              accounts: {
                create: {
                  type: account.type || "oauth",
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
            },
          });
        }

        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return false;
      }
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
