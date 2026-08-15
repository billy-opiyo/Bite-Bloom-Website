import "server-only";

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";
import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { getPrismaClient } from "./prisma";

async function getUserAccess(userId: string): Promise<{ roles: string[]; permissions: string[] }> {
  const user = await getPrismaClient().user.findUnique({
    where: { id: userId },
    select: { roles: { select: { role: { select: { key: true, permissions: { select: { permission: { select: { key: true } } } } } } } } },
  });
  const roles = user?.roles.map(({ role }) => role.key) ?? [];
  const permissions = Array.from(new Set(user?.roles.flatMap(({ role }) => role.permissions.map(({ permission }) => permission.key)) ?? []));
  return { roles, permissions };
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(getPrismaClient()),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        const user = await getPrismaClient().user.findUnique({
          where: { email },
          include: { roles: { include: { role: true } } },
        });

        if (!user || user.status !== "ACTIVE" || !user.passwordHash) return null;
        if (!(await compare(password, user.passwordHash))) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          roles: user.roles.map(({ role }) => role.key),
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })] : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const access = await getUserAccess(user.id);
        token.roles = access.roles;
        token.permissions = access.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id ?? "";
      session.user.roles = token.roles ?? [];
      session.user.permissions = token.permissions ?? [];
      return session;
    },
  },
};
