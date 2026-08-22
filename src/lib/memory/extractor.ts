import { createLLMClient } from "@/lib/llm/client";
import { isValidFactKey } from "@/lib/memory/profileKeys";
import {
  getProfileFactByKey,
  upsertProfileFact,
} from "@/lib/repositories/profileFacts";
import type { Message } from "@/lib/types";

const EXTRACT_PROMPT = `分析以下对话，判断用户是否透露了新的个人信息。
只提取用户明确说过的内容，不要猜测。

预置键：birthday, hobbies, favorite_food, recent_event, anniversary, dislikes
不属于预置键时使用 custom_ 前缀。

输出纯 JSON：
{"facts":[{"key":"birthday","value":"3月15日"}],"updates":[{"key":"hobbies","value":"画画","action":"merge"}]}
无新信息则 {"facts":[],"updates":[]}`;

interface ExtractResult {
  facts: Array<{ key: string; value: string }>;
  updates: Array<{ key: string; value: string; action?: string }>;
}

const MERGE_KEYS = new Set(["hobbies", "dislikes"]);

async function resolveFactValue(
  boyfriendId: string,
  userId: string,
  key: string,
  value: string,
  action?: string
): Promise<string> {
  if (action !== "merge" || !MERGE_KEYS.has(key)) {
    return value;
  }

  const existing = await getProfileFactByKey(boyfriendId, key, userId);
  if (!existing?.factValue) return value;

  const parts = existing.factValue.split(/[、,，]/).map((s) => s.trim());
  if (parts.includes(value.trim())) return existing.factValue;
  return `${existing.factValue}、${value.trim()}`;
}

export async function extractProfileFacts(
  boyfriendId: string,
  userId: string,
  recentMessages: Message[],
  sourceMessageId?: string
): Promise<void> {
  if (recentMessages.length === 0) return;

  const context = recentMessages
    .slice(-6)
    .map((m) => `${m.role === "user" ? "用户" : "男友"}: ${m.content}`)
    .join("\n");

  try {
    const client = createLLMClient();
    const raw = await client.complete(
      [
        { role: "system", content: EXTRACT_PROMPT },
        { role: "user", content: context },
      ],
      { temperature: 0.3 }
    );

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;

    const result = JSON.parse(jsonMatch[0]) as ExtractResult;

    for (const fact of result.facts ?? []) {
      if (!isValidFactKey(fact.key) || !fact.value) continue;
      await upsertProfileFact(
        {
          boyfriendId,
          factKey: fact.key,
          factValue: fact.value,
          sourceMessageId: sourceMessageId ?? null,
        },
        userId
      );
    }

    for (const update of result.updates ?? []) {
      if (!isValidFactKey(update.key) || !update.value) continue;
      const factValue = await resolveFactValue(
        boyfriendId,
        userId,
        update.key,
        update.value,
        update.action
      );
      await upsertProfileFact(
        {
          boyfriendId,
          factKey: update.key,
          factValue,
          sourceMessageId: sourceMessageId ?? null,
        },
        userId
      );
    }
  } catch (error) {
    console.error("Profile extract failed:", error);
  }
}
