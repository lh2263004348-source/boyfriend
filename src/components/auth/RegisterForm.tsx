"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import {
  AuthShell,
  authInputClassName,
  authSubmitButtonClassName,
} from "@/components/auth/AuthShell";
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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
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

      window.location.assign("/create");
    } catch {
      setError("注册失败，请稍后重试");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="创建账号"
      showBackButton
      backHref="/login"
      backLabel="返回登录"
      subtitle={
        <>
          已有账号？
          <Link
            href="/login"
            className="ml-1 font-medium text-[var(--color-accent-primary)] hover:underline"
          >
            去登录
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[var(--color-text-primary)]">
            邮箱
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="你的邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={authInputClassName}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName" className="text-[var(--color-text-primary)]">
            昵称（可选）
          </Label>
          <Input
            id="displayName"
            type="text"
            placeholder="他该怎么称呼你"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="nickname"
            className={authInputClassName}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[var(--color-text-primary)]">
            密码
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="至少 8 位，含字母和数字"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className={`${authInputClassName} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-accent-soft)]"
              aria-label={showPassword ? "隐藏密码" : "显示密码"}
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="size-4 cursor-pointer rounded border-[#E8DFD6] accent-[var(--color-accent-primary)]"
          />
          <Label
            htmlFor="rememberMe"
            className="cursor-pointer font-normal text-[var(--color-text-secondary)]"
          >
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
          className={authSubmitButtonClassName}
          disabled={loading || (turnstileEnabled && !turnstileToken)}
        >
          {loading ? "注册中…" : "注册并开始"}
        </Button>
      </form>
    </AuthShell>
  );
}
