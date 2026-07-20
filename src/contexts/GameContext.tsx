"use client";

/**
 * @file GameContext.tsx
 * @author loho
 *
 * 游戏状态上下文与 reducer。
 *
 * 使用 React Context + useReducer 管理游戏核心状态（棋盘、选中、输入模式、
 * 步骤历史等），不引入额外状态管理库。
 *
 * 设计说明见 PLAN.md 七、核心实现要点。
 */

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
} from "react";
import type { GameState, GameAction, CellData, StepChange } from "@/types/game";
import { hasErrors } from "@/lib/sudoku/validator";
import { getCandidates } from "@/lib/sudoku/candidates";
import { applySmartNotes } from "@/lib/sudoku/techniques";

// ---- 初始状态 ----

const initialState: GameState = {
  puzzleId: null,
  grid: [],
  selectedCells: [],
  inputMode: "answer",
  stickyNumber: null,
  isStickyMode: false,
  steps: [],
  currentStepIndex: -1,
  showNotes: false,
  noteType: "none",
  smartNotesExpired: false,
  chains: [],
  timerRunning: false,
  elapsedSeconds: 0,
  isCompleted: false,
  isSubmitted: false,
};

// ---- 辅助函数 ----

/**
 * 将 81 字符题目字符串解析为 CellData 9×9 网格。
 * @param puzzle - 81 字符字符串（"0" 或 "." 表示空格）。
 * @returns 填充好的 CellData 网格。
 */
function parsePuzzleToGrid(puzzle: string): CellData[][] {
  const grid: CellData[][] = [];
  for (let r = 0; r < 9; r++) {
    grid[r] = [];
    for (let c = 0; c < 9; c++) {
      const ch = puzzle[r * 9 + c];
      const value = ch === "0" || ch === "." ? null : parseInt(ch, 10);
      grid[r][c] = {
        value,
        isGiven: value !== null,
        notes: [],
        isError: false,
      };
    }
  }
  return grid;
}

/**
 * 深拷贝 9×9 CellData 网格（避免 notes 数组引用共享）。
 */
function cloneGrid(grid: CellData[][]): CellData[][] {
  return grid.map((row) =>
    row.map((cell) => ({ ...cell, notes: [...cell.notes] }))
  );
}

/**
 * 将 CellData 网格转为 number 网格（null → 0），供算法库使用。
 */
function toNumberGrid(grid: CellData[][]): number[][] {
  return grid.map((row) => row.map((cell) => cell.value ?? 0));
}

/**
 * 获取填入/删除数字 (row, col) 后受影响的格子坐标。
 * 包括同行、同列、同宫的全部格子（去重）。
 */
function getAffectedCells(
  row: number,
  col: number
): [number, number][] {
  const seen = new Set<string>();
  const cells: [number, number][] = [];
  const add = (r: number, c: number) => {
    const key = `${r}-${c}`;
    if (!seen.has(key)) {
      seen.add(key);
      cells.push([r, c]);
    }
  };
  for (let c = 0; c < 9; c++) add(row, c);
  for (let r = 0; r < 9; r++) add(r, col);
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++) add(r, c);
  return cells;
}

