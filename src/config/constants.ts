export const GRID_SIZE = 9;
export const BOX_SIZE = 3;
export const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const DEFAULT_FONT_SIZE = 24;
export const MIN_FONT_SIZE = 16;
export const MAX_FONT_SIZE = 40;

export const AUTO_SAVE_INTERVAL = 30000;
export const DEFAULT_EDIT_PASSWORD = 'mysudoku';
export const PROGRESS_KEY = 'mysudoku_game_progress';
export const SETTINGS_KEY = 'mysudoku_settings';

export const DIFFICULTY_LABELS: Record<number, string> = {
  0: '未分类',
  1: '简单',
  2: '中等',
  3: '困难',
  4: '专家',
};

export const CHAIN_COLORS = [
  '#1677ff', '#52c41a', '#fa8c16', '#eb2f96',
  '#722ed1', '#13c2c2', '#f5222d', '#faad14',
];
