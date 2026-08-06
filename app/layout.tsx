import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KnowForge — 可信知识重构",
  description: "把分散资料重构为可追溯、可复用、可被 AI 安全调用的长期知识资产。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
