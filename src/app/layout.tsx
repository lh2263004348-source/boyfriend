import type { Metadata } from "next";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { ChatProvider } from "@/components/providers/ChatProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "纸片人男友",
  description: "温暖的虚拟男友陪伴",
  viewport: {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[var(--color-bg-primary)] antialiased">
        <AuthProvider>
          <ChatProvider>{children}</ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
