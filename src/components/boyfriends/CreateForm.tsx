"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RELATIONSHIP_MODES,
  type RelationshipModeConfig,
} from "@/lib/relationship/config";
import type { Boyfriend, RelationshipMode } from "@/lib/types";
import { useChatDispatch } from "@/components/providers/ChatProvider";

interface CreateFormProps {
  defaultUserNickname?: string;
}

export function CreateForm({
  defaultUserNickname = "宝贝",
}: CreateFormProps): React.ReactElement {
  const router = useRouter();
  const dispatch = useChatDispatch();
  const [selectedMode, setSelectedMode] = useState<RelationshipMode>("dominant");
  const [nickname, setNickname] = useState("陆景琛");
  const [userNickname, setUserNickname] = useState(defaultUserNickname);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function selectMode(config: RelationshipModeConfig): void {
    setSelectedMode(config.mode);
    setNickname(config.defaultNickname);
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError("");
    setLoading(true);

    const modeConfig = RELATIONSHIP_MODES.find((m) => m.mode === selectedMode)!;

    try {
      const res = await fetch("/api/boyfriends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationshipMode: selectedMode,
          nickname: nickname.trim(),
          userNickname: userNickname.trim(),
          avatarUrl: modeConfig.avatarUrl,
        }),
      });

      const data = (await res.json()) as {
        boyfriend?: Boyfriend;
        error?: string;
      };

      if (!res.ok || !data.boyfriend) {
        setError(data.error ?? "创建失败");
        return;
      }

      dispatch({ type: "ADD_BOYFRIEND", boyfriend: data.boyfriend });
      router.push(`/chat/${data.boyfriend.id}`);
    } catch {
      setError("创建失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <Label>选择性格</Label>
        <div className="grid gap-3">
          {RELATIONSHIP_MODES.map((mode) => (
            <button
              key={mode.mode}
              type="button"
              onClick={() => selectMode(mode)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                selectedMode === mode.mode
                  ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-soft)] shadow-sm"
                  : "border-border bg-white hover:border-[var(--color-accent-primary)]/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-xs text-white"
                  style={{ backgroundColor: mode.color }}
                >
                  {mode.label}
                </span>
                <span className="font-medium">{mode.defaultNickname}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {mode.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nickname">给他的昵称</Label>
        <Input
          id="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="userNickname">他叫你什么</Label>
        <Input
          id="userNickname"
          value={userNickname}
          onChange={(e) => setUserNickname(e.target.value)}
          required
        />
      </div>

      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "创建中…" : "开始聊天"}
      </Button>
    </form>
  );
}
