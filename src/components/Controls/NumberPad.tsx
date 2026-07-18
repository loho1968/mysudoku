"use client";

/**
 * @file NumberPad.tsx
 * @author loho
 *
 * 数字输入面板。
 *
 * 功能：
 * - 1-9 数字按钮
 * - 橡皮擦按钮（清除选中格）
 * - 答题模式：填入数字
 * - 笔记模式：toggle 候选数
 * - 双击数字：进入/退出粘滞模式
 *
 * 粘滞模式：激活后点击格子自动填入该数字，方便连续输入。
 */

import { DeleteOutlined } from "@ant-design/icons";
import { useGame } from "@/contexts/GameContext";
import { useCallback } from "react";

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * 数字输入面板组件。
 */
export function NumberPad() {
  const { state, dispatch } = useGame();
  const { selectedCells, inputMode, isStickyMode, stickyNumber } = state;

  const fillValue = useCallback(
    (num: number) => {
      if (selectedCells.length === 0) return;
      for (const [r, c] of selectedCells) {
        dispatch({ type: "SET_CELL_VALUE", row: r, col: c, value: num });
      }
    },
    [selectedCells, dispatch]
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
    // 双击数字进入/退出粘滞模式
    if (isStickyMode && stickyNumber === num) {
      dispatch({ type: "SET_STICKY_NUMBER", number: null });
    } else {
      dispatch({ type: "SET_STICKY_NUMBER", number: num });
    }
  };

  const handleEraser = () => {
    if (selectedCells.length === 0) return;
    for (const [r, c] of selectedCells) {
      dispatch({ type: "SET_CELL_VALUE", row: r, col: c, value: null });
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
            }`}
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
      <button className="eraser-btn" onClick={handleEraser} title="清除选中格">
        <DeleteOutlined />
        <span className="eraser-label">橡皮擦</span>
      </button>
    </div>
  );
}
