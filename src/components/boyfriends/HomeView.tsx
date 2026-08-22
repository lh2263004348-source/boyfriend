"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { BoyfriendCard } from "@/components/boyfriends/BoyfriendCard";
import { BoyfriendCardSkeleton } from "@/components/boyfriends/BoyfriendCardSkeleton";
import { LogoutButton } from "@/components/layout/LogoutButton";
import {
  useChatDispatch,
  useChatState,
} from "@/components/providers/ChatProvider";
import type { Boyfriend } from "@/lib/types";

interface HomeViewProps {
  userName: string;
  initialBoyfriends: Boyfriend[];
}

export function HomeView({
  userName,
  initialBoyfriends,
}: HomeViewProps): React.ReactElement {
  const { loading } = useChatState();
  const dispatch = useChatDispatch();
  const router = useRouter();
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  useEffect(() => {
    dispatch({ type: "INIT", boyfriends: initialBoyfriends });
  }, [dispatch, initialBoyfriends]);

  const list = initialBoyfriends.filter((b) => !removedIds.includes(b.id));

  const handleDelete = useCallback(
    async (id: string): Promise<void> => {
      const res = await fetch(`/api/boyfriends?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setRemovedIds((prev) => [...prev, id]);
        dispatch({ type: "DELETE_BOYFRIEND", boyfriendId: id });
        router.refresh();
      }
    },
    [dispatch, router]
  );

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-6 pb-safe">
      <header className="mb-6 flex min-h-12 items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
            我的男友们
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">你好，{userName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/create"
            className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            + 创建
          </Link>
          <LogoutButton />
        </div>
      </header>

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="加载中">
          <BoyfriendCardSkeleton />
          <BoyfriendCardSkeleton />
        </div>
      ) : list.length === 0 ? (
        <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-[var(--color-accent-soft)]">
            <span className="text-3xl text-[var(--color-accent-primary)]" aria-hidden="true">
              ♡
            </span>
          </div>
          <p className="text-base font-medium text-[var(--color-text-primary)]">
            还没有人陪你说话
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            选一个性格，开始你的专属陪伴
          </p>
          <Link
            href="/create"
            className="mt-6 inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            创建男友
          </Link>
        </section>
      ) : (
        <div className="space-y-3" role="list" aria-label="男友列表">
          {list.map((boyfriend) => (
            <BoyfriendCard
              key={boyfriend.id}
              boyfriend={boyfriend}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </main>
  );
}
