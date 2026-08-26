import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

import {
  createSession,
  deleteSession,
  mapDbUserToSessionUser,
  validateSession,
} from "./session";

const PASSWORD_MIN_LENGTH = 8;

export function validatePassword(password: string): boolean {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return false;
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  return hasLetter && hasDigit;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Vercel 上若误把本地 AUTH_URL 配进去，Auth.js 会把登录跳转到 localhost
if (process.env.VERCEL && process.env.AUTH_URL?.includes("localhost")) {
  delete process.env.AUTH_URL;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
        rememberMe: { label: "记住我", type: "checkbox" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const rememberMe = credentials?.rememberMe === "true";

        if (!email || !password) {
          return null;
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);

        if (!user) {
          return null;
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
          return null;
        }

        const { sessionToken } = await createSession(user.id, rememberMe);

        await db
          .update(users)
          .set({ lastLoginAt: new Date(), updatedAt: new Date() })
          .where(eq(users.id, user.id));

        return {
          ...mapDbUserToSessionUser(user),
          sessionToken,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as {
          id: string;
          email: string;
          displayName: string;
          sessionToken?: string;
        };
        token.id = authUser.id;
        token.email = authUser.email;
        token.displayName = authUser.displayName;
        token.sessionToken = authUser.sessionToken;
        // 刚写入的 session 不必立刻回库校验，避免 Neon 抖动直接打成 JWTSessionError
        return token;
      }

      if (token.sessionToken) {
        try {
          const dbUser = await validateSession(token.sessionToken as string);
          if (!dbUser) {
            return { ...token, id: undefined };
          }
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.displayName = dbUser.displayName;
        } catch (error) {
          // 瞬时 DB 失败不应让整页 auth() 抛 JWTSessionError；保留现有 JWT 声明
          console.error("Session validation failed:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.id && token.email) {
        session.user = {
          id: token.id as string,
          email: token.email as string,
          displayName: (token.displayName as string) ?? "",
        } as typeof session.user;
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      if ("token" in message && message.token?.sessionToken) {
        await deleteSession(message.token.sessionToken as string);
      }
    },
  },
  trustHost: true,
});
