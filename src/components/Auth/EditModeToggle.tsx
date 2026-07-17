"use client";

/**
 * @file EditModeToggle.tsx
 * @author loho
 *
 * 编辑模式切换按钮。
 * 放置在 AppHeader 右上角，切换编辑/浏览模式。
 */

import { Button } from "antd";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import { useEditMode } from "@/hooks/useEditMode";
import { EditModeModal } from "./EditModeModal";
import { useRouter } from "next/navigation";

/**
 * 编辑模式切换组件。
 */
export function EditModeToggle() {
  const router = useRouter();
  const {
    isEditMode,
    showPasswordModal,
    setShowPasswordModal,
    toggleEditMode,
    verifyPassword,
  } = useEditMode();

  const handleSuccess = (password: string) => {
    sessionStorage.setItem("edit_password", password);
    verifyPassword(password).then((ok) => {
      if (ok) {
        router.refresh();
      }
    });
  };

  return (
    <>
      <Button
        type={isEditMode ? "primary" : "text"}
        icon={isEditMode ? <EditOutlined /> : <EyeOutlined />}
        onClick={toggleEditMode}
      >
        {isEditMode ? "编辑模式" : "浏览模式"}
      </Button>
      <EditModeModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
