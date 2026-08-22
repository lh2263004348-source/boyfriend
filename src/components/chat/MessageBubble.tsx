"use client";

import type { Message } from "@/lib/types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps): React.ReactElement {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "rounded-br-md bg-[var(--color-bg-message-self)] text-[var(--color-text-primary)]"
            : "rounded-bl-md bg-white text-[var(--color-text-primary)]"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
