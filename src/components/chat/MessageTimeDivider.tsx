interface MessageTimeDividerProps {
  time: string;
}

export function MessageTimeDivider({
  time,
}: MessageTimeDividerProps): React.ReactElement {
  return (
    <div className="mb-3 flex justify-center" role="separator" aria-label={time}>
      <span
        suppressHydrationWarning
        className="rounded-full bg-black/5 px-3 py-1 text-xs text-muted-foreground"
      >
        {time}
      </span>
    </div>
  );
}
