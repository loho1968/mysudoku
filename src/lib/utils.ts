import { getDb } from './db';
import { isLocalRequest, LOCAL_DEV_HEADER } from './env';

/**
 * 校验请求是否具有编辑权限。
 *
 * 两种放行方式：
 * 1. 本地旁路：请求来自本地环境（Host 头判定）且携带 X-Local-Dev: 1 头
 *    （客户端 apiFetch 在本地自动注入），用于本机开发维护场景。
 * 2. 密码鉴权：X-Edit-Password 头与 settings.edit_password 明文匹配。
 *
 * @param request - 请求对象。
 * @returns 是否具有编辑权限。
 */
export function verifyEditMode(request: Request): boolean {
  // 本地旁路：本机访问 + 客户端标记头
  if (isLocalRequest(request) && request.headers.get(LOCAL_DEV_HEADER) === '1') {
    return true;
  }

  // 密码鉴权
  const password = request.headers.get('X-Edit-Password');
  if (!password) return false;
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('edit_password') as { value: string } | undefined;
  return row?.value === password;
}

/**
 * 生成 UUID v4（无外部依赖）。
 * @returns UUID v4 字符串。
 */
export function generateId(): string {
  // Simple UUID v4 generator (no external dep needed)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
