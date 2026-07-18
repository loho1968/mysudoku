"use client";

/**
 * @file usePlayedPuzzles.ts
 * @author loho
 *
 * 做过题目集合管理 hook。
 * 用 localStorage 存储 PLAYED_SET_KEY（JSON 格式的 id 数组）。
 * 纯前端标记，不跨设备同步。
 */

import { useCallback, useState } from "react";
import { PLAYED_SET_KEY } from "@/config/constants";

/**
 * 读本地存储的做过题目集合。
 */
function getPlayedSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(PLAYED_SET_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

/**
 * 写本地存储的做过题目集合。
 */
function savePlayedSet(ids: Set<string>): void {
  try {
    localStorage.setItem(PLAYED_SET_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // localStorage 满等异常静默忽略
  }
}

/**
 * 做过题目集合管理 hook。
 * 提供 markPlayed、isPlayed、refresh 三个操作。
 *
 * markPlayed 添加 id 后立即持久化并更新当前状态，
 * 使同页面的 PuzzleTable 等组件能实时反映"已做过"。
 */
export function usePlayedPuzzles() {
  const [played, setPlayed] = useState<Set<string>>(getPlayedSet);

  const refresh = useCallback(() => {
    setPlayed(getPlayedSet());
  }, []);

  /** 标记某道题已做过。 */
  const markPlayed = useCallback((id: string) => {
    const next = new Set(getPlayedSet());
    next.add(id);
    savePlayedSet(next);
    setPlayed(next);
  }, []);

  /** 检查某道题是否做过。 */
  const isPlayed = useCallback(
    (id: string) => played.has(id),
    [played]
  );

  return { played, markPlayed, isPlayed, refresh };
}
