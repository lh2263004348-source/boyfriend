import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  boyfriends,
  type DbBoyfriend,
  type NewDbBoyfriend,
} from "@/lib/db/schema";
import type { Boyfriend, RelationshipMode } from "@/lib/types";

function mapBoyfriend(row: DbBoyfriend): Boyfriend {
  return {
    id: row.id,
    userId: row.userId,
    relationshipMode: row.relationshipMode as RelationshipMode,
    nickname: row.nickname,
    userNickname: row.userNickname,
    avatarUrl: row.avatarUrl,
    intimacy: row.intimacy,
    lastSurpriseAt: row.lastSurpriseAt,
    surpriseCountToday: row.surpriseCountToday,
    lastSurpriseDate: row.lastSurpriseDate,
    memorySummary: row.memorySummary,
    unreadCount: row.unreadCount,
    lastMessagePreview: row.lastMessagePreview,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastActiveAt: row.lastActiveAt,
  };
}

export async function listBoyfriendsByUserId(
  userId: string
): Promise<Boyfriend[]> {
  const rows = await db
    .select()
    .from(boyfriends)
    .where(eq(boyfriends.userId, userId))
    .orderBy(desc(boyfriends.lastActiveAt));

  return rows.map(mapBoyfriend);
}

export async function getBoyfriendById(
  id: string,
  userId: string
): Promise<Boyfriend | null> {
  const [row] = await db
    .select()
    .from(boyfriends)
    .where(and(eq(boyfriends.id, id), eq(boyfriends.userId, userId)))
    .limit(1);

  return row ? mapBoyfriend(row) : null;
}

export async function createBoyfriend(
  data: NewDbBoyfriend
): Promise<Boyfriend> {
  const [row] = await db.insert(boyfriends).values(data).returning();
  return mapBoyfriend(row);
}

export async function updateBoyfriend(
  id: string,
  userId: string,
  data: Partial<NewDbBoyfriend>
): Promise<Boyfriend | null> {
  const [row] = await db
    .update(boyfriends)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(boyfriends.id, id), eq(boyfriends.userId, userId)))
    .returning();

  return row ? mapBoyfriend(row) : null;
}

export async function deleteBoyfriend(
  id: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .delete(boyfriends)
    .where(and(eq(boyfriends.id, id), eq(boyfriends.userId, userId)))
    .returning({ id: boyfriends.id });

  return result.length > 0;
}

/** 校验男友归属，不属于当前用户则返回 null */
export async function assertBoyfriendOwnership(
  boyfriendId: string,
  userId: string
): Promise<Boyfriend | null> {
  return getBoyfriendById(boyfriendId, userId);
}
