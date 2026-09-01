/** 用户消息中的显式媒介诉求（拍照 / 语音等） */
export type UserMediaIntent = "photo" | "voice";

const PHOTO_KEYWORDS = [
  "拍照",
  "照片",
  "自拍",
  "拍一张",
  "拍个照",
  "拍张",
  "看看你",
  "报备",
  "发张图",
  "发图片",
  "发个图",
  "发照片",
  "想看你",
];

const VOICE_KEYWORDS = [
  "发语音",
  "语音",
  "唱给我",
  "说给我听",
  "想听你声音",
  "听听你的声音",
];

/** 从用户文本识别是否明确要求某种媒介 */
export function detectUserMediaIntent(text: string): UserMediaIntent | null {
  const normalized = text.trim();
  if (!normalized) return null;

  if (PHOTO_KEYWORDS.some((kw) => normalized.includes(kw))) {
    return "photo";
  }

  if (VOICE_KEYWORDS.some((kw) => normalized.includes(kw))) {
    return "voice";
  }

  return null;
}

/** 用户已有明确媒介诉求，或 LLM 已决定出图时，不再插入随机惊喜 */
export function shouldSuppressSurprise(
  userIntent: UserMediaIntent | null,
  decision: { shouldGenerateImage?: boolean; preferredMedia?: string } | null
): boolean {
  if (userIntent !== null) return true;
  if (decision?.shouldGenerateImage) return true;
  if (decision?.preferredMedia === "image") return true;
  return false;
}
