/**
 * 生成三种关系模式的预置头像，保存到 public/avatars/
 * 用法: pnpm tsx scripts/generate-avatars.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const AVATARS: Array<{ file: string; prompt: string }> = [
  {
    file: "dominant.jpg",
    prompt:
      "一位26岁中国男性陆景琛，黑色短发向后梳理，五官深邃，穿深棕色西装或高领毛衣，神情冷峻沉稳有掌控感，暖色室内柔光，头肩肖像，面部居中，背景虚化，高质量人像摄影，自然肤色，适合圆形头像裁剪",
  },
  {
    file: "puppy.jpg",
    prompt:
      "一位22岁中国男性林念安，微卷浅棕发，明亮大眼，笑容干净有少年感，穿浅色卫衣，暖桃粉色调柔光，头肩肖像，面部居中，背景虚化，高质量人像摄影，自然清新，适合圆形头像裁剪",
  },
  {
    file: "warm.jpg",
    prompt:
      "一位25岁中国男性沈予白，干净短发，温和微笑，眼神温暖可靠，穿米色针织开衫，暖驼色柔光，头肩肖像，面部居中，背景虚化，高质量人像摄影，稳定温柔气质，适合圆形头像裁剪",
  },
];

function getConfig(): { apiKey: string; baseUrl: string; model: string } {
  const apiKey = process.env.IMAGE_API_KEY ?? process.env.LLM_API_KEY;
  const baseUrl = process.env.IMAGE_BASE_URL?.replace(/\/$/, "");
  const model = process.env.IMAGE_MODEL ?? "doubao-seedream-5.0-lite";

  if (!apiKey || !baseUrl) {
    throw new Error("Image API credentials are not configured");
  }

  return { apiKey, baseUrl, model };
}

async function generateImage(prompt: string): Promise<string> {
  const config = getConfig();
  const fullPrompt = `${prompt}，人像摄影，轻度美颜，自然光，暖色调，柔和光线，高质量，无文字水印`;

  const response = await fetch(config.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      prompt: fullPrompt,
      size: "2K",
      response_format: "url",
      n: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Image API failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    data?: Array<{ url?: string }>;
    error?: { message?: string };
  };

  const imageUrl = data.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error(data.error?.message ?? "No image URL in response");
  }

  return imageUrl;
}

async function downloadToFile(url: string, filePath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(filePath, buffer);
}

async function main(): Promise<void> {
  const outDir = path.join(process.cwd(), "public", "avatars");
  await mkdir(outDir, { recursive: true });

  for (const avatar of AVATARS) {
    console.log(`Generating ${avatar.file}...`);
    const url = await generateImage(avatar.prompt);
    const filePath = path.join(outDir, avatar.file);
    await downloadToFile(url, filePath);
    console.log(`Saved ${filePath}`);
  }

  console.log("Done. Update avatarUrl in src/lib/relationship/config.ts if needed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
