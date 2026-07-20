"use client";

/**
 * @file TechniquePicker.tsx
 * @author loho
 *
 * 导航栏"数独技巧"按钮。
 *
 * 点击弹出 Modal，展示题库中已有的技巧及其题目数量，每个技巧是一个按钮，
 * 点击即随机抽取一道含该技巧的题目并跳转。
 *
 * 每次打开 Modal 都重新拉取数据，确保保存题目后立即可见更新。
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal, Space, Tag, Typography, Spin, App } from "antd";
import { BulbOutlined } from "@ant-design/icons";
import { TECHNIQUE_GROUPS, PLAYED_SET_KEY } from "@/config/constants";

const { Text } = Typography;

/** 技巧及其题目数量。 */
interface TechniqueCount {
  technique: string;
  count: number;
}

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
  const [techniques, setTechniques] = useState<TechniqueCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingId, setFetchingId] = useState<string | null>(null);

  // 每次打开 Modal 都重新拉取（保证保存后即刷新）
  const fetchTechniques = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/puzzles/techniques");
      const data = await res.json();
      if (data.success) {
        setTechniques(data.data);
      }
    } catch {
      // 静默
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchTechniques();
    }
  }, [open, fetchTechniques]);

  const handleOpen = () => {
    setOpen(true);
  };

  /** 构建技巧名 → 题数的映射。 */
  const countMap = new Map<string, number>(
    techniques.map((t) => [t.technique, t.count])
  );

  /** 点击某个技巧按钮：立即随机抽题并跳转。 */
  const handleTechniqueClick = useCallback(
    async (tech: string) => {
      setFetchingId(tech);
      try {
        const exclude = getExcludeIds();
        let url = `/api/puzzles/random?techniques=${encodeURIComponent(tech)}`;
        if (exclude) {
          url += `&exclude=${encodeURIComponent(exclude)}`;
        }
        const res = await fetch(url);
        const json = await res.json();
        if (json.success && json.data) {
          setOpen(false);
          router.push(`/game/${json.data.id}`);
        } else {
          message.warning(`暂无含「${tech}」技巧的未做题目`);
        }
      } catch {
        message.error("获取题目失败");
      } finally {
        setFetchingId(null);
      }
    },
    [router, message]
  );

  return (
    <>
      <Button type="text" icon={<BulbOutlined />} onClick={handleOpen}>
        数独技巧
      </Button>
      <Modal
        title="选择数独技巧"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={560}
        style={{ top: 40 }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin />
          </div>
        ) : techniques.length === 0 ? (
          <Text type="secondary">题库中暂无已关联技巧的题目。</Text>
        ) : (
          TECHNIQUE_GROUPS.map((group) => {
            // 只展示题库中存在的技巧
            const existItems = group.items.filter((t) => countMap.has(t));
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
                    <Button
                      key={tech}
                      size="small"
                      loading={fetchingId === tech}
                      onClick={() => handleTechniqueClick(tech)}
                    >
                      {tech}
                      <Text type="secondary" style={{ fontSize: 11, marginInlineStart: 4 }}>
                        ({countMap.get(tech)})
                      </Text>
                    </Button>
                  ))}
                </Space>
              </div>
            );
          })
        )}
      </Modal>
    </>
  );
}
