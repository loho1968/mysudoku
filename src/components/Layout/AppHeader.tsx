"use client";

/**
 * @file AppHeader.tsx
 * @author loho
 *
 * 顶部导航栏。
 * 左侧标题 + 右侧主题切换 + 编辑模式切换。
 */

import { Layout, Typography, Space, theme as antdTheme } from "antd";
import { ThemeToggle } from "@/components/Theme/ThemeToggle";
import { EditModeToggle } from "@/components/Auth/EditModeToggle";

const { Header } = Layout;
const { Title } = Typography;

export function AppHeader() {
  const { token } = antdTheme.useToken();

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
        <EditModeToggle />
        <ThemeToggle />
      </Space>
    </Header>
  );
}
