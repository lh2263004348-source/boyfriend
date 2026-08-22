import { redirect } from "next/navigation";

import { ChatView } from "@/components/chat/ChatView";
import { auth } from "@/lib/auth/config";
import { getBoyfriendById } from "@/lib/repositories/boyfriends";
import { listMessagesByBoyfriendId } from "@/lib/repositories/messages";
import { listProfileFactsByBoyfriendId } from "@/lib/repositories/profileFacts";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const boyfriend = await getBoyfriendById(id, session.user.id);

  if (!boyfriend) {
    redirect("/");
  }

  const [messages, profileFacts] = await Promise.all([
    listMessagesByBoyfriendId(id, session.user.id, { limit: 50 }),
    listProfileFactsByBoyfriendId(id, session.user.id),
  ]);

  return (
    <ChatView
      boyfriend={boyfriend}
      initialMessages={messages}
      profileFacts={profileFacts}
    />
  );
}
