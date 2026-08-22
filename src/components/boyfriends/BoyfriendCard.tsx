"use client";

import Link from "next/link";

import { IntimacyBar } from "@/components/chat/IntimacyBar";
import { getRelationshipModeConfig } from "@/lib/relationship/config";
import type { Boyfriend } from "@/lib/types";

interface BoyfriendCardProps {
  boyfriend: Boyfriend;
  onDelete?: (id: string) => void;
}

export function BoyfriendCard({
  boyfriend,
  onDelete,
}: BoyfriendCardProps): React.ReactElement {
  const modeConfig = getRelationshipModeConfig(boyfriend.relationshipMode);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/chat/${boyfriend.id}`} className="block p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
            style={{ backgroundColor: modeConfig.color }}
          >
            {boyfriend.nickname.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-medium text-[var(--color-text-primary)]">
                {boyfriend.nickname}
              </h3>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-xs text-white"
                style={{ backgroundColor: modeConfig.color }}
              >
                {modeConfig.label}
              </span>
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {boyfriend.lastMessagePreview ?? "还没有消息，去打个招呼吧"}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <IntimacyBar value={boyfriend.intimacy} />
        </div>
      </Link>
      {onDelete ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (confirm(`确定删除 ${boyfriend.nickname} 吗？`)) {
              onDelete(boyfriend.id);
            }
          }}
          className="absolute right-3 top-3 rounded-lg px-2 py-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
        >
          删除
        </button>
      ) : null}
    </div>
  );
}
