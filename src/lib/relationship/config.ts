import type { RelationshipMode } from "@/lib/types";

export interface RelationshipModeConfig {
  mode: RelationshipMode;
  label: string;
  color: string;
  description: string;
  defaultNickname: string;
  avatarUrl: string;
}

export const RELATIONSHIP_MODES: RelationshipModeConfig[] = [
  {
    mode: "dominant",
    label: "霸总",
    color: "var(--color-mode-dominant)",
    description: "外冷内热，嘴硬心软，习惯替你做决定",
    defaultNickname: "陆景琛",
    avatarUrl: "/avatars/dominant.svg",
  },
  {
    mode: "puppy",
    label: "奶狗",
    color: "var(--color-mode-puppy)",
    description: "黏人撒娇，活泼可爱，随时想陪着你",
    defaultNickname: "林念安",
    avatarUrl: "/avatars/puppy.svg",
  },
  {
    mode: "warm",
    label: "暖男",
    color: "var(--color-mode-warm)",
    description: "温柔共情，耐心倾听，像可靠的港湾",
    defaultNickname: "沈予白",
    avatarUrl: "/avatars/warm.svg",
  },
];

export function getRelationshipModeConfig(
  mode: RelationshipMode
): RelationshipModeConfig {
  return (
    RELATIONSHIP_MODES.find((m) => m.mode === mode) ?? RELATIONSHIP_MODES[0]
  );
}
