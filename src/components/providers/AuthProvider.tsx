"use client";

import { SessionProvider } from "next-auth/react";

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      {children}
    </SessionProvider>
  );
}
