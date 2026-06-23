import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "البريد", type: "email" },
        kalimaSirr: { label: "كلمة السر", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.kalimaSirr) return null;

        const mustakhdim = await db.mustakhdim.findUnique({
          where: { email: credentials.email },
        });

        if (!mustakhdim || !mustakhdim.kalimaSirr) return null;

        const sahih = await bcrypt.compare(
          credentials.kalimaSirr,
          mustakhdim.kalimaSirr,
        );
        if (!sahih) return null;

        return {
          id: mustakhdim.id,
          email: mustakhdim.email,
          name: mustakhdim.ism,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/idkhal" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email ?? null;
      }
      return session;
    },
  },
};
