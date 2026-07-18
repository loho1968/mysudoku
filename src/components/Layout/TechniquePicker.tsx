"use client";

/**
 * @file TechniquePicker.tsx
 * @author loho
 *
 * 导航栏"数独技巧"按钮。
 *
 * 点击弹出 Modal，展示题库中已有的技巧（非全量）、支持多选，
 * 选择后调随机出题 API，筛选含所选技巧的题目并跳转。
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal, Checkbox, Space, Tag, Typography, Spin, App } from "antd";
import { BulbOutlined } from "@ant-design/icons";
import { TECHNIQUE_GROUPS, PLAYED_SET_KEY } from "@/config/constants";

const { Text, Title } = Typography;

/** 读 localStorage 已做过集合。 */
function getExcludeIds(): string {
  try {
    const raw = localStorage.getItem(PLAYED_SET_KEY);
    if (!raw) return "";
    return (JSON.parse(raw) as string[]).join(",");
  } catch {
    return "";
  }
}

/**
 * 数独技巧练习选择组件。
 */
export function TechniquePicker() {
  const router = useRouter();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [availTechniques, setAvailTechniques] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingPuzzle, setFetchingPuzzle] = useState(false);

  // 打开 Modal 时拉取已有题目关联的技巧
  const fetchTechniques = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/puzzles/techniques");
      const data = await res.json();
      if (data.success) {
        setAvailTechniques(data.data);
      }
    } catch {
      // 静默
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && availTechniques.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchTechniques();
    }
  }, [open, availTechniques.length, fetchTechniques]);

  const handleOpen = () => {
    setSelected([]);
    setOpen(true);
  };

  const handleStart = async () => {
    if (selected.length === 0) return;
    setFetchingPuzzle(true);
    try {
      const exclude = getExcludeIds();
      const techniquesParam = encodeURIComponent(selected.join(","));
      let url = `/api/puzzles/random?techniques=${techniquesParam}`;
      if (exclude) {
        url += `&exclude=${encodeURIComponent(exclude)}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setOpen(false);
        router.push(`/game/${json.data.id}`);
      } else {
        message.warning("暂无完全匹配所选技巧的题目");
      }
    } catch {
      message.error("获取题目失败");
    } finally {
      setFetchingPuzzle(false);
    }
  };

  return (
    <>
      <Button type="text" icon={<BulbOutlined />} onClick={handleOpen}>
        数独技巧
      </Button>
      <Modal
        title="选择数独技巧"
        open={open}
        onCancel={() => setOpen(false)}
        footer={
          <Button
            type="primary"
            onClick={handleStart}
            loading={fetchingPuzzle}
            disabled={selected.length === 0}
          >
            开始练习
          </Button>
        }
        width={560}
        style={{ top: 40 }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin />
          </div>
        ) : availTechniques.length === 0 ? (
          <Text type="secondary">题库中暂无已关联技巧的题目。</Text>
        ) : (
          <>
            <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
              已选 {selected.length} 项技巧，将筛选同时含有全部所选技巧的题目。
            </Text>
            <Checkbox.Group
              value={selected}
              onChange={(vals) => setSelected(vals as string[])}
            >
              {TECHNIQUE_GROUPS.map((group) => {
                // 只展示题库中存在的技巧
                const existItems = group.items.filter((t) =>
                  availTechniques.includes(t)
                );
                if (existItems.length === 0) return null;
                return (
                  <div key={group.label} style={{ marginBottom: 16 }}>
                    <Text
                      strong
                      style={{ fontSize: 13, marginBottom: 8, display: "block" }}
                    >
                      {group.label}
                    </Text>
                    <Space wrap size={[8, 8]}>
                      {existItems.map((tech) => (
                        <Checkbox key={tech} value={tech}>
                          {tech}
                        </Checkbox>
                      ))}
                    </Space>
                  </div>
                );
              })}
            </Checkbox.Group>
          </>
        )}
      </Modal>
    </>
  );
}
