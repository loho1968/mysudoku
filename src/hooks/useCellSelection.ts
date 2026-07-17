"use client";

/**
 * @file useCellSelection.ts
 * @author loho
 *
 * 单元格选择交互 hook。
 *
 * 三种普通选择模式：
 * 1. 普通单击 → 单选一个格子
 * 2. Ctrl/Cmd + 单击 → toggle 多选
 * 3. Shift + 单击 → 范围选择（从第一个选中格到点击格）
 *
 * 粘滞模式：
 * - 如果 isStickyMode 激活，点击空格自动填入粘滞数字，
 *   相当于省去「选格子→按数字」两步中的按数字。
 * - 点击已填格则仅切换选中，不覆盖。
 */

import { useCallback } from "react";
import { useGame } from "@/contexts/GameContext";

/**
 * 单元格选择 hook。
 * @returns handleCellClick 事件处理函数。
 */
export function useCellSelection() {
  const { state, dispatch } = useGame();

  const handleCellClick = useCallback(
    (row: number, col: number, event: React.MouseEvent) => {
      // 粘滞模式：点击空格自动填入粘滞数字
      if (state.isStickyMode && state.stickyNumber !== null) {
        if (
          !state.grid[row]?.[col]?.isGiven &&
          state.grid[row]?.[col]?.value === null
        ) {
          dispatch({
            type: "SET_CELL_VALUE",
            row,
            col,
            value: state.stickyNumber,
          });
        }
        dispatch({ type: "SELECT_CELL", row, col, additive: false });
        return;
      }

      // Shift+点击：范围选择（从第一个选中格到点击格）
      if (event.shiftKey && state.selectedCells.length > 0) {
        const [firstRow, firstCol] = state.selectedCells[0];
        const minR = Math.min(firstRow, row);
        const maxR = Math.max(firstRow, row);
        const minC = Math.min(firstCol, col);
        const maxC = Math.max(firstCol, col);

        dispatch({ type: "CLEAR_SELECTION" });
        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            dispatch({
              type: "SELECT_CELL",
              row: r,
              col: c,
              additive: true,
            });
          }
        }
        return;
      }

      // 普通点击 / Ctrl+点击 toggle
      dispatch({
        type: "SELECT_CELL",
        row,
        col,
        additive: event.ctrlKey || event.metaKey,
      });
    },
    [state, dispatch]
  );

  return { handleCellClick };
}
