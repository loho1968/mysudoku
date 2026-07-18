"use client";

/**
 * @file game/[id]/page.tsx
 * @author loho
 *
 * 加载指定题目的游戏页面。
 * 从 API 获取题目后，通过 GameProvider 初始化棋盘。
 */

import { useParams } from "next/navigation";
import { Card, Spin, Typography, Button } from "antd";
import { useEffect, useState, useCallback } from "react";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { SudokuGrid } from "@/components/SudokuGrid/SudokuGrid";
import { NumberPad } from "@/components/Controls/NumberPad";
import { GameToolBar } from "@/components/Controls/GameToolBar";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useLocalProgress, markPlayed, saveLastPuzzle } from "@/hooks/useLocalProgress";
import type { GameAction } from "@/types/game";

const { Title } = Typography;

interface PuzzleData {
  id: string;
  puzzle: string;
  solution?: string;
  difficulty: number;
}

/**
 * 内部游戏界面（需在 GameProvider 内）。
 */
function GameContent({ puzzle }: { puzzle: PuzzleData }) {
  const { state, dispatch } = useGame();
  const { restore } = useLocalProgress();

  useKeyboard();

  useEffect(() => {
    dispatch({
      type: "LOAD_PUZZLE",
      puzzleId: puzzle.id,
      puzzle: puzzle.puzzle,
      solution: puzzle.solution,
    } as GameAction);
    saveLastPuzzle(puzzle.id, puzzle.puzzle, puzzle.solution);
  }, [puzzle, dispatch]);

  useEffect(() => {
    if (state.puzzleId) restore();
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [state.puzzleId]);

  // 完成时标记已做过
  useEffect(() => {
    if (state.isCompleted && state.puzzleId) {
      markPlayed(state.puzzleId);
    }
  }, [state.isCompleted, state.puzzleId]);

  return (
    <div
      style={{
        padding: 24,
        width: "100%",
        maxWidth: "min(90vw, 700px)",
        margin: "0 auto",
        height: "100%",
      }}
    >
      <Card
        styles={{
          body: {
            display: "flex",
            flexDirection: "column",
            height: "100%",
            alignItems: "center",
          },
        }}
      >
        <Title level={3} style={{ textAlign: "center", marginBottom: 8 }}>
          数独
        </Title>
        <GameToolBar />
        <div
          style={{
            flex: 1,
            minHeight: 0,
            width: "100%",
            margin: "8px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SudokuGrid />
        </div>
        <NumberPad />
      </Card>
    </div>
  );
}

/**
 * 指定题目的游戏入口。
 */
export default function GameWithPuzzlePage() {
  const params = useParams();
  const id = params.id as string;
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPuzzle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/puzzles/${id}`);
      const data = await res.json();
      if (data.success) {
        setPuzzle(data.data);
      } else {
        setError("题目不存在");
      }
    } catch {
      setError("加载失败");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPuzzle();
  }, [loadPuzzle]);

  if (loading) {
    return (
      <div
        style={{
          padding: 24,
          maxWidth: 800,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <Spin size="large" style={{ paddingTop: 80 }} />
      </div>
    );
  }

  if (error || !puzzle) {
    return (
      <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
        <Card>
          <div style={{ textAlign: "center", padding: 40 }}>
            <Title level={4}>{error}</Title>
            <Button
              type="primary"
              onClick={() => (window.location.href = "/game")}
            >
              返回游戏
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <GameProvider>
      <GameContent puzzle={puzzle} />
    </GameProvider>
  );
}
