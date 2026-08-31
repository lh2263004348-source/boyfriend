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
import {
  verifyRegisterLoginPass,
  verifyTurnstileToken,
} from "./turnstile";

const PASSWORD_MIN_LENGTH = 8;
// JWT 本身已签名，可信。回数据库只是为了检测「会话是否被吊销」，
// 不必每次 auth() 都打 Neon，这里隔 5 分钟校验一次。
const SESSION_REVALIDATE_MS = 5 * 60 * 1000;

/** 至少 8 位，且同时包含字母和数字 */
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

/** 注册时把明文密码变成不可逆 hash，再入库 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/** 登录时用同一套算法比对「用户输入」和「库里的 hash」 */
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

/**
 * Auth.js 入口。对外导出 4 个东西：
 * - handlers：给 /api/auth/[...nextauth] 用（处理登录请求）
 * - signIn / signOut：登录、登出
 * - auth：读当前登录用户（middleware 和页面都会用）
 *
 * 登录方式：邮箱 + 密码（Credentials）。authorize 返回用户对象 = 登录成功，返回 null = 失败。
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
        rememberMe: { label: "记住我", type: "checkbox" },
        turnstileToken: { label: "人机验证", type: "text" },
        loginPass: { label: "注册通行", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const rememberMe = credentials?.rememberMe === "true";
        const turnstileToken = credentials?.turnstileToken as string | undefined;
        const loginPass = credentials?.loginPass as string | undefined;

        if (!email || !password) {
          return null;
        }

        // 普通登录走 Turnstile；刚注册完走 loginPass（60 秒内有效的一次性凭证）
        const captchaOk = loginPass
          ? await verifyRegisterLoginPass(email, loginPass)
          : await verifyTurnstileToken(turnstileToken);
        if (!captchaOk) {
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

        // 写入 sessions 表 + 更新最后登录时间（两件事并行，互不依赖）
        const [{ sessionToken }] = await Promise.all([
          createSession(user.id, rememberMe),
          db
            .update(users)
            .set({ lastLoginAt: new Date(), updatedAt: new Date() })
            .where(eq(users.id, user.id)),
        ]);

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
    // jwt：登录成功后把用户信息写进 token；之后每次请求会再走这里
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
        token.sessionValidatedAt = Date.now();
        // 刚写入的 session 不必立刻回库；后续按间隔校验，避免每次 auth() 打 Neon
        return token;
      }

      const lastValidated = (token.sessionValidatedAt as number | undefined) ?? 0;
      if (
        token.id &&
        Date.now() - lastValidated < SESSION_REVALIDATE_MS
      ) {
        return token;
      }

      if (token.sessionToken) {
        try {
          const dbUser = await validateSession(token.sessionToken as string);
          if (!dbUser) {
            // 库里找不到会话（过期或已登出）→ 清掉 id，后面 session 就会变成未登录
            return { ...token, id: undefined };
          }
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.displayName = dbUser.displayName;
          token.sessionValidatedAt = Date.now();
        } catch (error) {
          // 瞬时 DB 失败不应让整页 auth() 抛 JWTSessionError；保留现有 JWT 声明
          console.error("Session validation failed:", error);
        }
      }

      return token;
    },
    // session：把 JWT 里的字段映射成页面能读的 session.user
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
    // 退出登录时，同步删掉数据库里的会话记录（否则 JWT 过期前仍可能被校验通过）
    async signOut(message) {
      if ("token" in message && message.token?.sessionToken) {
        await deleteSession(message.token.sessionToken as string);
      }
    },
  },
  trustHost: true,
});
