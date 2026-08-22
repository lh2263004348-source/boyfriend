import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";
import { createImageClient } from "@/lib/image/client";
import { canGenerateImageType } from "@/lib/image/frequency";
import { matchesSceneKeyword } from "@/lib/image/sceneKeywords";
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
      userMessage?: string;
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

    const imageType = body.imageType ?? "scene";

    const freq = await canGenerateImageType(
      body.boyfriendId,
      session.user.id,
      imageType
    );
    if (!freq.allowed) {
      return NextResponse.json(
        { error: freq.reason ?? "图像频率限制", degraded: true },
        { status: 200 }
      );
    }

    if (
      imageType === "scene" &&
      body.userMessage &&
      !matchesSceneKeyword(body.userMessage)
    ) {
      return NextResponse.json(
        { error: "当前话题未命中场景图关键词", degraded: true },
        { status: 200 }
      );
    }

    const imageClient = createImageClient();
    const result = await imageClient.generate({
      prompt: body.prompt.trim(),
      imageType,
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
    const fileName = `chat-images/${imageType}_${Date.now()}.png`;
    const { fileKey, url } = await uploadToR2(buffer, fileName, "image/png");

    const message = await createMessage(
      {
        boyfriendId: body.boyfriendId,
        role: "boyfriend",
        type: "image",
        content: body.caption?.trim() || "给你看一张图~",
        mediaKey: fileKey,
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
