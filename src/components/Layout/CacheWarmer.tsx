"use client";

/**
 * @file CacheWarmer.tsx
 * @author loho
 *
 * 题库缓存预热组件。
 *
 * 应用启动时静默拉取 `/api/puzzles/all` 全量写入本地缓存，
 * 供离线访问使用。失败时保留旧缓存不动。
 *
 * 不渲染任何 UI；挂在 AppShell 内。
 */

import { useEffect } from "react";
import { writePuzzleCache, type PuzzleCacheEntry } from "@/lib/puzzleCache";
import { api } from "@/config/runtime";

/**
 * 题库缓存预热组件（无 UI）。
 */
export function CacheWarmer() {
  useEffect(() => {
    let cancelled = false;
    fetch(api("/api/puzzles/all"))
      .then((res) => res.json())
      .then((data: { success?: boolean; data?: { puzzles: PuzzleCacheEntry[] } }) => {
        if (cancelled) return;
        if (data.success && data.data && Array.isArray(data.data.puzzles)) {
          writePuzzleCache(data.data.puzzles);
        }
      })
      .catch(() => {
        // 离线/网络错误：保留旧缓存，静默失败
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
