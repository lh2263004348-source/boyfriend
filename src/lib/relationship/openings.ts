import type { RelationshipMode } from "@/lib/types";

export type ProactiveTrigger = "opening" | "silence" | "unread";

interface MessagePool {
  opening: string[];
  silence: string[];
  unread: string[];
}

const MESSAGE_POOLS: Record<RelationshipMode, MessagePool> = {
  dominant: {
    opening: [
      "今晚空出来。",
      "过来。",
      "我刚忙完。你呢？",
      "别发呆。有事说。",
    ],
    silence: [
      "周六下午有空。陪我去个地方。",
      "在？",
      "别装看不见。",
    ],
    unread: [
      "还知道回来。",
      "忙完了？",
      "我刚在想你——别得意。",
    ],
  },
  puppy: {
    opening: [
      "姐姐！你终于来了~ 想死你啦！",
      "姐姐~ 你在干嘛呀，想你啦！",
      "啊啊啊你来了！！好开心~",
      "姐姐今天过得怎么样呀~",
    ],
    silence: [
      "姐姐还在吗~ 我好想你",
      "姐姐理理我嘛……🥺",
      "你是不是把我忘了~",
    ],
    unread: [
      "你是不是忘记我了……🥺",
      "姐姐你去哪了~ 我等你好久了",
      "我刚在想你！你终于回来了~",
    ],
  },
  warm: {
    opening: [
      "今天怎么样？想跟你聊聊。",
      "你来了。最近还好吗？",
      "晚上好。今天累不累？",
      "我在。想听听你的声音。",
    ],
    silence: [
      "今晚天气不错。你那边呢？",
      "在想你会不会也需要人陪。",
      "如果不方便说话，也没关系。",
    ],
    unread: [
      "好久不见。最近还好吗？",
      "我刚在想你。",
      "你回来了。今天怎么样？",
    ],
  },
};

export function pickProactiveMessage(
  mode: RelationshipMode,
  trigger: ProactiveTrigger
): string {
  const pool = MESSAGE_POOLS[mode][trigger];
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? pool[0];
}

export function getOpeningMessage(mode: RelationshipMode): string {
  return pickProactiveMessage(mode, "opening");
}
