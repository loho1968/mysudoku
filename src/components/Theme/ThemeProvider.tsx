"use client";

/**
 * @file ThemeProvider.tsx
 * @author loho
 *
 * 主题提供者：整合 next-themes 与 antd ConfigProvider。
 *
 * 职责：
 * 1. 通过 next-themes 管理主题状态（亮 / 暗 / 跟随系统），处理 SSR 闪烁、
 *    localStorage 持久化与 prefers-color-scheme 监听。
 * 2. 监听 next-themes 解析后的 resolvedTheme，动态切换 antd 的
 *    theme.algorithm（defaultAlgorithm / darkAlgorithm），使 antd 组件
 *    颜色随主题自动跟随。
 *
 * 设计说明见 .ai/DECISIONS.md D-011。
 */

import {
  ThemeProvider as NextThemesProvider,
  useTheme,
  type ThemeProviderProps,
} from "next-themes";
import { ConfigProvider, App, theme as antdTheme } from "antd";
import zhCN from "antd/locale/zh_CN";
import { useSyncExternalStore } from "react";

type ResolvedTheme = "light" | "dark";

const emptySubscribe = () => () => {};

/**
 * 挂载检测：SSR 与客户端 hydration 首帧都返回 false（getServerSnapshot），
 * 挂载后才返回 true。用于让依赖客户端态（next-themes 解析结果）的渲染
 * 在首帧与 SSR 保持一致，避免 hydration mismatch。
 */
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

/**
 * 根据已解析主题构造 antd ThemeConfig。
 * @param resolvedTheme - 当前实际生效的亮/暗主题。
 * @returns antd ConfigProvider 的 theme 配置。
 */
function buildAntdTheme(resolvedTheme: ResolvedTheme) {
  const isDark = resolvedTheme === "dark";
  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: "#1677ff",
      borderRadius: 6,
    },
  };
}

/**
 * 内层客户端组件：读取 next-themes 的 resolvedTheme 并驱动 antd。
 * 必须是客户端组件，useTheme 依赖 next-themes 的 React context。
 *
 * 关键：next-themes 的内联脚本会在 React hydration 之前从 localStorage 读出
 * theme 值，因此客户端 hydration 首帧的 resolvedTheme 已是用户偏好（如 dark），
 * 而 SSR 时 resolvedTheme 为 undefined（→light）。若直接派生会让 antd algorithm
 * 两端不一致（Header 的 colorBgContainer 等内联 token 不同 → hydration mismatch）。
 *
 * 解法：挂载前（SSR + hydration 首帧）强制用 light，与 SSR 一致；挂载后再切换
 * 到真实 resolvedTheme。切换瞬间由 next-themes 的 html class 与 antd algorithm
 * 共同完成，disableTransitionOnChange 抑制过渡闪烁。
 * @param children - 子节点。
 */
function AntdThemeSync({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  // 挂载前两端统一 light；挂载后才用真实解析值。
  const effective: ResolvedTheme =
    mounted && resolvedTheme === "dark" ? "dark" : "light";

  return (
    <ConfigProvider locale={zhCN} theme={buildAntdTheme(effective)}>
      <App>{children}</App>
    </ConfigProvider>
  );
}

/**
 * 对外暴露的主题提供者组件。
 * 包裹 next-themes + antd，供根 layout 使用。
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <AntdThemeSync>{children}</AntdThemeSync>
    </NextThemesProvider>
  );
}

export { useTheme };
