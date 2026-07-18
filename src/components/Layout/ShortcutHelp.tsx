"use client";

/**
 * @file ShortcutHelp.tsx
 * @author loho
 *
 * 快捷键说明。在导航栏以按钮形式展示，点击弹出 Popover 列出全部快捷键。
 * 数据来源 lib/keyboardShortcuts，与 useKeyboard 共享，避免重复维护。
 */

import { Button, Popover, Tag, Typography } from "antd";
import { KeyOutlined } from "@ant-design/icons";
import { SHORTCUT_GROUPS } from "@/lib/keyboardShortcuts";

const { Text } = Typography;

/**
 * 快捷键说明组件。
 */
export function ShortcutHelp() {
  const content = (
    <div style={{ maxWidth: 340 }}>
      {SHORTCUT_GROUPS.map((group) => (
        <div key={group.title} style={{ marginBottom: 12 }}>
          <Text
            type="secondary"
            style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}
          >
            {group.title}
          </Text>
          <div style={{ marginTop: 4 }}>
            {group.items.map((item) => (
              <div
                key={item.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "3px 0",
                }}
              >
                <Text style={{ fontSize: 13 }}>{item.desc}</Text>
                <Tag
                  style={{
                    margin: 0,
                    fontFamily: "monospace",
                    fontSize: 12,
                  }}
                >
                  {item.key}
                </Tag>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Popover
      content={content}
      title="快捷键"
      trigger="click"
      placement="bottomRight"
    >
      <Button type="text" icon={<KeyOutlined />} title="快捷键说明">
        快捷键
      </Button>
    </Popover>
  );
}
