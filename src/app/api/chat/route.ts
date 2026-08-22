import { auth } from "@/lib/auth/config";
import { createLLMClient, getSimpleSystemPrompt } from "@/lib/llm/client";
import { assertBoyfriendOwnership } from "@/lib/repositories/boyfriends";
import { createMessage, listMessagesByBoyfriendId } from "@/lib/repositories/messages";

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

    const boyfriend = await assertBoyfriendOwnership(
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

    await createMessage(
      {
        boyfriendId: body.boyfriendId,
        role: "user",
        type: "text",
        content: userMessage,
      },
      session.user.id
    );

    const history = await listMessagesByBoyfriendId(
      body.boyfriendId,
      session.user.id,
      { limit: 20 }
    );

    const llmMessages = [
      { role: "system" as const, content: getSimpleSystemPrompt(boyfriend) },
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
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
          }

          if (fullText.trim()) {
            await createMessage(
              {
                boyfriendId: body.boyfriendId!,
                role: "boyfriend",
                type: "text",
                content: fullText.trim(),
              },
              session.user!.id
            );
          }

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
