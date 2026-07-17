"use client";

/**
 * @file TagManager.tsx
 * @author loho
 *
 * 标签管理弹窗。
 * 支持新增、编辑（名称+颜色）、删除标签。
 */

import { useEffect, useState, useCallback } from "react";
import {
  Modal,
  Table,
  Button,
  Space,
  Popconfirm,
  Form,
  Input,
  ColorPicker,
  App,
  Tag,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { apiFetch } from "@/hooks/useEditMode";
import type { Tag as TagType } from "@/types/sudoku";

interface TagManagerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * 标签管理组件。
 */
export function TagManager({ open, onClose }: TagManagerProps) {
  const { message } = App.useApp();
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form] = Form.useForm();

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tags");
      const data = await res.json();
      if (data.success) setTags(data.data);
    } catch {
      message.error("加载标签失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchTags();
  }, [open, fetchTags]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const color =
        typeof values.color === "string"
          ? values.color
          : values.color?.toHexString?.() || "#1890ff";
      const body = { name: values.name.trim(), color };

      let res;
      if (editingTag) {
        res = await apiFetch(`/api/tags/${editingTag.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        res = await apiFetch("/api/tags", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      const data = await res.json();
      if (data.success) {
        message.success(editingTag ? "已更新" : "已添加");
        setShowForm(false);
        setEditingTag(null);
        form.resetFields();
        fetchTags();
      } else {
        message.error(data.error || "操作失败");
      }
    } catch {
      message.error("表单校验失败");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await apiFetch(`/api/tags/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        message.success("已删除");
        fetchTags();
      } else {
        message.error(data.error || "删除失败");
      }
    } catch {
      message.error("删除失败");
    }
  };

  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: TagType) => (
        <Tag color={record.color}>{name}</Tag>
      ),
    },
    {
      title: "颜色",
      dataIndex: "color",
      key: "color",
      render: (color: string) => (
        <span
          style={{
            display: "inline-block",
            width: 20,
            height: 20,
            borderRadius: 4,
            background: color,
            border: "1px solid #d9d9d9",
          }}
        />
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 100,
      render: (_: unknown, record: TagType) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingTag(record);
              form.setFieldsValue({
                name: record.name,
                color: record.color,
              });
              setShowForm(true);
            }}
          />
          <Popconfirm
            title="确定删除此标签？"
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
    <Modal
      title="标签管理"
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
    >
      <Table
        dataSource={tags}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
        style={{ marginBottom: 16 }}
      />
      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        onClick={() => {
          setEditingTag(null);
          form.resetFields();
          setShowForm(true);
        }}
      >
        新增标签
      </Button>

      {/* 新增/编辑标签弹窗 */}
      <Modal
        title={editingTag ? "编辑标签" : "新增标签"}
        open={showForm}
        onCancel={() => {
          setShowForm(false);
          setEditingTag(null);
        }}
        onOk={handleSave}
        okText={editingTag ? "保存" : "添加"}
        width={400}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="标签名称"
            rules={[{ required: true, message: "请输入标签名称" }]}
          >
            <Input placeholder="如：唯余法" />
          </Form.Item>
          <Form.Item name="color" label="颜色" initialValue="#1890ff">
            <ColorPicker />
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
}
