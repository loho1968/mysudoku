export type CellValue = number | null;
export type InputMode = 'answer' | 'note';

export interface CellData {
  value: number | null;
  isGiven: boolean;
  notes: number[];
  isError: boolean;
}

export interface StepChange {
  row: number;
  col: number;
  prevValue: number | null;
  prevNotes: number[];
  newValue: number | null;
  newNotes: number[];
}

export interface Step {
  type: 'fill' | 'erase' | 'toggleNote' | 'batchFill' | 'batchErase' | 'batchToggleNote';
  changes: StepChange[];
}

export interface ChainLink {
  id: string;
  from: { row: number; col: number };
  to: { row: number; col: number };
  type: 'strong' | 'weak';
  candidate: number;
  color: string;
}

export interface GameState {
  puzzleId: string | null;
  grid: CellData[][];
  selectedCells: [number, number][];
  inputMode: InputMode;
  stickyNumber: number | null;
  isStickyMode: boolean;
  steps: Step[];
  currentStepIndex: number;
  showNotes: boolean;
  noteType: 'none' | 'normal' | 'smart';
  smartNotesExpired: boolean;
  chains: ChainLink[];
  timerRunning: boolean;
  elapsedSeconds: number;
  /** 本题是否已提交成功（提交时填满且无错）。true 时棋盘锁定。 */
  isCompleted: boolean;
  /** 本题是否已成功提交过。true 时禁止再次提交/编辑/撤销。 */
  isSubmitted: boolean;
}

export type GameAction =
  | { type: 'LOAD_PUZZLE'; puzzleId: string; puzzle: string; solution?: string }
  | { type: 'SET_CELL_VALUE'; row: number; col: number; value: number | null }
  | { type: 'BATCH_SET_VALUE'; cells: [number, number][]; value: number | null }
  | { type: 'TOGGLE_NOTE'; row: number; col: number; note: number }
  | { type: 'BATCH_TOGGLE_NOTE'; cells: [number, number][]; note: number }
  | { type: 'SELECT_CELL'; row: number; col: number; additive: boolean }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_INPUT_MODE'; mode: InputMode }
  | { type: 'SET_STICKY_NUMBER'; number: number | null }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_SHOW_NOTES'; show: boolean }
  | { type: 'AUTO_NOTES' }
  | { type: 'SMART_NOTES' }
  | { type: 'SUBMIT_PUZZLE' }
  | { type: 'ADD_CHAIN_LINK'; link: ChainLink }
  | { type: 'REMOVE_CHAIN_LINK'; id: string }
  | { type: 'CLEAR_CHAINS' }
  | { type: 'TICK_TIMER' }
  | { type: 'TOGGLE_TIMER' }
  | { type: 'RESET_TIMER' }
  | { type: 'RESTORE_STATE'; state: GameState };

export interface LocalProgress {
  puzzleId: string;
  grid: { value: number | null; isGiven: boolean; notes: number[] }[][];
  steps: Step[];
  currentStepIndex: number;
  showNotes: boolean;
  noteType: 'none' | 'normal' | 'smart';
  chains: ChainLink[];
  elapsedSeconds: number;
  timerRunning: boolean;
  savedAt: number;
}

export interface UserSettings {
  fontSize: number;
}