// ---- Reducer ----

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "LOAD_PUZZLE": {
      const grid = parsePuzzleToGrid(action.puzzle);
      return {
        ...initialState,
        puzzleId: action.puzzleId,
        grid,
        inputMode: "answer",
        noteType: "none",
        showNotes: false,
      };
    }

    case "SELECT_CELL": {
      const { row, col, additive } = action;

      if (additive) {
        // Ctrl/Cmd+点击：toggle 单个格子
        const exists = state.selectedCells.some(
          ([r, c]) => r === row && c === col
        );
        const selectedCells: [number, number][] = exists
          ? state.selectedCells.filter(
              ([r, c]) => !(r === row && c === col)
            )
          : [...state.selectedCells, [row, col] as [number, number]];
        return { ...state, selectedCells };
      }

      // 普通点击：单选
      return { ...state, selectedCells: [[row, col]] };
    }

    case "CLEAR_SELECTION":
      return { ...state, selectedCells: [] };

    case "SET_CELL_VALUE": {
      // 已提交成功 → 棋盘锁定，禁止编辑
      if (state.isSubmitted) return state;

      const { row, col, value } = action;
      const newGrid = cloneGrid(state.grid);
      const cell = newGrid[row]?.[col];
      // 初始数字不可修改
      if (!cell || cell.isGiven) return state;

      // 重复输入已有数字 → 擦除（用户习惯：再按一次同一数字 = 撤销）
      const effectiveValue = value === cell.value ? null : value;

      // 先把目标格的值/笔记改好
      newGrid[row][col] = {
        ...cell,
        value: effectiveValue,
        notes: effectiveValue !== null ? [] : cell.notes,
        isError: false,
      };

      // 答题后重新计算候选数：
      // - none / normal：重算受影响格（同行/列/宫）的普通候选
      // - smart：基于新盘面整体重跑区块消除（pointing/boxLine），
      //   保证全局候选与最新盘面约束一致。
      const numGrid = toNumberGrid(newGrid);
      if (state.noteType === "smart") {
        const smartNotes = applySmartNotes(numGrid);
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            if (newGrid[r][c].value === null) {
              newGrid[r][c].notes = smartNotes[r][c];
            }
          }
        }
      } else {
        for (const [ar, ac] of getAffectedCells(row, col)) {
          if (newGrid[ar][ac].value !== null) {
            newGrid[ar][ac].notes = [];
          } else {
            newGrid[ar][ac].notes = Array.from(
              getCandidates(numGrid, ar, ac)
            ).sort();
          }
        }
      }

      // 生成完整变更记录：目标格 + 所有候选数发生变化的格子。
      // 这样 UNDO/REDO 才能完整恢复连带被重算的候选数。
      const changes: StepChange[] = [
        {
          row,
          col,
          prevValue: cell.value,
          prevNotes: [...cell.notes],
          newValue: effectiveValue,
          newNotes: [],
        },
      ];
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (r === row && c === col) continue;
          const before = state.grid[r][c];
          const after = newGrid[r][c];
          // value 或 notes 任一变化即记入（避免冗余）
          if (
            before.value !== after.value ||
            before.notes.join(",") !== after.notes.join(",")
          ) {
            changes.push({
              row: r,
              col: c,
              prevValue: before.value,
              prevNotes: [...before.notes],
              newValue: after.value,
              newNotes: [...after.notes],
            });
          }
        }
      }

      // 丢弃 currentStepIndex 之后的步骤（新分支）
      const steps = state.steps.slice(0, state.currentStepIndex + 1);
      steps.push({
        type: effectiveValue === null ? "erase" : "fill",
        changes,
      });

      // 注意：填满棋盘 ≠ 完成。完成需用户提交且无错（SUBMIT_PUZZLE）。
      const result: GameState = {
        ...state,
        grid: newGrid,
        steps,
        currentStepIndex: steps.length - 1,
        // smart 模式答题后候选已重算，不再标记过期
        smartNotesExpired: false,
        // 答题后清除旧的完成态（用户重新编辑视为放弃上次的提交成果）
        isCompleted: false,
        isSubmitted: false,
      };
      return result;
    }

    case "SUBMIT_PUZZLE": {
      // 已提交 → 不再处理
      if (state.isSubmitted) return state;

      // 必须填满 + 无错才算完成
      const allFilled = state.grid.every((row) =>
        row.every((cell) => cell.value !== null)
      );
      if (!allFilled) return state;

      const numberGrid = toNumberGrid(state.grid);
      if (hasErrors(numberGrid)) return state;

      // 提交成功：标记完成 + 锁定棋盘 + 停止计时器
      return {
        ...state,
        isCompleted: true,
        isSubmitted: true,
        timerRunning: false,
      };
    }

    case "AUTO_NOTES": {
      // 重新计算全部格子的普通笔记
      const numGrid = toNumberGrid(state.grid);
      const newGrid = cloneGrid(state.grid);
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (newGrid[r][c].value !== null) {
            newGrid[r][c].notes = [];
          } else {
            newGrid[r][c].notes = Array.from(
              getCandidates(numGrid, r, c)
            ).sort();
          }
        }
      }
      return {
        ...state,
        grid: newGrid,
        noteType: "normal",
        smartNotesExpired: false,
      };
    }

    case "SMART_NOTES": {
      // 智能笔记：在普通笔记基础上叠加技巧推理
      if (state.grid.length === 0) return state;
      const numGrid = toNumberGrid(state.grid);
      // 判断当前是否已有有效笔记：若全空则传 undefined，让 applySmartNotes
      // 内部用 getAllCandidates 初始化候选集（否则在空集上做消除无意义）
      const hasAnyNotes = state.grid.some((row) =>
        row.some((cell) => cell.notes.length > 0)
      );
      const currentNotes = hasAnyNotes
        ? state.grid.map((row) => row.map((cell) => [...cell.notes]))
        : undefined;
      const smartNotes = applySmartNotes(numGrid, currentNotes);
      const newGrid = cloneGrid(state.grid);
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (newGrid[r][c].value === null) {
            newGrid[r][c].notes = smartNotes[r][c];
          }
        }
      }
      return {
        ...state,
        grid: newGrid,
        noteType: "smart",
        smartNotesExpired: false,
      };
    }

    case "SET_INPUT_MODE":
      return { ...state, inputMode: action.mode };

    case "SET_SHOW_NOTES":
      return { ...state, showNotes: action.show };

    case "SET_STICKY_NUMBER":
      return {
        ...state,
        stickyNumber: action.number,
        isStickyMode: action.number !== null,
      };

    case "TICK_TIMER":
      return { ...state, elapsedSeconds: state.elapsedSeconds + 1 };

    case "TOGGLE_TIMER":
      return { ...state, timerRunning: !state.timerRunning };

    case "RESET_TIMER":
      return { ...state, elapsedSeconds: 0, timerRunning: false };

    case "RESTORE_STATE":
      return { ...action.state };

    case "TOGGLE_NOTE": {
      // 已提交 → 禁止笔记操作
      if (state.isSubmitted) return state;
      const { row, col, note } = action;
      const oldCell = state.grid[row]?.[col];
      if (!oldCell || oldCell.isGiven || oldCell.value !== null) return state;

      const newGrid = cloneGrid(state.grid);
      const cell = newGrid[row][col];
      const notes = cell.notes.includes(note)
        ? cell.notes.filter((n: number) => n !== note)
        : [...cell.notes, note].sort();

      const steps = state.steps.slice(0, state.currentStepIndex + 1);
      steps.push({
        type: "toggleNote",
        changes: [
          {
            row,
            col,
            prevValue: cell.value,
            prevNotes: [...cell.notes],
            newValue: cell.value,
            newNotes: notes,
          },
        ],
      });

      newGrid[row][col] = { ...cell, notes };

      return {
        ...state,
        grid: newGrid,
        steps,
        currentStepIndex: steps.length - 1,
      };
    }

    case "UNDO": {
      // 已提交 → 禁止撤销（防止解锁棋盘）
      if (state.isSubmitted) return state;
      if (state.currentStepIndex < 0) return state;
      const undoStep = state.steps[state.currentStepIndex];
      const undoGrid = cloneGrid(state.grid);

      for (const change of undoStep.changes) {
        const cell = undoGrid[change.row][change.col];
        undoGrid[change.row][change.col] = {
          ...cell,
          value: change.prevValue,
          notes: change.prevNotes,
          isError: false,
        };
      }

      // 选中格跟随撤销的操作位置：changes[0] 是用户直接操作的目标格
      const focusChange = undoStep.changes[0];

      return {
        ...state,
        grid: undoGrid,
        selectedCells: [[focusChange.row, focusChange.col]],
        currentStepIndex: state.currentStepIndex - 1,
        isCompleted: false,
      };
    }

    case "REDO": {
      // 已提交 → 禁止重做
      if (state.isSubmitted) return state;
      if (state.currentStepIndex >= state.steps.length - 1) return state;
      const redoStep = state.steps[state.currentStepIndex + 1];
      const redoGrid = cloneGrid(state.grid);

      for (const change of redoStep.changes) {
        const cell = redoGrid[change.row][change.col];
        redoGrid[change.row][change.col] = {
          ...cell,
          value: change.newValue,
          notes: change.newNotes,
          isError: false,
        };
      }

      // 选中格跟随重做的操作位置：changes[0] 是用户直接操作的目标格
      const focusChange = redoStep.changes[0];

      return {
        ...state,
        grid: redoGrid,
        selectedCells: [[focusChange.row, focusChange.col]],
        currentStepIndex: state.currentStepIndex + 1,
      };
    }

    default:
      return state;
  }
}

// ---- Context ----

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

// ---- Provider ----

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

// ---- Hook ----

/**
 * 在子组件中获取游戏状态与 dispatch。
 * 必须在 `<GameProvider>` 内部调用，否则抛出异常。
 */
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGame 必须在 <GameProvider> 内部调用");
  }
  return ctx;
}
