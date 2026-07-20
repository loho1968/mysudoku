"use client";

/**
 * @file SyncBar.tsx
 * @author loho
 *
 * 题库同步工具栏。
 *
 * 仅在本地开发环境渲染（部署到服务器后返回 null）。
 *
 * 提供两个动作：
 * - 拉取：从远程服务器 GET /api/puzzles/all，把题目和标签 upsert 进本地库
 * - 同步：把本地全量题目和标签 POST 到远程服务器 /api/puzzles/upsert
 *
 * 远程服务器地址与密码通过 UI 输入，存于 localStorage 下次自动回填。
 */

import { useState, useCallback } from "react";
import { Card, Input, Button, Space, App, Tag as AntTag, Typography } from "antd";
import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { isLocalEnv } from "@/lib/env";
import { apiFetch } from "@/hooks/useEditMode";
import { SYNC_SERVER_KEY, SYNC_PASSWORD_KEY } from "@/config/constants";
import type { Puzzle } from "@/types/sudoku";

const { Text } = Typography;

/** 服务器返回的全量数据结构。 */
interface AllDataPayload {
  puzzles: Puzzle[];
}

interface SyncBarProps {
  /** 同步/拉取完成后回调（用于刷新外层 PuzzleTable）。 */
  onDone?: () => void;
}

/**
 * 规整化服务器 URL：去掉末尾斜杠。
 * @param url - 用户输入的 URL。
 * @returns 规整化后的 URL。
 */
function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/**
 * 从 localStorage 读取字符串值（仅客户端）。
 * @param key - localStorage 键。
 * @returns 值或空字符串。
 */
function readStored(key: string): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(key) || "";
}

/**
 * 读取 403 响应体中的 error 字段。
 */
