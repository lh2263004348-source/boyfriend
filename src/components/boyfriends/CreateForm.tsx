"use client";

import Image from "next/image";
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

const MODE_TAGLINES: Record<RelationshipMode, string> = {
  dominant: "主导节奏",
  puppy: "撒娇依赖",
  warm: "倾听共情",
};

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-24">
      <div className="space-y-3">
        <Label>选择性格</Label>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory">
          {RELATIONSHIP_MODES.map((mode) => {
            const selected = selectedMode === mode.mode;
            return (
              <button
                key={mode.mode}
                type="button"
                onClick={() => selectMode(mode)}
                className={`w-[140px] shrink-0 snap-center cursor-pointer rounded-2xl border-2 p-4 text-center transition-all duration-300 ${
                  selected
                    ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-soft)] shadow-sm"
                    : "border-border bg-white hover:border-[var(--color-accent-primary)]/50"
                }`}
                aria-pressed={selected}
              >
                <div
                  className={`relative mx-auto size-20 overflow-hidden rounded-full transition-transform duration-300 ${
                    selected ? "scale-105" : ""
                  }`}
                >
                  <Image
                    src={mode.avatarUrl}
                    alt={mode.label}
                    fill
                    sizes="80px"
                    quality={75}
                    className="object-cover"
                  />
                </div>
                <p
                  className="mt-3 text-sm font-semibold"
                  style={{ color: mode.color }}
                >
                  {mode.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {MODE_TAGLINES[mode.mode]}
                </p>
              </button>
            );
          })}
        </div>
        <p className="text-sm text-muted-foreground">
          {
            RELATIONSHIP_MODES.find((m) => m.mode === selectedMode)
              ?.description
          }
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nickname">给他的昵称</Label>
        <Input
          id="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="例如：陆景琛"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="userNickname">他叫你什么</Label>
        <Input
          id="userNickname"
          value={userNickname}
          onChange={(e) => setUserNickname(e.target.value)}
          placeholder="例如：宝贝"
          required
        />
      </div>

      {error ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-[var(--color-bg-primary)]/95 px-4 py-3 pb-safe backdrop-blur-sm">
        <div className="mx-auto max-w-lg">
          <Button
            type="submit"
            className="min-h-[44px] w-full cursor-pointer"
            size="lg"
            disabled={loading}
          >
            {loading ? "创建中…" : "开始聊天"}
          </Button>
        </div>
      </div>
    </form>
  );
}
