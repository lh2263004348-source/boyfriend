import { Suspense } from "react";

import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage(): React.ReactElement {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-primary)] px-4 py-12 pb-safe">
      <Suspense fallback={<div className="text-muted-foreground">加载中…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
