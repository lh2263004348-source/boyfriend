"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm(): React.ReactElement {
  const router = useRouter();
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
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border/60 shadow-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-[var(--color-text-primary)]">
          纸片人男友
        </CardTitle>
        <CardDescription>登录你的私人陪伴空间</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
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
              className="size-4 rounded border-input accent-[var(--color-accent-primary)]"
            />
            <Label htmlFor="rememberMe" className="font-normal">
              记住我（30 天）
            </Label>
          </div>
          {error ? (
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "登录中…" : "登录"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            还没有账号？
            <Link
              href="/register"
              className="ml-1 text-[var(--color-accent-primary)] hover:underline"
            >
              去注册
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
