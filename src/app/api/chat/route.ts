import { after } from "next/server";

import { auth } from "@/lib/auth/config";
import { detectEmotion } from "@/lib/emotion/detector";
import { extractProfileFacts } from "@/lib/memory/extractor";
import { maybeSummarize } from "@/lib/memory/summarizer";
import { createLLMClient } from "@/lib/llm/client";
import { splitContentAndDecision } from "@/lib/llm/parser";
import { getSystemPrompt } from "@/lib/llm/prompts";
import {
  assertBoyfriendOwnership,
  incrementIntimacy,
  recordSurprise,
  updateBoyfriendPreview,
} from "@/lib/repositories/boyfriends";
import {
  countUserMessagesByBoyfriendId,
  countUserMessagesSince,
  createMessage,
  listMessagesByBoyfriendId,
} from "@/lib/repositories/messages";
import { listProfileFactsByBoyfriendId } from "@/lib/repositories/profileFacts";
import {
  tryTriggerSurprise,
  type SurprisePayload,
} from "@/lib/surprise/trigger";
import { getStickerById, getStickersByEmotion } from "@/lib/stickers/data";
import { attachVoiceToMessage } from "@/lib/tts/attachVoice";

const MAX_USER_MESSAGE_LENGTH = 2000;

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "请先登录", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = (await request.json()) as {
      boyfriendId?: string;
      userMessage?: string;
      stickerId?: string;
    };

    if (!body.boyfriendId) {
      return Response.json(
        { error: "缺少必填字段", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const hasText = !!body.userMessage?.trim();
    const hasSticker = !!body.stickerId?.trim();

    if (!hasText && !hasSticker) {
      return Response.json(
        { error: "缺少必填字段", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (hasText && body.userMessage!.trim().length > MAX_USER_MESSAGE_LENGTH) {
      return Response.json(
        { error: "消息过长", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    let boyfriend = await assertBoyfriendOwnership(body.boyfriendId, userId);
    if (!boyfriend) {
      return Response.json(
        { error: "男友不存在或无权访问", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    let userEmotion: string | null = null;
    let llmUserContent = "";

    if (hasSticker) {
      const sticker = getStickerById(body.stickerId!.trim());
      if (!sticker) {
        return Response.json(
          { error: "无效的表情包", code: "VALIDATION_ERROR" },
          { status: 400 }
        );
      }

      await createMessage(
        {
          boyfriendId: body.boyfriendId,
          role: "user",
          type: "sticker",
          content: sticker.id,
          emotion: sticker.emotion,
        },
        userId
      );

      userEmotion = sticker.emotion;
      llmUserContent = `用户发送了表情包：${sticker.emoji}`;
      await updateBoyfriendPreview(body.boyfriendId, userId, sticker.emoji);
    } else {
      const userMessage = body.userMessage!.trim();
      userEmotion = detectEmotion(userMessage);
      llmUserContent = userMessage;

      await createMessage(
        {
          boyfriendId: body.boyfriendId,
          role: "user",
          type: "text",
          content: userMessage,
          emotion: userEmotion,
        },
        userId
      );

      await updateBoyfriendPreview(body.boyfriendId, userId, userMessage);
    }

    const prevIntimacy = boyfriend.intimacy;
    const showNextStage = prevIntimacy === 99;

    boyfriend =
      (await incrementIntimacy(body.boyfriendId, userId)) ?? boyfriend;

    const [history, profileFacts, surpriseMessagesSince] = await Promise.all([
      listMessagesByBoyfriendId(body.boyfriendId, userId, { limit: 20 }),
      listProfileFactsByBoyfriendId(body.boyfriendId, userId),
      boyfriend.lastSurpriseAt
        ? countUserMessagesSince(
            body.boyfriendId,
            userId,
            boyfriend.lastSurpriseAt
          )
        : countUserMessagesByBoyfriendId(body.boyfriendId, userId),
    ]);

    const lastUserMsg = history.filter((m) => m.role === "user").at(-1);

    let surprisePayload: SurprisePayload | null = null;

    const llmMessages = [
      {
        role: "system" as const,
        content: getSystemPrompt(
          boyfriend,
          boyfriend.memorySummary,
          profileFacts,
          undefined,
          userEmotion
        ),
      },
      ...history.map((m, idx) => {
        const isLastUser =
          idx === history.length - 1 && m.role === "user" && hasSticker;
        return {
          role: (m.role === "user" ? "user" : "assistant") as
            | "user"
            | "assistant",
          content: isLastUser ? llmUserContent : m.content,
        };
      }),
    ];

    const client = createLLMClient();
    const encoder = new TextEncoder();
    let fullText = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of client.stream(llmMessages)) {
            fullText += chunk;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
            );
          }

          const { content, decision } = splitContentAndDecision(fullText);

          if (content) {
            await createMessage(
              {
                boyfriendId: body.boyfriendId!,
                role: "boyfriend",
                type: "text",
                content,
                emotion: decision?.emotion ?? null,
              },
              userId
            );
            await updateBoyfriendPreview(body.boyfriendId!, userId, content);
          }

          if (decision?.sendSticker) {
            const emotion = decision.stickerEmotion ?? decision.emotion ?? "happy";
            const pool = getStickersByEmotion(emotion);
            const sticker = pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
            if (sticker) {
              await createMessage(
                {
                  boyfriendId: body.boyfriendId!,
                  role: "boyfriend",
                  type: "sticker",
                  content: sticker.id,
                  emotion,
                },
                userId
              );
            }
          }

          if (decision) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ decision })}\n\n`
              )
            );
          }

          surprisePayload = tryTriggerSurprise(
            boyfriend!,
            history,
            surpriseMessagesSince,
            lastUserMsg
          );

          if (surprisePayload) {
            boyfriend =
              (await recordSurprise(body.boyfriendId!, userId)) ?? boyfriend;

            if (surprisePayload.type === "gift") {
              const giftMessage = await createMessage(
                {
                  boyfriendId: body.boyfriendId!,
                  role: "boyfriend",
                  type: "image",
                  content: `[礼物] ${surprisePayload.giftName}`,
                  mediaKey: surprisePayload.giftImage ?? null,
                  isSurprise: true,
                },
                userId
              );
              if (giftMessage) {
                surprisePayload = {
                  ...surprisePayload,
                  messageId: giftMessage.id,
                };
              }
            } else {
              const songMessage = await createMessage(
                {
                  boyfriendId: body.boyfriendId!,
                  role: "boyfriend",
                  type: "text",
                  content: `🎵 ${surprisePayload.songTitle}\n${surprisePayload.songLyrics}`,
                  isSurprise: true,
                },
                userId
              );

              if (songMessage) {
                surprisePayload = {
                  ...surprisePayload,
                  messageId: songMessage.id,
                };

                after(async () => {
                  await attachVoiceToMessage(
                    songMessage.id,
                    body.boyfriendId!,
                    userId,
                    surprisePayload!.songLyrics ?? "",
                    boyfriend!.relationshipMode
                  );
                });
              }
            }
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                meta: {
                  intimacy: boyfriend!.intimacy,
                  showNextStage,
                  surprise: surprisePayload,
                },
              })}\n\n`
            )
          );

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();

          after(async () => {
            const recent = await listMessagesByBoyfriendId(
              body.boyfriendId!,
              userId,
              { limit: 6 }
            );
            await extractProfileFacts(body.boyfriendId!, userId, recent);
            await maybeSummarize(body.boyfriendId!, userId);
          });
        } catch (error) {
          console.error("Chat stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "对话生成失败，请稍后重试" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "对话请求失败", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
