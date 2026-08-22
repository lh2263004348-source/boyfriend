import { and, desc, eq, gt, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { assertBoyfriendOwnership } from "@/lib/repositories/boyfriends";
import { countUserMessagesByBoyfriendId } from "@/lib/repositories/messages";

const USER_MESSAGE_WINDOW: Record<string, number> = {
  scene: 15,
  selfie: 15,
  share: 20,
  gift: 15,
};

function isGeneratedImageKey(mediaKey: string | null): boolean {
  if (!mediaKey) return false;
  return (
    mediaKey.startsWith("chat-images/") || mediaKey.includes("/chat-images/")
  );
}

async function getLastGeneratedImageAt(
  boyfriendId: string
): Promise<Date | null> {
  const imageRows = await db
    .select({ createdAt: messages.createdAt, mediaKey: messages.mediaKey })
    .from(messages)
    .where(
      and(
        eq(messages.boyfriendId, boyfriendId),
        eq(messages.role, "boyfriend"),
        eq(messages.type, "image")
      )
    )
    .orderBy(desc(messages.createdAt))
    .limit(50);

  const lastGen = imageRows.find((r) => isGeneratedImageKey(r.mediaKey));
  return lastGen?.createdAt ?? null;
}

/** 自上次 AI 生成图以来，用户消息条数；若无生成图则返回用户消息总数 */
export async function countUserMessagesSinceLastGeneratedImage(
  boyfriendId: string,
  userId: string
): Promise<number> {
  const boyfriend = await assertBoyfriendOwnership(boyfriendId, userId);
  if (!boyfriend) return Number.MAX_SAFE_INTEGER;

  const lastGenAt = await getLastGeneratedImageAt(boyfriendId);

  if (!lastGenAt) {
    return countUserMessagesByBoyfriendId(boyfriendId, userId);
  }

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(messages)
    .where(
      and(
        eq(messages.boyfriendId, boyfriendId),
        eq(messages.role, "user"),
        gt(messages.createdAt, lastGenAt)
      )
    );

  return result?.count ?? 0;
}

export async function canGenerateImageType(
  boyfriendId: string,
  userId: string,
  imageType: string
): Promise<{ allowed: boolean; reason?: string }> {
  const window = USER_MESSAGE_WINDOW[imageType] ?? USER_MESSAGE_WINDOW.scene;
  const sinceLast = await countUserMessagesSinceLastGeneratedImage(
    boyfriendId,
    userId
  );

  if (sinceLast < window) {
    return {
      allowed: false,
      reason: `图像频率限制：需间隔 ${window} 条用户消息（当前 ${sinceLast}）`,
    };
  }

  return { allowed: true };
}
