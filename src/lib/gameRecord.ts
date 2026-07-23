"use client";

/**
 * @file gameRecord.ts
 * @author loho
 *
 * 提交成功后的记录写入工具。
 *
 * 首次提交（localStorage 已做过集合未含此题）时：
 * - markPlayed 写入 PLAYED_SET_KEY
 * - POST /api/puzzles/{id}/records 持久化做题记录
 *
 * 非首次提交：仅 markPlayed，不重复写库。
 */

import { PLAYED_SET_KEY } from "@/config/constants";
import { api } from "@/config/runtime";

/**
 * 读 localStorage 已做过集合。
 * @returns 已做过题目 id 集合。
 */
function readPlayedSet(): Set<string> {
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
 * 写 localStorage 已做过集合。
 * @param ids - 集合。
 */
function writePlayedSet(ids: Set<string>): void {
  try {
    localStorage.setItem(PLAYED_SET_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // localStorage 满等异常静默忽略
  }
}

/**
 * 将秒数格式化为 `M分SS秒` 或 `HH时MM分SS秒`。
 * @param totalSeconds - 总秒数。
 * @returns 易读的中文时长。
 */
export function formatElapsed(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0) {
    return `${hours}时${String(minutes).padStart(2, "0")}分${String(seconds).padStart(2, "0")}秒`;
  }
  return `${minutes}分${String(seconds).padStart(2, "0")}秒`;
}

/**
 * 提交成功后处理：首次提交写库，所有提交都更新本地已做过集合。
 *
 * @param puzzleId - 题目 id。
 * @param elapsedSeconds - 用时（秒）。
 * @returns 是否为首次提交（即是否调用了 records API）。
 */
export async function submitPuzzleRecord(
  puzzleId: string,
  elapsedSeconds: number
): Promise<boolean> {
  // 先读当前已做过集合，判断是否首次提交
  const played = readPlayedSet();
  const isFirstTime = !played.has(puzzleId);

  // 更新本地已做过集合
  played.add(puzzleId);
  writePlayedSet(played);

  // 仅首次提交写库，避免重复记录
  if (!isFirstTime) {
    return false;
  }

  try {
    await fetch(api(`/api/puzzles/${puzzleId}/records`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        time_seconds: elapsedSeconds,
        completed: true,
        check_errors: 1,
      }),
    });
  } catch {
    // 网络失败静默忽略；本地已标记 markPlayed，下次同一题不会重复写
  }
  return true;
}
