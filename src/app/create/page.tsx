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
    <main className="mx-auto min-h-screen max-w-lg px-4 py-8">
      <header className="mb-8">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 返回主页
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">创建男友</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          选择一种性格，开始你的专属陪伴
        </p>
      </header>
      <CreateForm defaultUserNickname="宝贝" />
    </main>
  );
}
