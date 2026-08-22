"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { BoyfriendCard } from "@/components/boyfriends/BoyfriendCard";
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
    <main className="mx-auto min-h-screen max-w-lg px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            纸片人男友
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">你好，{userName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/create"
            className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            + 创建
          </Link>
          <LogoutButton />
        </div>
      </header>

      {loading ? (
        <p className="text-center text-muted-foreground">加载中…</p>
      ) : list.length === 0 ? (
        <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <p className="text-muted-foreground">
            还没有男友，创建你的第一个纸片人男友吧
          </p>
          <Link
            href="/create"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            创建男友
          </Link>
        </section>
      ) : (
        <div className="space-y-3">
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
