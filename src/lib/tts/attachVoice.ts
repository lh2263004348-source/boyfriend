import { synthesizeSpeech } from "@/lib/tts/client";
import { updateMessageMedia } from "@/lib/repositories/messages";
import { uploadToR2 } from "@/lib/storage/r2";

export async function attachVoiceToMessage(
  messageId: string,
  boyfriendId: string,
  userId: string,
  text: string,
  mode: string
): Promise<void> {
  try {
    const tts = await synthesizeSpeech({ text, mode });
    const base64 = tts.audioUrl.split(",")[1];
    if (!base64) return;

    const buffer = Buffer.from(base64, "base64");
    const fileName = `chat-voice/${boyfriendId}_${Date.now()}.mp3`;
    const { fileKey } = await uploadToR2(buffer, fileName, "audio/mpeg");

    await updateMessageMedia(messageId, userId, {
      mediaKey: fileKey,
      type: "voice",
    });
  } catch (error) {
    console.error("Attach voice failed:", error);
  }
}
