"use client";

/**
 * @file useEditMode.ts
 * @author loho
 *
 * 编辑模式状态管理 hook。
 *
 * 编辑密码存储在 sessionStorage 中，关闭页面即退出编辑模式。
 * API 请求通过 apiFetch 自动附加 X-Edit-Password 头。
 *
 * 设计说明见 .ai/DECISIONS.md D-005。
 */

import { useState, useCallback } from "react";

const STORAGE_KEY = "edit_password";
const AUTH_URL = "/api/auth";

/**
 * 从 sessionStorage 读取密码。
 */
function getStoredPassword(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

/**
 * 编辑模式 hook。
 */
export function useEditMode() {
  const [isEditMode, setIsEditMode] = useState(() => !!getStoredPassword());
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const toggleEditMode = useCallback(() => {
    if (isEditMode) {
      setIsEditMode(false);
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      setShowPasswordModal(true);
    }
  }, [isEditMode]);

  const verifyPassword = useCallback(async (password: string) => {
    try {
      const res = await fetch(AUTH_URL, {
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
 * 带编辑密码验证的 fetch 封装。
 * @param url - 请求 URL。
 * @param options - fetch 选项（可选）。
 * @returns fetch 响应。
 */
export async function apiFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const password = getStoredPassword();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };
  if (password) {
    headers["X-Edit-Password"] = password;
  }
  return fetch(url, { ...options, headers });
}
