"use client";

/**
 * @file useLocalProgress.ts
 * @author loho
 *
 * localStorage 游戏进度自动存档/恢复 hook。
 *
 * 存档时机：每次游戏状态变化后 debounce 3s 自动保存；
 *           页面卸载时立即保存（beforeunload）。
 * 恢复时机：加载题目时检测 localStorage，如存在对应用题的存档则恢复。
 *
 * 序列化字段：grid、steps、currentStepIndex、showNotes、noteType、chains、
 * elapsedSeconds、timerRunning、puzzleId。
 */

import { useCallback, useEffect, useRef } from "react";
import { useGame } from "@/contexts/GameContext";
import { PLAYED_SET_KEY, PROGRESS_KEY, LAST_PUZZLE_KEY } from "@/config/constants";
import type { GameState, LocalProgress, CellData } from "@/types/game";

/**
 * 从当前 GameState 提取可序列化的进度数据。
 */
function toLocalProgress(state: GameState): LocalProgress {
  return {
    puzzleId: state.puzzleId ?? "",
    grid: state.grid,
    steps: state.steps,
    currentStepIndex: state.currentStepIndex,
    showNotes: state.showNotes,
    noteType: state.noteType,
    chains: state.chains,
    elapsedSeconds: state.elapsedSeconds,
    timerRunning: state.timerRunning,
    savedAt: Date.now(),
  };
}

/**
 * 将 LocalProgress 恢复为 GameState（补全 transient 字段）。
 */
function toGameState(progress: LocalProgress): GameState {
  const grid: CellData[][] = progress.grid.map((row) =>
    row.map((cell) => ({
      value: cell.value,
      isGiven: cell.isGiven,
      notes: cell.notes,
      isError: false,
    }))
  );
  return {
    puzzleId: progress.puzzleId,
    grid,
    selectedCells: [],
    inputMode: "answer",
    stickyNumber: null,
    isStickyMode: false,
    steps: progress.steps,
    currentStepIndex: progress.currentStepIndex,
    showNotes: progress.showNotes,
    noteType: progress.noteType,
    smartNotesExpired: false,
    chains: progress.chains,
    timerRunning: progress.timerRunning,
    elapsedSeconds: progress.elapsedSeconds,
    isCompleted: false,
    errorCheckResult: null,
  };
}

/**
 * 从 localStorage 读取存档。
 */
function loadFromStorage(): LocalProgress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalProgress;
  } catch {
    return null;
  }
}

/**
 * 写入 localStorage。
 */
function saveToStorage(progress: LocalProgress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // 存储满时静默失败
  }
}

/**
 * 清除存档。
 */
export function clearProgress(): void {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // ignore
  }
}

/**
 * 读取当前存档（供外部判断是否有未完成进度）。
 */
export function getSavedProgress(): LocalProgress | null {
  return loadFromStorage();
}

/**
 * 记录最后玩的题目（last puzzle），用于首页跨题目自动恢复。
 * 写入 LAST_PUZZLE_KEY，格式：{ puzzleId, puzzle, solution? }
 */
export function saveLastPuzzle(
  puzzleId: string,
  puzzle: string,
  solution?: string | null
): void {
  try {
    localStorage.setItem(
      LAST_PUZZLE_KEY,
      JSON.stringify({ puzzleId, puzzle, solution })
    );
  } catch {
    // ignore
  }
}

/**
 * 读取最后玩的题目记录。
 */
export function getLastPuzzle(): {
  puzzleId: string;
  puzzle: string;
  solution?: string | null;
} | null {
  try {
    const raw = localStorage.getItem(LAST_PUZZLE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * 标记某道题已做完（写入 PLAYED_SET_KEY 集合）。
 */
export function markPlayed(puzzleId: string): void {
  try {
    const raw = localStorage.getItem(PLAYED_SET_KEY);
    const set = new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
    set.add(puzzleId);
    localStorage.setItem(PLAYED_SET_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

/**
 * 检查某道题是否做过。
 */
export function isPlayed(puzzleId: string): boolean {
  try {
    const raw = localStorage.getItem(PLAYED_SET_KEY);
    if (!raw) return false;
    const set = new Set<string>(JSON.parse(raw) as string[]);
    return set.has(puzzleId);
  } catch {
    return false;
  }
}

const SAVE_DEBOUNCE_MS = 3000;

/**
 * 进度保存 hook。在 GameProvider 内部调用。
 *
 * - 自动保存：状态变化后 debounce 写入 localStorage
 * - 页面关闭前立即保存（beforeunload）
 * - restore() 改为直接恢复，**不再弹确认窗**（符合"无脑恢复"需求）
 */
export function useLocalProgress() {
  const { state, dispatch } = useGame();
  // 用 ref 保存最新 state 用于 beforeunload（必须用 effect 更新，React 19 禁止 render 中改 ref）
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 自动保存（debounce）
  useEffect(() => {
    if (!state.puzzleId || state.grid.length === 0) return;
    const timer = setTimeout(() => {
      saveToStorage(toLocalProgress(state));
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [
    state.puzzleId,
    state.grid,
    state.steps,
    state.currentStepIndex,
    state.showNotes,
    state.noteType,
    state.chains,
    state.elapsedSeconds,
    state.timerRunning,
  ]);

  // 页面关闭/刷新时立即保存
  useEffect(() => {
    const save = () => {
      const s = stateRef.current;
      if (s.puzzleId && s.grid.length > 0) {
        saveToStorage(toLocalProgress(s));
      }
    };
    window.addEventListener("beforeunload", save);
    return () => window.removeEventListener("beforeunload", save);
  }, []);

  // 恢复存档：直接恢复，不弹确认窗
  const restore = useCallback(() => {
    const saved = loadFromStorage();
    if (
      saved &&
      saved.puzzleId === state.puzzleId &&
      saved.savedAt
    ) {
      dispatch({
        type: "RESTORE_STATE",
        state: toGameState(saved),
      });
    }
  }, [state.puzzleId, dispatch]);

  return { restore };
}
