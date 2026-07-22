"use client";

/**
 * @file NumberPad.tsx
 * @author loho
 *
 * 数字输入面板。
 *
 * 功能：
 * - 1-9 数字按钮（含双击粘滞）
 * - 答题模式：填入数字（开启候选数显示时，校验非候选数 → 拒绝输入）
 * - 笔记模式：toggle 候选数
 *
 * 错误反馈（输入非候选数时）：
 * - 桌面端：message 提示 + 数字按钮闪烁
 * - 移动端：震动（navigator.vibrate）+ 数字按钮闪烁 + 禁止输入
 */

import { useCallback, useState } from "react";
import { App } from "antd";
import { useGame } from "@/contexts/GameContext";
import { getCandidates } from "@/lib/sudoku/candidates";

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** 检测是否为移动设备（粗略判断，用于决定是否触发震动）。 */
function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/**
 * 数字输入面板组件。
 */
export function NumberPad() {
  const { state, dispatch } = useGame();
  const { message } = App.useApp();
  const { selectedCells, inputMode, isStickyMode, stickyNumber, showNotes, grid } = state;
  const [shakeNum, setShakeNum] = useState<number | null>(null);

  /** 触发数字按钮闪烁动画。 */
  const triggerShake = useCallback((num: number) => {
    setShakeNum(num);
    setTimeout(() => setShakeNum(null), 400);
  }, []);

  const fillValue = useCallback(
    (num: number) => {
      if (selectedCells.length === 0) return;

      // 候选数校验：显示笔记 + 答题模式时，非候选数拒绝输入
      if (showNotes) {
        const numberGrid = grid.map((row) => row.map((cc) => cc.value ?? 0));
        const invalidCells: [number, number][] = [];
        for (const [r, c] of selectedCells) {
          const cell = grid[r]?.[c];
          if (!cell || cell.isGiven || cell.value !== null) continue;
          const cands = getCandidates(numberGrid, r, c);
          if (!cands.has(num)) {
            invalidCells.push([r, c]);
          }
        }
        if (invalidCells.length > 0) {
          // 反馈：闪烁 + 震动（移动端）+ message
          triggerShake(num);
          if (isMobile() && "vibrate" in navigator) {
            try {
              navigator.vibrate(80);
            } catch {
              // 静默
            }
          }
          message.warning(`${num} 不是选中格的候选数`);
          return;
        }
      }

      for (const [r, c] of selectedCells) {
        dispatch({ type: "SET_CELL_VALUE", row: r, col: c, value: num });
      }
    },
    [selectedCells, dispatch, showNotes, grid, message, triggerShake]
  );

  const toggleNote = useCallback(
    (note: number) => {
      if (selectedCells.length === 0) return;
      for (const [r, c] of selectedCells) {
        dispatch({ type: "TOGGLE_NOTE", row: r, col: c, note });
      }
    },
    [selectedCells, dispatch]
  );

  const handleClick = (num: number) => {
    if (inputMode === "answer") {
      fillValue(num);
    } else {
      toggleNote(num);
    }
  };

  const handleDoubleClick = (num: number) => {
    if (isStickyMode && stickyNumber === num) {
      dispatch({ type: "SET_STICKY_NUMBER", number: null });
    } else {
      dispatch({ type: "SET_STICKY_NUMBER", number: num });
    }
  };

  return (
    <div className="number-pad">
      <div className="number-pad-grid">
        {NUMBERS.map((num) => (
          <button
            key={num}
            className={`number-btn${
              isStickyMode && stickyNumber === num ? " sticky-active" : ""
            }${shakeNum === num ? " shake" : ""}`}
            onClick={() => handleClick(num)}
            onDoubleClick={() => handleDoubleClick(num)}
            title={
              isStickyMode && stickyNumber === num
                ? "点击退出粘滞模式"
                : "双击进入粘滞模式"
            }
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}
