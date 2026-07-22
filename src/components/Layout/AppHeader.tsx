"use client";

/**
 * @file AppHeader.tsx
 * @author loho
 *
 * 顶部导航栏。
 * 左侧标题 + 右侧主题切换 + 编辑模式切换。
 *
 * 在 /puzzles 维护页面下隐藏「选择题目 / 数独技巧 / 题库维护」三个按钮，
 * 让维护页面聚焦于数据管理（这三个按钮是游戏出题入口，维护场景用不到）。
 */

import { useEffect, useState } from "react";
import { Layout, Typography, Space, Button, Tooltip, theme as antdTheme } from "antd";
import { ExportOutlined, DatabaseOutlined, WifiOutlined, DisconnectOutlined } from "@ant-design/icons";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/Theme/ThemeToggle";
import { ShortcutHelp } from "@/components/Layout/ShortcutHelp";
import { PuzzlePicker } from "@/components/Layout/PuzzlePicker";
import { TechniquePicker } from "@/components/Layout/TechniquePicker";

const { Header } = Layout;
const { Title } = Typography;

/** 技巧练习外链（sudoku.coach） */
const PRACTICE_URL =
  "https://sudoku.coach/zh-cn/practice/locked-candidate";

/** 题库维护内链 */
const PUZZLES_URL = "/puzzles";

/**
 * 在线/离线状态 hook（监听 online/offline 事件）。
 * SSR 时默认在线，避免水合不一致。
 */
function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

export function AppHeader() {
  const { token } = antdTheme.useToken();
  const pathname = usePathname();
  const online = useOnlineStatus();
  // 维护页面隐藏「选择题目 / 数独技巧 / 题库维护」三个出题入口按钮
  const onPuzzlesPage = pathname === "/puzzles";

  return (
    <Header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingInline: 24,
        background: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        color: token.colorText,
      }}
    >
      <Title level={4} style={{ margin: 0, color: token.colorTextHeading }}>
        mysudoku
      </Title>
      <Space size="middle">
        <Button
          type="link"
          href={PRACTICE_URL}
          target="_blank"
          rel="noopener noreferrer"
          icon={<ExportOutlined />}
        >
          技巧练习
        </Button>
        {!onPuzzlesPage && <PuzzlePicker />}
        {!onPuzzlesPage && <TechniquePicker />}
        {!onPuzzlesPage && (
          <Button
            type="text"
            icon={<DatabaseOutlined />}
            onClick={() => window.open(PUZZLES_URL, "_blank")}
          >
            题库维护
          </Button>
        )}
        <Tooltip title={online ? "在线" : "离线（仅可玩已缓存题目 / 粘贴出题）"}>
          {online ? (
            <WifiOutlined style={{ color: token.colorSuccess, fontSize: 16 }} />
          ) : (
            <DisconnectOutlined style={{ color: token.colorWarning, fontSize: 16 }} />
          )}
        </Tooltip>
        <ShortcutHelp />
        <ThemeToggle />
      </Space>
    </Header>
  );
}
