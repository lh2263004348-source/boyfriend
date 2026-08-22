import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage(): React.ReactElement {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <RegisterForm />
    </main>
  );
}
