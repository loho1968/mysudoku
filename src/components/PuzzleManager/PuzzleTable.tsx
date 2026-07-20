"use client";

/**
 * @file PuzzleTable.tsx
 * @author loho
 *
 * 题目列表表格。
 * 支持分页、搜索、难度筛选、编辑/删除操作。
 *
 * 支持 readOnly 属性：只读模式下隐藏写操作（导入/标签/新增/编辑/删除），
 * 适合"浏览模式"使用。
 */

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Popconfirm,
  App,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ImportOutlined,
  SearchOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { apiFetch } from "@/hooks/useEditMode";
import { DIFFICULTY_LABELS, PLAYED_SET_KEY } from "@/config/constants";
import type { Puzzle } from "@/types/sudoku";
import { PuzzleForm } from "./PuzzleForm";
import { PuzzleImportModal } from "./PuzzleImportModal";

const { Text } = Typography;

const DIFFICULTY_COLORS: Record<number, string> = {
  0: "default",
  1: "green",
  2: "blue",
  3: "orange",
  4: "red",
};

/** 读 localStorage 已做过集合。 */
function getPlayedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(PLAYED_SET_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

interface PuzzleTableProps {
  /** 只读模式：隐藏写操作按钮，仅搜索/筛选/查看。默认 false。 */
  readOnly?: boolean;
}

/**
 * 题目列表管理组件。
 */
export function PuzzleTable({ readOnly = false }: PuzzleTableProps) {
  const { message } = App.useApp();
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState("");
  const [difficulty, setDifficulty] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [editingPuzzle, setEditingPuzzle] = useState<Puzzle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [playedSet, setPlayedSet] = useState<Set<string>>(getPlayedSet);
  // playedSet 在每次 fetchPuzzles 完成时刷新（localStorage 可能被其他标签页修改）
  const refreshPlayedSet = useCallback(() => {
    setPlayedSet(getPlayedSet());
  }, []);

  const fetchPuzzles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (keyword) params.set("keyword", keyword);
      if (difficulty !== undefined) params.set("difficulty", String(difficulty));

      const res = await fetch(`/api/puzzles?${params}`);
      const data = await res.json();
      if (data.success) {
        setPuzzles(data.data.list);
        setTotal(data.data.total);
        // 刷新"已做过"集合
        refreshPlayedSet();
      }
    } catch {
      message.error("加载题目列表失败");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, difficulty, refreshPlayedSet]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPuzzles();
  }, [fetchPuzzles]);

  // 仅在浏览器端初始读取"已做过"集合（不受 fetch 的 refreshPlayedSet 调用覆盖）

  const handleDelete = async (id: string) => {
    try {
      const res = await apiFetch(`/api/puzzles/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        message.success("已删除");
        fetchPuzzles();
      } else {
        message.error("删除失败");
      }
    } catch {
      message.error("删除失败");
    }
  };

  const columns = [
    {
      title: "完成",
      key: "played",
      width: 60,
      render: (_: unknown, record: Puzzle) =>
        playedSet.has(record.id) ? (
          <PlayCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
        ) : null,
    },
    {
      title: "题面预览",
      dataIndex: "puzzle",
      key: "preview",
      width: 120,
      render: (val: string) => (
        <Text code style={{ fontSize: 12 }}>
          {val.substring(0, 9)}...
        </Text>
      ),
    },
    {
      title: "难度",
      dataIndex: "difficulty",
      key: "difficulty",
      width: 80,
      render: (val: number) => (
        <Tag color={DIFFICULTY_COLORS[val] || "default"}>
          {DIFFICULTY_LABELS[val] || "未知"}
        </Tag>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
    },
    ...(!readOnly
      ? [
          {
            title: "涉及技巧",
            dataIndex: "techniqueNames",
            key: "techniqueNames",
            render: (names?: string[]) =>
              names && names.length > 0 ? (
                <Space size={[2, 2]} wrap>
                  {names.map((n) => (
                    <Tag key={n}>{n}</Tag>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">-</Text>
              ),
          },
          {
            title: "操作",
            key: "actions",
            width: 140,
            render: (_: unknown, record: Puzzle) => (
              <Space size="small">
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditingPuzzle(record);
                    setShowForm(true);
                  }}
                />
                <Popconfirm
                  title="确定删除此题？"
                  onConfirm={() => handleDelete(record.id)}
                  okText="删除"
                  cancelText="取消"
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      {/* 工具栏 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <Space size="middle" wrap>
          <Input
            placeholder="搜索题面..."
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="难度筛选"
            value={difficulty}
            onChange={(v) => {
              setDifficulty(v);
              setPage(1);
            }}
            allowClear
            style={{ width: 120 }}
            options={Object.entries(DIFFICULTY_LABELS).map(([k, v]) => ({
              value: parseInt(k),
              label: v,
            }))}
          />
        </Space>
        {!readOnly && (
          <Space size="small">
            <Button
              icon={<ImportOutlined />}
              onClick={() => setShowImport(true)}
            >
              导入
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingPuzzle(null);
                setShowForm(true);
              }}
            >
              新增
            </Button>
          </Space>
        )}
      </div>

      {/* 列表 */}
      <Table
        dataSource={puzzles}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showTotal: (t) => `共 ${t} 题`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        size="small"
      />

      {/* 新增/编辑弹窗 */}
      <PuzzleForm
        open={showForm}
        puzzle={editingPuzzle}
        onClose={() => {
          setShowForm(false);
          setEditingPuzzle(null);
        }}
        onSuccess={() => {
          setShowForm(false);
          setEditingPuzzle(null);
          fetchPuzzles();
        }}
      />

      {/* 导入弹窗 */}
      <PuzzleImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={() => {
          setShowImport(false);
          fetchPuzzles();
        }}
      />
    </div>
  );
}