async function readErrorBody(res: Response): Promise<string> {
  try {
    const body = await res.json() as { error?: string };
    return body.error || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

/**
 * 同步工具栏组件。
 */
export function SyncBar({ onDone }: SyncBarProps) {
  const { message } = App.useApp();
  const [serverUrl, setServerUrl] = useState(() => readStored(SYNC_SERVER_KEY));
  const [password, setPassword] = useState(() =>
    readStored(SYNC_PASSWORD_KEY)
  );
  const [pulling, setPulling] = useState(false);
  const [pushing, setPushing] = useState(false);

  /**
   * 持久化当前输入到 localStorage（trim 后再存）。
   */
  const persistInputs = useCallback((url: string, pwd: string) => {
    window.localStorage.setItem(SYNC_SERVER_KEY, url.trim());
    window.localStorage.setItem(SYNC_PASSWORD_KEY, pwd.trim());
  }, []);

  /**
   * 校验密码：向远程 /api/auth 发一次验证，返回 true/false。
   */
  const verifyRemotePassword = useCallback(async (
    url: string,
    pwd: string
  ): Promise<string | null> => {
    try {
      const res = await fetch(`${url}/api/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.success) return null; // 密码正确
      return `密码错误：${data.error || ""}`;
    } catch (err) {
      return `无法连接服务器：${err instanceof Error ? err.message : "未知错误"}`;
    }
  }, []);

  /**
   * 从服务器拉取数据到本地。
   */
  const handlePull = useCallback(async () => {
    const url = normalizeUrl(serverUrl);

    if (!url) {
      message.warning("请填写服务器地址");
      return;
    }
    persistInputs(url, password.trim());
    setPulling(true);
    const hide = message.loading("正在拉取...", 0);

    try {
      // 1) 从远程拉取全量（公开接口，不需要密码）
      const remoteRes = await fetch(`${url}/api/puzzles/all`);
      if (!remoteRes.ok) {
        hide();
        const errBody = await readErrorBody(remoteRes);
        console.error(`[SyncBar] 拉取失败: ${remoteRes.status} - ${errBody}`);
        message.error(`服务器返回错误 ${remoteRes.status}：${errBody}`);
        return;
      }
      const remoteData = (await remoteRes.json()) as {
        success: boolean;
        data?: AllDataPayload;
        error?: string;
      };
      if (!remoteData.success || !remoteData.data) {
        hide();
        message.error(remoteData.error || "服务器返回数据异常");
        return;
      }

      const { puzzles } = remoteData.data;

      // 2) 写入本地库（apiFetch 自动附加 X-Local-Dev 头）
      const upsertRes = await apiFetch("/api/puzzles/upsert", {
        method: "POST",
        body: JSON.stringify({ puzzles }),
      });
      const upsertData = await upsertRes.json();
      if (!upsertData.success) {
        hide();
        console.error("[SyncBar] 写入本地 upsert 失败:", upsertData);
        message.error(upsertData.error || "写入本地库失败");
        return;
      }

      hide();
      message.success(`已拉取 ${puzzles.length} 题`);
      onDone?.();
    } catch (err) {
      hide();
      const msg = err instanceof Error ? err.message : "未知错误";
      console.error("[SyncBar] 拉取异常:", err);
      message.error(`拉取失败：${msg}`);
    } finally {
      setPulling(false);
    }
  }, [serverUrl, password, persistInputs, message, onDone, verifyRemotePassword]);

  /**
   * 把本地数据推送到服务器。
   */
  const handlePush = useCallback(async () => {
    const url = normalizeUrl(serverUrl);
    const pwd = password.trim();

    if (!url) {
      message.warning("请填写服务器地址");
      return;
    }
    if (!pwd) {
      message.warning("请填写服务器密码");
      return;
    }
    persistInputs(url, pwd);
    setPushing(true);
    const hide = message.loading("正在同步...", 0);

    try {
      // 0) 先验证密码
      const pwdErr = await verifyRemotePassword(url, pwd);
      if (pwdErr) {
        hide();
        message.error(pwdErr);
        return;
      }

      // 1) 从本地拉取全量（GET 公开，不需凭据）
      const localRes = await fetch("/api/puzzles/all");
      if (!localRes.ok) {
        hide();
        message.error(`读取本地库失败：${localRes.status}`);
        return;
      }
      const localData = (await localRes.json()) as {
        success: boolean;
        data?: AllDataPayload;
      };
      if (!localData.success || !localData.data) {
        hide();
        message.error("读取本地库数据异常");
        return;
      }
      const { puzzles } = localData.data;

      // 2) 推送到远程（带 X-Edit-Password）
      const pushRes = await fetch(`${url}/api/puzzles/upsert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Edit-Password": pwd,
        },
        body: JSON.stringify({ puzzles }),
      });
      if (!pushRes.ok) {
        hide();
        const errBody = await readErrorBody(pushRes);
        console.error(`[SyncBar] 推送失败: ${pushRes.status} - ${errBody}`);
        message.error(`服务器拒绝（${pushRes.status}）：${errBody}`);
        return;
      }
      const pushData = await pushRes.json();
      if (!pushData.success) {
        hide();
        console.error("[SyncBar] 推送服务器返回失败:", pushData);
        message.error(pushData.error || "服务器写入失败");
        return;
      }

      hide();
      message.success(`已同步 ${puzzles.length} 题到服务器`);
      onDone?.();
    } catch (err) {
      hide();
      const msg = err instanceof Error ? err.message : "未知错误";
      console.error("[SyncBar] 同步异常:", err);
      message.error(`同步失败：${msg}`);
    } finally {
      setPushing(false);
    }
  }, [serverUrl, password, persistInputs, message, onDone, verifyRemotePassword]);

  // 服务器环境：不渲染
  if (!isLocalEnv()) {
    return null;
  }

  return (
    <Card
      size="small"
      style={{ marginBottom: 16 }}
      title={
        <Space size="small">
          <LinkOutlined />
          <span>本地同步</span>
          <AntTag color="green" style={{ marginInlineStart: 4 }}>
            本地环境
          </AntTag>
        </Space>
      }
    >
      <Space size="middle" wrap style={{ width: "100%" }}>
        <Input
          placeholder="服务器地址（如 https://your.domain）"
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          style={{ width: 320 }}
          prefix={<LinkOutlined />}
        />
        <Input.Password
          placeholder="服务器编辑密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: 180 }}
        />
        <Button
          icon={<CloudDownloadOutlined />}
          loading={pulling}
          disabled={pushing}
          onClick={handlePull}
        >
          拉取
        </Button>
        <Button
          type="primary"
          icon={<CloudUploadOutlined />}
          loading={pushing}
          disabled={pulling}
          onClick={handlePush}
        >
          同步
        </Button>
      </Space>
      <div style={{ marginTop: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          拉取：从服务器下载数据到本地库（按 ID 覆盖）。
          同步：把本地数据上传到服务器（按 ID 覆盖）。
          地址与密码会记忆在 localStorage。
        </Text>
      </div>
    </Card>
  );
}
