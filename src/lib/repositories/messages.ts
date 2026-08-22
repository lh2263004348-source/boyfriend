import { and, desc, eq, lt } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  messages,
  type DbMessage,
  type NewDbMessage,
} from "@/lib/db/schema";
import { assertBoyfriendOwnership } from "@/lib/repositories/boyfriends";
import type { Message, MessageRole, MessageType } from "@/lib/types";

function mapMessage(row: DbMessage): Message {
  return {
    id: row.id,
    boyfriendId: row.boyfriendId,
    role: row.role as MessageRole,
    type: row.type as MessageType,
    content: row.content,
    mediaKey: row.mediaKey,
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
