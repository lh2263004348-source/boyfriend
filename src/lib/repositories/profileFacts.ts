import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  userProfileFacts,
  type DbUserProfileFact,
  type NewDbUserProfileFact,
} from "@/lib/db/schema";
import { assertBoyfriendOwnership } from "@/lib/repositories/boyfriends";
import type { UserProfileFact } from "@/lib/types";

function mapProfileFact(row: DbUserProfileFact): UserProfileFact {
  return {
    id: row.id,
    boyfriendId: row.boyfriendId,
    factKey: row.factKey,
    factValue: row.factValue,
    sourceMessageId: row.sourceMessageId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listProfileFactsByBoyfriendId(
  boyfriendId: string,
  userId: string
): Promise<UserProfileFact[]> {
  const boyfriend = await assertBoyfriendOwnership(boyfriendId, userId);
  if (!boyfriend) {
    return [];
  }

  const rows = await db
    .select()
    .from(userProfileFacts)
    .where(eq(userProfileFacts.boyfriendId, boyfriendId));

  return rows.map(mapProfileFact);
}

export async function upsertProfileFact(
  data: NewDbUserProfileFact,
  userId: string
): Promise<UserProfileFact | null> {
  const boyfriend = await assertBoyfriendOwnership(data.boyfriendId, userId);
  if (!boyfriend) {
    return null;
  }

  const [row] = await db
    .insert(userProfileFacts)
    .values(data)
    .onConflictDoUpdate({
      target: [userProfileFacts.boyfriendId, userProfileFacts.factKey],
      set: {
        factValue: data.factValue,
        sourceMessageId: data.sourceMessageId,
        updatedAt: new Date(),
      },
    })
    .returning();

  return mapProfileFact(row);
}

export async function deleteProfileFactsByBoyfriendId(
  boyfriendId: string,
  userId: string
): Promise<boolean> {
  const boyfriend = await assertBoyfriendOwnership(boyfriendId, userId);
  if (!boyfriend) {
    return false;
  }

  await db
    .delete(userProfileFacts)
    .where(eq(userProfileFacts.boyfriendId, boyfriendId));

  return true;
}

export async function getProfileFactByKey(
  boyfriendId: string,
  factKey: string,
  userId: string
): Promise<UserProfileFact | null> {
  const boyfriend = await assertBoyfriendOwnership(boyfriendId, userId);
  if (!boyfriend) {
    return null;
  }

  const [row] = await db
    .select()
    .from(userProfileFacts)
    .where(
      and(
        eq(userProfileFacts.boyfriendId, boyfriendId),
        eq(userProfileFacts.factKey, factKey)
      )
    )
    .limit(1);

  return row ? mapProfileFact(row) : null;
}
