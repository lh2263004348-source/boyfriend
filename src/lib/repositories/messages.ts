import { and, desc, eq, gt, lt, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  messages,
  type DbMessage,
  type NewDbMessage,
} from "@/lib/db/schema";
import { assertBoyfriendOwnership } from "@/lib/repositories/boyfriends";
import { resolveMediaUrl } from "@/lib/storage/mediaUrl";
import type { Message, MessageRole, MessageType } from "@/lib/types";

function mapMessage(row: DbMessage): Message {
  return {
    id: row.id,
    boyfriendId: row.boyfriendId,
    role: row.role as MessageRole,
    type: row.type as MessageType,
    content: row.content,
    mediaKey: resolveMediaUrl(row.mediaKey),
    emotion: row.emotion,
    isSurprise: row.isSurprise,
    createdAt: row.createdAt,
  };
}

export async function listMessagesByBoyfriendId(
  boyfriendId: string,
  userId: string,
  options: { limit?: number; cursor?: Date } = {}
): Promise<Message[]> {
  const boyfriend = await assertBoyfriendOwnership(boyfriendId, userId);
  if (!boyfriend) {
    return [];
  }

  const limit = options.limit ?? 20;
  const conditions = [eq(messages.boyfriendId, boyfriendId)];

  if (options.cursor) {
    conditions.push(lt(messages.createdAt, options.cursor));
  }

  const rows = await db
    .select()
    .from(messages)
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  return rows.map(mapMessage).reverse();
}

export async function getMessageById(
  id: string,
  userId: string
): Promise<Message | null> {
  const [row] = await db
    .select({
      message: messages,
      userId: messages.boyfriendId,
    })
    .from(messages)
    .where(eq(messages.id, id))
    .limit(1);

  if (!row) {
    return null;
  }

  const boyfriend = await assertBoyfriendOwnership(row.message.boyfriendId, userId);
  if (!boyfriend) {
    return null;
  }

  return mapMessage(row.message);
}

export async function createMessage(
  data: NewDbMessage,
  userId: string
): Promise<Message | null> {
  const boyfriend = await assertBoyfriendOwnership(data.boyfriendId, userId);
  if (!boyfriend) {
    return null;
  }

  const [row] = await db.insert(messages).values(data).returning();
  return mapMessage(row);
}

export async function countUserMessagesByBoyfriendId(
  boyfriendId: string,
  userId: string
): Promise<number> {
  const boyfriend = await assertBoyfriendOwnership(boyfriendId, userId);
  if (!boyfriend) return 0;

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(messages)
    .where(
      and(eq(messages.boyfriendId, boyfriendId), eq(messages.role, "user"))
    );

  return result?.count ?? 0;
}

export async function countUserMessagesSince(
  boyfriendId: string,
  userId: string,
  since: Date
): Promise<number> {
  const boyfriend = await assertBoyfriendOwnership(boyfriendId, userId);
  if (!boyfriend) return 0;

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(messages)
    .where(
      and(
        eq(messages.boyfriendId, boyfriendId),
        eq(messages.role, "user"),
        gt(messages.createdAt, since)
      )
    );

  return result?.count ?? 0;
}

export async function updateMessageMedia(
  messageId: string,
  userId: string,
  data: { mediaKey: string; type?: MessageType }
): Promise<Message | null> {
  const existing = await getMessageById(messageId, userId);
  if (!existing) return null;

  const [row] = await db
    .update(messages)
    .set({
      mediaKey: data.mediaKey,
      ...(data.type ? { type: data.type } : {}),
    })
    .where(eq(messages.id, messageId))
    .returning();

  return row ? mapMessage(row) : null;
}

export async function deleteMessagesByBoyfriendId(
  boyfriendId: string,
  userId: string
): Promise<boolean> {
  const boyfriend = await assertBoyfriendOwnership(boyfriendId, userId);
  if (!boyfriend) {
    return false;
  }

  await db.delete(messages).where(eq(messages.boyfriendId, boyfriendId));
  return true;
}
