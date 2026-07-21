"use client";

/**
 * @file puzzles/page.tsx
 * @author loho
 *
 * 题库维护页面。
 *
 * 两种入口模式：
 * - 本地环境：自动进入维护模式（免密），显示同步工具栏
 * - 服务器环境：默认浏览模式，需密码切换为维护模式
 *
 * 维护模式下可增、删、改题目和标签；本地环境额外提供「拉取/同步」服务器数据。
 */

import { useEffect, useState } from "react";
import { Typography, Card, Button } from "antd";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import { useEditMode } from "@/hooks/useEditMode";
import { isLocalEnv } from "@/lib/env";
import { EditModeModal } from "@/components/Auth/EditModeModal";
import { PuzzleTable } from "@/components/PuzzleManager/PuzzleTable";
import { SyncBar } from "@/components/PuzzleManager/SyncBar";

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

  // 标记客户端是否已完成 hydration（避免 SSR 与服务端 sessionStorage 状态不一致的闪烁）
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  // 客户端挂载后才可知是否本地环境（避免 SSR 闪烁）
  const [isLocal, setIsLocal] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLocal(isLocalEnv());
  }, []);

  // 本地环境：首次进入时自动切换为维护模式（免密，useEditMode 已处理本地旁路）
  useEffect(() => {
    if (isLocal && !isEditMode) {
      toggleEditMode();
    }
    // 仅在 isLocal 变化时触发一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocal]);

  const handlePasswordSuccess = (password: string) => {
    sessionStorage.setItem("edit_password", password);
    verifyPassword(password);
  };

  // 拉取/同步成功后刷新 PuzzleTable（通过 key 变化强制重置内部状态）
  const [refreshKey, setRefreshKey] = useState(0);
  const handleSyncDone = () => setRefreshKey((k) => k + 1);

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
              {!hydrated
                ? "维护模式"
                : isLocal
                  ? "本地维护模式"
                  : isEditMode
                    ? "维护模式"
                    : "浏览模式"}
            </Text>
          </div>
          {/* 本地环境不需要切换按钮（已自动维护）；服务器环境显示密码切换 */}
          {!isLocal && (
            <Button
              type={isEditMode ? "default" : "primary"}
              icon={isEditMode ? <EyeOutlined /> : <EditOutlined />}
              onClick={toggleEditMode}
              suppressHydrationWarning
            >
              {isEditMode ? "退出维护模式" : "进入维护模式"}
            </Button>
          )}
        </div>

        {/* 本地环境：同步工具栏 */}
        {isLocal && <SyncBar onDone={handleSyncDone} />}

        <PuzzleTable key={refreshKey} readOnly={!isEditMode} />
      </Card>

      {/* 服务器环境才需要密码 Modal */}
      {!isLocal && (
        <EditModeModal
          open={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={handlePasswordSuccess}
        />
      )}
    </div>
  );
}
