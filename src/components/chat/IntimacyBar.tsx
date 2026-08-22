"use client";

interface IntimacyBarProps {
  value: number;
  variant?: "default" | "compact" | "header";
}

export function IntimacyBar({
  value,
  variant = "default",
}: IntimacyBarProps): React.ReactElement {
  const clamped = Math.min(100, Math.max(0, value));

  if (variant === "compact") {
    return (
      <div
        className="h-2 w-[60px] overflow-hidden rounded-full bg-[var(--color-accent-soft)]"
        aria-label={`暧昧值 ${clamped}`}
        title={`暧昧值 ${clamped}/100`}
      >
        <div
          className="h-full rounded-full bg-[var(--color-accent-warm)] transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ width: `${clamped}%` }}
        />
      </div>
    );
  }

  if (variant === "header") {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--color-accent-soft)]">
          <div
            className="h-full rounded-full bg-[var(--color-accent-warm)] transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ width: `${clamped}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
          {clamped}/100
        </span>
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>暧昧值</span>
        <span className="font-mono tabular-nums">{clamped}/100</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-accent-soft)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent-warm)] transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
