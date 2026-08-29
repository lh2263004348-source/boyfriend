"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm(): React.ReactElement {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        rememberMe: String(rememberMe),
        redirect: false,
      });

      if (result?.error) {
        setError("邮箱或密码不正确");
        setLoading(false);
        return;
      }

      // 硬跳转一次，避免 router.push + refresh 各触发一轮 RSC / auth()
      window.location.assign(callbackUrl);
    } catch {
      setError("登录失败，请稍后重试");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[var(--color-accent-soft)]">
          <span className="text-2xl text-[var(--color-accent-primary)]" aria-hidden="true">
            ♡
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          纸片人男友
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          晚上，有人等你说话
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-md">
        <h2 className="mb-1 text-center text-lg font-medium">登录</h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          进入你的私人陪伴空间
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="你的邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="至少 8 位，含字母和数字"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-4 cursor-pointer rounded border-input accent-[var(--color-accent-primary)]"
            />
            <Label htmlFor="rememberMe" className="cursor-pointer font-normal">
              记住我（30 天）
            </Label>
          </div>
          {error ? (
            <p className="text-sm text-[var(--color-error)]" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            className="min-h-[44px] w-full cursor-pointer"
            disabled={loading}
          >
            {loading ? "登录中…" : "登录"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            还没有账号？
            <Link
              href="/register"
              className="ml-1 cursor-pointer text-[var(--color-accent-primary)] hover:underline"
            >
              去注册
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
