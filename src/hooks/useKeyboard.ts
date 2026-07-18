"use client";

/**
 * @file useKeyboard.ts
 * @author loho
 *
 * 键盘事件处理 hook。
 *
 * 功能：
 * - 数字键 1-9: 答题模式填入 / 笔记模式 toggle
 * - Backspace/Delete: 擦除选中格
 * - F: 答题模式 / N: 笔记模式 / H: 笔记显示开关
 * - E: 橡皮擦（擦除选中格）
 * - C: 差错检查
 * - Space: 开始/暂停计时 / R: 重置计时
 * - Escape: 退出粘滞模式 / 清除选择
 * - Ctrl+Z: 撤销 / Ctrl+Shift+Z, Ctrl+Y: 重做
 *
 * handler 在 useEffect 内定义并绑定，state 作为依赖项确保每次渲染后
 * 监听器持有最新状态（React 19 禁止 render 时改 ref）。
 */

import { useCallback, useEffect } from "react";
import { App } from "antd";
import { useGame } from "@/contexts/GameContext";
import { hasErrors } from "@/lib/sudoku/validator";

export function useKeyboard() {
  const { state, dispatch } = useGame();
  const { message } = App.useApp();
  const handleUndo = useCallback(() => dispatch({ type: "UNDO" }), [dispatch]);
  const handleRedo = useCallback(() => dispatch({ type: "REDO" }), [dispatch]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // 忽略输入框内的按键
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Escape: 退出粘滞模式 → 清除选择
      if (event.key === "Escape") {
        if (state.isStickyMode) {
          dispatch({ type: "SET_STICKY_NUMBER", number: null });
        } else {
          dispatch({ type: "CLEAR_SELECTION" });
        }
        return;
      }

      // 箭头键：移动选中格
      if (event.key.startsWith("Arrow")) {
        event.preventDefault();
        if (state.selectedCells.length === 0) return;
        const [r, c] = state.selectedCells[0];
        let newR = r;
        let newC = c;
        if (event.key === "ArrowUp") newR = Math.max(0, r - 1);
        if (event.key === "ArrowDown") newR = Math.min(8, r + 1);
        if (event.key === "ArrowLeft") newC = Math.max(0, c - 1);
        if (event.key === "ArrowRight") newC = Math.min(8, c + 1);
        dispatch({ type: "SELECT_CELL", row: newR, col: newC, additive: false });
        return;
      }

      // 数字键 1-9
      if (event.key >= "1" && event.key <= "9") {
        const num = parseInt(event.key, 10);
        if (state.selectedCells.length === 0) return;

        if (state.inputMode === "answer") {
          for (const [r, c] of state.selectedCells) {
            dispatch({ type: "SET_CELL_VALUE", row: r, col: c, value: num });
          }
        } else {
          for (const [r, c] of state.selectedCells) {
            dispatch({ type: "TOGGLE_NOTE", row: r, col: c, note: num });
          }
        }
        return;
      }

      // Backspace / Delete: 擦除
      if (event.key === "Backspace" || event.key === "Delete") {
        if (state.selectedCells.length === 0) return;
        for (const [r, c] of state.selectedCells) {
          dispatch({ type: "SET_CELL_VALUE", row: r, col: c, value: null });
        }
        return;
      }

      // 单字母快捷键（大小写不敏感，避开 Ctrl/Cmd 组合）
      const key = event.key.toLowerCase();
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        // F: 答题模式
        if (key === "f") {
          dispatch({ type: "SET_INPUT_MODE", mode: "answer" });
          return;
        }
        // N: 笔记模式
        if (key === "n") {
          dispatch({ type: "SET_INPUT_MODE", mode: "note" });
          return;
        }
        // H: 笔记显示开关
        if (key === "h") {
          dispatch({ type: "SET_SHOW_NOTES", show: !state.showNotes });
          return;
        }
        // E: 橡皮擦（擦除选中格）
        if (key === "e") {
          if (state.selectedCells.length === 0) return;
          for (const [r, c] of state.selectedCells) {
            dispatch({ type: "SET_CELL_VALUE", row: r, col: c, value: null });
          }
          return;
        }
        // C: 差错检查
        if (key === "c") {
          const numberGrid = state.grid.map((row) =>
            row.map((cell) => cell.value ?? 0)
          );
          const hasErr = hasErrors(numberGrid);
          dispatch({ type: "CHECK_ERRORS" });
          if (hasErr) {
            message.warning("题目中存在错误");
          } else {
            message.success("没有发现错误");
          }
          return;
        }
        // R: 重置计时
        if (key === "r") {
          dispatch({ type: "RESET_TIMER" });
          return;
        }
      }

      // Space: 开始/暂停计时（单独处理，需 preventDefault 避免页面滚动）
      if (event.code === "Space" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        dispatch({ type: "TOGGLE_TIMER" });
        return;
      }

      // Ctrl+Z: 撤销
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "z" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        handleUndo();
        return;
      }

      // Ctrl+Shift+Z / Ctrl+Y: 重做
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === "y" || (event.shiftKey && event.key === "z"))
      ) {
        event.preventDefault();
        handleRedo();
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state, dispatch, handleUndo, handleRedo, message]);
}
