"use client";

import { Send, Smile } from "lucide-react";
import { useState } from "react";

import { StickerPicker } from "@/components/chat/StickerPicker";
import { Button } from "@/components/ui/button";
import type { StickerItem } from "@/lib/stickers/data";

interface ChatInputProps {
  onSend: (text: string) => void;
  onSendSticker?: (sticker: StickerItem) => void;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  onSendSticker,
  disabled = false,
}: ChatInputProps): React.ReactElement {
  const [text, setText] = useState("");
  const [stickerOpen, setStickerOpen] = useState(false);

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <div
      className="border-t border-border bg-[var(--color-bg-primary)] pb-safe"
      style={{ touchAction: "manipulation" }}
    >
      <StickerPicker
        open={stickerOpen}
        onClose={() => setStickerOpen(false)}
        onSelect={(sticker) => onSendSticker?.(sticker)}
      />
      <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={() => setStickerOpen((v) => !v)}
          className="size-11 shrink-0 cursor-pointer rounded-xl"
          aria-label={stickerOpen ? "关闭表情包" : "选择表情包"}
          aria-expanded={stickerOpen}
        >
          <Smile className="size-5" />
        </Button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="说点什么…"
          rows={1}
          disabled={disabled}
          aria-label="消息输入框"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-input bg-muted px-3 py-2.5 text-[length:var(--text-message)] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
        />
        <Button
          type="submit"
          size="icon"
          disabled={disabled || !text.trim()}
          className="size-11 shrink-0 cursor-pointer rounded-xl"
          aria-label="发送消息"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
