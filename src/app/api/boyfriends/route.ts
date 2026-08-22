import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";
import {
  createBoyfriend,
  deleteBoyfriend,
  getBoyfriendById,
  listBoyfriendsByUserId,
  clearUnreadCount,
  updateBoyfriend,
} from "@/lib/repositories/boyfriends";
import type { RelationshipMode } from "@/lib/types";

const VALID_MODES: RelationshipMode[] = ["dominant", "puppy", "warm"];

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "请先登录", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  try {
    const boyfriends = await listBoyfriendsByUserId(session.user.id);
    return NextResponse.json({ boyfriends });
  } catch (error) {
    console.error("List boyfriends error:", error);
    return NextResponse.json(
      { error: "获取男友列表失败", code: "INTERNAL_ERROR" },
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
      relationshipMode?: string;
      nickname?: string;
      userNickname?: string;
      avatarUrl?: string;
    };

    if (!body.relationshipMode || !body.nickname || !body.userNickname) {
      return NextResponse.json(
        { error: "缺少必填字段", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (!VALID_MODES.includes(body.relationshipMode as RelationshipMode)) {
      return NextResponse.json(
        { error: "无效的关系模式", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const boyfriend = await createBoyfriend({
      userId: session.user.id,
      relationshipMode: body.relationshipMode as RelationshipMode,
      nickname: body.nickname,
      userNickname: body.userNickname,
      avatarUrl: body.avatarUrl ?? "/avatars/warm.jpg",
    });

    return NextResponse.json({ boyfriend }, { status: 201 });
  } catch (error) {
    console.error("Create boyfriend error:", error);
    return NextResponse.json(
      { error: "创建男友失败", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "请先登录", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "缺少男友 ID", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const deleted = await deleteBoyfriend(id, session.user.id);
    if (!deleted) {
      return NextResponse.json(
        { error: "男友不存在或无权访问", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete boyfriend error:", error);
    return NextResponse.json(
      { error: "删除男友失败", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/** 用于 TC-M0-011 跨用户隔离验证 */
export async function PATCH(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "请先登录", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      markRead?: boolean;
      intimacy?: number;
    };
    if (!body.id) {
      return NextResponse.json(
        { error: "缺少男友 ID", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const boyfriend = await getBoyfriendById(body.id, session.user.id);
    if (!boyfriend) {
      return NextResponse.json(
        { error: "男友不存在或无权访问", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    if (body.markRead) {
      const updated = await clearUnreadCount(body.id, session.user.id);
      return NextResponse.json({ boyfriend: updated });
    }

    if (typeof body.intimacy === "number") {
      const updated = await updateBoyfriend(body.id, session.user.id, {
        intimacy: body.intimacy,
      });
      return NextResponse.json({ boyfriend: updated });
    }

    return NextResponse.json({ boyfriend });
  } catch (error) {
    console.error("Get boyfriend error:", error);
    return NextResponse.json(
      { error: "获取男友失败", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
