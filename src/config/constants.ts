export const GRID_SIZE = 9;
export const BOX_SIZE = 3;
export const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const DEFAULT_FONT_SIZE = 24;
export const MIN_FONT_SIZE = 16;
export const MAX_FONT_SIZE = 40;

export const AUTO_SAVE_INTERVAL = 30000;
export const DEFAULT_EDIT_PASSWORD = 'Kili+2016';
export const PROGRESS_KEY = 'mysudoku_game_progress';
export const SETTINGS_KEY = 'mysudoku_settings';

/** 最后玩的题目（id + 题面），用于首页跨题目自动恢复 */
export const LAST_PUZZLE_KEY = 'mysudoku_last_puzzle';
/** 做过的题目 id 集合（JSON 数组），用于"已做过"判定与随机出题优先排除 */
export const PLAYED_SET_KEY = 'mysudoku_played_puzzles';

export const DIFFICULTY_LABELS: Record<number, string> = {
  0: '未分类',
  1: '简单',
  2: '中等',
  3: '困难',
  4: '专家',
};

/**
 * 随机出题可选难度档位（仅简单/中等/困难）。
 * 不含 0=未分类与 4=专家。
 */
export const DIFFICULTY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "简单" },
  { value: 2, label: "中等" },
  { value: 3, label: "困难" },
];

/**
 * 涉及技巧枚举列表（33 项）。
 * 按类别分三组，便于 UI 展示。
 */
export const TECHNIQUE_GROUPS: { label: string; items: string[] }[] = [
  {
    label: "基础技巧",
    items: [
      "直观区块",
      "割补",
      "显性数对",
      "显性三数组",
      "显性四数组",
      "隐性数对",
      "隐性三数组",
      "隐性四数组",
    ],
  },
  {
    label: "进阶技巧",
    items: [
      "双线风筝",
      "摩天楼",
      "多宝鱼",
      "X-Wing",
      "XY-Wing",
      "XYZ-Wing",
      "剑鱼（Swordfish）",
      "W-Wing",
      "X-Chain",
      "XY-Chain",
      "鳄鱼（Finned X-Wing）",
      "Remote Pair",
      "同数区块链",
      "水母（Jellyfish）",
      "退化鱼（Sashimi X-Wing）",
    ],
  },
  {
    label: "高级技巧",
    items: [
      "唯一环",
      "唯一矩形",
      "连续环",
      "混合鱼（Franken X-Wing）",
      "孪生鱼（Siamese X-Wing）",
      "AIC",
      "变异鱼（Mutant X-Wing）",
      "鳄鱼剑鱼（Finned Swordfish）",
      "ALS-XZ",
      "鳄鱼水母（Finned Jellyfish）",
      "ALS-Chain",
    ],
  },
];

/** 所有技巧名扁平数组，用于表单 Select 选项。 */
export const TECHNIQUE_LIST: string[] = TECHNIQUE_GROUPS.flatMap(
  (g) => g.items
);

export const CHAIN_COLORS = [
  '#1677ff', '#52c41a', '#fa8c16', '#eb2f96',
  '#722ed1', '#13c2c2', '#f5222d', '#faad14',
];
