"use client";

/**
 * @file useEditMode.ts
 * @author loho
 *
 * 编辑模式状态管理 hook。
 *
 * 两种放行模式：
 * 1. 本地环境（isLocalEnv() === true）：toggleEditMode 直接进入编辑模式，不弹密码框。
 *    apiFetch 自动注入 X-Local-Dev: 1 头，服务端 verifyEditMode 据此放行。
 * 2. 服务器环境：维持密码验证流程。密码存于 sessionStorage，关闭页面即退出编辑模式。
 *    API 请求通过 apiFetch 自动附加 X-Edit-Password 头。
 *
 * 设计说明见 .ai/DECISIONS.md D-005。
 */

import { useState, useCallback, useEffect } from "react";
import { isLocalEnv, LOCAL_DEV_HEADER } from "@/lib/env";
import { api } from "@/config/runtime";

const STORAGE_KEY = "edit_password";
const AUTH_URL = "/api/auth";

/** 本地旁路标识（写到 sessionStorage 仅用于跨组件状态读取，非安全机制）。 */
const LOCAL_BYPASS_KEY = "edit_local_bypass";

/**
 * 从 sessionStorage 读取密码。
 * @returns 密码或 null。
 */
function getStoredPassword(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

/**
 * 是否已通过本地旁路进入编辑模式。
 * @returns 是否本地旁路。
 */
function getLocalBypass(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(LOCAL_BYPASS_KEY) === "1";
}

/**
 * 编辑模式 hook。
 */
export function useEditMode() {
  // 初始状态恒为 false，避免 SSR（无 sessionStorage）与客户端 hydration 不一致。
  // sessionStorage 的读取推迟到 effect 中，水合后再修正状态。
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // 客户端水合后：根据 sessionStorage 修正初始状态
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsEditMode(!!getStoredPassword() || getLocalBypass());
  }, []);

  const toggleEditMode = useCallback(() => {
    if (isEditMode) {
      // 退出编辑模式：清空两种凭据
      setIsEditMode(false);
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(LOCAL_BYPASS_KEY);
    } else if (isLocalEnv()) {
      // 本地环境：直接进入，写入本地旁路标识
      sessionStorage.setItem(LOCAL_BYPASS_KEY, "1");
      setIsEditMode(true);
    } else {
      // 服务器环境：弹密码框
      setShowPasswordModal(true);
    }
  }, [isEditMode]);

  const verifyPassword = useCallback(async (password: string) => {
    try {
      const res = await fetch(api(AUTH_URL), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem(STORAGE_KEY, password);
        setIsEditMode(true);
        setShowPasswordModal(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const exitEditMode = useCallback(() => {
    setIsEditMode(false);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(LOCAL_BYPASS_KEY);
  }, []);

  return {
    isEditMode,
    showPasswordModal,
    setShowPasswordModal,
    toggleEditMode,
    verifyPassword,
    exitEditMode,
  };
}

/**
 * 带编辑凭据验证的 fetch 封装。
 *
 * 自动注入凭据头：
 * - 本地环境：附加 X-Local-Dev: 1（服务端见此头 + 本机 Host 即放行）
 * - 服务器环境：附加 X-Edit-Password（如 sessionStorage 有密码）
 *
 * @param url - 请求 URL。
 * @param options - fetch 选项（可选）。
 * @returns fetch 响应。
 */
export async function apiFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };

  if (isLocalEnv()) {
    headers[LOCAL_DEV_HEADER] = "1";
  } else {
    const password = getStoredPassword();
    if (password) {
      headers["X-Edit-Password"] = password;
    }
  }

  return fetch(url, { ...options, headers });
}
