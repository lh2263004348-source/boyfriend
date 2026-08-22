import type { Boyfriend, Message, RelationshipMode } from "@/lib/types";

import {
  calculateSurpriseProbability,
  rollSurprise,
} from "@/lib/intimacy/calculator";

export type SurpriseType = "gift" | "song";

export interface SurprisePayload {
  type: SurpriseType;
  giftId?: string;
  giftName?: string;
  giftImage?: string;
  giftMeaning?: string;
  songId?: string;
  songTitle?: string;
  songLyrics?: string;
  audioUrl?: string;
}

const GIFT_POOL = [
  {
    id: "cup",
    name: "马克杯",
    image: "/gifts/cup.svg",
    meaning: "以后每一个早晨，都想让你用这只杯子喝温水。",
  },
  {
    id: "flower",
    name: "小雏菊",
    image: "/gifts/flower.svg",
    meaning: "像今天一样，想把明亮和温柔都给你。",
  },
  {
    id: "book",
    name: "手账本",
    image: "/gifts/book.svg",
    meaning: "想把和你有关的碎片，都记下来。",
  },
  {
    id: "keychain",
    name: "钥匙扣",
    image: "/gifts/keychain.svg",
    meaning: "随身带着，就像我把你放在心上。",
  },
  {
    id: "letter",
    name: "手写信",
    image: "/gifts/letter.svg",
    meaning: "有些话，打字不够，想手写给你。",
  },
];

const SONG_POOL: Record<
  RelationshipMode,
  Array<{ id: string; title: string; lyrics: string }>
> = {
  dominant: [
    {
      id: "dom-1",
      title: "只对你",
      lyrics: "夜色很深，我在等你回信\n别的都不重要，你最重要",
    },
  ],
  puppy: [
    {
      id: "pup-1",
      title: "想你了",
      lyrics: "姐姐姐姐，今天有没有想我\n我一想到你就忍不住笑",
    },
  ],
  warm: [
    {
      id: "warm-1",
      title: "晚风",
      lyrics: "晚风经过的时候，我在想你\n如果你也刚好抬头，我们就同频了",
    },
  ],
};

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function shouldResetSurpriseCount(boyfriend: Boyfriend): boolean {
  const today = getTodayDateString();
  return boyfriend.lastSurpriseDate !== today;
}

export function canTriggerSurpriseToday(boyfriend: Boyfriend): boolean {
  const today = getTodayDateString();
  if (boyfriend.lastSurpriseDate !== today) return true;
  return boyfriend.surpriseCountToday < 2;
}

export function tryTriggerSurprise(
  boyfriend: Boyfriend,
  recentMessages: Message[],
  messagesSinceLastSurprise: number,
  lastUserMessage?: Message,
  forceDebug = process.env.SURPRISE_DEBUG === "1"
): SurprisePayload | null {
  if (!canTriggerSurpriseToday(boyfriend) && !forceDebug) {
    return null;
  }

  const { probability } = calculateSurpriseProbability(
    boyfriend.intimacy,
    recentMessages,
    messagesSinceLastSurprise,
    lastUserMessage
  );

  if (!forceDebug && !rollSurprise(probability)) {
    return null;
  }

  const type: SurpriseType = Math.random() < 0.5 ? "gift" : "song";

  if (type === "gift") {
    const gift = GIFT_POOL[Math.floor(Math.random() * GIFT_POOL.length)];
    return {
      type: "gift",
      giftId: gift.id,
      giftName: gift.name,
      giftImage: gift.image,
      giftMeaning: gift.meaning,
    };
  }

  const songs = SONG_POOL[boyfriend.relationshipMode];
  const song = songs[Math.floor(Math.random() * songs.length)];
  return {
    type: "song",
    songId: song.id,
    songTitle: song.title,
    songLyrics: song.lyrics,
  };
}

export { GIFT_POOL };
