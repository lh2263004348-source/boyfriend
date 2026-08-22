"use client";

import { SessionProvider } from "next-auth/react";

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <SessionProvider>{children}</SessionProvider>;
}
