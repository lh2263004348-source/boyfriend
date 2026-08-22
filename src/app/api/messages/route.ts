import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";
import { assertBoyfriendOwnership, updateBoyfriendPreview } from "@/lib/repositories/boyfriends";
import {
  createMessage,
  listMessagesByBoyfriendId,
} from "@/lib/repositories/messages";

export async function GET(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "请先登录", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const boyfriendId = searchParams.get("boyfriendId");
    const limit = Number(searchParams.get("limit") ?? "20");
    const cursor = searchParams.get("cursor");

    if (!boyfriendId) {
      return NextResponse.json(
        { error: "缺少 boyfriendId", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const boyfriend = await assertBoyfriendOwnership(
      boyfriendId,
      session.user.id
    );
    if (!boyfriend) {
      return NextResponse.json(
        { error: "男友不存在或无权访问", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const messages = await listMessagesByBoyfriendId(
      boyfriendId,
      session.user.id,
      {
        limit,
        cursor: cursor ? new Date(cursor) : undefined,
      }
    );

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("List messages error:", error);
    return NextResponse.json(
      { error: "获取消息失败", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

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
      role?: string;
      type?: string;
      content?: string;
      mediaKey?: string | null;
      emotion?: string | null;
      isSurprise?: boolean;
    };

    if (!body.boyfriendId || !body.role || !body.type || !body.content) {
      return NextResponse.json(
        { error: "缺少必填字段", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const message = await createMessage(
      {
        boyfriendId: body.boyfriendId,
        role: body.role,
        type: body.type,
        content: body.content,
        mediaKey: body.mediaKey ?? null,
        emotion: body.emotion ?? null,
        isSurprise: body.isSurprise ?? false,
      },
      session.user.id
    );

    if (!message) {
      return NextResponse.json(
        { error: "男友不存在或无权访问", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    if (body.role === "boyfriend") {
      await updateBoyfriendPreview(
        body.boyfriendId,
        session.user.id,
        body.content
      );
    } else if (body.role === "user") {
      await updateBoyfriendPreview(
        body.boyfriendId,
        session.user.id,
        body.content
      );
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Create message error:", error);
    return NextResponse.json(
      { error: "写入消息失败", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
