"use client";

interface IntimacyBarProps {
  value: number;
}

export function IntimacyBar({ value }: IntimacyBarProps): React.ReactElement {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="px-4 py-2">
      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>暧昧值</span>
        <span className="font-mono tabular-nums">{clamped}/100</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-accent-soft)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent-warm)] transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
