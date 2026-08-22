"use client";

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
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="surprise-title"
    >
      <div
        className="animate-modal-in w-full max-w-sm rounded-2xl bg-white p-6"
        style={{ boxShadow: "var(--shadow-surprise)" }}
      >
        <p className="mb-2 text-center text-sm text-[var(--color-accent-primary)]">
          收到一份惊喜
        </p>
        <div className="mx-auto mb-4 flex size-[200px] items-center justify-center rounded-2xl bg-[var(--color-accent-soft)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={giftImage}
            alt={giftName}
            className="size-[160px] object-contain"
          />
        </div>
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
      </div>
    </div>
  );
}
