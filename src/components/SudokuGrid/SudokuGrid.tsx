"use client";

/**
 * @file SudokuGrid.tsx
 * @author loho
 *
 * 数独棋盘容器。
 *
 * 使用 CSS Grid 布局（display: grid; grid-template-columns: repeat(9, 1fr)），
 * 纯 div 渲染。高亮与 3×3 宫框由 CSS 控制。
 *
 * 格子大小与字体大小根据视口实时自适应计算，通过 --cell-size / --cell-font-size
 * CSS 变量传递给子组件。
 *
 * 内部使用 useHighlights 与 useCellSelection 管理选中状态与高亮计算。
 */

import { useEffect, useState, type CSSProperties } from "react";
import { useGame } from "@/contexts/GameContext";
import { useHighlights } from "@/hooks/useHighlights";
import { useCellSelection } from "@/hooks/useCellSelection";
import { Cell } from "./Cell";

/** 格子大小上下限 */
const MIN_CELL_SIZE = 40;
const MAX_CELL_SIZE = 160;

/** 页面外边距 */
const PAGE_PADDING = 48;

/**
 * 计算合适的格子大小。
 * 左右布局下，棋盘可用宽度 = 视口宽度 - 右侧面板（≈5*cellSize，需要迭代收敛）- 页面边距；
 * 可用高度 = 视口高度 - Header - 页面上下边距。
 * 面板宽度随 cellSize 变化，故迭代几次收敛。
 * @returns 格子像素大小。
 */
function calcCellSize(): number {
  if (typeof window === "undefined") return 64;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // 纵向估算：Header(64) + 页面上下 padding(48) + 棋盘外框(6)
  const fixedV = 118;
  // 列间距 + 页面左右 padding
  const fixedH = PAGE_PADDING + 24;

  const availH = vh - fixedV;

  // 迭代收敛：面板宽度 = 5*cellSize + 32，min 320
  let cellSize = Math.floor(availH / 9);
  for (let i = 0; i < 4; i++) {
    const panelW = Math.max(320, cellSize * 5 + 32);
    const availW = vw - fixedH - panelW;
    const maxEdge = Math.min(availW, availH);
    cellSize = Math.floor(maxEdge / 9);
  }

  return Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, cellSize));
}

/**
 * 棋盘组件。需在 `<GameProvider>` 内部使用。
 */
export function SudokuGrid() {
  const { state } = useGame();
  const { rowColSet, sameNumberSet, selectedSet } = useHighlights(
    state.selectedCells,
    state.grid
  );
  const { handleCellClick } = useCellSelection();

  const [cellSize, setCellSize] = useState(calcCellSize);

  // 同步到 document root，让棋盘外的组件（数字键盘等）也能取到
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--cell-size",
      `${cellSize}px`
    );
    document.documentElement.style.setProperty(
      "--cell-font-size",
      `${Math.round(cellSize * 0.58)}px`
    );
  }, [cellSize]);

  useEffect(() => {
    const handler = () => setCellSize(calcCellSize());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  if (state.grid.length === 0) {
    return (
      <div
        className="sudoku-grid-empty"
        style={{ textAlign: "center", padding: 40, color: "#999" }}
      >
        请加载一个题目
      </div>
    );
  }

  const gridStyle: CSSProperties = {
    "--cell-size": `${cellSize}px`,
    "--cell-font-size": `${Math.round(cellSize * 0.58)}px`,
  } as CSSProperties;

  return (
    <div className="sudoku-grid" style={gridStyle}>
      {state.grid.map((row, r) =>
        row.map((cell, c) => {
          // 选中格的数字（若有），用于候选数同数字高亮
          const firstSelected = state.selectedCells[0];
          const sameCandidateValue =
            firstSelected
              ? state.grid[firstSelected[0]]?.[firstSelected[1]]?.value ?? null
              : null;

          return (
            <Cell
              key={`${r}-${c}`}
              row={r}
              col={c}
              data={cell}
              isRowColHighlighted={rowColSet.has(`${r}-${c}`)}
              isSameNumberHighlighted={sameNumberSet.has(`${r}-${c}`)}
              isSelected={selectedSet.has(`${r}-${c}`)}
              showNotes={state.showNotes}
              sameCandidateValue={sameCandidateValue}
              onClick={handleCellClick}
            />
          );
        })
      )}
    </div>
  );
}
