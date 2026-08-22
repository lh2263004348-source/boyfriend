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
  complete: (messages: LLMMessage[], options?: LLMStreamOptions) => Promise<string>;
} {
  const config = getConfig();

  async function callLLM(
    messages: LLMMessage[],
    options: LLMStreamOptions = {},
    stream: boolean
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
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
            stream,
          }),
          signal: AbortSignal.timeout(60_000),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`LLM request failed: ${response.status} ${text}`);
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt === 0) continue;
      }
    }

    throw lastError ?? new Error("LLM request failed");
  }

  return {
    async *stream(messages, options = {}) {
      const response = await callLLM(messages, options, true);

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

    async complete(messages, options = {}) {
      const response = await callLLM(messages, options, false);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`LLM request failed: ${response.status} ${text}`);
      }
      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return data.choices?.[0]?.message?.content?.trim() ?? "";
    },
  };
}
