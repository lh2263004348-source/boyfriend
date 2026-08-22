import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";
import { buildRecallMessage } from "@/lib/memory/recall";
import { listProfileFactsByBoyfriendId } from "@/lib/repositories/profileFacts";
import {
  assertBoyfriendOwnership,
  updateBoyfriendPreview,
} from "@/lib/repositories/boyfriends";
import { createMessage } from "@/lib/repositories/messages";
import {
  getOpeningMessage,
  pickProactiveMessage,
  type ProactiveTrigger,
} from "@/lib/relationship/openings";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "请先登录", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as {
      boyfriendId?: string;
      kind?: "opening" | "recall" | "proactive";
      trigger?: ProactiveTrigger;
    };

    if (!body.boyfriendId || !body.kind) {
      return NextResponse.json(
        { error: "缺少必填字段", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const boyfriend = await assertBoyfriendOwnership(
      body.boyfriendId,
      session.user.id
    );
    if (!boyfriend) {
      return NextResponse.json(
        { error: "无权访问", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    let content: string | null = null;

    if (body.kind === "opening") {
      content = getOpeningMessage(boyfriend.relationshipMode);
    } else if (body.kind === "recall") {
      const facts = await listProfileFactsByBoyfriendId(
        body.boyfriendId,
        session.user.id
      );
      content = buildRecallMessage(boyfriend.relationshipMode, facts);
    } else if (body.kind === "proactive") {
      content = pickProactiveMessage(
        boyfriend.relationshipMode,
        body.trigger ?? "silence"
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: "无法生成系统消息", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const message = await createMessage(
      {
        boyfriendId: body.boyfriendId,
        role: "boyfriend",
        type: "text",
        content,
      },
      session.user.id
    );

    if (!message) {
      return NextResponse.json(
        { error: "写入失败", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    await updateBoyfriendPreview(
      body.boyfriendId,
      session.user.id,
      content
    );

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("System message error:", error);
    return NextResponse.json(
      { error: "写入失败", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
