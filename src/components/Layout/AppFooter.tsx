"use client";

/**
 * @file AppFooter.tsx
 * @author loho
 *
 * 底部信息栏骨架。
 * 同 AppHeader，用 antd token 驱动背景，避免 Layout.Footer 默认深色背景
 * 在亮色主题下与文字融为一体。
 */

import { Layout, Typography, theme as antdTheme } from "antd";

const { Footer } = Layout;
const { Text } = Typography;

export function AppFooter() {
  const { token } = antdTheme.useToken();

  return (
    <Footer
      style={{
        textAlign: "center",
        paddingInline: 24,
        background: token.colorBgContainer,
        borderTop: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Text type="secondary">mysudoku — 个人数独学习与练习</Text>
    </Footer>
  );
}
