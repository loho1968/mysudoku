"use client";

/**
 * @file PuzzlePicker.tsx
 * @author loho
 *
 * 导航栏"选择题目"按钮。
 *
 * 点击弹出难度下拉菜单，选择后调随机出题 API，
 * 通过 router.push 导航到 /game?picked=难度，
 * game/page.tsx 读取该参数后自动加载题目。
 */

import { useRouter } from "next/navigation";
import { Button, Dropdown } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import { DIFFICULTY_OPTIONS } from "@/config/constants";

/**
 * 选择题目组件。
 */
export function PuzzlePicker() {
  const router = useRouter();

  const items = DIFFICULTY_OPTIONS.map((opt) => ({
    key: String(opt.value),
    label: opt.label,
    onClick: () => {
      router.push(`/game?picked=${opt.value}`);
    },
  }));

  return (
    <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
      <Button type="text" icon={<TrophyOutlined />}>
        选择题目
      </Button>
    </Dropdown>
  );
}
