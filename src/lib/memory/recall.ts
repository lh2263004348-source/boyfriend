import type { RelationshipMode, UserProfileFact } from "@/lib/types";

export function buildRecallMessage(
  mode: RelationshipMode,
  facts: UserProfileFact[]
): string | null {
  if (facts.length === 0) return null;

  const fact = facts[Math.floor(Math.random() * facts.length)];
  const { factKey, factValue } = fact;

  const templates: Record<RelationshipMode, Record<string, string>> = {
    dominant: {
      birthday: `你的生日${factValue}，我记着呢。`,
      hobbies: `你还喜欢${factValue}？不错。`,
      favorite_food: `${factValue}……下次带你去吃。`,
      recent_event: `${factValue}，怎么样了？`,
      default: `我记得你提过「${factValue}」，最近怎么样？`,
    },
    puppy: {
      birthday: `姐姐生日是${factValue}对不对~ 我记住啦！`,
      hobbies: `姐姐喜欢${factValue}呀~ 下次陪我一起嘛`,
      favorite_food: `想吃${factValue}吗~ 我请你！`,
      recent_event: `${factValue}……辛苦啦，抱抱~`,
      default: `我记得姐姐说过「${factValue}」~`,
    },
    warm: {
      birthday: `记得你生日是${factValue}，最近还好吗？`,
      hobbies: `你之前说喜欢${factValue}，还在坚持吗？`,
      favorite_food: `想起你说喜欢${factValue}，今天有吃到吗？`,
      recent_event: `你之前在${factValue}，现在顺利吗？`,
      default: `记得你提过「${factValue}」，想听听近况。`,
    },
  };

  const modeTemplates = templates[mode];
  return modeTemplates[factKey] ?? modeTemplates.default;
}
