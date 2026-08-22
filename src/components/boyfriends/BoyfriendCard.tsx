"use client";

import Image from "next/image";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { useState } from "react";

import { IntimacyBar } from "@/components/chat/IntimacyBar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <div className="card-hover group relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <Link
          href={`/chat/${boyfriend.id}`}
          className="block cursor-pointer p-4"
          aria-label={`与 ${boyfriend.nickname} 聊天${boyfriend.unreadCount > 0 ? `，${boyfriend.unreadCount} 条未读` : ""}`}
        >
          <div className="flex items-start gap-3">
            <div className="relative size-[60px] shrink-0 overflow-hidden rounded-full">
              <Image
                src={boyfriend.avatarUrl}
                alt={boyfriend.nickname}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-medium text-[var(--color-text-primary)]">
                  {boyfriend.nickname}
                  <span className="text-muted-foreground">·</span>
                  <span style={{ color: modeConfig.color }}>
                    {modeConfig.label}
                  </span>
                </h3>
              </div>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {boyfriend.lastMessagePreview ?? "还没有消息，去打个招呼吧"}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <IntimacyBar value={boyfriend.intimacy} variant="compact" />
          </div>
        </Link>

        {boyfriend.unreadCount > 0 ? (
          <span
            className="pointer-events-none absolute right-12 top-4 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent-primary)] px-1.5 text-xs font-medium text-white"
            aria-hidden="true"
          >
            {boyfriend.unreadCount > 99 ? "99+" : boyfriend.unreadCount}
          </span>
        ) : null}

        {onDelete ? (
          <div className="absolute right-2 top-3">
            <button
              type="button"
              aria-label="更多操作"
              aria-expanded={menuOpen}
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen((v) => !v);
              }}
              className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MoreVertical className="size-5" />
            </button>
            {menuOpen ? (
              <>
                <button
                  type="button"
                  aria-label="关闭菜单"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-11 z-20 min-w-[120px] overflow-hidden rounded-xl border border-border bg-white py-1 shadow-md">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmOpen(true);
                    }}
                    className="flex min-h-[44px] w-full cursor-pointer items-center px-4 text-sm text-[var(--color-error)] transition-colors hover:bg-red-50"
                  >
                    删除
                  </button>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={`删除 ${boyfriend.nickname}？`}
        description="删除后聊天记录将无法恢复，确定要告别吗？"
        confirmLabel="删除"
        cancelLabel="再想想"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete?.(boyfriend.id);
        }}
      />
    </>
  );
}
