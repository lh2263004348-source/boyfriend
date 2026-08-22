import { randomBytes } from "crypto";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { sessions, users, type DbUser } from "@/lib/db/schema";

const SESSION_MAX_AGE_REMEMBER = 30 * 24 * 60 * 60; // 30 days
const SESSION_MAX_AGE_DEFAULT = 24 * 60 * 60; // 1 day

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function getSessionMaxAge(rememberMe: boolean): number {
  return rememberMe ? SESSION_MAX_AGE_REMEMBER : SESSION_MAX_AGE_DEFAULT;
}

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

export async function validateSession(
  sessionToken: string
): Promise<DbUser | null> {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.sessionToken, sessionToken))
    .limit(1);

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    await deleteSession(sessionToken);
    return null;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return user ?? null;
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
