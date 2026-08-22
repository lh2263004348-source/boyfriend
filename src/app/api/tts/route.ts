import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";
import { synthesizeSpeech } from "@/lib/tts/client";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      text?: string;
      mode?: string;
    };

    if (!body.text?.trim()) {
      return NextResponse.json({ error: "缺少文本" }, { status: 400 });
    }

    const result = await synthesizeSpeech({
      text: body.text.trim(),
      mode: body.mode ?? "warm",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: "语音生成失败", fallback: true },
      { status: 200 }
    );
  }
}
