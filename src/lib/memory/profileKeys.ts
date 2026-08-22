export const PRESET_PROFILE_KEYS = [
  "birthday",
  "hobbies",
  "favorite_food",
  "recent_event",
  "anniversary",
  "dislikes",
] as const;

export type PresetProfileKey = (typeof PRESET_PROFILE_KEYS)[number];

export function isValidFactKey(key: string): boolean {
  return (
    PRESET_PROFILE_KEYS.includes(key as PresetProfileKey) ||
    key.startsWith("custom_")
  );
}
