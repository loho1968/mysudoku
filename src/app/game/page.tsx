"use client";

/**
 * @file game/page.tsx
 * @author loho
 *
 * 游戏主页面。
 *
 * 逻辑顺序：
 * 1. 有存档 + 对应题目数据 → 自动恢复（无弹窗）
 * 2. 无存档但 URL 携带 ?picked=难度 → 随机出题
 * 3. 无存档 / 无参数 → 显示难度选择引导界面
 *
 * 此页面不再加载硬编码缺省题目。
 */

import { useEffect, useState } from "react";
import { Typography, Card, Spin } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { SudokuGrid } from "@/components/SudokuGrid/SudokuGrid";
import { NumberPad } from "@/components/Controls/NumberPad";
import { GameToolBar } from "@/components/Controls/GameToolBar";
import { useKeyboard } from "@/hooks/useKeyboard";
import {
  useLocalProgress,
  getSavedProgress,
  getLastPuzzle,
  saveLastPuzzle,
  markPlayed,
} from "@/hooks/useLocalProgress";
import { DIFFICULTY_OPTIONS, PLAYED_SET_KEY } from "@/config/constants";

const { Title, Text } = Typography;

// ─── Types ────────────────────────────────────────────────────────

interface PuzzleData {
  id: string;
  puzzle: string;
  solution?: string | null;
}

// ─── Utilities ────────────────────────────────────────────────────

/** 读 localStorage 已做过集合，返回逗号分隔字符串。 */
function getExcludeIds(): string {
  try {
    const raw = localStorage.getItem(PLAYED_SET_KEY);
    if (!raw) return "";
    return (JSON.parse(raw) as string[]).join(",");
  } catch {
    return "";
  }
}

/** 调随机出题 API。 */
async function fetchRandomPuzzle(difficulty: number): Promise<PuzzleData | null> {
  const exclude = getExcludeIds();
  const url = `/api/puzzles/random?difficulty=${difficulty}${
    exclude ? `&exclude=${encodeURIComponent(exclude)}` : ""
  }`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (json.success) return json.data;
  } catch {
    // 静默失败，返回 null
  }
  return null;
}

// ─── DifficultyPicker ─────────────────────────────────────────────

/**
 * 无存档/未选择难度时显示的引导界面。
 * onPick 回调触发后父组件切换渲染 GameContent。
 */
function DifficultyPicker({
  onPick,
}: {
  onPick: (data: PuzzleData) => void;
}) {
  const [loadingDiff, setLoadingDiff] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePick = async (value: number) => {
    setLoadingDiff(value);
    setErrorMsg(null);
    const data = await fetchRandomPuzzle(value);
    if (data) {
      onPick(data);
    } else {
      setErrorMsg("该难度暂无题目，请先通过题库维护页面添加。");
    }
    setLoadingDiff(null);
  };

  return (
    <div className="difficulty-picker">
      <Title level={2} style={{ textAlign: "center", marginBottom: 8 }}>
        选择难度开始
      </Title>
      <Text
        type="secondary"
        style={{ display: "block", textAlign: "center", marginBottom: 32 }}
      >
        随机选取一道适合你水平的数独题
      </Text>
      <div className="difficulty-picker-cards">
        {DIFFICULTY_OPTIONS.map((opt) => (
          <Card
            key={opt.value}
            hoverable
            className="difficulty-card"
            onClick={() => handlePick(opt.value)}
          >
            <div className="difficulty-card-inner">
              <PlayCircleOutlined
                style={{ fontSize: 36, color: "var(--cell-selected-ring)" }}
              />
              <Title level={4} style={{ marginTop: 12, marginBottom: 0 }}>
                {opt.label}
              </Title>
            </div>
          </Card>
        ))}
      </div>
      {errorMsg && (
        <Text
          type="danger"
          style={{ display: "block", textAlign: "center", marginTop: 16 }}
        >
          {errorMsg}
        </Text>
      )}
      {loadingDiff !== null && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Spin />
        </div>
      )}
    </div>
  );
}

// ─── GameContent ──────────────────────────────────────────────────

function GameContent({ puzzle }: { puzzle: PuzzleData }) {
  const { state, dispatch } = useGame();
  const { restore } = useLocalProgress();
  useKeyboard();

  // LOAD_PUZZLE
  useEffect(() => {
    dispatch({
      type: "LOAD_PUZZLE",
      puzzleId: puzzle.id,
      puzzle: puzzle.puzzle,
      solution: puzzle.solution ?? undefined,
    });
    saveLastPuzzle(puzzle.id, puzzle.puzzle, puzzle.solution);
  }, [puzzle, dispatch]);

  // 自动恢复进度（匹配时直接恢复，无弹窗）
  useEffect(() => {
    if (state.puzzleId) restore();
  }, [state.puzzleId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 完成时标记已做过
  useEffect(() => {
    if (state.isCompleted && state.puzzleId) {
      markPlayed(state.puzzleId);
    }
  }, [state.isCompleted, state.puzzleId]);

  return (
    <div className="game-layout">
      <div className="game-layout-board">
        <SudokuGrid />
      </div>
      <aside className="game-layout-panel">
        <GameToolBar />
        <NumberPad />
      </aside>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────

/**
 * 游戏首页。
 *
 * 逻辑顺序（仅在客户端首次渲染时执行）：
 * 1. 有存档 + 有最后题目记录 → 自动加载并恢复
 * 2. URL 含 ?picked=难度 → 随机出题后加载
 * 3. 均无 → 显示难度选择引导
 */
export default function GamePage() {
  const [puzzleData, setPuzzleData] = useState<PuzzleData | null | "loading">(
    "loading"
  );

  useEffect(() => {
    // ── 尝试自动恢复 ──
    const saved = getSavedProgress();
    if (saved) {
      const last = getLastPuzzle();
      if (last && last.puzzleId === saved.puzzleId) {
        setPuzzleData({
          id: last.puzzleId,
          puzzle: last.puzzle,
          solution: last.solution ?? undefined,
        });
        return;
      }
    }

    // ── URL 携带 ?picked=难度（从导航栏"选择题目"跳来） ──
    const params = new URLSearchParams(window.location.search);
    const picked = params.get("picked");
    if (picked) {
      const diff = parseInt(picked, 10);
      if (!isNaN(diff) && diff >= 1 && diff <= 3) {
        // 异步获取后再设置
        (async () => {
          const data = await fetchRandomPuzzle(diff);
          if (data) {
            setPuzzleData(data);
          } else {
            setPuzzleData(null);
          }
        })();
        return;
      }
    }

    // ── 无存档、无参数 → 显示引导界面 ──
    setPuzzleData(null);
  }, []);

  if (puzzleData === "loading") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: 120,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (puzzleData === null) {
    return <DifficultyPicker onPick={setPuzzleData} />;
  }

  return (
    <GameProvider>
      <GameContent puzzle={puzzleData} />
    </GameProvider>
  );
}
