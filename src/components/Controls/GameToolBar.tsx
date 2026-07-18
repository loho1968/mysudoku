"use client";

/**
 * @file GameToolBar.tsx
 * @author loho
 *
 * 游戏工具栏。
 *
 * 功能：模式切换、撤销、笔记开关、差错检查、计时器、智能笔记、粘滞与笔记状态指示。
 */

import { Segmented, Button, Switch, Tag, App } from "antd";
import {
  UndoOutlined,
  BulbOutlined,
  AlertOutlined,
} from "@ant-design/icons";
import { useGame } from "@/contexts/GameContext";
import { GameTimer } from "@/components/Controls/GameTimer";
import { hasErrors } from "@/lib/sudoku/validator";
import type { InputMode } from "@/types/game";

/**
 * 游戏工具栏组件。
 */
export function GameToolBar() {
  const { message } = App.useApp();
  const { state, dispatch } = useGame();

  const handleCheckErrors = () => {
    const numberGrid = state.grid.map((row) =>
      row.map((cell) => cell.value ?? 0)
    );
    const hasErr = hasErrors(numberGrid);
    dispatch({ type: "CHECK_ERRORS" });
    if (hasErr) {
      message.warning("题目中存在错误");
    } else {
      message.success("没有发现错误");
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
          disabled={state.currentStepIndex < 0}
          onClick={() => dispatch({ type: "UNDO" })}
          block
        >
          撤销
        </Button>
        <Button icon={<BulbOutlined />} onClick={handleSmartNotes} block>
          智能笔记
        </Button>
        <Button icon={<AlertOutlined />} onClick={handleCheckErrors} block>
          差错检查
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
      </div>
    </div>
  );
}
