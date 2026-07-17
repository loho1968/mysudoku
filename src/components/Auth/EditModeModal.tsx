"use client";

/**
 * @file EditModeModal.tsx
 * @author loho
 *
 * 编辑模式密码验证弹窗。
 * 验证成功后回调 onSuccess(password)，由调用方存储密码。
 */

import { useState } from "react";
import { Modal, Input, Button, Typography, App, Space } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { DEFAULT_EDIT_PASSWORD } from "@/config/constants";

const { Text } = Typography;

interface EditModeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (password: string) => void;
}

/**
 * 编辑模式密码验证弹窗。
 */
export function EditModeModal({
  open,
  onClose,
  onSuccess,
}: EditModeModalProps) {
  const { message } = App.useApp();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        message.success("已进入编辑模式");
        onSuccess(password);
        setPassword("");
      } else {
        message.error("密码错误");
      }
    } catch {
      message.error("验证失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="进入编辑模式"
      open={open}
      onCancel={onClose}
      footer={null}
      width={380}
      centered
    >
      <Space
        orientation="vertical"
        size="middle"
        style={{ width: "100%", paddingTop: 8 }}
      >
        <Text type="secondary">输入编辑密码以管理题目和标签。</Text>
        <Input.Password
          prefix={<LockOutlined />}
          placeholder={`默认密码: ${DEFAULT_EDIT_PASSWORD}`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onPressEnter={handleSubmit}
          autoFocus
        />
        <Button type="primary" block loading={loading} onClick={handleSubmit}>
          验证
        </Button>
      </Space>
    </Modal>
  );
}
