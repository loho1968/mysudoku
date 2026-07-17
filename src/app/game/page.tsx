"use client";

/**
 * @file game/page.tsx
 * @author loho
 *
 * 游戏主页面。
 * 自动加载默认题目（硬编码），供快速试玩。
 * 若无默认题目或需选择特定题目，前往题目管理。
 */

import { useEffect } from "react";
import { Card, Typography } from "antd";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { SudokuGrid } from "@/components/SudokuGrid/SudokuGrid";
import { NumberPad } from "@/components/Controls/NumberPad";
import { GameToolBar } from "@/components/Controls/GameToolBar";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useLocalProgress } from "@/hooks/useLocalProgress";

const { Title } = Typography;

/** 缺省题目（硬编码） */
const DEFAULT_PUZZLE =
  "821000400500000000000320861053260004240530086010047203000800300092000600000410500";

/** 缺省题目 ID 标记（非数据库 ID） */
const DEFAULT_PUZZLE_ID = "__default__";

/**
 * 游戏界面主体（需在 GameProvider 内）。
 */
function GameContent() {
  const { state, dispatch } = useGame();
  const { restore } = useLocalProgress();

  useKeyboard();

  useEffect(() => {
    dispatch({
      type: "LOAD_PUZZLE",
      puzzleId: DEFAULT_PUZZLE_ID,
      puzzle: DEFAULT_PUZZLE,
    });
  }, [dispatch]);

  // 加载后检测是否有存档可恢复
  useEffect(() => {
    if (state.puzzleId) restore();
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [state.puzzleId]);

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
          mySudoku
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
 * 游戏首页。
 */
export default function GamePage() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
