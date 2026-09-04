import type { Message } from "@/lib/types";

const FIVE_MINUTES_MS = 5 * 60 * 1000;
/** 产品面向国内用户，SSR（Vercel UTC）与浏览器需用同一时区，避免 hydration 文本不一致 */
const APP_TIMEZONE = "Asia/Shanghai";

interface ZonedParts {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: pick("hour"),
    minute: pick("minute"),
  };
}

function formatClock(parts: Pick<ZonedParts, "hour" | "minute">): string {
  return `${parts.hour}:${parts.minute}`;
}

function isSameZonedDay(a: ZonedParts, b: ZonedParts): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

function getYesterdayParts(now: ZonedParts): ZonedParts {
  const utcNoon = Date.UTC(
    Number(now.year),
    Number(now.month) - 1,
    Number(now.day),
    12
  );
  const yesterday = new Date(utcNoon - 24 * 60 * 60 * 1000);
  return getZonedParts(yesterday, APP_TIMEZONE);
}

export function shouldShowTimeDivider(
  current: Message,
  previous?: Message
): boolean {
  if (!previous) return true;
  const currentTime = new Date(current.createdAt).getTime();
  const previousTime = new Date(previous.createdAt).getTime();
  return currentTime - previousTime > FIVE_MINUTES_MS;
}

export function formatMessageTime(date: Date): string {
  const messageParts = getZonedParts(new Date(date), APP_TIMEZONE);
  const nowParts = getZonedParts(new Date(), APP_TIMEZONE);
  const time = formatClock(messageParts);

  if (isSameZonedDay(messageParts, nowParts)) {
    return time;
  }

  const yesterdayParts = getYesterdayParts(nowParts);
  if (isSameZonedDay(messageParts, yesterdayParts)) {
    return `昨天 ${time}`;
  }

  if (messageParts.year === nowParts.year) {
    return `${Number(messageParts.month)}/${Number(messageParts.day)} ${time}`;
  }

  return `${messageParts.year}/${Number(messageParts.month)}/${Number(messageParts.day)} ${time}`;
}
