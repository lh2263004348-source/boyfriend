export const EMOJI_EMOTION_MAP: Record<string, string> = {
  "😊": "happy",
  "😄": "happy",
  "😁": "happy",
  "🤣": "happy",
  "🥰": "heart",
  "😍": "heart",
  "❤️": "heart",
  "💕": "heart",
  "💖": "heart",
  "👍": "happy",
  "🤗": "happy",
  "😘": "heart",
  "💗": "heart",
  "🥺": "shy",
  "😳": "shy",
  "🙈": "shy",
  "😢": "sad",
  "😭": "sad",
  "😔": "sad",
  "😞": "sad",
  "💔": "sad",
  "😩": "sad",
  "😫": "sad",
  "😤": "angry",
  "😠": "angry",
  "😡": "angry",
  "🤔": "neutral",
  "😐": "neutral",
  "😶": "neutral",
};

export type EmotionCategory =
  | "happy"
  | "heart"
  | "shy"
  | "sad"
  | "angry"
  | "neutral";
