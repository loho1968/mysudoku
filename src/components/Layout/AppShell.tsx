"use client";

/**
 * @file AppShell.tsx
 * @author loho
 *
 * 应用外壳：antd Layout（Header / Content / Footer）。
 * 根 layout.tsx 是 Server Component，不能直接渲染 antd 组件，故将外壳抽为
 * 客户端组件。Header 内含主题切换，Footer 为信息栏。
 */

import { Layout } from "antd";
import { AppHeader } from "@/components/Layout/AppHeader";
import { AppFooter } from "@/components/Layout/AppFooter";

/**
 * 应用外壳。
 * @param children - 页面内容。
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AppHeader />
      <Layout.Content
        style={{ flex: 1, overflow: "auto", display: "flex" }}
      >
        {children}
      </Layout.Content>
      <AppFooter />
    </Layout>
  );
}
