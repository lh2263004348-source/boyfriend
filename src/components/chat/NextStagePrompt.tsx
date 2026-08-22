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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <p className="text-2xl">💕</p>
        <h3 className="mt-3 text-lg font-semibold">你们已经这么亲密了</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          你和他已经这么亲密了，下一阶段敬请期待
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground"
        >
          知道了
        </button>
      </div>
    </div>
  );
}
