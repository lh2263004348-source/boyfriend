import type { LLMDecision } from "@/lib/types";

const DECISION_START = "<DECISION>";
const DECISION_END = "</DECISION>";

/** 从流式/raw 文本中分离聊天正文与 DECISION */
export function splitContentAndDecision(raw: string): {
  content: string;
  decision: LLMDecision | null;
} {
  const startIdx = raw.indexOf(DECISION_START);
  if (startIdx === -1) {
    return { content: raw.trim(), decision: null };
  }

  const content = raw.slice(0, startIdx).trim();
  const afterStart = raw.slice(startIdx + DECISION_START.length);
  const endIdx = afterStart.indexOf(DECISION_END);

  if (endIdx === -1) {
    return { content, decision: null };
  }

  const jsonStr = afterStart.slice(0, endIdx).trim();

  try {
    const decision = JSON.parse(jsonStr) as LLMDecision;
    return { content, decision };
  } catch {
    return { content, decision: null };
  }
}

/** 流式展示用：隐藏尚未完整的 DECISION 块 */
export function getDisplayContent(raw: string): string {
  const idx = raw.indexOf(DECISION_START);
  if (idx === -1) return raw;
  return raw.slice(0, idx);
}
