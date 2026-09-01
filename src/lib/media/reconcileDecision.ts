import { canGenerateImageType } from "@/lib/image/frequency";
import { getRelationshipModeConfig } from "@/lib/relationship/config";
import type { Boyfriend, LLMDecision } from "@/lib/types";

import { detectUserMediaIntent } from "./intent";

const SELFIE_INTIMACY_MIN = 30;

function defaultDecision(): LLMDecision {
  return {
    emotion: "happy",
    preferredMedia: "text",
    shouldGenerateImage: false,
    imageType: "scene",
    imagePrompt: "",
    surpriseTriggered: false,
    surpriseType: "none",
    sendSticker: false,
  };
}

function buildSelfiePrompt(boyfriend: Boyfriend): string {
  const config = getRelationshipModeConfig(boyfriend.relationshipMode);
  return `${boyfriend.nickname}，${config.description}，年轻帅气的亚洲男性，日常自拍报备，自然微笑，手机前置摄像头风格，背景是居家或日常场景`;
}

/**
 * 将 LLM 的 DECISION 与用户显式诉求对齐，避免「口头答应拍照却不出图」。
 */
export async function reconcileDecision(
  decision: LLMDecision | null,
  userMessage: string,
  boyfriend: Boyfriend,
  userId: string
): Promise<LLMDecision | null> {
  const intent = detectUserMediaIntent(userMessage);
  if (intent !== "photo") {
    return decision;
  }

  const base = decision ?? defaultDecision();
  const patched: LLMDecision = {
    ...base,
    surpriseTriggered: false,
    surpriseType: "none",
    preferredMedia: "image",
  };

  if (boyfriend.intimacy < SELFIE_INTIMACY_MIN) {
    return {
      ...patched,
      shouldGenerateImage: false,
      preferredMedia: "text",
    };
  }

  const freq = await canGenerateImageType(
    boyfriend.id,
    userId,
    "selfie"
  );

  if (!freq.allowed) {
    return {
      ...patched,
      shouldGenerateImage: false,
      preferredMedia: "text",
    };
  }

  return {
    ...patched,
    shouldGenerateImage: true,
    imageType: "selfie",
    imagePrompt: buildSelfiePrompt(boyfriend),
    preferredMedia: "image",
  };
}
