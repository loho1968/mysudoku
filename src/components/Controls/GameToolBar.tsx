"use client";

/**
 * @file GameToolBar.tsx
 * @author loho
 *
 * 游戏工具栏。
 *
 * 功能：模式切换、撤销、笔记开关、差错检查、计时器、智能笔记、粘滞与笔记状态指示。
 */

import { Segmented, Button, Switch, Space, Tag, App } from "antd";
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
    dispatch({ type: "SMART_NOTES" });
    message.info("智能笔记已更新");
  };

  return (
    <div className="game-toolbar">
      <Space size="middle" wrap>
        {/* 答题 / 笔记模式切换 */}
        <Segmented<InputMode>
          options={[
            { value: "answer", label: "答题" },
            { value: "note", label: "笔记" },
          ]}
          value={state.inputMode}
          onChange={(value) =>
            dispatch({ type: "SET_INPUT_MODE", mode: value })
          }
        />

        {/* 撤销 */}
        <Button
          icon={<UndoOutlined />}
          disabled={state.currentStepIndex < 0}
          onClick={() => dispatch({ type: "UNDO" })}
        >
          撤销
        </Button>

        {/* 笔记显示开关 */}
        <span>
          <Switch
            checkedChildren="笔记开"
            unCheckedChildren="笔记关"
            checked={state.showNotes}
            onChange={(checked) =>
              dispatch({ type: "SET_SHOW_NOTES", show: checked })
            }
            size="small"
          />
        </span>

        {/* 智能笔记 */}
        <Button icon={<BulbOutlined />} onClick={handleSmartNotes}>
          智能笔记
        </Button>

        {/* 笔记类型 + 过期状态 */}
        {state.noteType === "smart" && !state.smartNotesExpired && (
          <Tag color="purple">智能笔记</Tag>
        )}
        {state.noteType === "smart" && state.smartNotesExpired && (
          <Tag color="warning" style={{ borderColor: "#faad14", color: "#ad8b00" }}>
            智能笔记过期
          </Tag>
        )}
        {state.noteType === "normal" && (
          <Tag>普通笔记</Tag>
        )}

        {/* 差错检查 */}
        <Button icon={<AlertOutlined />} onClick={handleCheckErrors}>
          差错检查
        </Button>

        {/* 计时器 */}
        <GameTimer />

        {/* 粘滞模式指示 */}
        {state.isStickyMode && (
          <Tag color="blue">粘滞: {state.stickyNumber}</Tag>
        )}
      </Space>
    </div>
  );
}
