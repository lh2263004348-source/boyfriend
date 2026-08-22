"use client";

import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function LogoutButton(): React.ReactElement {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      退出登录
    </Button>
  );
}
