/**
 * @file keyboardShortcuts.ts
 * @author loho
 *
 * 键盘快捷键定义。useKeyboard hook 与"快捷键说明"面板共用此数据，
 * 避免两处维护不一致。
 */

export interface ShortcutItem {
  /** 按键显示文本（支持组合键，如 "Ctrl+Z"） */
  key: string;
  /** 功能描述 */
  desc: string;
}

export interface ShortcutGroup {
  /** 分组标题 */
  title: string;
  items: ShortcutItem[];
}

/**
 * 全部快捷键分组。新增/修改快捷键时，同步更新 useKeyboard.ts 与本表。
 */
export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "输入",
    items: [
      { key: "1 - 9", desc: "答题模式填数 / 笔记模式标记候选" },
      { key: "E", desc: "橡皮擦（擦除选中格）" },
      { key: "Backspace", desc: "擦除选中格" },
    ],
  },
  {
    title: "模式",
    items: [
      { key: "F", desc: "切换到答题模式 (Fill)" },
      { key: "N", desc: "切换到笔记模式 (Note)" },
      { key: "H", desc: "笔记显示开关 (sHow notes)" },
      { key: "C", desc: "差错检查 (Check)" },
    ],
  },
  {
    title: "计时",
    items: [
      { key: "Space", desc: "开始 / 暂停" },
      { key: "R", desc: "重置计时 (Reset)" },
    ],
  },
  {
    title: "编辑与导航",
    items: [
      { key: "Ctrl + Z", desc: "撤销" },
      { key: "Ctrl + Shift + Z", desc: "重做（或 Ctrl + Y）" },
      { key: "方向键", desc: "移动选中格" },
      { key: "Esc", desc: "退出粘滞模式 / 清除选择" },
    ],
  },
];
