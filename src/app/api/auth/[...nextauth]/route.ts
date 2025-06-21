import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { users } from "@/lib/schema";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
      company?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    role: string;
    company?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    company?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);

        if (!user) return null;

        // Check if password is hashed (starts with $2b$)
        const isHashed = user.password.startsWith("$2b$");

        let isValid = false;

        if (isHashed) {
          // Compare with bcrypt for hashed passwords
          isValid = await bcrypt.compare(credentials.password, user.password);
        } else {
          // Direct comparison for plain text passwords (temporary)
          isValid = credentials.password === user.password;
        }

        if (isValid) {
          return {
            id: user.id.toString(),
            email: user.email,
            role: user.role,
            company: user.company,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.company = user.company;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.company = token.company as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
