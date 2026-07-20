"use client";

/**
 * @file Cell.tsx
 * @author loho
 *
 * 数独棋盘单个单元格。
 *
 * 纯 div 渲染（不用 table/canvas），通过 CSS class 控制样式与高亮。
 * 格子的值以大数字显示，候选数以 NotesLayer 小字显示。
 * 宫框加粗与高亮色由 CSS 控制（globals.css）。
 *
 * 接收 isRowColHighlighted / isSameNumberHighlighted / isSelected
 * 等布尔标志位，由父组件 SudokuGrid 根据 useHighlights 计算结果传入，
 * 避免在每个 Cell 中重复计算。
 */

import type { CellData } from "@/types/game";
import { NotesLayer } from "./NotesLayer";

interface CellProps {
  row: number;
  col: number;
  /** 该格的数据（value / isGiven / notes / isError） */
  data: CellData;
  /** 是否在行列高亮范围内（选中格所在行/列） */
  isRowColHighlighted: boolean;
  /** 是否在相同数字高亮范围内 */
  isSameNumberHighlighted: boolean;
  /** 是否被选中 */
  isSelected: boolean;
  /** 是否显示候选数笔记 */
  showNotes: boolean;
  /** 选中格的数字（用于候选数同数字高亮框） */
  sameCandidateValue: number | null;
  /** 点击事件回调 */
  onClick: (row: number, col: number, event: React.MouseEvent) => void;
}

/**
 * 单元格组件。
 */
export function Cell({
  row,
  col,
  data,
  isRowColHighlighted,
  isSameNumberHighlighted,
  isSelected,
  showNotes,
  sameCandidateValue,
  onClick,
}: CellProps) {
  const classNames = [
    "cell",
    data.isGiven ? "given" : "user-filled",
    isRowColHighlighted ? "row-highlight" : "",
    isSameNumberHighlighted ? "same-number" : "",
    isSelected ? "selected" : "",
    data.isError ? "error" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = (event: React.MouseEvent) => {
    onClick(row, col, event);
  };

  return (
    <div className={classNames} onClick={handleClick}>
      {data.value !== null ? (
        <span
          className={`cell-value ${data.isGiven ? "given" : "user-filled"}`}
        >
          {data.value}
        </span>
      ) : showNotes ? (
        <NotesLayer notes={data.notes} sameCandidateValue={sameCandidateValue} />
      ) : null}
    </div>
  );
}
