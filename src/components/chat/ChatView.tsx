"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { ChatInput } from "@/components/chat/ChatInput";
import { IntimacyBar } from "@/components/chat/IntimacyBar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageTimeDivider } from "@/components/chat/MessageTimeDivider";
import { NextStagePrompt } from "@/components/chat/NextStagePrompt";
import { SurpriseCard } from "@/components/chat/SurpriseCard";
import {
  StreamingText,
  TypingIndicator,
} from "@/components/chat/StreamingText";
import { useProactive } from "@/hooks/useProactive";
import { useStreaming } from "@/hooks/useStreaming";
import { useChatDispatch } from "@/components/providers/ChatProvider";
import {
  formatMessageTime,
  shouldShowTimeDivider,
} from "@/lib/chat/timeFormat";
import {
  createOptimisticBoyfriendMessage,
  mergeMessagesWithServer,
} from "@/lib/chat/mergeMessages";
import type { StickerItem } from "@/lib/stickers/data";
import { getRelationshipModeConfig } from "@/lib/relationship/config";
import type { Boyfriend, Message, UserProfileFact } from "@/lib/types";

interface ChatViewProps {
  boyfriend: Boyfriend;
  initialMessages: Message[];
  profileFacts?: UserProfileFact[];
}

export function ChatView({
  boyfriend,
  initialMessages,
  profileFacts = [],
}: ChatViewProps): React.ReactElement {
  const dispatch = useChatDispatch();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [animateMessageIds, setAnimateMessageIds] = useState<Set<string>>(
    () => new Set()
  );
  const [hasMore, setHasMore] = useState(initialMessages.length >= 50);
  const [loadingMore, setLoadingMore] = useState(false);
  const [intimacy, setIntimacy] = useState(boyfriend.intimacy);
  const [surpriseGift, setSurpriseGift] = useState<{
    name: string;
    image: string;
    meaning: string;
  } | null>(null);
  const [showNextStage, setShowNextStage] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingOlderRef = useRef(false);
  const openingSentRef = useRef(false);
  const lastUserTextRef = useRef("");
  const { streamingText, isStreaming, isTyping, error, sendMessage, reset } =
    useStreaming();

  const modeConfig = getRelationshipModeConfig(boyfriend.relationshipMode);

  const markMessageAnimated = useCallback((id: string): void => {
    setAnimateMessageIds((prev) => {
      if (prev.has(id)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const addMessage = useCallback(
    (message: Message, options?: { animate?: boolean }): void => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      if (options?.animate ?? true) {
        markMessageAnimated(message.id);
      }
    },
    [markMessageAnimated]
  );

  useProactive({
    boyfriendId: boyfriend.id,
    relationshipMode: boyfriend.relationshipMode,
    enabled: !isTyping && !isStreaming && messages.length > 0,
    onProactiveMessage: addMessage,
  });

  useEffect(() => {
    if (openingSentRef.current) return;

    const recallKey = `recall-sent-${boyfriend.id}`;
    const openingKey = `opening-sent-${boyfriend.id}`;

    let kind: "opening" | "recall" | null = null;
    if (initialMessages.length === 0) {
      if (sessionStorage.getItem(openingKey)) return;
      kind = "opening";
    } else if (profileFacts.length > 0) {
      if (sessionStorage.getItem(recallKey)) return;
      kind = "recall";
    }

    if (!kind) return;

    openingSentRef.current = true;

    void fetch("/api/messages/system", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boyfriendId: boyfriend.id,
        kind,
      }),
    })
      .then((res) => res.json())
      .then((data: { message?: Message }) => {
        if (data.message) {
          addMessage(data.message);
          if (initialMessages.length === 0) {
            sessionStorage.setItem(openingKey, "1");
          } else {
            sessionStorage.setItem(recallKey, "1");
          }
        }
      })
      .catch(() => {
        openingSentRef.current = false;
      });
  }, [
    addMessage,
    boyfriend.id,
    boyfriend.relationshipMode,
    initialMessages.length,
    profileFacts,
  ]);

  useEffect(() => {
    const extractKey = `extract-at-${boyfriend.id}`;
    const payload = JSON.stringify({ boyfriendId: boyfriend.id });

    const sendExtractBeacon = (): void => {
      const last = sessionStorage.getItem(extractKey);
      if (last && Date.now() - Number(last) < 30_000) return;
      sessionStorage.setItem(extractKey, String(Date.now()));
      navigator.sendBeacon(
        "/api/memory/extract",
        new Blob([payload], { type: "application/json" })
      );
    };

    const onBeforeUnload = (): void => sendExtractBeacon();

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      sendExtractBeacon();
    };
  }, [boyfriend.id]);

  useEffect(() => {
    void fetch("/api/boyfriends", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: boyfriend.id, markRead: true }),
    }).then((res) => {
      if (res.ok) {
        dispatch({
          type: "UPDATE_BOYFRIEND",
          boyfriend: { ...boyfriend, unreadCount: 0 },
        });
      }
    });
    // 进入聊天页时清零未读，仅执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boyfriend.id, dispatch]);

  useEffect(() => {
    if (isLoadingOlderRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText, isTyping, isStreaming]);

  const reloadMessages = useCallback(async (): Promise<void> => {
    const res = await fetch(
      `/api/messages?boyfriendId=${boyfriend.id}&limit=50`
    );
    const data = (await res.json()) as { messages?: Message[] };
    if (data.messages) {
      setMessages((prev) => mergeMessagesWithServer(prev, data.messages!));
      setHasMore(data.messages.length >= 50);
    }
  }, [boyfriend.id]);

  const pollVoiceMessage = useCallback(
    async (messageId: string): Promise<void> => {
      for (let i = 0; i < 8; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const res = await fetch(
          `/api/messages?boyfriendId=${boyfriend.id}&limit=50`
        );
        const data = (await res.json()) as { messages?: Message[] };
        const target = data.messages?.find((m) => m.id === messageId);
        if (target?.type === "voice" && target.mediaKey) {
          if (data.messages) {
            setMessages((prev) => mergeMessagesWithServer(prev, data.messages!));
          }
          return;
        }
      }
      await reloadMessages();
    },
    [boyfriend.id, reloadMessages]
  );

  const loadOlderMessages = useCallback(async (): Promise<void> => {
    const oldest = messages[0];
    if (!oldest || loadingMore) return;

    const scrollEl = scrollContainerRef.current;
    const prevScrollHeight = scrollEl?.scrollHeight ?? 0;

    setLoadingMore(true);
    isLoadingOlderRef.current = true;
    try {
      const cursor = encodeURIComponent(
        new Date(oldest.createdAt).toISOString()
      );
      const res = await fetch(
        `/api/messages?boyfriendId=${boyfriend.id}&limit=50&cursor=${cursor}`
      );
      const data = (await res.json()) as { messages?: Message[] };
      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => [...data.messages!, ...prev]);
        setHasMore(data.messages.length >= 50);
        requestAnimationFrame(() => {
          if (scrollEl) {
            scrollEl.scrollTop = scrollEl.scrollHeight - prevScrollHeight;
          }
        });
      } else {
        setHasMore(false);
      }
    } finally {
      setLoadingMore(false);
      isLoadingOlderRef.current = false;
    }
  }, [boyfriend.id, loadingMore, messages]);

  const handleSend = useCallback(
    async (text: string): Promise<void> => {
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        boyfriendId: boyfriend.id,
        role: "user",
        type: "text",
        content: text,
        mediaKey: null,
        emotion: null,
        isSurprise: false,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, tempUserMessage]);
      markMessageAnimated(tempUserMessage.id);
      lastUserTextRef.current = text;

      try {
        const result = await sendMessage(boyfriend.id, text);

        if (result.content.trim()) {
          setMessages((prev) => [
            ...prev,
            createOptimisticBoyfriendMessage(
              boyfriend.id,
              result.content,
              result.decision?.emotion ?? null
            ),
          ]);
        }

        reset();

        sessionStorage.setItem(
          `extract-at-${boyfriend.id}`,
          String(Date.now())
        );

        if (result.meta) {
          const nextIntimacy = result.meta.intimacy;
          setIntimacy(nextIntimacy);
          dispatch({
            type: "UPDATE_BOYFRIEND",
            boyfriend: { ...boyfriend, intimacy: nextIntimacy },
          });
          if (result.meta.showNextStage) setShowNextStage(true);
          if (
            result.meta.surprise?.type === "gift" &&
            result.meta.surprise.giftName &&
            result.meta.surprise.giftImage &&
            result.meta.surprise.giftMeaning
          ) {
            setSurpriseGift({
              name: result.meta.surprise.giftName,
              image: result.meta.surprise.giftImage,
              meaning: result.meta.surprise.giftMeaning,
            });
          }
          if (
            result.meta.surprise?.type === "song" &&
            result.meta.surprise.messageId
          ) {
            void pollVoiceMessage(result.meta.surprise.messageId);
          }
        }

        await reloadMessages();

        if (
          result.decision?.shouldGenerateImage &&
          result.decision.imagePrompt?.trim()
        ) {
          const imageType = result.decision.imageType ?? "scene";
          const pendingCaption =
            imageType === "selfie" ? "给你报备~稍等一下" : "给你看一张图~";
          const pendingId = `pending-image-${Date.now()}`;
          const pendingMessage: Message = {
            id: pendingId,
            boyfriendId: boyfriend.id,
            role: "boyfriend",
            type: "image",
            content: pendingCaption,
            mediaKey: null,
            emotion: result.decision.emotion ?? null,
            isSurprise: false,
            createdAt: new Date(),
          };
          setMessages((prev) => [...prev, pendingMessage]);
          markMessageAnimated(pendingId);

          void fetch("/api/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              boyfriendId: boyfriend.id,
              prompt: result.decision.imagePrompt,
              imageType,
              caption: pendingCaption,
              userMessage: lastUserTextRef.current,
            }),
          })
            .then(async (res) => {
              const data = (await res.json()) as {
                message?: Message;
                degraded?: boolean;
              };
              if (data.message) {
                markMessageAnimated(data.message.id);
                setMessages((prev) =>
                  prev
                    .filter((m) => m.id !== pendingId)
                    .concat(data.message!)
                );
              } else {
                setMessages((prev) => prev.filter((m) => m.id !== pendingId));
              }
            })
            .catch(() => {
              setMessages((prev) => prev.filter((m) => m.id !== pendingId));
            });
        }
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
      }
    },
    [boyfriend, dispatch, markMessageAnimated, pollVoiceMessage, reloadMessages, reset, sendMessage]
  );

  const handleSendSticker = useCallback(
    async (sticker: StickerItem): Promise<void> => {
      const tempUserMessage: Message = {
        id: `temp-sticker-${Date.now()}`,
        boyfriendId: boyfriend.id,
        role: "user",
        type: "sticker",
        content: sticker.id,
        mediaKey: null,
        emotion: sticker.emotion,
        isSurprise: false,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, tempUserMessage]);
      markMessageAnimated(tempUserMessage.id);

      try {
        const result = await sendMessage(boyfriend.id, "", {
          stickerId: sticker.id,
        });

        if (result.content.trim()) {
          setMessages((prev) => [
            ...prev,
            createOptimisticBoyfriendMessage(
              boyfriend.id,
              result.content,
              result.decision?.emotion ?? null
            ),
          ]);
        }

        reset();

        if (result.meta) {
          const nextIntimacy = result.meta.intimacy;
          setIntimacy(nextIntimacy);
          dispatch({
            type: "UPDATE_BOYFRIEND",
            boyfriend: { ...boyfriend, intimacy: nextIntimacy },
          });
        }

        await reloadMessages();
      } catch {
        setMessages((prev) =>
          prev.filter((m) => m.id !== tempUserMessage.id)
        );
      }
    },
    [boyfriend, dispatch, markMessageAnimated, reloadMessages, reset, sendMessage]
  );

  return (
    <div className="chat-screen flex h-[100dvh] flex-col overflow-hidden bg-[var(--color-bg-primary)]">
      <header className="shrink-0 border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center gap-2 px-3 py-2">
          <Link
            href="/"
            className="flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="返回主页"
          >
            ←
          </Link>
          <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-[var(--color-accent-soft)]">
            <Image
              src={boyfriend.avatarUrl}
              alt={boyfriend.nickname}
              fill
              sizes="36px"
              quality={75}
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-medium">
              {boyfriend.nickname}
              <span className="text-muted-foreground">·</span>
              <span style={{ color: modeConfig.color }}>{modeConfig.label}</span>
            </h1>
            <IntimacyBar value={intimacy} variant="header" />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="scrollbar-hidden flex-1 overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          role="log"
          aria-live="polite"
          aria-label={`与 ${boyfriend.nickname} 的聊天记录`}
        >
          {hasMore ? (
            <button
              type="button"
              onClick={() => void loadOlderMessages()}
              disabled={loadingMore}
              className="mb-4 min-h-[44px] w-full cursor-pointer rounded-xl py-2 text-sm text-muted-foreground transition-colors hover:bg-white/60 disabled:opacity-50"
            >
              {loadingMore ? "加载中…" : "加载更早的消息"}
            </button>
          ) : null}
          {messages.map((message, index) => {
            const previous = index > 0 ? messages[index - 1] : undefined;
            const showTime = shouldShowTimeDivider(message, previous);
            return (
              <div key={message.id}>
                {showTime ? (
                  <MessageTimeDivider
                    time={formatMessageTime(message.createdAt)}
                  />
                ) : null}
                <MessageBubble
                  message={message}
                  animate={animateMessageIds.has(message.id)}
                />
              </div>
            );
          })}
          <TypingIndicator visible={isTyping} />
          {isStreaming && streamingText ? (
            <StreamingText text={streamingText} />
          ) : null}
          {error ? (
            <p className="text-center text-sm text-[var(--color-error)]" role="alert">
              {error}
            </p>
          ) : null}
          <div ref={bottomRef} />
        </div>
        <ChatInput
          onSend={handleSend}
          onSendSticker={handleSendSticker}
          disabled={isTyping || isStreaming}
        />
      </div>

      {surpriseGift ? (
        <SurpriseCard
          giftName={surpriseGift.name}
          giftImage={surpriseGift.image}
          giftMeaning={surpriseGift.meaning}
          onAccept={() => setSurpriseGift(null)}
        />
      ) : null}
      <NextStagePrompt
        open={showNextStage}
        onClose={() => setShowNextStage(false)}
      />
    </div>
  );
}
