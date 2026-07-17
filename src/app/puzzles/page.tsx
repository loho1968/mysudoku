"use client";

/**
 * @file puzzles/page.tsx
 * @author loho
 *
 * 题目管理页面。
 * 需要编辑模式才能访问，否则显示引导按钮。
 */

import { Typography, Card, Button, Space } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useEditMode } from "@/hooks/useEditMode";
import { EditModeModal } from "@/components/Auth/EditModeModal";
import { PuzzleTable } from "@/components/PuzzleManager/PuzzleTable";

const { Title, Text } = Typography;

/**
 * 题目管理页面。
 */
export default function PuzzlesPage() {
  const {
    isEditMode,
    showPasswordModal,
    setShowPasswordModal,
    toggleEditMode,
    verifyPassword,
  } = useEditMode();

  const handleSuccess = (password: string) => {
    sessionStorage.setItem("edit_password", password);
    verifyPassword(password);
  };

  if (!isEditMode) {
    return (
      <div
        style={{
          padding: 24,
          maxWidth: 600,
          margin: "0 auto",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Card style={{ width: "100%", textAlign: "center" }}>
          <Space orientation="vertical" size="large">
            <LockOutlined style={{ fontSize: 48, color: "#999" }} />
            <Title level={4}>需要编辑模式</Title>
            <Text type="secondary">
              输入编辑密码以管理题目和标签。
            </Text>
            <Button type="primary" size="large" onClick={toggleEditMode}>
              进入编辑模式
            </Button>
            <Button
              type="link"
              onClick={() => (window.location.href = "/game")}
            >
              返回游戏
            </Button>
          </Space>
          <EditModeModal
            open={showPasswordModal}
            onClose={() => setShowPasswordModal(false)}
            onSuccess={handleSuccess}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <Card>
        <Title level={3} style={{ marginBottom: 16 }}>
          题目管理
        </Title>
        <PuzzleTable />
      </Card>
    </div>
  );
}
