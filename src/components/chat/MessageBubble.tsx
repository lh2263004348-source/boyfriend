"use client";

import type { Message } from "@/lib/types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps): React.ReactElement {
  const isUser = message.role === "user";

  if (message.type === "image" && message.mediaKey) {
    return (
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
        <div className="max-w-[75%] rounded-2xl bg-white p-2 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={message.mediaKey}
            alt={message.content}
            className="max-h-40 rounded-xl object-contain"
          />
          <p className="mt-1 px-1 text-xs text-muted-foreground">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.type === "voice" && message.mediaKey) {
    return (
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
        <div className="max-w-[75%] rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
          <audio controls src={message.mediaKey} className="w-full max-w-xs" />
          <p className="mt-2 whitespace-pre-wrap text-sm">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.type === "sticker" && message.mediaKey) {
    return (
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={message.mediaKey} alt="sticker" className="size-24 object-contain" />
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "rounded-br-md bg-[var(--color-bg-message-self)] text-[var(--color-text-primary)]"
            : "rounded-bl-md bg-white text-[var(--color-text-primary)]"
        } ${message.isSurprise ? "ring-2 ring-[var(--color-accent-warm)]" : ""}`}
      >
        {message.content}
      </div>
    </div>
  );
}
