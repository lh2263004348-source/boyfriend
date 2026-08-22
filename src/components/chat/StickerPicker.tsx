"use client";

import { STICKERS, type StickerItem } from "@/lib/stickers/data";

interface StickerPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (sticker: StickerItem) => void;
}

export function StickerPicker({
  open,
  onClose,
  onSelect,
}: StickerPickerProps): React.ReactElement | null {
  if (!open) return null;

  return (
    <div className="border-t border-border bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">选择表情包</span>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] cursor-pointer px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          关闭
        </button>
      </div>
      <div className="grid max-h-40 grid-cols-6 gap-2 overflow-y-auto sm:grid-cols-8">
        {STICKERS.map((sticker) => (
          <button
            key={sticker.id}
            type="button"
            title={sticker.label}
            aria-label={sticker.label}
            onClick={() => {
              onSelect(sticker);
              onClose();
            }}
            className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl text-2xl transition-colors hover:bg-[var(--color-accent-soft)]"
          >
            {sticker.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
