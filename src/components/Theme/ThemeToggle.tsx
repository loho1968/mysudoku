"use client";

/**
 * @file ThemeToggle.tsx
 * @author loho
 *
 * 主题切换按钮：提供亮色 / 暗色 / 跟随系统三种选择。
 * 依赖 next-themes 的 useTheme，实际主题驱动逻辑见 ThemeProvider。
 *
 * 关键：next-themes 的内联脚本会在 React hydration 之前从 localStorage 读取
 * theme 值，因此客户端 hydration 首帧的 theme 已是用户存储的偏好，而 SSR 时
 * theme 为 undefined —— 若直接渲染会触发 hydration mismatch（图标不一致）。
 * 用 useSyncExternalStore 实现"挂载检测"：SSR 与 hydration 首帧都返回 false，
 * 挂载后才返回 true，从而首帧统一渲染中性占位图标，避免不匹配。
 */

import { Button, Dropdown, type MenuProps } from "antd";
import {
  BulbOutlined,
  MoonOutlined,
  DesktopOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

type ThemeChoice = "light" | "dark" | "system";

const emptySubscribe = () => () => {};

/**
 * 挂载检测：SSR 返回 false，客户端 hydration 首帧也返回 false（getServerSnapshot），
 * 挂载后 getSnapshot 返回 true。两端首帧一致，无 hydration mismatch。
 */
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

/**
 * 根据主题选择展示图标。
 * @param choice - 用户选择的主题模式。
 * @returns 对应的图标节点。
 */
function iconFor(choice: ThemeChoice) {
  if (choice === "dark") return <MoonOutlined />;
  if (choice === "system") return <DesktopOutlined />;
  return <BulbOutlined />;
}

/**
 * 主题切换组件。
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const choice: ThemeChoice = (theme as ThemeChoice) || "system";

  const items: MenuProps["items"] = [
    { key: "light", icon: <BulbOutlined />, label: "亮色" },
    { key: "dark", icon: <MoonOutlined />, label: "暗色" },
    { key: "system", icon: <DesktopOutlined />, label: "跟随系统" },
  ];

  const onClick: MenuProps["onClick"] = ({ key }) => {
    setTheme(key);
  };

  // 挂载前用中性齿轮图标占位，SSR 与 hydration 首帧一致。
  const displayIcon = mounted ? iconFor(choice) : <SettingOutlined />;
  const selectedKeys = mounted ? [choice] : [];

  return (
    <Dropdown
      menu={{ items, onClick, selectedKeys }}
      trigger={["click"]}
      placement="bottomRight"
    >
      <Button
        type="text"
        icon={displayIcon}
        aria-label="切换主题"
        title="切换主题"
      />
    </Dropdown>
  );
}
