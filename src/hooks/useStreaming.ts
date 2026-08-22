"use client";

import { useCallback, useRef, useState } from "react";

const MIN_TYPING_MS = 1500;

export interface UseStreamingResult {
  streamingText: string;
  isStreaming: boolean;
  isTyping: boolean;
  error: string | null;
  sendMessage: (boyfriendId: string, userMessage: string) => Promise<string>;
  reset: () => void;
}

export function useStreaming(): UseStreamingResult {
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<number>(0);

  const reset = useCallback((): void => {
    setStreamingText("");
    setIsStreaming(false);
    setIsTyping(false);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (boyfriendId: string, userMessage: string): Promise<string> => {
      reset();
      setIsTyping(true);
      startTimeRef.current = Date.now();

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ boyfriendId, userMessage }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? "发送失败");
        }

        const elapsed = Date.now() - startTimeRef.current;
        if (elapsed < MIN_TYPING_MS) {
          await new Promise((resolve) =>
            setTimeout(resolve, MIN_TYPING_MS - elapsed)
          );
        }

        setIsTyping(false);
        setIsStreaming(true);
        setStreamingText("");

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("无法读取流式响应");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data) as {
                content?: string;
                error?: string;
              };
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.content) {
                fullText += parsed.content;
                setStreamingText(fullText);
              }
            } catch (parseError) {
              if (parseError instanceof Error && parseError.message !== "Unexpected end of JSON input") {
                throw parseError;
              }
            }
          }
        }

        setIsStreaming(false);
        return fullText.trim();
      } catch (err) {
        setIsTyping(false);
        setIsStreaming(false);
        const message = err instanceof Error ? err.message : "发送失败";
        setError(message);
        throw err;
      }
    },
    [reset]
  );

  return {
    streamingText,
    isStreaming,
    isTyping,
    error,
    sendMessage,
    reset,
  };
}
