"use client";

/**
 * @file useHighlights.ts
 * @author loho
 *
 * 高亮计算 hook。
 *
 * 基于当前选中的格子与棋盘状态，计算三类高亮 Set：
 * - rowColSet:      选中格所在行列的全部格子
 * - sameNumberSet:  选中格的值相同的全局格子
 * - selectedSet:    当前被选中的格子自身
 *
 * 均为纯派生状态（useMemo），非 reducer 的一部分。
 * 亮/暗主题的高亮色值由 CSS 变量控制（globals.css），不在此处处理。
 */

import { useMemo } from "react";
import type { CellData } from "@/types/game";

export interface HighlightResult {
  /** key = `${row}-${col}`，行列高亮的集合 */
  rowColSet: ReadonlySet<string>;
  /** key = `${row}-${col}`，同数字高亮的集合 */
  sameNumberSet: ReadonlySet<string>;
  /** key = `${row}-${col}`，选中格自身的集合 */
  selectedSet: ReadonlySet<string>;
}

/**
 * 根据 selectedCells 与 grid 计算高亮集合。
 * @param selectedCells - 当前选中格的坐标列表。
 * @param grid - 当前棋盘 9×9。
 * @returns 三类高亮的 Set。
 */
export function useHighlights(
  selectedCells: [number, number][],
  grid: CellData[][]
): HighlightResult {
  const rowColSet = useMemo(() => {
    const set = new Set<string>();
    for (const [r, c] of selectedCells) {
      for (let i = 0; i < 9; i++) {
        set.add(`${r}-${i}`);
        set.add(`${i}-${c}`);
      }
    }
    return set;
  }, [selectedCells]);

  const sameNumberSet = useMemo(() => {
    const set = new Set<string>();
    for (const [r, c] of selectedCells) {
      const val = grid[r]?.[c]?.value;
      if (val === null) continue;
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (grid[i]?.[j]?.value === val) {
            set.add(`${i}-${j}`);
          }
        }
      }
    }
    return set;
  }, [selectedCells, grid]);

  const selectedSet = useMemo(() => {
    const set = new Set<string>();
    for (const [r, c] of selectedCells) {
      set.add(`${r}-${c}`);
    }
    return set;
  }, [selectedCells]);

  return { rowColSet, sameNumberSet, selectedSet };
}
