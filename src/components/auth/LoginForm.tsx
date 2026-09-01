"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
 * 登录表单。
 * 提交后调用 signIn("credentials") → /api/auth/[...nextauth] → config.ts authorize。
 */
export function LoginForm(): React.ReactElement {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const result = await signIn("credentials", {
        email,
        password,
        rememberMe: String(rememberMe),
        turnstileToken,
        redirect: false,
      });

      if (result?.error) {
        setError("邮箱或密码不正确");
        setTurnstileToken("");
        setTurnstileResetKey((key) => key + 1);
        setLoading(false);
        return;
      }

      window.location.assign(callbackUrl);
    } catch {
      setError("登录失败，请稍后重试");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="欢迎回来"
      subtitle={
        <>
          还没有账号？
          <Link
            href="/register"
            className="ml-1 font-medium text-[var(--color-accent-primary)] hover:underline"
          >
            去注册
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
              autoComplete="current-password"
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
          {loading ? "登录中…" : "登录"}
        </Button>
      </form>
    </AuthShell>
  );
}
