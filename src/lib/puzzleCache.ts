/**
 * @file puzzleCache.ts
 * @author loho
 *
 * 题库本地缓存（localStorage）。
 *
 * 用途：离线访问时，游戏页能加载曾经在线浏览过的题目。
 * - CacheWarmer 在应用启动时静默拉取 `/api/puzzles/all`，全量写入缓存
 * - game/page.tsx 在 `/api/puzzles/{id}` 失败时回退到 `getCachedPuzzleById`
 *
 * 容量评估：localStorage 5MB 上限；单题约 200B（含 solution），5000 题约 1MB。
 */

import { PUZZLES_CACHE_KEY } from "@/config/constants";

/** 单条缓存条目。 */
export interface PuzzleCacheEntry {
  id: string;
  puzzle: string;
  solution: string | null;
  difficulty: number;
  seq: number | null;
}

/** 持久化结构。 */
interface CacheShape {
  puzzles: PuzzleCacheEntry[];
  updatedAt: number;
}

/**
 * 从 localStorage 读取题库缓存。
 * @returns 题目数组；无缓存或格式异常时返回空数组。
 */
export function readPuzzleCache(): PuzzleCacheEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PUZZLES_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<CacheShape>;
    if (!Array.isArray(parsed.puzzles)) return [];
    return parsed.puzzles as PuzzleCacheEntry[];
  } catch {
    // 旧数据格式不兼容、JSON 解析失败 → 视为空缓存
    return [];
  }
}

/**
 * 写入题库缓存（去重 + 按 seq 排序）。
 * @param puzzles - 待缓存题目数组。
 */
export function writePuzzleCache(puzzles: PuzzleCacheEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    // 按 id 去重
    const map = new Map<string, PuzzleCacheEntry>();
    for (const p of puzzles) {
      if (p && p.id && p.puzzle) map.set(p.id, p);
    }
    const list = Array.from(map.values()).sort((a, b) => {
      const sa = a.seq ?? Number.MAX_SAFE_INTEGER;
      const sb = b.seq ?? Number.MAX_SAFE_INTEGER;
      return sa - sb;
    });
    const payload: CacheShape = { puzzles: list, updatedAt: Date.now() };
    window.localStorage.setItem(PUZZLES_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // 容量超限 / 隐私模式等：静默失败
  }
}

/**
 * 按 id 从缓存中读取单题。
 * @param id - 题目 id。
 * @returns 题目数据；无则 null。
 */
export function getCachedPuzzleById(id: string): PuzzleCacheEntry | null {
  const cache = readPuzzleCache();
  return cache.find((p) => p.id === id) ?? null;
}

/**
 * 读取缓存最后更新时间戳。
 * @returns 时间戳（ms）；无缓存返回 0。
 */
export function getPuzzleCacheUpdatedAt(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(PUZZLES_CACHE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as Partial<CacheShape>;
    return parsed.updatedAt ?? 0;
  } catch {
    return 0;
  }
}
