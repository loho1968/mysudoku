"use client";

/**
 * @file NotesLayer.tsx
 * @author loho
 *
 * 候选数笔记渲染层。
 *
 * 在单元格内渲染 3×3 的迷你数字网格，每个数字 1-9 占据一格位置，
 * 若该数字在候选数列表中则显示数字，否则留空。
 * 通过 CSS 的 .notes-layer 布局（3×3 grid）控制排列。
 */

interface NotesLayerProps {
  /** 当前单元格的候选数列表 */
  notes: number[];
}

/**
 * 候选数笔记组件。
 * @param notes - 候选数数组。
 */
export function NotesLayer({ notes }: NotesLayerProps) {
  if (notes.length === 0) return null;

  return (
    <div className="notes-layer">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <span key={n} className={`note ${notes.includes(n) ? "active" : ""}`}>
          {notes.includes(n) ? n : ""}
        </span>
      ))}
    </div>
  );
}
