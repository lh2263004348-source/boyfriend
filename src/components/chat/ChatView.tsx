"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { ChatInput } from "@/components/chat/ChatInput";
import { IntimacyBar } from "@/components/chat/IntimacyBar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import {
  StreamingText,
  TypingIndicator,
} from "@/components/chat/StreamingText";
import { useStreaming } from "@/hooks/useStreaming";
import { getRelationshipModeConfig } from "@/lib/relationship/config";
import type { Boyfriend, Message } from "@/lib/types";

interface ChatViewProps {
  boyfriend: Boyfriend;
  initialMessages: Message[];
}

export function ChatView({
  boyfriend,
  initialMessages,
}: ChatViewProps): React.ReactElement {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const {
    streamingText,
    isStreaming,
    isTyping,
    error,
    sendMessage,
    reset,
  } = useStreaming();

  const modeConfig = getRelationshipModeConfig(boyfriend.relationshipMode);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText, isTyping, isStreaming]);

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
        await sendMessage(boyfriend.id, text);
        reset();

        const res = await fetch(
          `/api/messages?boyfriendId=${boyfriend.id}&limit=50`
        );
        const data = (await res.json()) as { messages?: Message[] };
        if (data.messages) {
          setMessages(data.messages);
        }
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
      }
    },
    [boyfriend.id, reset, sendMessage]
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
          <div
            className="flex size-9 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: modeConfig.color }}
          >
            {boyfriend.nickname.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-medium">{boyfriend.nickname}</h1>
            <p className="text-xs text-muted-foreground">{modeConfig.label}</p>
          </div>
        </div>
        <IntimacyBar value={boyfriend.intimacy} />
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
        <ChatInput onSend={handleSend} disabled={isTyping || isStreaming} />
      </div>
    </div>
  );
}
