import type { Message } from "@/lib/types";

export function isEphemeralMessageId(id: string): boolean {
  return id.startsWith("temp-") || id.startsWith("pending-");
}

function messageMatchKey(message: Message): string {
  return `${message.role}\0${message.type}\0${message.content}`;
}

/** 将服务端最近窗口与本地 temp / pending 消息合并，避免 reload 整表替换闪烁 */
export function mergeMessagesWithServer(
  local: Message[],
  server: Message[]
): Message[] {
  const serverByKey = new Map<string, Message[]>();
  for (const message of server) {
    const key = messageMatchKey(message);
    const list = serverByKey.get(key) ?? [];
    list.push(message);
    serverByKey.set(key, list);
  }

  const consumedServerIds = new Set<string>();
  const keepLocal: Message[] = [];

  for (const message of local) {
    if (!isEphemeralMessageId(message.id)) {
      continue;
    }
    const candidates = serverByKey.get(messageMatchKey(message)) ?? [];
    const match = candidates.find((candidate) => !consumedServerIds.has(candidate.id));
    if (match) {
      consumedServerIds.add(match.id);
    } else {
      keepLocal.push(message);
    }
  }

  const serverIds = new Set(server.map((message) => message.id));
  const pendingLocal = keepLocal.filter((message) => !serverIds.has(message.id));

  return [...server, ...pendingLocal].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function createOptimisticBoyfriendMessage(
  boyfriendId: string,
  content: string,
  emotion: string | null = null
): Message {
  return {
    id: `temp-boyfriend-${Date.now()}`,
    boyfriendId,
    role: "boyfriend",
    type: "text",
    content,
    mediaKey: null,
    emotion,
    isSurprise: false,
    createdAt: new Date(),
  };
}
