"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const isUser = message.role === "user";
  const alignClass = isUser ? "justify-end" : "justify-start";

  useEffect(() => {
    if (!isImageExpanded || message.type !== "image" || !message.mediaKey) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsImageExpanded(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isImageExpanded, message.mediaKey, message.type]);
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
      <>
        <div className={`flex ${alignClass} mb-3 ${animClass}`}>
          <div
            className="max-w-[75%] rounded-2xl bg-white p-2 shadow-sm"
            aria-label={ariaLabel}
            role="article"
          >
            <button
              type="button"
              onClick={() => setIsImageExpanded(true)}
              className="block cursor-zoom-in rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2"
              aria-label="点击放大图片"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.mediaKey}
                alt={message.content}
                className="max-h-48 rounded-xl object-contain"
                loading="lazy"
              />
            </button>
            <p className="mt-1 px-1 text-xs text-muted-foreground">{message.content}</p>
          </div>
        </div>

        {isImageExpanded ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="放大图片"
            onClick={() => setIsImageExpanded(false)}
          >
            <button
              type="button"
              onClick={() => setIsImageExpanded(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/45 p-2 text-white transition-colors hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="关闭图片预览"
            >
              <X className="size-6" aria-hidden="true" />
            </button>
            <div
              className="flex max-h-full max-w-full items-center justify-center"
              onClick={(event) => event.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.mediaKey}
                alt={message.content}
                className="max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] rounded-xl object-contain shadow-2xl"
              />
            </div>
          </div>
        ) : null}
      </>
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
