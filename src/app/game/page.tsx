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

import { useEffect, useState, useCallback } from "react";
import {
  Typography, Card, Spin, App, Modal, Input, Select, Button, Space,
} from "antd";
import { PlayCircleOutlined, SnippetsOutlined, SaveOutlined } from "@ant-design/icons";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { SudokuGrid } from "@/components/SudokuGrid/SudokuGrid";
import { NumberPad } from "@/components/Controls/NumberPad";
import { GameToolBar } from "@/components/Controls/GameToolBar";
import { useKeyboard, type SubmitSuccessHandler } from "@/hooks/useKeyboard";
import { useEditMode, apiFetch } from "@/hooks/useEditMode";
import { EditModeModal } from "@/components/Auth/EditModeModal";
import { submitPuzzleRecord, formatElapsed } from "@/lib/gameRecord";
import { v4 as generateId } from "uuid";
import {
  useLocalProgress,
  getSavedProgress,
  getLastPuzzle,
  saveLastPuzzle,
  markPlayed,
} from "@/hooks/useLocalProgress";
import { DIFFICULTY_LABELS, DIFFICULTY_OPTIONS, TECHNIQUE_LIST, PLAYED_SET_KEY } from "@/config/constants";

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
  const { modal, message } = App.useApp();
  const {
    isEditMode,
    showPasswordModal,
    setShowPasswordModal,
    verifyPassword,
  } = useEditMode();

  // 粘贴相关状态
  const [isPasted, setIsPasted] = useState(false);
  const [puzzleSaved, setPuzzleSaved] = useState(false);
  const [pastedPuzzleStr, setPastedPuzzleStr] = useState<string>("");

  // 保存弹窗状态
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveDifficulty, setSaveDifficulty] = useState<number>(1);
  const [saveRemark, setSaveRemark] = useState("");
  const [saveTechniques, setSaveTechniques] = useState<string[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);

  // 提交成功：写记录 + 弹庆祝提示
  const handleSubmitSuccess = useCallback<SubmitSuccessHandler>(
    async (puzzleId, elapsedSeconds) => {
      await submitPuzzleRecord(puzzleId, elapsedSeconds);
      modal.success({
        title: "恭喜完成！",
        content: `用时 ${formatElapsed(elapsedSeconds)}`,
        okText: "好的",
      });
    },
    [modal]
  );

  useKeyboard(handleSubmitSuccess);

  // 粘贴处理
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = text.replace(/\s/g, "");
      if (!/^[0-9.]{81}$/.test(cleaned)) {
        message.warning("剪贴板内容不是有效的数独题目（需要 81 个字符，0-9 或 .）");
        return;
      }
      const normalized = cleaned.replace(/\./g, "0");
      // 避免重复粘贴同一题
      if (normalized === pastedPuzzleStr) {
        message.info("已载入此题目");
        return;
      }
      const newId = generateId();
      // 通过 dispatch 直接加载新题（不改变父级 puzzleData，避免 GameContent 重挂载）
      dispatch({
        type: "LOAD_PUZZLE",
        puzzleId: newId,
        puzzle: normalized,
      });
      setPastedPuzzleStr(normalized);
      setIsPasted(true);
      setPuzzleSaved(false);
      message.success("已从剪贴板加载题目");
    } catch (err) {
      message.error(
        `读取剪贴板失败：${err instanceof Error ? err.message : "未知错误"}`
      );
    }
  }, [dispatch, pastedPuzzleStr, message]);

  // 保存按钮点击
  const handleSaveClick = useCallback(() => {
    if (!isEditMode) {
      setShowPasswordModal(true);
    } else {
      setShowSaveForm(true);
    }
  }, [isEditMode, setShowPasswordModal]);

  // 密码验证成功后的回调
  const handlePasswordSuccess = useCallback(
    async (password: string) => {
      sessionStorage.setItem("edit_password", password);
      const ok = await verifyPassword(password);
      if (ok) {
        setShowSaveForm(true);
      }
    },
    [verifyPassword]
  );

  // 执行保存
  const handleSaveSubmit = useCallback(async () => {
    if (!pastedPuzzleStr) return;
    setSaveLoading(true);
    try {
      const res = await apiFetch("/api/puzzles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puzzle: pastedPuzzleStr,
          solution: null,
          difficulty: saveDifficulty,
          remark: saveRemark || null,
          techniqueNames: saveTechniques,
        }),
      });
      const data = await res.json();
      if (data.success) {
        message.success("题目已保存到题库");
        setPuzzleSaved(true);
        setShowSaveForm(false);
      } else {
        message.error(data.error || "保存失败");
      }
    } catch {
      message.error("保存失败");
    } finally {
      setSaveLoading(false);
    }
  }, [pastedPuzzleStr, saveDifficulty, saveRemark, saveTechniques, message]);

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

  // 完成时标记已做过（兼容键盘提交等路径）
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
        {/* 顶部工具条：粘贴 + 保存 */}
        <div className="game-panel-tools">
          <Space.Compact block>
            <Button
              icon={<SnippetsOutlined />}
              onClick={handlePaste}
              block
            >
              粘贴
            </Button>
            {isPasted && !puzzleSaved && (
              <Button
                icon={<SaveOutlined />}
                onClick={handleSaveClick}
                block
              >
                保存题目
              </Button>
            )}
          </Space.Compact>
        </div>

        <GameToolBar onSubmitSuccess={handleSubmitSuccess} />
        <NumberPad />
      </aside>

      {/* 密码弹窗 */}
      {isPasted && !puzzleSaved && (
        <EditModeModal
          open={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={handlePasswordSuccess}
        />
      )}

      {/* 保存信息填写弹窗 */}
      <Modal
        title="保存题目到题库"
        open={showSaveForm}
        onCancel={() => setShowSaveForm(false)}
        onOk={handleSaveSubmit}
        confirmLoading={saveLoading}
        okText="保存"
        width={480}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div>
            <Text type="secondary">题目（81 字符）</Text>
            <Input.TextArea
              value={pastedPuzzleStr}
              disabled
              rows={3}
              style={{ fontFamily: "monospace", fontSize: 12, marginTop: 4 }}
            />
          </div>
          <div>
            <Text type="secondary">难度</Text>
            <Select
              value={saveDifficulty}
              onChange={setSaveDifficulty}
              style={{ width: "100%", marginTop: 4 }}
              options={Object.entries(DIFFICULTY_LABELS).map(([k, v]) => ({
                value: parseInt(k),
                label: v,
              }))}
            />
          </div>
          <div>
            <Text type="secondary">备注（可选）</Text>
            <Input.TextArea
              value={saveRemark}
              onChange={(e) => setSaveRemark(e.target.value)}
              rows={2}
              placeholder="备注..."
              style={{ marginTop: 4 }}
            />
          </div>
          <div>
            <Text type="secondary">涉及技巧（可选）</Text>
            <Select
              mode="multiple"
              value={saveTechniques}
              onChange={setSaveTechniques}
              style={{ width: "100%", marginTop: 4 }}
              placeholder="选择涉及技巧"
              options={TECHNIQUE_LIST.map((t) => ({
                value: t,
                label: t,
              }))}
            />
          </div>
        </Space>
      </Modal>
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
