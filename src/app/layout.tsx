import type { Metadata, Viewport } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ThemeProvider } from "@/components/Theme/ThemeProvider";
import { AppShell } from "@/components/Layout/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "mysudoku — 数独学习与练习",
  description: "个人学习和练习数独",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1677ff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // suppressHydrationWarning: next-themes 会在首屏前由内联脚本改写 html class，
  // 服务端与客户端首帧 class 不一致，需抑制该处的 hydration 警告。
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <AntdRegistry>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
