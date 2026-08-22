import Link from "next/link";
import { redirect } from "next/navigation";

import { CreateForm } from "@/components/boyfriends/CreateForm";
import { auth } from "@/lib/auth/config";

export default async function CreatePage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-6 pb-safe">
      <header className="mb-6">
        <Link
          href="/"
          className="inline-flex min-h-[44px] cursor-pointer items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          aria-label="返回主页"
        >
          ← 返回主页
        </Link>
        <h1 className="mt-2 text-xl font-semibold">创建一个新男友</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          选择一种性格，开始你的专属陪伴
        </p>
      </header>
      <CreateForm defaultUserNickname="宝贝" />
    </main>
  );
}
