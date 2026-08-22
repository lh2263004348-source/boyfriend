import { redirect } from "next/navigation";

import { HomeView } from "@/components/boyfriends/HomeView";
import { auth } from "@/lib/auth/config";
import { listBoyfriendsByUserId } from "@/lib/repositories/boyfriends";

export default async function HomePage(): Promise<React.ReactElement> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const boyfriends = await listBoyfriendsByUserId(session.user.id);

  return (
    <HomeView
      userName={session.user.displayName}
      initialBoyfriends={boyfriends}
    />
  );
}
