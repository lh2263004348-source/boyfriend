import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { memorySummaries } from "@/lib/db/schema";
import { createLLMClient } from "@/lib/llm/client";
import { updateBoyfriend } from "@/lib/repositories/boyfriends";
import { countUserMessagesByBoyfriendId, listMessagesByBoyfriendId } from "@/lib/repositories/messages";
import type { Message } from "@/lib/types";

const SUMMARY_PROMPT = `请用 2-3 句话总结以下对话的关键内容（话题、情绪、重要信息），中文，不要列表。`;

export async function summarizeConversation(
  boyfriendId: string,
  userId: string,
  messages: Message[]
): Promise<string | null> {
  if (messages.length < 10) return null;

  const context = messages
    .slice(-20)
    .map((m) => `${m.role === "user" ? "用户" : "男友"}: ${m.content}`)
    .join("\n");

  try {
    const client = createLLMClient();
    const summary = await client.complete(
      [
        { role: "system", content: SUMMARY_PROMPT },
        { role: "user", content: context },
      ],
      { temperature: 0.5 }
    );

    if (!summary) return null;

    await db.insert(memorySummaries).values({
      boyfriendId,
      summary,
      messageCount: messages.length,
    });

    await updateBoyfriend(boyfriendId, userId, { memorySummary: summary });

    const all = await db
      .select({ id: memorySummaries.id })
      .from(memorySummaries)
      .where(eq(memorySummaries.boyfriendId, boyfriendId))
      .orderBy(desc(memorySummaries.createdAt));

    if (all.length > 3) {
      const toDelete = all.slice(3).map((r) => r.id);
      for (const id of toDelete) {
        await db.delete(memorySummaries).where(eq(memorySummaries.id, id));
      }
    }

    return summary;
  } catch (error) {
    console.error("Summarize failed:", error);
    return null;
  }
}

export async function maybeSummarize(
  boyfriendId: string,
  userId: string
): Promise<void> {
  const userCount = await countUserMessagesByBoyfriendId(boyfriendId, userId);
  if (userCount > 0 && userCount % 10 === 0) {
    const messages = await listMessagesByBoyfriendId(boyfriendId, userId, {
      limit: 20,
    });
    await summarizeConversation(boyfriendId, userId, messages);
  }
}
