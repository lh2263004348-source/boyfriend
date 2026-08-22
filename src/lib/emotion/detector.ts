import { EMOJI_EMOTION_MAP, type EmotionCategory } from "@/lib/emotion/emojiMap";

const EMOTION_WORDS: Record<EmotionCategory, string[]> = {
  happy: ["开心", "哈哈", "高兴", "快乐", "太好了", "棒"],
  heart: ["爱你", "喜欢", "心动", "想你", "爱"],
  shy: ["害羞", "不好意思"],
  sad: ["难过", "伤心", "哭", "委屈", "好累", "烦", "郁闷"],
  angry: ["生气", "讨厌", "气死", "愤怒"],
  neutral: [],
};

export function detectEmotion(text: string): EmotionCategory | null {
  for (const [emoji, emotion] of Object.entries(EMOJI_EMOTION_MAP)) {
    if (text.includes(emoji)) {
      return emotion as EmotionCategory;
    }
  }

  for (const [category, words] of Object.entries(EMOTION_WORDS) as Array<
    [EmotionCategory, string[]]
  >) {
    if (words.some((word) => text.includes(word))) {
      return category;
    }
  }

  return null;
}

export function isPositiveEmotion(emotion: EmotionCategory | null): boolean {
  return emotion === "happy" || emotion === "heart" || emotion === "shy";
}
