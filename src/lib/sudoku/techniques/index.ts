import { nakedSingle } from "./nakedSingle";
import { hiddenSingle } from "./hiddenSingle";
import { pointingPair } from "./pointingPair";
import { boxLineReduction } from "./boxLineReduction";
import { getAllCandidates } from "../candidates";
import type { NotesGrid } from "../types";

export type TechniqueResult = { notes: NotesGrid; changed: boolean };

/**
 * 全部已实现技巧。供"求解器"等需要逐步收窄候选的场景使用。
 */
const allTechniques = [nakedSingle, hiddenSingle, pointingPair, boxLineReduction];

/**
 * 智能笔记使用的技巧子集。
 * 只包含"消除候选"类技巧（pointing / box-line），
 * 不含 nakedSingle / hiddenSingle —— 后两者会把候选收窄成单值，
 * 等同于直接告诉答案，不适合"展示候选数"的辅助笔记场景。
 */
const notesTechniques = [pointingPair, boxLineReduction];

/**
 * 智能笔记：基于完整候选集，用区块类技巧（pointing / box-line）
 * 做多轮消除，得到精简后的候选数。
 *
 * 注意：不使用 nakedSingle / hiddenSingle，因为它们会把候选收窄成单值，
 * 对"给玩家展示候选数"的辅助笔记而言属于过度暴露答案。
 *
 * @param grid - 9×9 数字网格（0 表示空）。
 * @param currentNotes - 已有候选数；为空或缺省时用 getAllCandidates 初始化。
 * @returns 消除后的候选数网格。
 */
export function applySmartNotes(
  grid: number[][],
  currentNotes?: NotesGrid
): NotesGrid {
  let notes: NotesGrid = currentNotes
    ? currentNotes.map((row) => row.map((cell) => [...cell]))
    : getAllCandidates(grid);
  let changed = true;
  let iterations = 0;

  while (changed && iterations < 10) {
    changed = false;
    for (const technique of notesTechniques) {
      const result = technique.apply(grid, notes);
      if (result.changed) {
        notes = result.notes;
        changed = true;
      }
    }
    iterations++;
  }
  return notes;
}

/**
 * 完整技巧链求解：用全部技巧迭代消除候选（含收窄成单值的技巧）。
 * 供未来"自动求解/提示"场景使用。
 * @param grid - 9×9 数字网格（0 表示空）。
 * @param currentNotes - 已有候选数；为空或缺省时用 getAllCandidates 初始化。
 * @returns 消除后的候选数网格。
 */
export function applyAllTechniques(
  grid: number[][],
  currentNotes?: NotesGrid
): NotesGrid {
  let notes: NotesGrid = currentNotes
    ? currentNotes.map((row) => row.map((cell) => [...cell]))
    : getAllCandidates(grid);
  let changed = true;
  let iterations = 0;

  while (changed && iterations < 10) {
    changed = false;
    for (const technique of allTechniques) {
      const result = technique.apply(grid, notes);
      if (result.changed) {
        notes = result.notes;
        changed = true;
      }
    }
    iterations++;
  }
  return notes;
}
