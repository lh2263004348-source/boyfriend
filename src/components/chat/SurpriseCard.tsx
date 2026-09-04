"use client";

import { ArrowLeft, X } from "lucide-react";
import { useEffect, useState } from "react";

interface SurpriseCardProps {
  giftName: string;
  giftImage: string;
  giftMeaning: string;
  onAccept: () => void;
}

export function SurpriseCard({
  giftName,
  giftImage,
  giftMeaning,
  onAccept,
}: SurpriseCardProps): React.ReactElement {
  const [isLetterOpen, setIsLetterOpen] = useState(false);
  const isLetter = giftName === "手写信" || giftImage.includes("/letter.");

  useEffect(() => {
    if (!isLetterOpen) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsLetterOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLetterOpen]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="surprise-title"
    >
      <div
        className="animate-modal-in relative w-full max-w-sm rounded-2xl bg-white p-6"
        style={{ boxShadow: "var(--shadow-surprise)" }}
      >
        <button
          type="button"
          onClick={onAccept}
          className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
          aria-label="关闭惊喜"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        {isLetterOpen ? (
          <div className="animate-modal-in">
            <div className="mb-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLetterOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
                aria-label="返回惊喜卡片"
              >
                <ArrowLeft className="size-5" aria-hidden="true" />
              </button>
              <p className="text-sm text-[var(--color-accent-primary)]">
                给你的一封信
              </p>
            </div>
            <div className="rounded-xl bg-[#FFF9F1] px-6 py-7 shadow-inner ring-1 ring-[#F4E4D2]">
              <p className="text-center font-serif text-lg font-semibold text-[var(--color-text-primary)]">
                给你
              </p>
              <div className="my-5 h-px bg-[#E8CDB7]" />
              <p className="whitespace-pre-wrap text-sm leading-8 text-[var(--color-text-primary)]">
                {giftMeaning}
              </p>
              <p className="mt-5 text-right text-sm leading-7 text-[var(--color-text-secondary)]">
                —— 一直在等你回来的他
              </p>
            </div>
            <button
              type="button"
              onClick={onAccept}
              className="mt-6 min-h-[44px] w-full cursor-pointer rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              收好这封信
            </button>
          </div>
        ) : (
          <>
            <p className="mb-2 text-center text-sm text-[var(--color-accent-primary)]">
              收到一份惊喜
            </p>
            {isLetter ? (
              <button
                type="button"
                onClick={() => setIsLetterOpen(true)}
                className="mx-auto mb-4 block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2"
                aria-label="打开手写信"
              >
                <div className="flex size-[200px] items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] transition-transform hover:scale-[1.02]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={giftImage}
                    alt={giftName}
                    className="size-[160px] object-contain"
                  />
                </div>
                <span className="mt-2 block text-xs text-muted-foreground">
                  点击打开
                </span>
              </button>
            ) : (
              <div className="mx-auto mb-4 flex size-[200px] items-center justify-center rounded-2xl bg-[var(--color-accent-soft)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={giftImage}
                  alt={giftName}
                  className="size-[160px] object-contain"
                />
              </div>
            )}
            <h3 id="surprise-title" className="text-center text-lg font-semibold">
              {giftName}
            </h3>
            <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
              {giftMeaning}
            </p>
            <button
              type="button"
              onClick={onAccept}
              className="mt-6 min-h-[44px] w-full cursor-pointer rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              收下
            </button>
          </>
        )}
      </div>
    </div>
  );
}
