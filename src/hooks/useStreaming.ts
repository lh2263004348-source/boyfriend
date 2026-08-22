"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getDisplayContent } from "@/lib/llm/parser";
import type { LLMDecision } from "@/lib/types";
import type { SurprisePayload } from "@/lib/surprise/trigger";

const MIN_TYPING_MS = 1500;

export interface StreamMeta {
  intimacy: number;
  showNextStage: boolean;
  surprise: SurprisePayload | null;
}

export interface StreamResult {
  content: string;
  decision: LLMDecision | null;
  meta: StreamMeta | null;
}

export interface UseStreamingResult {
  streamingText: string;
  isStreaming: boolean;
  isTyping: boolean;
  error: string | null;
  lastDecision: LLMDecision | null;
  sendMessage: (boyfriendId: string, userMessage: string) => Promise<StreamResult>;
  reset: () => void;
}

export function useStreaming(): UseStreamingResult {
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDecision, setLastDecision] = useState<LLMDecision | null>(null);
  const startTimeRef = useRef<number>(0);
  const rawBufferRef = useRef("");

  const reset = useCallback((): void => {
    setStreamingText("");
    setIsStreaming(false);
    setIsTyping(false);
    setError(null);
    rawBufferRef.current = "";
  }, []);

  const sendMessage = useCallback(
    async (boyfriendId: string, userMessage: string): Promise<StreamResult> => {
      reset();
      setLastDecision(null);
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
        rawBufferRef.current = "";

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("无法读取流式响应");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let decision: LLMDecision | null = null;
        let meta: StreamMeta | null = null;

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
                decision?: LLMDecision;
                meta?: StreamMeta;
                error?: string;
              };
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.meta) {
                meta = parsed.meta;
              }
              if (parsed.decision) {
                decision = parsed.decision;
                setLastDecision(parsed.decision);
              }
              if (parsed.content) {
                rawBufferRef.current += parsed.content;
                setStreamingText(getDisplayContent(rawBufferRef.current));
              }
            } catch (parseError) {
              if (
                parseError instanceof Error &&
                parseError.message !== "Unexpected end of JSON input"
              ) {
                throw parseError;
              }
            }
          }
        }

        setIsStreaming(false);
        const content = getDisplayContent(rawBufferRef.current).trim();
        return { content, decision, meta };
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
    lastDecision,
    sendMessage,
    reset,
  };
}
