import type { Message } from "@/lib/types";

const EMOTION_WORDS = [
  "开心",
  "难过",
  "想你",
  "喜欢",
  "爱",
  "烦",
  "累",
  "抱抱",
  "哈哈",
  "呜呜",
  "心动",
  "寂寞",
];

const POSITIVE_EMOJI = ["😊", "😄", "🥰", "❤️", "💕", "👍", "😍", "💗", "✨"];

export function hasConsecutiveEmotionWords(
  messages: Message[],
  count: number
): boolean {
  const userTexts = messages
    .filter((m) => m.role === "user")
    .slice(-count)
    .map((m) => m.content);

  if (userTexts.length < count) return false;

  return userTexts.every((text) =>
    EMOTION_WORDS.some((word) => text.includes(word))
  );
}

export function hasPositiveEmoji(message: Message | undefined): boolean {
  if (!message) return false;
  return POSITIVE_EMOJI.some((emoji) => message.content.includes(emoji));
}

export function countUserMessagesSince(
  messages: Message[],
  sinceIndex: number
): number {
  return messages.slice(sinceIndex).filter((m) => m.role === "user").length;
}

export interface SurpriseProbabilityResult {
  probability: number;
  reason: string;
}

export function calculateSurpriseProbability(
  currentIntimacy: number,
  recentMessages: Message[],
  messagesSinceLastSurprise: number,
  lastUserMessage?: Message
): SurpriseProbabilityResult {
  let probability = 0.08;
  let reason = "基础概率";

  if (currentIntimacy % 10 === 0 && currentIntimacy > 0) {
    probability = Math.max(probability, 0.2);
    reason = "暧昧值里程碑";
  }

  if (hasConsecutiveEmotionWords(recentMessages, 3)) {
    probability = Math.max(probability, 0.15);
    reason = "情绪词连续";
  }

  if (messagesSinceLastSurprise > 20) {
    probability = Math.max(probability, 0.25);
    reason = "长时间无惊喜";
  }

  if (hasPositiveEmoji(lastUserMessage)) {
    probability += 0.05;
    reason = "积极 emoji";
  }

  return { probability: Math.min(probability, 1), reason };
}

export function rollSurprise(probability: number): boolean {
  return Math.random() < probability;
}

export function clampIntimacy(value: number): number {
  return Math.min(100, Math.max(0, value));
}
