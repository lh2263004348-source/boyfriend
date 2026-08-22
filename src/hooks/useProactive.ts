"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  pickProactiveMessage,
  type ProactiveTrigger,
} from "@/lib/relationship/openings";
import type { Message, RelationshipMode } from "@/lib/types";

const SILENCE_MS = 30_000;
const UNREAD_MS = 5 * 60_000;
const MIN_INTERVAL_MS = 5 * 60_000;
const MAX_PER_SESSION = 3;

interface UseProactiveOptions {
  boyfriendId: string;
  relationshipMode: RelationshipMode;
  enabled: boolean;
  onProactiveMessage: (message: Message) => void;
  resetKey?: number;
}

async function saveProactiveMessage(
  boyfriendId: string,
  content: string
): Promise<Message | null> {
  const res = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      boyfriendId,
      role: "boyfriend",
      type: "text",
      content,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { message?: Message };
  return data.message ?? null;
}

export function useProactive({
  boyfriendId,
  relationshipMode,
  enabled,
  onProactiveMessage,
  resetKey = 0,
}: UseProactiveOptions): void {
  const lastActivityRef = useRef(Date.now());
  const lastProactiveRef = useRef(0);
  const sessionCountRef = useRef(0);
  const hiddenAtRef = useRef<number | null>(null);

  const touchActivity = useCallback((): void => {
    lastActivityRef.current = Date.now();
  }, []);

  const trySend = useCallback(
    async (trigger: ProactiveTrigger): Promise<void> => {
      if (!enabled) return;
      if (sessionCountRef.current >= MAX_PER_SESSION) return;

      const now = Date.now();
      if (now - lastProactiveRef.current < MIN_INTERVAL_MS) return;

      const content = pickProactiveMessage(relationshipMode, trigger);
      const message = await saveProactiveMessage(boyfriendId, content);
      if (message) {
        lastProactiveRef.current = now;
        sessionCountRef.current += 1;
        onProactiveMessage(message);
      }
    },
    [boyfriendId, enabled, onProactiveMessage, relationshipMode]
  );

  useEffect(() => {
    sessionCountRef.current = 0;
    lastProactiveRef.current = 0;
    lastActivityRef.current = Date.now();
    hiddenAtRef.current = null;
  }, [boyfriendId, resetKey]);

  useEffect(() => {
    if (!enabled) return;

    const onActivity = (): void => touchActivity();
    window.addEventListener("keydown", onActivity);
    window.addEventListener("pointerdown", onActivity);

    const silenceTimer = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= SILENCE_MS) {
        void trySend("silence");
        lastActivityRef.current = Date.now();
      }
    }, 5000);

    const onVisibility = (): void => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        return;
      }
      if (
        hiddenAtRef.current &&
        Date.now() - hiddenAtRef.current >= UNREAD_MS
      ) {
        void trySend("unread");
      }
      hiddenAtRef.current = null;
      touchActivity();
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("pointerdown", onActivity);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(silenceTimer);
    };
  }, [enabled, touchActivity, trySend]);
}
