/**
 * 登录会话（sessions 表）。
 *
 * 和 JWT 的关系：
 * - 浏览器里：Auth.js 存一份 JWT cookie（页面用来判断「谁登录了」）
 * - 数据库里：sessions 表再存一份 token（用来吊销：退出登录 / 过期后 JWT 也不再有效）
 */
import { randomBytes } from "crypto";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { sessions, users, type DbUser } from "@/lib/db/schema";

const SESSION_MAX_AGE_REMEMBER = 30 * 24 * 60 * 60; // 勾选「记住我」：30 天
const SESSION_MAX_AGE_DEFAULT = 24 * 60 * 60; // 默认：1 天

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function getSessionMaxAge(rememberMe: boolean): number {
  return rememberMe ? SESSION_MAX_AGE_REMEMBER : SESSION_MAX_AGE_DEFAULT;
}

/** 登录成功时写入一条会话记录，返回的 sessionToken 会放进 JWT */
export async function createSession(
  userId: string,
  rememberMe = false
): Promise<{ sessionToken: string; expiresAt: Date }> {
  const sessionToken = generateSessionToken();
  const maxAge = getSessionMaxAge(rememberMe);
  const expiresAt = new Date(Date.now() + maxAge * 1000);

  await db.insert(sessions).values({
    userId,
    sessionToken,
    expiresAt,
  });

  return { sessionToken, expiresAt };
}

export async function deleteSession(sessionToken: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
}

export async function deleteUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/** 用 JWT 里的 token 回库查：还在、没过期 → 返回用户；否则返回 null */
export async function validateSession(
  sessionToken: string
): Promise<DbUser | null> {
  const [row] = await db
    .select({
      user: users,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.sessionToken, sessionToken))
    .limit(1);

  if (!row) {
    return null;
  }

  if (row.expiresAt < new Date()) {
    await deleteSession(sessionToken);
    return null;
  }

  return row.user;
}

export function mapDbUserToSessionUser(user: DbUser): {
  id: string;
  email: string;
  displayName: string;
} {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  };
}
