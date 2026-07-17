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
const MIN_CELL_SIZE = 28;
const MAX_CELL_SIZE = 72;

/**
 * 计算合适的格子大小。
 * 横向排除左右 padding + Card padding（估 96px），
 * 纵向排除 Header/Footer/Toolbar/Title/NumberPad 等固定高度（估 482px）。
 * @returns 格子像素大小。
 */
function calcCellSize(): number {
  if (typeof window === "undefined") return 40;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // 纵向估算：Header(64) + Footer(64) + padding上下(48) + Card上下(48)
  //   + Title(60) + Toolbar(32) + 棋盘margin(32) + NumberPad(150) = 498
  const fixedV = 498;
  // 横向估算：左右 padding + Card padding
  const fixedH = 96;

  const availW = vw - fixedH;
  const availH = vh - fixedV;

  // 棋盘必须是正方形，取较小可用维度
  const maxEdge = Math.min(availW, availH);
  const cellSize = Math.floor(maxEdge / 9);

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
        row.map((cell, c) => (
          <Cell
            key={`${r}-${c}`}
            row={r}
            col={c}
            data={cell}
            isRowColHighlighted={rowColSet.has(`${r}-${c}`)}
            isSameNumberHighlighted={sameNumberSet.has(`${r}-${c}`)}
            isSelected={selectedSet.has(`${r}-${c}`)}
            showNotes={state.showNotes}
            onClick={handleCellClick}
          />
        ))
      )}
    </div>
  );
}
