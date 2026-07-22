"use client";

/**
 * @file GameToolBar.tsx
 * @author loho
 *
 * 游戏工具栏（精简版）。
 *
 * 单行布局：粘贴 / 撤销 / 橡皮擦 / 提交 / 笔记开关
 * - 粘贴、撤销、橡皮擦：纯图标按钮（外部传入 onPaste）
 * - 智能笔记：固定开启，不再有切换按钮
 * - 笔记按钮：toggle 候选数显示开关
 *
 * 桌面端：闪烁提示 + message
 * 移动端：闪烁 + 震动 + 禁止输入（由 useGame/useKeyboard 处理）
 */

import { Button, Switch, App, Typography } from "antd";
import {
  UndoOutlined,
  CheckCircleOutlined,
  SnippetsOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useGame } from "@/contexts/GameContext";
import { GameTimer } from "@/components/Controls/GameTimer";
import { hasErrors } from "@/lib/sudoku/validator";
import type { SubmitSuccessHandler } from "@/hooks/useKeyboard";

const { Text } = Typography;

interface GameToolBarProps {
  /** 提交成功回调：通知父组件调 records API 并展示庆祝提示。 */
  onSubmitSuccess?: SubmitSuccessHandler;
  /** 当前练习的技巧名（从技巧选择器传入）。null 或空则不显示。 */
  currentTechnique?: string | null;
  /** 粘贴按钮回调（由父组件 game page 提供，处理剪贴板读取）。 */
  onPaste?: () => void;
}

/**
 * 游戏工具栏组件。
 */
export function GameToolBar({
  onSubmitSuccess,
  currentTechnique,
  onPaste,
}: GameToolBarProps) {
  const { message } = App.useApp();
  const { state, dispatch } = useGame();

  const handleSubmit = () => {
    if (state.isSubmitted) {
      message.info("本题已完成");
      return;
    }
    const allFilled = state.grid.every((row) =>
      row.every((cell) => cell.value !== null)
    );
    if (!allFilled) {
      message.warning("棋盘未填满，无法提交");
      return;
    }
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

  return (
    <div className="game-toolbar">
      {/* 计时器 + 技巧名 */}
      <div className="toolbar-timer-row">
        <GameTimer />
        {currentTechnique && (
          <Text
            strong
            style={{
              fontSize: 15,
              marginInlineStart: 8,
              verticalAlign: "middle",
            }}
          >
            {currentTechnique}
          </Text>
        )}
      </div>

      {/* 单行操作栏 */}
      <div className="toolbar-actions-row">
        {onPaste && (
          <Button
            icon={<SnippetsOutlined />}
            onClick={onPaste}
            title="粘贴题目"
          />
        )}
        <Button
          icon={<UndoOutlined />}
          disabled={state.currentStepIndex < 0 || state.isSubmitted}
          onClick={() => dispatch({ type: "UNDO" })}
          title="撤销"
        />
        <Button
          icon={<DeleteOutlined />}
          disabled={state.isSubmitted}
          onClick={() => {
            for (const [r, c] of state.selectedCells) {
              dispatch({ type: "SET_CELL_VALUE", row: r, col: c, value: null });
            }
          }}
          title="橡皮擦"
        />
        <Button
          icon={<CheckCircleOutlined />}
          onClick={handleSubmit}
          disabled={state.isSubmitted}
          title="提交"
        >
          {state.isSubmitted ? "已完成" : "提交"}
        </Button>
        <div className="toolbar-notes-toggle" title="显示候选数">
          <Switch
            checkedChildren="笔记"
            unCheckedChildren="笔记"
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
          <Text type="secondary" style={{ fontSize: 12 }}>
            智能笔记
          </Text>
        )}
        {state.isStickyMode && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            粘滞: {state.stickyNumber}
          </Text>
        )}
        {state.isSubmitted && (
          <Text type="success" style={{ fontSize: 12 }}>
            已完成
          </Text>
        )}
      </div>
    </div>
  );
}
