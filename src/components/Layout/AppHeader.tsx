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

import { Layout, Typography, Space, Button, theme as antdTheme } from "antd";
import { ExportOutlined, DatabaseOutlined } from "@ant-design/icons";
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

export function AppHeader() {
  const { token } = antdTheme.useToken();
  const pathname = usePathname();
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
        <ShortcutHelp />
        <ThemeToggle />
      </Space>
    </Header>
  );
}
