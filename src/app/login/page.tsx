/**
 * 登录页：表单在 LoginForm。
 * Suspense：LoginForm 会读 URL 的 callbackUrl，Next.js 要求包一层。
 */
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-primary)] text-muted-foreground">
          加载中…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
