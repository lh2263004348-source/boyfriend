import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";
import { extractProfileFacts } from "@/lib/memory/extractor";
import { assertBoyfriendOwnership } from "@/lib/repositories/boyfriends";
import { listMessagesByBoyfriendId } from "@/lib/repositories/messages";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { boyfriendId?: string };
    if (!body.boyfriendId) {
      return NextResponse.json({ error: "缺少 boyfriendId" }, { status: 400 });
    }

    const boyfriend = await assertBoyfriendOwnership(
      body.boyfriendId,
      session.user.id
    );
    if (!boyfriend) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const messages = await listMessagesByBoyfriendId(
      body.boyfriendId,
      session.user.id,
      { limit: 10 }
    );

    await extractProfileFacts(
      body.boyfriendId,
      session.user.id,
      messages
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Memory extract API error:", error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
