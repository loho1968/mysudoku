"use client";

/**
 * @file PuzzleForm.tsx
 * @author loho
 *
 * 题目新增/编辑表单弹窗。
 */

import { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  App,
} from "antd";
import { apiFetch } from "@/hooks/useEditMode";
import { api } from "@/config/runtime";
import { DIFFICULTY_LABELS, TECHNIQUE_LIST } from "@/config/constants";
import type { Puzzle } from "@/types/sudoku";

const { TextArea } = Input;

interface PuzzleFormProps {
  open: boolean;
  puzzle: Puzzle | null;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * 题目新增/编辑表单。
 */
export function PuzzleForm({
  open,
  puzzle,
  onClose,
  onSuccess,
}: PuzzleFormProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const isEdit = !!puzzle;

  // 编辑模式回填
  useEffect(() => {
    if (open && puzzle) {
      form.setFieldsValue({
        puzzle: puzzle.puzzle,
        solution: puzzle.solution || "",
        difficulty: puzzle.difficulty,
        remark: puzzle.remark || "",
        techniqueNames: puzzle.techniqueNames || [],
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, puzzle, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const body = {
        puzzle: values.puzzle.replace(/\./g, "0"),
        solution: values.solution?.replace(/\./g, "0") || null,
        difficulty: values.difficulty ?? 0,
        remark: values.remark || null,
        techniqueNames: values.techniqueNames || [],
      };

      const url = api(isEdit ? `/api/puzzles/${puzzle!.id}` : "/api/puzzles");
      const method = isEdit ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        message.success(isEdit ? "已更新" : "已添加");
        onSuccess();
      } else {
        message.error(data.error || "操作失败");
      }
    } catch {
      message.error("表单校验失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "编辑题目" : "新增题目"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText={isEdit ? "保存" : "添加"}
      width={600}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="puzzle"
          label="题目（81字符，0或.表示空格）"
          rules={[
            { required: true, message: "请输入题目" },
            {
              validator: (_, value) => {
                if (value && value.length === 81) return Promise.resolve();
                return Promise.reject(new Error("需要 81 字符"));
              },
            },
          ]}
        >
          <TextArea rows={3} placeholder="530070000600195000098000060800060003400803001700020006060000280000419005000080079" />
        </Form.Item>

        <Form.Item
          name="solution"
          label="答案（81字符，可选）"
        >
          <TextArea rows={3} placeholder="可选，81字符" />
        </Form.Item>

        <Form.Item name="difficulty" label="难度">
          <Select
            options={Object.entries(DIFFICULTY_LABELS).map(([k, v]) => ({
              value: parseInt(k),
              label: v,
            }))}
          />
        </Form.Item>

        <Form.Item name="remark" label="备注">
          <TextArea rows={2} placeholder="可选" />
        </Form.Item>

        <Form.Item name="techniqueNames" label="涉及技巧">
          <Select
            mode="multiple"
            placeholder="选择涉及技巧（可选）"
            options={TECHNIQUE_LIST.map((t) => ({
              value: t,
              label: t,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
