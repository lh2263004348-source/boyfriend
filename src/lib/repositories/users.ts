/**
 * 用户表的数据访问层（Repository）。
 *
 * 约定：页面 / API 不要直接写 SQL，一律走这里。
 * 这样查用户、建用户的逻辑只写一份，也方便统一处理「邮箱转小写」这类规则。
 */
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users, type DbUser, type NewDbUser } from "@/lib/db/schema";
import type { User } from "@/lib/types";

/** 数据库行 → 业务层 User（故意不带 passwordHash，避免泄露到前端） */
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
