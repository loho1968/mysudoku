"use client";

/**
 * @file AppFooter.tsx
 * @author loho
 *
 * 底部信息栏。
 * 包含备案信息：工信部备案号（可跳转查询）、公安备案号、网站名称。
 */

import { Layout, Typography, Space, theme as antdTheme } from "antd";

const { Footer } = Layout;
const { Text, Link } = Typography;

/** 工信部备案查询地址 */
const ICP_QUERY_URL = "https://beian.miit.gov.cn/";

/**
 * 公安备案图标 SVG（police badge 风格）。
 * 内联 SVG 避免外部资源依赖。
 */
function PoliceBadgeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ verticalAlign: "middle", marginInlineEnd: 2 }}
    >
      <path
        d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
        fill="currentColor"
        opacity={0.9}
      />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill="#fff"
      >
        公
      </text>
    </svg>
  );
}

/**
 * 备案信息区域。
 */
export function AppFooter() {
  const { token } = antdTheme.useToken();

  return (
    <Footer
      style={{
        textAlign: "center",
        padding: "12px 24px",
        background: token.colorBgContainer,
        borderTop: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Space
        orientation="vertical"
        size={4}
        style={{ width: "100%" }}
      >
        {/* 网站名称 */}
        <Text
          style={{ fontSize: 13, color: token.colorTextTertiary }}
        >
          loho的个人小站
        </Text>

        <Space size="middle" wrap style={{ justifyContent: "center" }}>
          {/* 工信部备案号（带超链接） */}
          <Text style={{ fontSize: 12, color: token.colorTextQuaternary }}>
            <Link
              href={ICP_QUERY_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: token.colorTextQuaternary }}
            >
              渝ICP备2026016277号-1
            </Link>
          </Text>

          {/* 公安备案号 + 图标 */}
          <Text style={{ fontSize: 12, color: token.colorTextQuaternary }}>
            <PoliceBadgeIcon />
            渝公网安备50019002505557号
          </Text>
        </Space>
      </Space>
    </Footer>
  );
}
