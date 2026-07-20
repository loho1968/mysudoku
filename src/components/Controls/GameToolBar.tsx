"use client";

/**
 * @file GameToolBar.tsx
 * @author loho
 *
 * 游戏工具栏。
 *
 * 功能：模式切换、撤销、笔记开关、提交、计时器、智能笔记、粘滞与笔记状态指示。
 */

import { Segmented, Button, Switch, Tag, App } from "antd";
import {
  UndoOutlined,
  BulbOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useGame } from "@/contexts/GameContext";
import { GameTimer } from "@/components/Controls/GameTimer";
import { hasErrors } from "@/lib/sudoku/validator";
import type { InputMode } from "@/types/game";
import type { SubmitSuccessHandler } from "@/hooks/useKeyboard";

interface GameToolBarProps {
  /** 提交成功回调：通知父组件调 records API 并展示庆祝提示。 */
  onSubmitSuccess?: SubmitSuccessHandler;
}

/**
 * 游戏工具栏组件。
 */
export function GameToolBar({ onSubmitSuccess }: GameToolBarProps) {
  const { message } = App.useApp();
  const { state, dispatch } = useGame();

  const handleSubmit = () => {
    // 已提交过 → 直接提示，不重复处理
    if (state.isSubmitted) {
      message.info("本题已完成");
      return;
    }
    // 未填满 → 禁止提交
    const allFilled = state.grid.every((row) =>
      row.every((cell) => cell.value !== null)
    );
    if (!allFilled) {
      message.warning("棋盘未填满，无法提交");
      return;
    }
    // 校验错误：有错 → 仅提示；无错 → 视为完成
    const numberGrid = state.grid.map((row) =>
      row.map((cell) => cell.value ?? 0)
    );
    const hasErr = hasErrors(numberGrid);
    dispatch({ type: "SUBMIT_PUZZLE" });
    if (hasErr) {
      message.error("题目存在错误，提交失败");
      return;
    }
    message.success("提交成功，题目已完成！");
    if (state.puzzleId) {
      onSubmitSuccess?.(state.puzzleId, state.elapsedSeconds);
    }
  };

  const handleSmartNotes = () => {
    // 智能笔记按钮：计算候选数并自动打开显示开关
    if (!state.showNotes) {
      dispatch({ type: "SET_SHOW_NOTES", show: true });
    }
    dispatch({ type: "SMART_NOTES" });
  };

  return (
    <div className="game-toolbar">
      {/* 顶部：计时器 */}
      <div className="toolbar-timer-row">
        <GameTimer />
      </div>

      {/* 模式切换：答题 / 笔记 */}
      <Segmented<InputMode>
        block
        size="large"
        options={[
          { value: "answer", label: "答题" },
          { value: "note", label: "笔记" },
        ]}
        value={state.inputMode}
        onChange={(value) => dispatch({ type: "SET_INPUT_MODE", mode: value })}
      />

      {/* 功能按钮 2x2 网格 */}
      <div className="toolbar-actions">
        <Button
          icon={<UndoOutlined />}
          disabled={state.currentStepIndex < 0 || state.isSubmitted}
          onClick={() => dispatch({ type: "UNDO" })}
          block
        >
          撤销
        </Button>
        <Button
          icon={<BulbOutlined />}
          onClick={handleSmartNotes}
          disabled={state.isSubmitted}
          block
        >
          智能笔记
        </Button>
        <Button
          icon={<CheckCircleOutlined />}
          onClick={handleSubmit}
          disabled={state.isSubmitted}
          block
        >
          {state.isSubmitted ? "已完成" : "提交"}
        </Button>
        <div className="toolbar-notes-toggle">
          <Switch
            checkedChildren="笔记开"
            unCheckedChildren="笔记关"
            checked={state.showNotes}
            onChange={(checked) =>
              dispatch({ type: "SET_SHOW_NOTES", show: checked })
            }
          />
        </div>
      </div>

      {/* 状态标签 */}
      <div className="toolbar-tags">
        {state.noteType === "smart" && !state.smartNotesExpired && (
          <Tag color="purple">智能笔记</Tag>
        )}
        {state.noteType === "smart" && state.smartNotesExpired && (
          <Tag color="warning" style={{ borderColor: "#faad14", color: "#ad8b00" }}>
            智能笔记过期
          </Tag>
        )}
        {state.noteType === "normal" && <Tag>普通笔记</Tag>}
        {state.isStickyMode && (
          <Tag color="blue">粘滞: {state.stickyNumber}</Tag>
        )}
        {state.isSubmitted && <Tag color="success">已完成</Tag>}
      </div>
    </div>
  );
}
