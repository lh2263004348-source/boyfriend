import type { Boyfriend } from "@/lib/types";

/** M1 简化版 system prompt，M2 将接入完整关系模式 */
export function getSimpleSystemPrompt(boyfriend: Boyfriend): string {
  return `你是${boyfriend.nickname}，用户的虚拟男友。
称呼用户为"${boyfriend.userNickname}"。
像真人微信聊天一样回复，保持 1-3 句话的短消息，语气温暖自然。
当前暧昧值：${boyfriend.intimacy}/100。
不要输出 markdown，不要使用列表格式。`;
}

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMStreamOptions {
  model?: string;
  temperature?: number;
}

function getConfig(): {
  apiKey: string;
  baseUrl: string;
  model: string;
} {
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL?.replace(/\/$/, "");
  const model = process.env.LLM_MODEL ?? "doubao-seed-2.0-lite";

  if (!apiKey || !baseUrl) {
    throw new Error("LLM credentials are not configured");
  }

  return { apiKey, baseUrl, model };
}

export function createLLMClient(): {
  stream: (
    messages: LLMMessage[],
    options?: LLMStreamOptions
  ) => AsyncGenerator<string, void, unknown>;
} {
  const config = getConfig();

  return {
    async *stream(messages, options = {}) {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: options.model ?? config.model,
          messages,
          temperature: options.temperature ?? 0.9,
          stream: true,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`LLM request failed: ${response.status} ${text}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("LLM response body is empty");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") return;

          try {
            const parsed = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    },
  };
}
