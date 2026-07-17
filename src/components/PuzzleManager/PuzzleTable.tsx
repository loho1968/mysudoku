"use client";

/**
 * @file PuzzleTable.tsx
 * @author loho
 *
 * 题目列表表格。
 * 支持分页、搜索、难度筛选、编辑/删除操作。
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
  TagsOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { apiFetch } from "@/hooks/useEditMode";
import { DIFFICULTY_LABELS } from "@/config/constants";
import type { Puzzle, Tag as TagType } from "@/types/sudoku";
import { PuzzleForm } from "./PuzzleForm";
import { PuzzleImportModal } from "./PuzzleImportModal";
import { TagManager } from "./TagManager";

const { Text } = Typography;

const DIFFICULTY_COLORS: Record<number, string> = {
  0: "default",
  1: "green",
  2: "blue",
  3: "orange",
  4: "red",
};

/**
 * 题目列表管理组件。
 */
export function PuzzleTable() {
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
  const [showTags, setShowTags] = useState(false);

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
      }
    } catch {
      message.error("加载题目列表失败");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, difficulty]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPuzzles();
  }, [fetchPuzzles]);

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
      title: "标签",
      dataIndex: "tags",
      key: "tags",
      render: (tags: TagType[]) =>
        tags.length > 0 ? (
          <Space size={[2, 2]} wrap>
            {tags.map((t) => (
              <Tag key={t.id} color={t.color}>
                {t.name}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
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
        <Space size="small">
          <Button
            icon={<ImportOutlined />}
            onClick={() => setShowImport(true)}
          >
            导入
          </Button>
          <Button icon={<TagsOutlined />} onClick={() => setShowTags(true)}>
            标签
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

      {/* 标签管理 */}
      <TagManager
        open={showTags}
        onClose={() => setShowTags(false)}
      />
    </div>
  );
}
