export interface StickerItem {
  id: string;
  emoji: string;
  emotion: string;
  label: string;
}

const EMOJIS = [
  ["s001", "😊", "happy", "微笑"],
  ["s002", "😄", "happy", "大笑"],
  ["s003", "😁", "happy", "开心"],
  ["s004", "🤣", "happy", "笑哭"],
  ["s005", "🥰", "heart", "爱你"],
  ["s006", "😍", "heart", "心动"],
  ["s007", "❤️", "heart", "红心"],
  ["s008", "💕", "heart", "双心"],
  ["s009", "💖", "heart", "闪心"],
  ["s010", "😘", "heart", "飞吻"],
  ["s011", "🥺", "shy", "委屈"],
  ["s012", "😳", "shy", "脸红"],
  ["s013", "🙈", "shy", "捂脸"],
  ["s014", "😢", "sad", "流泪"],
  ["s015", "😭", "sad", "大哭"],
  ["s016", "😔", "sad", "失落"],
  ["s017", "😞", "sad", "沮丧"],
  ["s018", "💔", "sad", "心碎"],
  ["s019", "😩", "sad", "疲惫"],
  ["s020", "😫", "sad", "累"],
  ["s021", "😤", "angry", "生气"],
  ["s022", "😠", "angry", "怒"],
  ["s023", "😡", "angry", "暴怒"],
  ["s024", "🤔", "neutral", "思考"],
  ["s025", "😐", "neutral", "平静"],
  ["s026", "😶", "neutral", "沉默"],
  ["s027", "👍", "happy", "赞"],
  ["s028", "🤗", "happy", "抱抱"],
  ["s029", "✨", "happy", "闪"],
  ["s030", "🌙", "neutral", "晚安"],
  ["s031", "☀️", "happy", "早安"],
  ["s032", "🍵", "neutral", "喝茶"],
  ["s033", "🎵", "happy", "音乐"],
  ["s034", "💤", "neutral", "睡"],
  ["s035", "🌸", "heart", "花"],
];

export const STICKERS: StickerItem[] = EMOJIS.map(([id, emoji, emotion, label]) => ({
  id,
  emoji,
  emotion,
  label,
}));

export function getStickerById(id: string): StickerItem | undefined {
  return STICKERS.find((s) => s.id === id);
}

export function getStickersByEmotion(emotion: string): StickerItem[] {
  return STICKERS.filter((s) => s.emotion === emotion);
}
