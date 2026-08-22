export function BoyfriendCardSkeleton(): React.ReactElement {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="size-[60px] shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <div className="h-2 w-[60px] animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}
