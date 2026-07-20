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
 *
 * 当 sameCandidateValue 不为空时，匹配的候选数用底色框高亮（表示
 * 该候选数与选中格数值相同）。
 */

interface NotesLayerProps {
  /** 当前单元格的候选数列表 */
  notes: number[];
  /** 选中格的数字，用于候选数同数字高亮框。null 表示不开启。 */
  sameCandidateValue?: number | null;
}

/**
 * 候选数笔记组件。
 * @param notes - 候选数数组。
 * @param sameCandidateValue - 选中格的值（可选）。
 */
export function NotesLayer({ notes, sameCandidateValue }: NotesLayerProps) {
  if (notes.length === 0) return null;

  return (
    <div className="notes-layer">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
        const isActive = notes.includes(n);
        const isCandidateHighlight =
          isActive &&
          sameCandidateValue !== null &&
          sameCandidateValue !== undefined &&
          n === sameCandidateValue;
        const className = `note${isActive ? " active" : ""}${isCandidateHighlight ? " candidate-highlight" : ""}`;
        return (
          <span key={n} className={className}>
            {isActive ? n : ""}
          </span>
        );
      })}
    </div>
  );
}
