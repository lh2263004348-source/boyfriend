import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";
import { createImageClient } from "@/lib/image/client";
import { assertBoyfriendOwnership } from "@/lib/repositories/boyfriends";
import { createMessage } from "@/lib/repositories/messages";
import { uploadToR2 } from "@/lib/storage/r2";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      boyfriendId?: string;
      prompt?: string;
      imageType?: string;
      caption?: string;
    };

    if (!body.boyfriendId || !body.prompt?.trim()) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    const boyfriend = await assertBoyfriendOwnership(
      body.boyfriendId,
      session.user.id
    );
    if (!boyfriend) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const imageClient = createImageClient();
    const result = await imageClient.generate({
      prompt: body.prompt.trim(),
      imageType: body.imageType ?? "scene",
    });

    if (!result.success || !result.imageUrl) {
      return NextResponse.json(
        { error: result.error ?? "图像生成失败", degraded: true },
        { status: 200 }
      );
    }

    const imageResponse = await fetch(result.imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "下载生成图像失败", degraded: true },
        { status: 200 }
      );
    }

    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    const fileName = `chat-images/${body.imageType ?? "scene"}_${Date.now()}.png`;
    const { fileKey, url } = await uploadToR2(buffer, fileName, "image/png");

    const message = await createMessage(
      {
        boyfriendId: body.boyfriendId,
        role: "boyfriend",
        type: "image",
        content: body.caption?.trim() || "给你看一张图~",
        mediaKey: url,
      },
      session.user.id
    );

    return NextResponse.json({ url, fileKey, message });
  } catch (error) {
    console.error("Image API error:", error);
    return NextResponse.json(
      { error: "图像生成失败", degraded: true },
      { status: 200 }
    );
  }
}
