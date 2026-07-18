"use client";

/**
 * @file puzzles/page.tsx
 * @author loho
 *
 * 题库维护页面。
 *
 * 默认进入浏览模式（只读），可从右上角切换为维护模式（需密码验证）。
 * 维护模式下可增、删、改题目和标签。
 */

import { Typography, Card, Button, Space, App } from "antd";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import { useEditMode } from "@/hooks/useEditMode";
import { EditModeModal } from "@/components/Auth/EditModeModal";
import { PuzzleTable } from "@/components/PuzzleManager/PuzzleTable";

const { Title, Text } = Typography;

/**
 * 题库页面。
 */
export default function PuzzlesPage() {
  const {
    isEditMode,
    showPasswordModal,
    setShowPasswordModal,
    toggleEditMode,
    verifyPassword,
  } = useEditMode();

  const handlePasswordSuccess = (password: string) => {
    sessionStorage.setItem("edit_password", password);
    verifyPassword(password);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0 }}>
              题目管理
            </Title>
            <Text type="secondary">
              {isEditMode ? "维护模式" : "浏览模式"}
            </Text>
          </div>
          <Button
            type={isEditMode ? "default" : "primary"}
            icon={isEditMode ? <EyeOutlined /> : <EditOutlined />}
            onClick={toggleEditMode}
          >
            {isEditMode ? "退出维护模式" : "进入维护模式"}
          </Button>
        </div>

        <PuzzleTable readOnly={!isEditMode} />
      </Card>

      <EditModeModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
      />
    </div>
  );
}
