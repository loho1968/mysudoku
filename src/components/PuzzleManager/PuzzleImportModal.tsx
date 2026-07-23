"use client";

/**
 * @file PuzzleImportModal.tsx
 * @author loho
 *
 * 剪贴板批量导入弹窗。
 * 支持 81 字符单行格式和 9 行 × 9 字符格式。
 */

import { useState } from "react";
import { Modal, Input, Button, Typography, App, Space } from "antd";
import { apiFetch } from "@/hooks/useEditMode";
import { api } from "@/config/runtime";

const { TextArea } = Input;
const { Text } = Typography;

interface PuzzleImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * 批量导入弹窗。
 */
export function PuzzleImportModal({
  open,
  onClose,
  onSuccess,
}: PuzzleImportModalProps) {
  const { message } = App.useApp();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!text.trim()) {
      message.warning("请粘贴题目文本");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch(api("/api/puzzles/import"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.success) {
        message.success(`成功导入 ${data.data.count} 题`);
        setText("");
        onSuccess();
      } else {
        message.error(data.error || "导入失败");
      }
    } catch {
      message.error("导入失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="批量导入题目"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <Text type="secondary">
          支持两种格式自动识别：
          <br />
          格式A：每行 81 字符（0或.表示空格）
          <br />
          格式B：每 9 行为一个题目（每行 9 字符）
        </Text>
        <TextArea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="在此粘贴题目文本..."
        />
        <Space>
          <Button type="primary" loading={loading} onClick={handleImport}>
            导入
          </Button>
          <Button onClick={onClose}>取消</Button>
        </Space>
      </Space>
    </Modal>
  );
}
