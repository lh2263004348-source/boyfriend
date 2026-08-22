/**
 * 将已有男友的 avatarUrl 更新为最新预置 JPG 头像
 * 用法: pnpm tsx scripts/update-avatar-urls.ts
 */
import path from "node:path";

import dotenv from "dotenv";
import { eq } from "drizzle-orm";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const MODE_AVATARS: Record<string, string> = {
  dominant: "/avatars/dominant.jpg",
  puppy: "/avatars/puppy.jpg",
  warm: "/avatars/warm.jpg",
};

async function main(): Promise<void> {
  const { db } = await import("../src/lib/db");
  const { boyfriends } = await import("../src/lib/db/schema");

  for (const [mode, avatarUrl] of Object.entries(MODE_AVATARS)) {
    const result = await db
      .update(boyfriends)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(boyfriends.relationshipMode, mode as "dominant" | "puppy" | "warm"))
      .returning({ id: boyfriends.id });

    console.log(`Updated ${result.length} boyfriends (${mode}) → ${avatarUrl}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
