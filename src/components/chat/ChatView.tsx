"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { ChatInput } from "@/components/chat/ChatInput";
import { IntimacyBar } from "@/components/chat/IntimacyBar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { NextStagePrompt } from "@/components/chat/NextStagePrompt";
import { SurpriseCard } from "@/components/chat/SurpriseCard";
import {
  StreamingText,
  TypingIndicator,
} from "@/components/chat/StreamingText";
import { useProactive } from "@/hooks/useProactive";
import { useStreaming } from "@/hooks/useStreaming";
import { buildRecallMessage } from "@/lib/memory/recall";
import { getOpeningMessage } from "@/lib/relationship/openings";
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
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [intimacy, setIntimacy] = useState(boyfriend.intimacy);
  const [surpriseGift, setSurpriseGift] = useState<{
    name: string;
    image: string;
    meaning: string;
  } | null>(null);
  const [showNextStage, setShowNextStage] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const openingSentRef = useRef(false);
  const { streamingText, isStreaming, isTyping, error, sendMessage, reset } =
    useStreaming();

  const modeConfig = getRelationshipModeConfig(boyfriend.relationshipMode);

  const addMessage = useCallback((message: Message): void => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  useProactive({
    boyfriendId: boyfriend.id,
    relationshipMode: boyfriend.relationshipMode,
    enabled: !isTyping && !isStreaming && messages.length > 0,
    onProactiveMessage: addMessage,
  });

  useEffect(() => {
    if (openingSentRef.current) return;
    openingSentRef.current = true;

    let content: string | null = null;
    if (initialMessages.length === 0) {
      content = getOpeningMessage(boyfriend.relationshipMode);
    } else if (profileFacts.length > 0) {
      content = buildRecallMessage(boyfriend.relationshipMode, profileFacts);
    }

    if (!content) return;

    void fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boyfriendId: boyfriend.id,
        role: "boyfriend",
        type: "text",
        content,
      }),
    })
      .then((res) => res.json())
      .then((data: { message?: Message }) => {
        if (data.message) addMessage(data.message);
      })
      .catch(() => undefined);
  }, [
    addMessage,
    boyfriend.id,
    boyfriend.relationshipMode,
    initialMessages.length,
    profileFacts,
  ]);

  useEffect(() => {
    const onLeave = (): void => {
      navigator.sendBeacon(
        "/api/memory/extract",
        new Blob(
          [JSON.stringify({ boyfriendId: boyfriend.id })],
          { type: "application/json" }
        )
      );
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [boyfriend.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText, isTyping, isStreaming]);

  const reloadMessages = useCallback(async (): Promise<void> => {
    const res = await fetch(
      `/api/messages?boyfriendId=${boyfriend.id}&limit=50`
    );
    const data = (await res.json()) as { messages?: Message[] };
    if (data.messages) setMessages(data.messages);
  }, [boyfriend.id]);

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

      try {
        const result = await sendMessage(boyfriend.id, text);
        reset();

        if (result.meta) {
          setIntimacy(result.meta.intimacy);
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
        }

        await reloadMessages();

        if (
          result.decision?.shouldGenerateImage &&
          result.decision.imagePrompt?.trim()
        ) {
          const pendingId = `pending-image-${Date.now()}`;
          const pendingMessage: Message = {
            id: pendingId,
            boyfriendId: boyfriend.id,
            role: "boyfriend",
            type: "image",
            content: "给你看一张图~",
            mediaKey: null,
            emotion: result.decision.emotion ?? null,
            isSurprise: false,
            createdAt: new Date(),
          };
          setMessages((prev) => [...prev, pendingMessage]);

          void fetch("/api/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              boyfriendId: boyfriend.id,
              prompt: result.decision.imagePrompt,
              imageType: result.decision.imageType ?? "scene",
              caption: "给你看一张图~",
            }),
          })
            .then(async (res) => {
              const data = (await res.json()) as {
                message?: Message;
                degraded?: boolean;
              };
              if (data.message) {
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
    [boyfriend.id, reloadMessages, reset, sendMessage]
  );

  const handleSendSticker = useCallback(
    async (sticker: StickerItem): Promise<void> => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boyfriendId: boyfriend.id,
          role: "user",
          type: "sticker",
          content: sticker.id,
          emotion: sticker.emotion,
        }),
      });
      const data = (await res.json()) as { message?: Message };
      if (data.message) addMessage(data.message);
    },
    [addMessage, boyfriend.id]
  );

  return (
    <div className="flex h-[100dvh] flex-col bg-[var(--color-bg-primary)]">
      <header className="border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ←
          </Link>
          <div className="relative size-9 shrink-0 overflow-hidden rounded-full">
            <Image
              src={boyfriend.avatarUrl}
              alt={boyfriend.nickname}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-medium">
              {boyfriend.nickname}
              <span className="text-muted-foreground">·</span>
              <span style={{ color: modeConfig.color }}>{modeConfig.label}</span>
            </h1>
          </div>
        </div>
        <IntimacyBar value={intimacy} />
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <TypingIndicator visible={isTyping} />
          {isStreaming && streamingText ? (
            <StreamingText text={streamingText} />
          ) : null}
          {error ? (
            <p className="text-center text-sm text-[var(--color-error)]">
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
