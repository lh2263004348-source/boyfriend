import { auth } from "@/lib/auth/config";
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
  createMessage,
  listMessagesByBoyfriendId,
} from "@/lib/repositories/messages";
import { listProfileFactsByBoyfriendId } from "@/lib/repositories/profileFacts";
import {
  tryTriggerSurprise,
  type SurprisePayload,
} from "@/lib/surprise/trigger";
import { synthesizeSpeech } from "@/lib/tts/client";

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "请先登录", code: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      boyfriendId?: string;
      userMessage?: string;
    };

    if (!body.boyfriendId || !body.userMessage?.trim()) {
      return Response.json(
        { error: "缺少必填字段", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    let boyfriend = await assertBoyfriendOwnership(
      body.boyfriendId,
      session.user.id
    );
    if (!boyfriend) {
      return Response.json(
        { error: "男友不存在或无权访问", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const userMessage = body.userMessage.trim();
    const prevIntimacy = boyfriend.intimacy;
    const showNextStage = prevIntimacy === 99;

    await createMessage(
      {
        boyfriendId: body.boyfriendId,
        role: "user",
        type: "text",
        content: userMessage,
      },
      session.user.id
    );

    boyfriend =
      (await incrementIntimacy(body.boyfriendId, session.user.id)) ?? boyfriend;
    await updateBoyfriendPreview(body.boyfriendId, session.user.id, userMessage);

    const [history, profileFacts] = await Promise.all([
      listMessagesByBoyfriendId(body.boyfriendId, session.user.id, { limit: 20 }),
      listProfileFactsByBoyfriendId(body.boyfriendId, session.user.id),
    ]);

    const lastUserMsg = history.filter((m) => m.role === "user").at(-1);
    const surpriseMessagesSince = boyfriend.lastSurpriseAt
      ? history.filter(
          (m) => m.createdAt > boyfriend!.lastSurpriseAt! && m.role === "user"
        ).length
      : history.filter((m) => m.role === "user").length;

    let surprisePayload: SurprisePayload | null = null;

    const llmMessages = [
      {
        role: "system" as const,
        content: getSystemPrompt(
          boyfriend,
          boyfriend.memorySummary,
          profileFacts
        ),
      },
      ...history.map((m) => ({
        role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      })),
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
              session.user!.id
            );
            await updateBoyfriendPreview(body.boyfriendId!, session.user!.id, content);
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
              (await recordSurprise(body.boyfriendId!, session.user!.id)) ??
              boyfriend;

            if (surprisePayload.type === "gift") {
              await createMessage(
                {
                  boyfriendId: body.boyfriendId!,
                  role: "boyfriend",
                  type: "image",
                  content: `[礼物] ${surprisePayload.giftName}`,
                  mediaKey: surprisePayload.giftImage ?? null,
                  isSurprise: true,
                },
                session.user!.id
              );
            } else {
              let audioUrl: string | null = null;
              try {
                const tts = await synthesizeSpeech({
                  text: surprisePayload.songLyrics ?? "",
                  mode: boyfriend!.relationshipMode,
                });
                audioUrl = tts.audioUrl;
              } catch {
                // TTS 失败降级为文字
              }

              await createMessage(
                {
                  boyfriendId: body.boyfriendId!,
                  role: "boyfriend",
                  type: audioUrl ? "voice" : "text",
                  content: `🎵 ${surprisePayload.songTitle}\n${surprisePayload.songLyrics}`,
                  mediaKey: audioUrl,
                  isSurprise: true,
                },
                session.user!.id
              );
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
