/**
 * 注册页：只负责排版居中，表单逻辑都在 RegisterForm。
 */
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage(): React.ReactElement {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-primary)] px-4 py-12 pb-safe">
      <RegisterForm />
    </main>
  );
}
