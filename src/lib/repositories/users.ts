import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users, type DbUser, type NewDbUser } from "@/lib/db/schema";
import type { User } from "@/lib/types";

function mapUser(row: DbUser): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastLoginAt: row.lastLoginAt,
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  return row ? mapUser(row) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ? mapUser(row) : null;
}

export async function createUser(data: NewDbUser): Promise<User> {
  const [row] = await db
    .insert(users)
    .values({
      ...data,
      email: data.email.toLowerCase(),
    })
    .returning();

  return mapUser(row);
}

export async function updateUserLastLogin(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function getUserPasswordHash(
  userId: string
): Promise<string | null> {
  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return row?.passwordHash ?? null;
}
