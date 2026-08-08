import "server-only";

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";
import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { getPrismaClient } from "./prisma";

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
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id ?? "";
      session.user.roles = token.roles ?? [];
      return session;
    },
  },
};
