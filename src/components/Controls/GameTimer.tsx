"use client";

/**
 * @file GameTimer.tsx
 * @author loho
 *
 * 游戏计时器组件。
 * 显示已用时间（MM:SS），提供开始/暂停/重置控制。
 * 计时 tick 由 useEffect + setInterval 驱动。
 */

import { useEffect } from "react";
import { Button, Space, Typography } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { useGame } from "@/contexts/GameContext";

const { Text } = Typography;

/**
 * 格式化秒数为 MM:SS。
 * @param seconds - 总秒数。
 * @returns 格式化字符串。
 */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * 游戏计时器组件。
 */
export function GameTimer() {
  const { state, dispatch } = useGame();

  // 定时器 tick
  useEffect(() => {
    if (!state.timerRunning) return;
    const interval = setInterval(() => {
      dispatch({ type: "TICK_TIMER" });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.timerRunning, dispatch]);

  return (
    <Space size="small">
      <ClockCircleOutlined />
      <Text strong>{formatTime(state.elapsedSeconds)}</Text>
      <Button
        size="small"
        onClick={() => dispatch({ type: "TOGGLE_TIMER" })}
      >
        {state.timerRunning ? "暂停" : "开始"}
      </Button>
      <Button size="small" onClick={() => dispatch({ type: "RESET_TIMER" })}>
        重置
      </Button>
    </Space>
  );
}
