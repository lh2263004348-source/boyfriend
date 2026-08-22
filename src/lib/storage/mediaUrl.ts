/** 将 DB 中的 mediaKey（fileKey 或 legacy URL）解析为可访问 URL */
export function resolveMediaUrl(mediaKey: string | null): string | null {
  if (!mediaKey) return null;

  if (
    mediaKey.startsWith("http://") ||
    mediaKey.startsWith("https://") ||
    mediaKey.startsWith("data:") ||
    mediaKey.startsWith("/")
  ) {
    return mediaKey;
  }

  const base = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!base) return mediaKey;

  return `${base}/${mediaKey}`;
}
