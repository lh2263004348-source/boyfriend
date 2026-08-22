"use client";

interface NextStagePromptProps {
  open: boolean;
  onClose: () => void;
}

export function NextStagePrompt({
  open,
  onClose,
}: NextStagePromptProps): React.ReactElement | null {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="next-stage-title"
    >
      <div className="animate-modal-in w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-lg">
        <div
          className="mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--color-accent-soft)]"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-8 text-[var(--color-accent-primary)]"
            fill="currentColor"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <h3 id="next-stage-title" className="mt-4 text-lg font-semibold">
          你们已经这么亲密了
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          暧昧值已满，下一阶段敬请期待
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 min-h-[44px] w-full cursor-pointer rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          知道了
        </button>
      </div>
    </div>
  );
}
