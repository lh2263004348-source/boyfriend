"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

/**
 * 注册页表单（客户端组件，才能用 useState / 提交后跳转）。
 *
 * 提交流程：
 * 1. POST /api/auth/register  → 创建账号
 * 2. signIn("credentials")    → 用返回的 loginPass 自动登录
 * 3. 跳到 /create             → 去创建第一位男友
 */
export function RegisterForm(): React.ReactElement {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  // 验证失败时 +1，让 Turnstile 组件重新挂载（换一张验证码）
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError("");

    if (turnstileEnabled && !turnstileToken) {
      setError("请先完成人机验证");
      return;
    }

    setLoading(true);

    try {
      // 第 1 步：先注册（只负责建账号，不负责登录态）
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          displayName: displayName || undefined,
          rememberMe,
          turnstileToken,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        loginPass?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "注册失败");
        setTurnstileToken("");
        setTurnstileResetKey((key) => key + 1);
        setLoading(false);
        return;
      }

      // 第 2 步：用刚拿到的 loginPass 自动登录
      // 注册时已经验过人机，这里不必再点一次 Turnstile
      const signInResult = await signIn("credentials", {
        email,
        password,
        rememberMe: String(rememberMe),
        loginPass: data.loginPass,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("注册成功但自动登录失败，请手动登录");
        setLoading(false);
        router.push("/login");
        return;
      }

      // 硬跳转：让浏览器重新带上登录 cookie，避免半登录状态
      window.location.assign("/create");
    } catch {
      setError("注册失败，请稍后重试");
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
          选一个性格，开始专属陪伴
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-md">
        <h2 className="mb-1 text-center text-lg font-medium">创建账号</h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          注册后可直接创建你的第一位男友
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
            <Label htmlFor="displayName">昵称（可选）</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="他该怎么称呼你"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="nickname"
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
              autoComplete="new-password"
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
          <TurnstileWidget
            resetKey={turnstileResetKey}
            onTokenChange={setTurnstileToken}
          />
          <Button
            type="submit"
            className="min-h-[44px] w-full cursor-pointer"
            disabled={loading || (turnstileEnabled && !turnstileToken)}
          >
            {loading ? "注册中…" : "注册并开始"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            已有账号？
            <Link
              href="/login"
              className="ml-1 cursor-pointer text-[var(--color-accent-primary)] hover:underline"
            >
              去登录
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
