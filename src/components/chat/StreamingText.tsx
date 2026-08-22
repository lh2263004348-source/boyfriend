"use client";

interface StreamingTextProps {
  text: string;
}

export function StreamingText({ text }: StreamingTextProps): React.ReactElement {
  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[75%] rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-sm leading-relaxed text-[var(--color-text-primary)] shadow-sm">
        {text}
        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[var(--color-accent-primary)] align-middle" />
      </div>
    </div>
  );
}

interface TypingIndicatorProps {
  visible: boolean;
}

export function TypingIndicator({
  visible,
}: TypingIndicatorProps): React.ReactElement | null {
  if (!visible) return null;

  return (
    <div className="flex justify-start mb-3">
      <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          <span className="size-2 animate-bounce rounded-full bg-[var(--color-accent-primary)] [animation-delay:0ms]" />
          <span className="size-2 animate-bounce rounded-full bg-[var(--color-accent-primary)] [animation-delay:150ms]" />
          <span className="size-2 animate-bounce rounded-full bg-[var(--color-accent-primary)] [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
