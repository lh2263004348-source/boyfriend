"use client";

import { getStickerById } from "@/lib/stickers/data";
import type { Message } from "@/lib/types";

interface MessageBubbleProps {
  message: Message;
  animate?: boolean;
}

function getMessageAriaLabel(message: Message): string {
  const who = message.role === "user" ? "我说" : "他说";
  if (message.type === "sticker") {
    const sticker = getStickerById(message.content);
    return `${who}：${sticker?.label ?? "表情包"}`;
  }
  if (message.type === "image") {
    return `${who}：${message.mediaKey ? "图片" : "图片生成中"}，${message.content}`;
  }
  if (message.type === "voice") {
    return `${who}：语音，${message.content}`;
  }
  return `${who}：${message.content}`;
}

export function MessageBubble({
  message,
  animate = false,
}: MessageBubbleProps): React.ReactElement {
  const isUser = message.role === "user";
  const alignClass = isUser ? "justify-end" : "justify-start";
  const ariaLabel = getMessageAriaLabel(message);
  const animClass = animate ? "animate-bubble-in" : "";

  if (message.type === "image" && !message.mediaKey) {
    return (
      <div className={`flex ${alignClass} mb-3 ${animClass}`}>
        <div
          className="max-w-[75%] rounded-2xl bg-white px-4 py-3 shadow-sm"
          aria-label={ariaLabel}
          role="article"
        >
          <div className="h-24 w-40 animate-pulse rounded-xl bg-muted" />
          <p className="mt-2 text-sm text-muted-foreground">图片生成中…</p>
        </div>
      </div>
    );
  }

  if (message.type === "image" && message.mediaKey) {
    return (
      <div className={`flex ${alignClass} mb-3 ${animClass}`}>
        <div
          className="max-w-[75%] rounded-2xl bg-white p-2 shadow-sm"
          aria-label={ariaLabel}
          role="article"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={message.mediaKey}
            alt={message.content}
            className="max-h-48 rounded-xl object-contain"
            loading="lazy"
          />
          <p className="mt-1 px-1 text-xs text-muted-foreground">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.type === "voice" && !message.mediaKey) {
    return (
      <div className={`flex ${alignClass} mb-3 ${animClass}`}>
        <div
          className="max-w-[75%] rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm"
          aria-label={ariaLabel}
          role="article"
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="size-1.5 animate-bounce rounded-full bg-[var(--color-accent-primary)] [animation-delay:0ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-[var(--color-accent-primary)] [animation-delay:150ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-[var(--color-accent-primary)] [animation-delay:300ms]" />
            </div>
            <span className="text-sm text-muted-foreground">语音生成中…</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-[length:var(--text-message)] leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  if (message.type === "voice" && message.mediaKey) {
    return (
      <div className={`flex ${alignClass} mb-3 ${animClass}`}>
        <div
          className="max-w-[75%] rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm"
          aria-label={ariaLabel}
          role="article"
        >
          <audio controls src={message.mediaKey} className="w-full max-w-xs" />
          <p className="mt-2 whitespace-pre-wrap text-[length:var(--text-message)] leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  if (message.type === "sticker") {
    const sticker = getStickerById(message.content);
    const emoji = sticker?.emoji ?? message.content;
    return (
      <div className={`flex ${alignClass} mb-3 ${animClass}`}>
        <div
          className="flex size-20 items-center justify-center rounded-2xl bg-white text-5xl shadow-sm"
          aria-label={ariaLabel}
          role="img"
        >
          {emoji}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${alignClass} mb-3 ${animClass}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[length:var(--text-message)] leading-relaxed shadow-sm ${
          isUser
            ? "rounded-br-md bg-[var(--color-bg-message-self)] text-[var(--color-text-primary)]"
            : "rounded-bl-md bg-white text-[var(--color-text-primary)]"
        } ${message.isSurprise ? "ring-2 ring-[var(--color-accent-warm)]" : ""}`}
        aria-label={ariaLabel}
        role="article"
      >
        {message.content}
        {message.emotion && isUser ? (
          <span className="ml-1 text-xs opacity-60">·{message.emotion}</span>
        ) : null}
      </div>
    </div>
  );
}
